import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from 'express-session';
import passport from './auth';
import MemoryStore from 'memorystore';
import connectPgSimple from 'connect-pg-simple';
import path from 'path';
import cors from 'cors';
import pg from 'pg';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import Tokens from 'csrf';

// Extend session type to include CSRF secret
declare module 'express-session' {
  interface SessionData {
    csrfSecret?: string;
  }
}

// Create session store with PostgreSQL for persistent sessions
const PgSession = connectPgSimple(session);
const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

// Initialize CSRF protection
const tokens = new Tokens();
const csrfSecret = process.env.CSRF_SECRET || 'fallback-csrf-secret-change-in-production';

// Rate limiting configuration - disabled for development and testing
const isDevelopment = process.env.NODE_ENV === 'development';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 10000 : 5, // Effectively unlimited for dev/testing
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: isDevelopment ? () => true : undefined, // Skip rate limiting completely in development
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 10000 : 100, // Effectively unlimited for dev/testing
  message: 'Too many API requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: isDevelopment ? () => true : undefined, // Skip rate limiting completely in development
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 10000 : 20, // Effectively unlimited for dev/testing
  message: 'Too many admin requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: isDevelopment ? () => true : undefined, // Skip rate limiting completely in development
});

// Create session store - use PostgreSQL for production and memory store for dev if no DATABASE_URL
let sessionStore;
if (process.env.DATABASE_URL) {
  console.log('Using PostgreSQL session store for persistent sessions');
  sessionStore = new PgSession({
    pool: pgPool,
    tableName: 'session', // Default session table name
    createTableIfMissing: true
  });
} else {
  const MemoryStoreSession = MemoryStore(session);
  console.log('Using memory session store (not persistent)');
  sessionStore = new MemoryStoreSession({
    checkPeriod: 86400000 // prune expired entries every 24h
  });
}

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Apply rate limiting
app.use('/api/auth', authLimiter);
app.use('/api/admin', adminLimiter);
app.use('/api', apiLimiter);

// Enable CORS with proper credentials support
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 
    process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'] : 
    true, // Allow requests from any origin in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-CSRF-Token', 'CSRF-Token']
}));

// Trust the first proxy to ensure cookie settings work correctly
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); // Add cookie-parser middleware

// Serve static files from the public directory
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// Session configuration
const isDevEnvironment = app.get("env") === "development";
app.use(session({
  secret: process.env.SESSION_SECRET || 'crypto-arbitrage-secret-change-in-production',
  resave: false, 
  saveUninitialized: false,
  rolling: true, // Force the session identifier cookie to be set on every response
  store: sessionStore,
  name: 'arb.sid', // Set a specific cookie name
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    sameSite: 'lax',
    path: '/'
  }
}));

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

// CSRF protection middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for GET requests and API endpoints that don't modify data
  if (req.method === 'GET' || req.path.startsWith('/api/prices') || req.path.startsWith('/api/arbitrage')) {
    return next();
  }

  const token = req.body._csrf || req.headers['x-csrf-token'] || req.headers['csrf-token'];
  const secret = req.session.csrfSecret || (req.session.csrfSecret = tokens.secretSync());

  if (!token || !tokens.verify(secret, token)) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
});

// CSRF token endpoint
app.get('/api/csrf-token', (req: Request, res: Response) => {
  const secret = req.session.csrfSecret || (req.session.csrfSecret = tokens.secretSync());
  const token = tokens.create(secret);
  res.json({ csrfToken: token });
});

// Serve static files from public folder (for profile pictures)
app.use(express.static(path.join(process.cwd(), 'public')));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Set up automated hourly data collection
  const startHourlyDataCollection = () => {
    const collectData = async () => {
      try {
        console.log("Running automated hourly spread data collection...");
        
        // TODO: Implement automated data collection
        // Currently disabled due to missing arbitrage module
        console.log("Automated data collection is temporarily disabled");
      } catch (error) {
        console.error("Error in automated hourly data collection:", error);
      }
    };
    
    // Run immediately on startup
    collectData();
    
    // Then run every hour at the start of the hour
    const scheduleNextRun = () => {
      const now = new Date();
      const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0, 0);
      const timeUntilNextHour = nextHour.getTime() - now.getTime();
      
      setTimeout(() => {
        collectData();
        // Schedule the next hourly run
        setInterval(collectData, 60 * 60 * 1000); // Every hour
      }, timeUntilNextHour);
    };
    
    scheduleNextRun();
    console.log("Automated hourly data collection scheduled");
  };

  // Start the hourly data collection
  startHourlyDataCollection();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 3000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 3000;
  server.listen(port, "127.0.0.1", () => {
    log(`serving on port ${port}`);
  });
})();
