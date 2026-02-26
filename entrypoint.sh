#!/bin/sh
set -e

echo "=== INICIANDO APLICAÇÃO (Prisma 5) ==="
echo "DATABASE_URL: $DATABASE_URL"
echo "Diretório atual: $(pwd)"
echo "Listando node_modules/.bin:"
ls -la node_modules/.bin/ | grep prisma

echo "Verificando versão do Prisma..."

# Verifica se o Prisma está instalado localmente
if [ -f "./node_modules/.bin/prisma" ]; then
  ./node_modules/.bin/prisma --version
else
  echo "ERRO: Prisma não encontrado no node_modules"
  echo "Buscando em locais alternativos..."
  find /app -name "prisma" -type f -executable 2>/dev/null | grep -v node_modules
  exit 1
fi

# Aguarda o banco com pg_isready
DB_HOST="${POSTGRES_HOST:-db}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_USER="${POSTGRES_USER:-admin}"
DB_NAME="${POSTGRES_DB:-projectdone}"

echo "Aguardando PostgreSQL em db:5432..."
echo "Host: $DB_HOST, Porta: $DB_PORT, Usuário: $DB_USER, Banco: $DB_NAME"

until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"; do
  echo "PostgreSQL não está pronto - aguardando 2s..."
  sleep 2
done
echo "PostgreSQL está pronto!"

# Executa o Prisma db push com o binário local
echo "Executando Prisma db push..."
./node_modules/.bin/prisma db push --accept-data-loss --schema=./prisma/schema.prisma

if [ $? -eq 0 ]; then
  echo "✓ Banco sincronizado com sucesso!"
else
  echo "✗ Erro ao sincronizar banco"
  exit 1
fi

if [ "${ALLOW_BOOTSTRAP_ADMIN:-true}" = "true" ]; then
  echo "Executando bootstrap de tenant/admin do sistema..."
  node ./scripts/bootstrap-admin.js
else
  echo "Bootstrap de tenant/admin desativado (ALLOW_BOOTSTRAP_ADMIN != true)"
fi

echo "Iniciando aplicação..."
exec node server.js
