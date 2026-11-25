CREATE TABLE apartments (
    slug text PRIMARY KEY,
    name text NOT NULL,
    width_m numeric(6, 3) NOT NULL CHECK (width_m > 0),
    length_m numeric(6, 3) NOT NULL CHECK (length_m > 0),
    height_m numeric(6, 3) NOT NULL CHECK (height_m > 0)
);

CREATE TABLE finish_packages (
    apartment_slug text NOT NULL REFERENCES apartments (slug) ON DELETE CASCADE,
    slug text NOT NULL,
    name text NOT NULL,
    wall_finish text NOT NULL,
    floor_finish text NOT NULL,
    PRIMARY KEY (apartment_slug, slug)
);
