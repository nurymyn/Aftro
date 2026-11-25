BEGIN;

CREATE TABLE IF NOT EXISTS aftro_rooms (
    account_id bigint PRIMARY KEY REFERENCES aftro_accounts (id) ON DELETE CASCADE,
    width double precision NOT NULL CHECK (width BETWEEN 0.8 AND 20),
    length double precision NOT NULL CHECK (length BETWEEN 0.8 AND 20),
    height double precision NOT NULL CHECK (height BETWEEN 1.8 AND 6),
    source text NOT NULL CHECK (source IN ('camera', 'manual')),
    finish text NOT NULL CHECK (finish IN ('before', 'warm', 'light'))
);

COMMIT;
