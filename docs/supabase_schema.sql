-- ============================================================
-- Project Phoenix — Supabase Schema Setup
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/inlnjaipjyhkohgnyliw/sql
-- ============================================================


-- 1. Leads table (Waitlist form submissions)
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
    id          BIGSERIAL PRIMARY KEY,
    email       TEXT        NOT NULL UNIQUE,
    source      TEXT        DEFAULT 'waitlist',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (allow anonymous inserts for the waitlist)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon inserts" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service reads"  ON leads FOR SELECT USING (true);


-- 2. Model Health Snapshots (Partitioned by model_id)
-- ============================================================
CREATE TABLE IF NOT EXISTS model_health_snapshots (
    id               BIGSERIAL,
    model_id         TEXT        NOT NULL,
    accuracy         FLOAT       NOT NULL,
    drift_detected   BOOLEAN     DEFAULT FALSE,
    drifted_features TEXT[]      DEFAULT '{}',
    state            TEXT        NOT NULL,
    snapshot_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, model_id)
) PARTITION BY LIST (model_id);

-- Create partitions for each registered model
CREATE TABLE IF NOT EXISTS model_health_snapshots_primary
    PARTITION OF model_health_snapshots FOR VALUES IN ('phoenix-primary');

CREATE TABLE IF NOT EXISTS model_health_snapshots_challenger
    PARTITION OF model_health_snapshots FOR VALUES IN ('phoenix-challenger');

CREATE TABLE IF NOT EXISTS model_health_snapshots_fraud_v3
    PARTITION OF model_health_snapshots FOR VALUES IN ('fraud-detector-v3');

CREATE TABLE IF NOT EXISTS model_health_snapshots_risk_llm
    PARTITION OF model_health_snapshots FOR VALUES IN ('risk-llm-adapter');

-- Index for fast time-series queries per model
CREATE INDEX IF NOT EXISTS idx_mhs_model_time
    ON model_health_snapshots (model_id, snapshot_at DESC);

ALTER TABLE model_health_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all ops" ON model_health_snapshots FOR ALL USING (true) WITH CHECK (true);


-- 3. Healing Events (permanent Alchemist audit log)
-- ============================================================
CREATE TABLE IF NOT EXISTS healing_events (
    id               BIGSERIAL PRIMARY KEY,
    timestamp        TIMESTAMPTZ NOT NULL UNIQUE,
    diversity_score  FLOAT,
    bias_check_result TEXT,
    drifted_features TEXT[]      DEFAULT '{}',
    row_count        INT,
    estimated_cost   FLOAT,
    batch_path       TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE healing_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all ops" ON healing_events FOR ALL USING (true) WITH CHECK (true);


-- 4. Neural Mesh Sync (knowledge sharing)
-- ============================================================
CREATE TABLE IF NOT EXISTS mesh_sync (
    id               BIGSERIAL PRIMARY KEY,
    sender_model     TEXT NOT NULL,
    target_model     TEXT NOT NULL,
    anomaly_signature TEXT NOT NULL,
    safety_approved  BOOLEAN DEFAULT FALSE,
    shared_at        TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE mesh_sync ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all ops" ON mesh_sync FOR ALL USING (true) WITH CHECK (true);


