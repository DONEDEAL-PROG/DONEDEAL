-- Done Deal D1 foundation. No live prices are seeded.
CREATE TABLE IF NOT EXISTS store_variants (
  sku TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  variant TEXT NOT NULL,
  price_centavos INTEGER NOT NULL CHECK(price_centavos >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
  enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_store_variants_enabled ON store_variants(enabled);
CREATE TABLE IF NOT EXISTS store_orders (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending',
  total_centavos INTEGER NOT NULL CHECK(total_centavos >= 0),
  customer_json TEXT NOT NULL,
  items_json TEXT NOT NULL,
  checkout_session_id TEXT UNIQUE,
  payment_id TEXT,
  created_at TEXT NOT NULL,
  paid_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_store_orders_created ON store_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_store_orders_status ON store_orders(status);
-- Future migrations will add pickup/delivery, shipping quotes, COD,
-- bank transfers, authenticated admin users, and inventory reservations.
