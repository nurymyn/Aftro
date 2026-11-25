BEGIN;

CREATE TABLE IF NOT EXISTS aftro_accounts (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    identifier text NOT NULL UNIQUE,
    kind text NOT NULL CHECK (kind IN ('email', 'phone')),
    password_salt bytea NOT NULL,
    password_hash bytea NOT NULL
);

CREATE TABLE IF NOT EXISTS aftro_sessions (
    token_hash bytea PRIMARY KEY,
    account_id bigint NOT NULL REFERENCES aftro_accounts (id) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS aftro_sessions_expiry ON aftro_sessions (expires_at);

CREATE TABLE IF NOT EXISTS aftro_saved_finishes (
    account_id bigint NOT NULL REFERENCES aftro_accounts (id) ON DELETE CASCADE,
    apartment_slug text NOT NULL,
    finish_slug text NOT NULL,
    PRIMARY KEY (account_id, apartment_slug),
    FOREIGN KEY (apartment_slug, finish_slug)
        REFERENCES finish_packages (apartment_slug, slug) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS aftro_auth_attempts (
    action text NOT NULL,
    subject_hash bytea NOT NULL,
    window_start timestamptz NOT NULL,
    attempts integer NOT NULL,
    PRIMARY KEY (action, subject_hash)
);

COMMIT;
