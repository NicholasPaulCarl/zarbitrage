# 🚀 Crypto Arbitrage Trading Platform

A sophisticated cryptocurrency arbitrage tracking platform with real-time price monitoring, historical spread analysis, and comprehensive admin dashboard capabilities.

## ✨ Features

### 📊 Core Trading Features
- **Real-time Price Monitoring** - Live cryptocurrency prices from multiple exchanges
- **Arbitrage Opportunity Detection** - Automated identification of profitable trading opportunities
- **Historical Spread Analysis** - 7+ days of historical spread data with trend visualization
- **Exchange Rate Integration** - Real-time USD/ZAR conversion rates

### 📈 Advanced Analytics
- **Interactive Charts** - Responsive spread trend visualizations with high/low tracking
- **Price Comparison Tools** - Side-by-side exchange price comparisons
- **Market Sentiment Analysis** - Visual indicators for market conditions
- **Arbitrage Calculator** - Profit calculation tools with fee considerations

### 👤 User Management
- **Authentication System** - Secure user registration and login
- **Premium Subscriptions** - Tiered access to advanced features
- **Profile Management** - User avatars and account settings
- **Trade Journal** - Personal trade tracking and performance analysis

### 🛠 Admin Dashboard
- **User Management** - Comprehensive user administration tools
- **Content Management** - Dynamic carousel and content editing
- **Payment Analytics** - Detailed payment flow tracking
- **System Monitoring** - Real-time application health monitoring

## 🏗 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** + **shadcn/ui** for styling
- **Vite** for fast development and building
- **TanStack Query** for data fetching and caching
- **Framer Motion** for animations
- **Recharts** for data visualization

### Backend
- **Node.js** with Express
- **PostgreSQL** database with Drizzle ORM
- **Zod** for schema validation
- **JWT** authentication
- **Passport.js** for auth strategies

### Infrastructure
- **TypeScript** for type safety
- **Drizzle Kit** for database migrations
- **Multer** for file uploads
- **CORS** for cross-origin requests

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd crypto-arbitrage-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: `http://localhost:5000`
   - API: `http://localhost:5000/api`

## 🗂 Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   └── contexts/       # React contexts
│   └── index.html
├── server/                 # Express backend
│   ├── services/           # Business logic services
│   ├── auth.ts            # Authentication middleware
│   ├── db.ts              # Database connection
│   ├── routes.ts          # API routes
│   └── storage.ts         # Data access layer
├── shared/                 # Shared types and schemas
│   ├── schema.ts          # Database schema
│   └── errors.ts          # Error definitions
└── public/                # Static assets
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/user` - Get current user
- `POST /api/auth/logout` - User logout

### Trading Data
- `GET /api/prices/local` - Local exchange prices (ZAR)
- `GET /api/prices/international` - International exchange prices (USD)
- `GET /api/arbitrage` - Current arbitrage opportunities
- `GET /api/historical-spread` - Historical spread data
- `GET /api/exchange-rate` - USD/ZAR exchange rate

### User Features
- `GET /api/alerts` - Price alerts
- `POST /api/alerts` - Create price alert
- `GET /api/trade-journal` - User's trade entries
- `POST /api/trade-journal` - Add trade entry

### Admin
- `GET /api/admin/users` - User management
- `GET /api/admin/carousels` - Content management
- `POST /api/admin/carousels` - Create carousel content

## 🎯 Key Features

### Real-time Price Monitoring
The platform monitors cryptocurrency prices from multiple exchanges:
- **International**: Binance, Kraken, Bitfinex, Bitstamp, KuCoin
- **Local (South Africa)**: LUNO, VALR, AltcoinTrader

### Arbitrage Detection
Automatically calculates potential arbitrage opportunities by:
- Comparing prices across exchanges
- Factoring in exchange rates (USD/ZAR)
- Identifying profitable trading routes
- Displaying potential profit margins

### Historical Analysis
- 7+ days of historical spread data
- Interactive trend charts with high/low tracking
- Market pattern recognition
- Performance analytics

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- SQL injection prevention with parameterized queries
- CORS protection
- Session management
- File upload restrictions

## 📊 Database Schema

The application uses PostgreSQL with the following main tables:
- `users` - User accounts and profiles
- `daily_spreads` - Historical arbitrage data
- `alerts` - Price alert notifications
- `trade_journal` - User trade tracking
- `carousels` - Admin-managed content
- `payment_logs` - Payment processing tracking

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Database Migration
```bash
npm run db:push
```

### Environment Variables
Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `NODE_ENV` - Application environment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Issues & Support

For bug reports and feature requests, please create an issue on GitHub.

---

**Built with ❤️ for the crypto trading community**# zarbitrage
