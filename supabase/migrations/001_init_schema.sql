-- =====================================================================
-- JARVIS AI DATABASE SCHEMA
-- =====================================================================

-- =====================================================================
-- 1. USERS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  auth_provider TEXT DEFAULT 'email', -- 'google', 'email'
  google_id TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- 2. CHAT_MESSAGES TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')), -- 'user' or 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id_created 
  ON chat_messages(user_id, created_at DESC);

-- =====================================================================
-- 3. TRIAL_USAGE TABLE (Free tier — 5 messages per 8 hours)
-- =====================================================================
CREATE TABLE IF NOT EXISTS trial_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_count INT DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- 4. SUBSCRIPTIONS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('pro', 'max')), -- 'pro' or 'max'
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users: Read own profile
CREATE POLICY "users_read_own" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Chat messages: Read/Write own messages
CREATE POLICY "chat_messages_user_insert" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat_messages_user_select" ON chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "chat_messages_user_update" ON chat_messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "chat_messages_user_delete" ON chat_messages
  FOR DELETE USING (auth.uid() = user_id);

-- Trial usage: Read/Write own
CREATE POLICY "trial_usage_user_read" ON trial_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "trial_usage_user_write" ON trial_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trial_usage_user_update" ON trial_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- Subscriptions: Read/Write own
CREATE POLICY "subscriptions_user_read" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "subscriptions_user_write" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subscriptions_user_update" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
