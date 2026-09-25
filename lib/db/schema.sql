PRAGMA foreign_keys = ON;

-- ======================================================
-- LOCKED V1 KERNEL TABLES
-- ======================================================

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  operator_id TEXT NOT NULL,
  trigger TEXT NOT NULL,
  distortion_class TEXT NOT NULL CHECK (
    distortion_class IN ('narrative','emotional','behavioral','perceptual','continuity')
  ),
  fracture_id TEXT,
  origin TEXT NOT NULL,
  thought TEXT NOT NULL,
  emotion TEXT NOT NULL,
  behavior TEXT NOT NULL,
  protocol TEXT NOT NULL,
  next_action TEXT NOT NULL,
  clarity_rating REAL NOT NULL CHECK (clarity_rating >= 0 AND clarity_rating <= 10),
  outcome TEXT NOT NULL CHECK (
    outcome IN ('reduced','unresolved','escalated')
  ),
  steps_completed INTEGER NOT NULL DEFAULT 9,
  continuity_score_before REAL,
  continuity_score_after REAL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_operator_created_at
  ON sessions(operator_id, created_at);

CREATE INDEX IF NOT EXISTS idx_sessions_operator_outcome_created_at
  ON sessions(operator_id, outcome, created_at);

CREATE INDEX IF NOT EXISTS idx_sessions_operator_distortion_created_at
  ON sessions(operator_id, distortion_class, created_at);


CREATE TABLE IF NOT EXISTS continuity_states (
  operator_id TEXT PRIMARY KEY,
  perception_alignment REAL NOT NULL DEFAULT 50,
  identity_alignment REAL NOT NULL DEFAULT 50,
  intention_alignment REAL NOT NULL DEFAULT 50,
  action_alignment REAL NOT NULL DEFAULT 50,
  continuity_score REAL NOT NULL DEFAULT 50,
  updated_at TEXT NOT NULL
);

-- ======================================================
-- EVENT LEDGER
-- ======================================================

CREATE TABLE IF NOT EXISTS events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  schema_version TEXT NOT NULL,

  actor_kind TEXT NOT NULL,
  actor_id TEXT,

  operator_id TEXT NOT NULL,
  session_id TEXT,
  fracture_id TEXT,
  distortion_id TEXT,

  payload_json TEXT NOT NULL,
  meta_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_operator_time
  ON events(operator_id, occurred_at);

CREATE INDEX IF NOT EXISTS idx_events_operator_session_time
  ON events(operator_id, session_id, occurred_at);

CREATE INDEX IF NOT EXISTS idx_events_type_time
  ON events(event_type, occurred_at);

-- ======================================================
-- DERIVED TABLES (REBUILDABLE CACHE)
-- ======================================================

CREATE TABLE IF NOT EXISTS derived_session_index (
  operator_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  confirmed_class TEXT CHECK (
    confirmed_class IN ('narrative','emotional','behavioral','perceptual','continuity')
  ),
  outcome TEXT NOT NULL CHECK (
    outcome IN ('reduced','unresolved','escalated')
  ),
  clarity_rating REAL NOT NULL,
  steps_completed INTEGER NOT NULL,
  continuity_before REAL,
  continuity_after REAL,
  continuity_delta REAL,
  protocol_type TEXT,
  formula_version TEXT,
  is_complete INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,

  PRIMARY KEY (operator_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_dsi_operator_time
  ON derived_session_index(operator_id, occurred_at);

CREATE INDEX IF NOT EXISTS idx_dsi_operator_class_time
  ON derived_session_index(operator_id, confirmed_class, occurred_at);


CREATE TABLE IF NOT EXISTS derived_recurrence_stats (
  operator_id TEXT NOT NULL,
  class TEXT NOT NULL CHECK (
    class IN ('narrative','emotional','behavioral','perceptual','continuity')
  ),
  window_days INTEGER NOT NULL CHECK (window_days IN (7, 30, 90)),
  count INTEGER NOT NULL DEFAULT 0,
  last_seen_at TEXT,
  avg_days_between REAL,
  updated_at TEXT NOT NULL,

  PRIMARY KEY (operator_id, class, window_days)
);

CREATE INDEX IF NOT EXISTS idx_drs_operator_window
  ON derived_recurrence_stats(operator_id, window_days);


CREATE TABLE IF NOT EXISTS derived_recovery_stats (
  operator_id TEXT NOT NULL,
  class TEXT NOT NULL CHECK (
    class IN ('narrative','emotional','behavioral','perceptual','continuity')
  ),
  sample_size INTEGER NOT NULL DEFAULT 0,
  reduced_rate REAL NOT NULL DEFAULT 0,
  escalated_rate REAL NOT NULL DEFAULT 0,
  avg_sessions_to_reduce REAL,
  avg_clarity_delta REAL,
  updated_at TEXT NOT NULL,

  PRIMARY KEY (operator_id, class)
);


CREATE TABLE IF NOT EXISTS derived_volatility (
  operator_id TEXT NOT NULL,
  window_days INTEGER NOT NULL CHECK (window_days IN (30, 90)),
  clarity_variance REAL NOT NULL DEFAULT 0,
  continuity_variance REAL NOT NULL DEFAULT 0,
  volatility_band TEXT NOT NULL DEFAULT 'low' CHECK (
    volatility_band IN ('low','medium','high')
  ),
  updated_at TEXT NOT NULL,

  PRIMARY KEY (operator_id, window_days)
);