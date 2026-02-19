#!/bin/bash
# Backup Completo da VPS
# Este script cria um backup de todos os projetos e bancos de dados

set -e

BACKUP_DIR="/root/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="vps_backup_$DATE"

echo "=========================================="
echo "   BACKUP COMPLETO DA VPS"
echo "   Data: $(date)"
echo "=========================================="

# Criar diretório de backup
mkdir -p "$BACKUP_DIR/$BACKUP_NAME"
cd "$BACKUP_DIR/$BACKUP_NAME"

echo ""
echo "[1/4] Listando projetos existentes..."
ls -la /root/

echo ""
echo "[2/4] Fazendo backup do web-portal (ProjectDone)..."
if [ -d "/root/web-portal" ]; then
    tar -czvf web-portal.tar.gz -C /root web-portal --exclude='node_modules' --exclude='.next'
    echo "✓ web-portal.tar.gz criado"
else
    echo "⚠ Diretório /root/web-portal não encontrado"
fi

if [ -d "/root/web-portal-docker" ]; then
    tar -czvf web-portal-docker.tar.gz -C /root web-portal-docker --exclude='node_modules' --exclude='.next'
    echo "✓ web-portal-docker.tar.gz criado"
fi

echo ""
echo "[3/4] Fazendo backup de outros projetos..."
# Lista todos os diretórios em /root exceto os já processados
for dir in /root/*/; do
    dirname=$(basename "$dir")
    if [[ "$dirname" != "web-portal" && "$dirname" != "web-portal-docker" && "$dirname" != "backups" && "$dirname" != ".pm2" && "$dirname" != ".npm" && "$dirname" != ".cache" ]]; then
        echo "Backup de: $dirname"
        tar -czvf "${dirname}.tar.gz" -C /root "$dirname" --exclude='node_modules' --exclude='.next' 2>/dev/null || true
    fi
done

echo ""
echo "[4/4] Fazendo backup do banco de dados PostgreSQL..."
# Tentar dump do PostgreSQL via Docker (se existir)
if command -v docker &> /dev/null; then
    POSTGRES_CONTAINER=$(docker ps --filter "name=db" --format "{{.Names}}" | head -1)
    if [ -n "$POSTGRES_CONTAINER" ]; then
        echo "Container PostgreSQL encontrado: $POSTGRES_CONTAINER"
        docker exec "$POSTGRES_CONTAINER" pg_dumpall -U postgres > database_full_dump.sql 2>/dev/null || echo "⚠ Falha no dump do Docker PostgreSQL"
        if [ -f database_full_dump.sql ]; then
            echo "✓ database_full_dump.sql criado"
        fi
    fi
fi

# Tentar dump do PostgreSQL local (se existir)
if command -v pg_dumpall &> /dev/null; then
    sudo -u postgres pg_dumpall > database_local_dump.sql 2>/dev/null || echo "⚠ Sem PostgreSQL local"
fi

echo ""
echo "=========================================="
echo "   BACKUP CONCLUÍDO!"
echo "=========================================="
echo ""
echo "Localização: $BACKUP_DIR/$BACKUP_NAME"
echo ""
ls -lh "$BACKUP_DIR/$BACKUP_NAME"
echo ""
echo "Espaço usado pelo backup:"
du -sh "$BACKUP_DIR/$BACKUP_NAME"
echo ""
echo "Espaço livre no disco:"
df -h /
