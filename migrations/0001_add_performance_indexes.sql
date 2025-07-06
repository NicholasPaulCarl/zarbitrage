-- Performance optimization indexes for crypto arbitrage platform
-- These indexes target the most frequently queried fields based on application usage patterns

-- Users table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_subscription_active ON users(subscription_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_subscription_expires ON users(subscription_expires) WHERE subscription_expires IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_is_deleted ON users(is_deleted) WHERE is_deleted = false;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Alert history indexes (for time-series queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alert_history_timestamp ON alert_history(timestamp DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alert_history_route ON alert_history(route);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alert_history_route_timestamp ON alert_history(route, timestamp DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alert_history_spread ON alert_history(spread DESC);

-- Daily spreads indexes (for analytics and historical data)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_spreads_date ON daily_spreads(date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_spreads_route ON daily_spreads(route);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_spreads_date_route ON daily_spreads(date DESC, route);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_spreads_buy_exchange ON daily_spreads(buy_exchange);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_spreads_sell_exchange ON daily_spreads(sell_exchange);

-- Feature requests indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feature_requests_user_id ON feature_requests(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feature_requests_status ON feature_requests(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feature_requests_created_at ON feature_requests(created_at DESC);

-- Trade journal indexes (for premium users)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trade_journal_user_id ON trade_journal(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trade_journal_user_trade_date ON trade_journal(user_id, trade_date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trade_journal_exchange ON trade_journal(exchange);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trade_journal_trade_pair ON trade_journal(trade_pair);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trade_journal_trade_type ON trade_journal(trade_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trade_journal_created_at ON trade_journal(created_at DESC);

-- Webhook alerts indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webhook_alerts_user_id ON webhook_alerts(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webhook_alerts_is_active ON webhook_alerts(is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webhook_alerts_last_triggered ON webhook_alerts(last_triggered DESC);

-- Payment logs indexes (for audit and analytics)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_logs_user_id ON payment_logs(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_logs_payment_id ON payment_logs(payment_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_logs_stage ON payment_logs(stage);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_logs_provider ON payment_logs(provider);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at DESC);

-- Registration stages indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_registration_stages_user_id ON registration_stages(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_registration_stages_stage ON registration_stages(stage);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_registration_stages_completed_at ON registration_stages(completed_at DESC);

-- Blacklisted emails indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blacklisted_emails_email ON blacklisted_emails(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blacklisted_emails_user_id ON blacklisted_emails(user_id);

-- Carousels indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_carousels_is_active ON carousels(is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_carousels_sort_order ON carousels(sort_order);

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_subscription_status ON users(subscription_active, subscription_expires) WHERE subscription_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trade_journal_user_filters ON trade_journal(user_id, exchange, trade_pair, trade_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alert_history_recent_routes ON alert_history(route, timestamp DESC, spread DESC);

-- Full-text search indexes (if needed for search functionality)
-- Uncomment if search functionality is implemented
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feature_requests_search ON feature_requests USING gin(to_tsvector('english', title || ' ' || description));
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trade_journal_search ON trade_journal USING gin(to_tsvector('english', notes));

-- Comments for index usage patterns:
-- idx_users_email, idx_users_username: User authentication lookups
-- idx_users_subscription_*: Subscription validation and expiry checks
-- idx_alert_history_timestamp: Recent alerts and time-series queries
-- idx_alert_history_route_timestamp: Route-specific alert history
-- idx_daily_spreads_date_route: Historical spread analysis
-- idx_trade_journal_user_trade_date: User's trading history with pagination
-- idx_webhook_alerts_is_active: Active webhook processing
-- idx_payment_logs_created_at: Payment audit trails
-- idx_carousels_sort_order: Homepage carousel ordering