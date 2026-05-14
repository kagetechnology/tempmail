-- Users table
CREATE TABLE IF NOT EXISTS users (
  telegram_id INTEGER PRIMARY KEY,
  username TEXT DEFAULT '',
  first_name TEXT DEFAULT '',
  default_expiry INTEGER DEFAULT 60,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Active email addresses
CREATE TABLE IF NOT EXISTS email_addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT UNIQUE NOT NULL,
  telegram_id INTEGER NOT NULL,
  label TEXT DEFAULT '',
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER DEFAULT 1,
  FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
);

-- Inbox messages
CREATE TABLE IF NOT EXISTS inbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email_address TEXT NOT NULL,
  from_address TEXT NOT NULL,
  from_name TEXT DEFAULT '',
  subject TEXT DEFAULT '(no subject)',
  body_text TEXT DEFAULT '',
  received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_read INTEGER DEFAULT 0
);

-- Blocked senders
CREATE TABLE IF NOT EXISTS blocked_senders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id INTEGER NOT NULL,
  sender_email TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(telegram_id, sender_email),
  FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inbox_email ON inbox(email_address);
CREATE INDEX IF NOT EXISTS idx_email_telegram ON email_addresses(telegram_id, is_active);
CREATE INDEX IF NOT EXISTS idx_blocked ON blocked_senders(telegram_id);
