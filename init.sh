#!/bin/sh

set -e

echo "⏳ Attente que PostgreSQL soit prêt..."

until PGPASSWORD="$DATABASE_PASS" psql -h "$DATABASE_HOST" -U "$DATABASE_USER" -d postgres -c '\q' 2>/dev/null; do
  echo "🔄 PostgreSQL indisponible - en attente..."
  sleep 2
done

echo "✅ PostgreSQL est prêt !"

DB_EXIST=$(PGPASSWORD="$DATABASE_PASS" psql -h "$DATABASE_HOST" -U "$DATABASE_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$DATABASE_NAME'")

if [ "$DB_EXIST" = "1" ]; then
  echo "📂 La base de données \"$DATABASE_NAME\" existe déjà."
else
  echo "🆕 La base de données \"$DATABASE_NAME\" n'existe pas. Création..."
  PGPASSWORD="$DATABASE_PASS" createdb -h "$DATABASE_HOST" -U "$DATABASE_USER" "$DATABASE_NAME"
  echo "✅ Base de données \"$DATABASE_NAME\" créée avec succès."
fi

echo "🔁 Lancement des migrations..."
npm run migration:up

echo "➕ Vérification de l'existence de l'utilisateur admin..."

USER_EXISTS=$(PGPASSWORD="$DATABASE_PASS" psql -h "$DATABASE_HOST" -U "$DATABASE_USER" -d "$DATABASE_NAME" -tAc "SELECT 1 FROM \"user\" WHERE email = 'admin@admin.fr'")

if [ "$USER_EXISTS" = "1" ]; then
  echo "✅ Utilisateur admin déjà présent."
else
  echo "➕ Insertion de l'utilisateur admin..."
  PGPASSWORD="$DATABASE_PASS" psql -h "$DATABASE_HOST" -U "$DATABASE_USER" -d "$DATABASE_NAME" <<EOF
INSERT INTO "user" (full_name, email, password, is_sponsor, is_admin, created_at, updated_at)
VALUES (
  'Admin',
  'admin@admin.fr',
  '\$2b\$10\$xy.QkVMTI9XKjuHgsnW8KualEl1.nkH2P91chNY4C3cMEgEj29YCC',
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;
EOF
  echo "✅ Utilisateur admin ajouté."
fi

echo "🚀 Lancement du serveur..."
npm start
