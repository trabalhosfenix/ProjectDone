# Configurações VPS
$IP = "72.60.251.183"
$USER = "root"
$REMOTE_PATH = "/root/web-portal"

Write-Host "Iniciando deploy Bare Metal (Sem Docker) para $IP..."

# 1. Empacotar o projeto
Write-Host "Empacotando projeto com tar..."
if (Test-Path "project.tar") { Remove-Item "project.tar" }
# Incluir mpxj-dist.zip se existir
if (Test-Path "mpxj-dist.zip") {
    tar -cf project.tar src prisma public bin mpxj-dist.zip package.json package-lock.json next.config.ts tsconfig.json postcss.config.mjs components.json prisma.config.ts Caddyfile
} else {
    tar -cf project.tar src prisma public bin package.json package-lock.json next.config.ts tsconfig.json postcss.config.mjs components.json prisma.config.ts Caddyfile
}

# 2. Transferir TAR
Write-Host "Enviando arquivos para VPS..."
$dest = $USER + "@" + $IP + ":" + $REMOTE_PATH
scp -o StrictHostKeyChecking=no "project.tar" ($dest + "/project.tar")

# 3. Executar comandos nativos na VPS
Write-Host "Instalando dependencias e rodando Build na VPS..."
$remoteCmd = "cd " + $REMOTE_PATH + " && rm -rf src/app/dashboard/projetos/[id]/kanban && tar -xf project.tar && rm project.tar"

# Instalar Java e Unzip se não existirem
$remoteCmd += " && (which java || apt-get update && apt-get install -y default-jre-headless unzip)"
$remoteCmd += " && (which unzip || apt-get install -y unzip)"

# Configurar MPXJ (se zip foi enviado)
$remoteCmd += " && if [ -f mpxj-dist.zip ]; then"
$remoteCmd += " echo 'Configurando MPXJ dependencies...';"
$remoteCmd += " mkdir -p bin/lib;"
$remoteCmd += " unzip -o -q mpxj-dist.zip -d bin/temp_mpxj;"
$remoteCmd += " cp bin/temp_mpxj/mpxj-*.jar bin/mpxj.jar;"
$remoteCmd += " cp bin/temp_mpxj/lib/*.jar bin/lib/;"
$remoteCmd += " rm -rf bin/temp_mpxj mpxj-dist.zip;"
$remoteCmd += " fi"

$remoteCmd += " && npm install"
$remoteCmd += " && export NEXT_TELEMETRY_DISABLED=1"
$remoteCmd += " && export DATABASE_URL='postgresql://admin:projectdone2025@localhost:5432/projectdone?schema=public'"
$remoteCmd += " && npx prisma generate"
$remoteCmd += " && npx prisma db push --accept-data-loss"
$remoteCmd += " && npm run build"
# Configurar Caddy nativo
$remoteCmd += " && cp Caddyfile /etc/caddy/Caddyfile && systemctl reload caddy"
# Iniciar/Reiniciar com PM2
$remoteCmd += " && (pm2 delete projectdone || true) && pm2 start 'npm run start' --name projectdone && pm2 save"

ssh -o StrictHostKeyChecking=no ($USER + "@" + $IP) $remoteCmd


Write-Host "Deploy Bare Metal Concluido! Acesse: https://projectdone.com.br"

