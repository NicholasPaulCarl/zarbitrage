-- Add hourly spreads tracking for more granular data collection
-- This migration creates a new table to record spread data every hour

-- Create hourly spreads table
CREATE TABLE IF NOT EXISTS hourly_spreads (
  id SERIAL PRIMARY KEY,
  hour_timestamp TIMESTAMP NOT NULL, -- Rounded to the hour (e.g., 2024-01-01 14:00:00)
  buy_exchange TEXT NOT NULL,
  sell_exchange TEXT NOT NULL,
  route TEXT NOT NULL,
  highest_spread REAL NOT NULL,
  lowest_spread REAL NOT NULL,
  average_spread REAL,
  data_points INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add performance indexes for hourly spreads
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hourly_spreads_hour_timestamp ON hourly_spreads(hour_timestamp DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hourly_spreads_route ON hourly_spreads(route);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hourly_spreads_hour_route ON hourly_spreads(hour_timestamp DESC, route);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hourly_spreads_buy_exchange ON hourly_spreads(buy_exchange);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hourly_spreads_sell_exchange ON hourly_spreads(sell_exchange);

-- Create unique constraint to prevent duplicate entries for same hour and route
CREATE UNIQUE INDEX IF NOT EXISTS idx_hourly_spreads_unique_hour_route ON hourly_spreads(hour_timestamp, route);

-- Comments for table usage:
-- hour_timestamp: Stores the hour rounded down (e.g., data from 14:00-14:59 is stored as 14:00:00)
-- highest_spread, lowest_spread: Min/max spreads recorded during that hour
-- average_spread: Running average of all spreads recorded during that hour
-- data_points: Number of individual spread measurements aggregated into this hourly record