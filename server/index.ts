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

// Create session store with PostgreSQL for persistent sessions
const PgSession = connectPgSimple(session);
const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
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

// Enable CORS with proper credentials support
app.use(cors({
  origin: true, // Allow requests from any origin in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
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
  secret: 'crypto-arbitrage-secret',
  resave: false, 
  saveUninitialized: false,
  rolling: true, // Force the session identifier cookie to be set on every response
  store: sessionStore,
  name: 'arb.sid', // Set a specific cookie name
  cookie: { 
    secure: false, // Turn off secure for testing on Replit, regardless of environment
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    sameSite: 'lax',
    path: '/'
  }
}));

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

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

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
