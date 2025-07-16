INSERT INTO "user" (full_name, email, password, is_sponsor, is_admin, created_at, updated_at)
VALUES (
  'Admin',
  'admin@admin.fr',
  "$2b$10$xy.QkVMTI9XKjuHgsnW8KualEl1.nkH2P91chNY4C3cMEgEj29YCC",
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING; 