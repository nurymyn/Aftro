INSERT INTO apartments (slug, name, width_m, length_m, height_m)
VALUES ('demo-apartment', 'Demo Living Room', 4.500, 3.600, 2.800)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO finish_packages (apartment_slug, slug, name, wall_finish, floor_finish)
VALUES
    ('demo-apartment', 'light', 'Light', 'Soft white paint', 'Light oak plank'),
    ('demo-apartment', 'warm', 'Warm', 'Warm beige plaster', 'Walnut parquet')
ON CONFLICT (apartment_slug, slug) DO NOTHING;
