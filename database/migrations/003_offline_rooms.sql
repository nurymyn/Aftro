BEGIN;

CREATE TABLE IF NOT EXISTS aftro_offline_rooms (
    id uuid PRIMARY KEY,
    saved_at timestamptz NOT NULL,
    width double precision NOT NULL CHECK (width BETWEEN 0.8 AND 20),
    length double precision NOT NULL CHECK (length BETWEEN 0.8 AND 20),
    height double precision NOT NULL CHECK (height BETWEEN 1.8 AND 6),
    source text NOT NULL CHECK (source IN ('camera', 'manual')),
    finish text NOT NULL CHECK (finish IN ('before', 'warm', 'light')),
    floor_area double precision GENERATED ALWAYS AS (width * length) STORED,
    wall_area double precision GENERATED ALWAYS AS (2 * (width + length) * height) STORED,
    flooring_with_allowance double precision GENERATED ALWAYS AS (width * length * 1.1) STORED
);

COMMIT;
