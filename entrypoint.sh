#!/bin/sh
echo "=== INICIANDO APLICAÇÃO (Prisma 5) ==="
echo "DATABASE_URL: $DATABASE_URL"
echo "Verificando versão do Prisma..."
npx prisma --version

# Aguarda o banco
echo "Aguardando PostgreSQL em db:5432..."
while ! nc -z db 5432; do
  sleep 2
done
echo "PostgreSQL está pronto!"

# Executa o Prisma db push com versão explícita
echo "Executando Prisma db push..."
npx prisma@5.22.0 db push --accept-data-loss

if [ $? -eq 0 ]; then
  echo "✓ Banco sincronizado com sucesso!"
else
  echo "✗ Erro ao sincronizar banco"
  exit 1
fi

echo "Iniciando aplicação..."
exec node server.js