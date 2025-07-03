# API Documentation

This document provides detailed information about the Crypto Arbitrage Platform API endpoints.

## Base URL

Development: `http://localhost:5000/api`
Production: `https://your-domain.com/api`

## Authentication

The API uses session-based authentication with JWT tokens for admin routes.

### Headers

```
Content-Type: application/json
Authorization: Bearer <token> (for admin routes)
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "isAdmin": false
  }
}
```

#### POST /auth/login
Authenticate user and create session.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "isAdmin": false
  }
}
```

#### GET /auth/user
Get current authenticated user.

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "isAdmin": false
  }
}
```

#### POST /auth/logout
End user session.

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### Market Data

#### GET /prices/local
Get cryptocurrency prices from local South African exchanges.

**Response:**
```json
[
  {
    "name": "LUNO",
    "price": 1903029,
    "currency": "ZAR"
  },
  {
    "name": "VALR",
    "price": 1905557,
    "currency": "ZAR"
  }
]
```

#### GET /prices/international
Get cryptocurrency prices from international exchanges.

**Response:**
```json
[
  {
    "name": "Binance",
    "price": 105133.14,
    "currency": "USD"
  },
  {
    "name": "Kraken",
    "price": 105422.5,
    "currency": "USD"
  }
]
```

#### GET /exchange-rate
Get current USD/ZAR exchange rate.

**Response:**
```json
{
  "rate": 17.86,
  "timestamp": "2025-07-03T20:33:32.531Z"
}
```

#### GET /arbitrage
Get current arbitrage opportunities.

**Response:**
```json
[
  {
    "buyExchange": "Binance",
    "sellExchange": "VALR",
    "spreadPercentage": 2.15,
    "buyPrice": 105133.14,
    "sellPrice": 1905557,
    "profit": 1234.56
  }
]
```

#### GET /historical-spread
Get historical spread data for trend analysis.

**Query Parameters:**
- `period` (optional): Time period (default: "7d")

**Response:**
```json
[
  {
    "date": "2025-05-28",
    "highestSpread": 1.66,
    "lowestSpread": 1.44,
    "route": "Binance → AltcoinTrader"
  }
]
```

### User Features

#### GET /alerts
Get user's price alerts.

**Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "targetPrice": 100000,
    "type": "above",
    "isActive": true,
    "createdAt": "2025-07-03T20:33:32.531Z"
  }
]
```

#### POST /alerts
Create a new price alert.

**Request Body:**
```json
{
  "targetPrice": 100000,
  "type": "above",
  "exchange": "Binance"
}
```

#### GET /trade-journal
Get user's trade journal entries.

**Query Parameters:**
- `exchange` (optional): Filter by exchange
- `pair` (optional): Filter by trading pair
- `type` (optional): Filter by trade type

**Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "exchange": "Binance",
    "pair": "BTC/USD",
    "type": "buy",
    "amount": 0.1,
    "price": 105000,
    "createdAt": "2025-07-03T20:33:32.531Z"
  }
]
```

#### POST /trade-journal
Add a new trade journal entry.

**Request Body:**
```json
{
  "exchange": "Binance",
  "pair": "BTC/USD",
  "type": "buy",
  "amount": 0.1,
  "price": 105000,
  "notes": "Initial position"
}
```

### Admin Routes

All admin routes require authentication and admin privileges.

#### GET /admin/users
Get all users (admin only).

#### GET /admin/carousels
Get all carousel content.

#### POST /admin/carousels
Create new carousel content.

#### PUT /admin/carousels/:id
Update carousel content.

#### DELETE /admin/carousels/:id
Delete carousel content.

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": "Specific validation error details"
  }
}
```

### 401 Unauthorized
```json
{
  "error": {
    "code": "AUTH_001",
    "message": "Please log in to access this resource"
  }
}
```

### 403 Forbidden
```json
{
  "error": {
    "code": "AUTH_002",
    "message": "Insufficient permissions"
  }
}
```

### 404 Not Found
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

### 500 Internal Server Error
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users
- 1000 requests per minute for admin users

## Data Models

### User
```typescript
interface User {
  id: number;
  username: string;
  email: string;
  profilePicture?: string;
  isAdmin: boolean;
  subscriptionActive: boolean;
  createdAt: Date;
}
```

### Trade Journal Entry
```typescript
interface TradeJournal {
  id: number;
  userId: number;
  exchange: string;
  pair: string;
  type: "buy" | "sell";
  amount: number;
  price: number;
  fees?: number;
  notes?: string;
  createdAt: Date;
}
```

### Alert
```typescript
interface Alert {
  id: number;
  userId: number;
  targetPrice: number;
  type: "above" | "below";
  exchange?: string;
  isActive: boolean;
  createdAt: Date;
}
```