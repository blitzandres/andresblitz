-- One row per (email, topic and options). confirmed = time of double opt-in, NULL while pending.
CREATE TABLE IF NOT EXISTS subs (
  token      TEXT PRIMARY KEY,
  email      TEXT NOT NULL,
  topic      TEXT NOT NULL,
  sub_key    TEXT NOT NULL,
  params     TEXT NOT NULL DEFAULT '{}',
  lang       TEXT NOT NULL DEFAULT 'en',
  created    INTEGER NOT NULL,
  confirmed  INTEGER,
  last_state TEXT,
  last_sent  TEXT,
  due        INTEGER,
  UNIQUE (email, sub_key)
);
CREATE INDEX IF NOT EXISTS subs_topic ON subs (topic, confirmed);

-- Every tagged PDF handed out: who got which copy, and how often it was downloaded.
CREATE TABLE IF NOT EXISTS pdf_tags (
  tag           TEXT PRIMARY KEY,
  doc           TEXT NOT NULL,
  email         TEXT NOT NULL,
  created       INTEGER NOT NULL,
  downloads     INTEGER NOT NULL DEFAULT 0,
  last_download INTEGER
);

-- What the cron has already seen (feeds, project list, last weekly values).
CREATE TABLE IF NOT EXISTS state (k TEXT PRIMARY KEY, v TEXT);

-- Sign-up rate limit per IP per hour.
CREATE TABLE IF NOT EXISTS hits (ip TEXT NOT NULL, hour INTEGER NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (ip, hour));
