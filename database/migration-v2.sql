-- Run once in Cloudflare D1 console, production database, before deploying.
-- Preserves all existing variants, orders and images.
CREATE TABLE IF NOT EXISTS store_products (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS store_order_meta (
  order_id TEXT PRIMARY KEY REFERENCES store_orders(id),
  source TEXT NOT NULL CHECK(source IN ('website','manual')),
  fulfillment TEXT NOT NULL CHECK(fulfillment IN ('delivery','pickup')),
  payment_method TEXT NOT NULL CHECK(payment_method IN ('cod','gcash','bank_transfer','card','cash')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid','pending_verification','paid','refunded')),
  shipping_fee_centavos INTEGER NOT NULL DEFAULT 0,
  shipping_note TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_store_order_meta_source ON store_order_meta(source);
