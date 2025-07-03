# Deployment Guide

This guide covers deploying the Crypto Arbitrage Platform to various hosting providers.

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database
- Environment variables configured
- SSL certificate (for production)

## 🚀 Platform-Specific Deployments

### Vercel (Recommended for Frontend)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Configure vercel.json**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server/index.ts",
         "use": "@vercel/node"
       },
       {
         "src": "client/**",
         "use": "@vercel/static"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "/server/index.ts"
       },
       {
         "src": "/(.*)",
         "dest": "/client/$1"
       }
     ]
   }
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Railway

1. **Connect GitHub repository** to Railway
2. **Set environment variables** in Railway dashboard
3. **Configure build command**:
   ```bash
   npm run build
   ```
4. **Configure start command**:
   ```bash
   npm start
   ```

### Heroku

1. **Install Heroku CLI**
2. **Create Heroku app**:
   ```bash
   heroku create crypto-arbitrage-app
   ```
3. **Add PostgreSQL addon**:
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```
4. **Set environment variables**:
   ```bash
   heroku config:set SESSION_SECRET=your_secret_here
   ```
5. **Deploy**:
   ```bash
   git push heroku main
   ```

### DigitalOcean App Platform

1. **Create new app** in DigitalOcean dashboard
2. **Connect GitHub repository**
3. **Configure build settings**:
   - Build command: `npm run build`
   - Run command: `npm start`
4. **Add PostgreSQL database** component
5. **Configure environment variables**

## 🗄️ Database Setup

### PostgreSQL on Cloud Providers

#### Neon (Recommended)
```bash
# Get connection string from Neon dashboard
DATABASE_URL=postgresql://user:pass@ep-example.neon.tech/dbname
```

#### Supabase
```bash
# Get connection string from Supabase dashboard
DATABASE_URL=postgresql://postgres:pass@db.project.supabase.co:5432/postgres
```

#### AWS RDS
```bash
# Create RDS PostgreSQL instance
DATABASE_URL=postgresql://user:pass@rds.amazonaws.com:5432/dbname
```

### Run Migrations
```bash
npm run db:push
```

## 🔧 Environment Configuration

### Production Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Security
SESSION_SECRET=your_super_secure_session_secret_here
NODE_ENV=production

# Optional: External Services
SENDGRID_API_KEY=your_sendgrid_key
SLACK_API_TOKEN=your_slack_token

# Optional: Payment Processing
STRIPE_SECRET_KEY=your_stripe_key
COINBASE_COMMERCE_API_KEY=your_coinbase_key
```

### Security Considerations
- Use strong, unique SESSION_SECRET
- Enable SSL/TLS in production
- Set secure cookie options
- Configure CORS properly
- Use environment-specific database URLs

## 📦 Build Process

### Production Build
```bash
# Install dependencies
npm ci --production

# Build the application
npm run build

# Start the server
npm start
```

### Docker Deployment

1. **Create Dockerfile**:
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --production
   
   COPY . .
   RUN npm run build
   
   EXPOSE 5000
   
   CMD ["npm", "start"]
   ```

2. **Create docker-compose.yml**:
   ```yaml
   version: '3.8'
   
   services:
     app:
       build: .
       ports:
         - "5000:5000"
       environment:
         - DATABASE_URL=postgresql://postgres:password@db:5432/crypto_arbitrage
         - SESSION_SECRET=your_secret_here
         - NODE_ENV=production
       depends_on:
         - db
   
     db:
       image: postgres:15
       environment:
         - POSTGRES_DB=crypto_arbitrage
         - POSTGRES_USER=postgres
         - POSTGRES_PASSWORD=password
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
   volumes:
     postgres_data:
   ```

3. **Deploy with Docker**:
   ```bash
   docker-compose up -d
   ```

## 🔍 Health Checks

### Application Health Check
Create `/api/health` endpoint:
```typescript
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### Database Health Check
```typescript
app.get('/api/health/db', async (req, res) => {
  try {
    await db.raw('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected' });
  }
});
```

## 🚨 Monitoring

### Error Tracking
Consider integrating:
- Sentry for error tracking
- LogRocket for session replay
- DataDog for application monitoring

### Performance Monitoring
- Monitor API response times
- Track database query performance
- Set up uptime monitoring
- Monitor memory and CPU usage

### Log Management
```typescript
// Use structured logging
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example
See `.github/workflows/ci.yml` for complete pipeline.

### Automatic Deployments
- Main branch → Production
- Develop branch → Staging
- Feature branches → Preview deployments

## 🛡️ Security Checklist

- [ ] SSL/TLS enabled
- [ ] Environment variables secured
- [ ] Database connections encrypted
- [ ] CORS configured properly
- [ ] Rate limiting implemented
- [ ] Input validation in place
- [ ] SQL injection prevention
- [ ] XSS protection enabled
- [ ] Security headers configured

## 📊 Performance Optimization

### Frontend Optimization
- Enable gzip compression
- Use CDN for static assets
- Implement service workers
- Optimize images and fonts
- Code splitting and lazy loading

### Backend Optimization
- Database query optimization
- Connection pooling
- Caching strategies
- API response compression

### Database Optimization
- Proper indexing
- Query optimization
- Connection pooling
- Read replicas for scaling

## 🔧 Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify DATABASE_URL format
- Check network connectivity
- Ensure database exists
- Verify user permissions

**Build Failures**
- Check Node.js version compatibility
- Verify all dependencies are installed
- Review TypeScript compilation errors
- Check environment variables

**Runtime Errors**
- Monitor application logs
- Check memory usage
- Verify all required environment variables
- Test database migrations

### Debugging Commands
```bash
# Check application logs
npm run logs

# Verify environment
npm run env:check

# Test database connection
npm run db:test

# Run health checks
curl https://your-app.com/api/health
```

## 📞 Support

For deployment issues:
1. Check application logs
2. Verify environment configuration
3. Test database connectivity
4. Review security settings
5. Contact support with specific error messages