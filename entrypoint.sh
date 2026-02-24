#!/bin/sh
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
echo "Aguardando PostgreSQL em db:5432..."
echo "Usuário: $POSTGRES_USER, Banco: $POSTGRES_DB"

until pg_isready -h db -U $POSTGRES_USER -d $POSTGRES_DB; do
  echo "PostgreSQL não está pronto - aguardando 2s..."
  sleep 2
done
echo "PostgreSQL está pronto!"

# Backfill de tenant para dados legados antes do schema enforcement
echo "Executando backfill de tenant para dados legados..."
node ./scripts/backfill-tenant-before-db-push.js

if [ $? -ne 0 ]; then
  echo "✗ Erro no backfill de tenant"
  exit 1
fi

# Executa o Prisma db push com o binário local
echo "Executando Prisma db push..."
./node_modules/.bin/prisma db push --accept-data-loss --schema=./prisma/schema.prisma

if [ $? -eq 0 ]; then
  echo "✓ Banco sincronizado com sucesso!"
else
  echo "✗ Erro ao sincronizar banco"
  exit 1
fi

echo "Iniciando aplicação..."
exec node server.js