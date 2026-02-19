# Configurações VPS (EDITAR AQUI)
$IP = "72.60.251.183"
$USER = "root"
$REMOTE_PATH = "/root/web-portal-docker"

Write-Host "Iniciando Deploy via Docker para $IP..."

# 1. Verificar se SSH funciona
Write-Host "Testando conexão SSH..."
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 ($USER + "@" + $IP) "echo 'Conexão OK'"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha na conexão SSH. Verifique IP, chave SSH e usuário."
    exit 1
}

# 2. Criar diretório remoto
ssh -o StrictHostKeyChecking=no ($USER + "@" + $IP) "mkdir -p $REMOTE_PATH"

# 3. Empacotar arquivos essenciais
Write-Host "Empacotando projeto..."
$tarFile = "deploy-package.tar"
if (Test-Path $tarFile) { Remove-Item $tarFile }

# Lista de arquivos para enviar (exclui node_modules e .next)
tar -cf $tarFile Dockerfile docker-compose.yml Caddyfile.docker package.json package-lock.json prisma public src next.config.ts tsconfig.json postcss.config.mjs components.json prisma.config.ts

# 4. Transferir pacote
Write-Host "Enviando arquivos para VPS..."
$dest = $USER + "@" + $IP + ":" + $REMOTE_PATH
scp -o StrictHostKeyChecking=no $tarFile ($dest + "/" + $tarFile)

# 5. Executar deploy remoto
Write-Host "Executando Docker Compose na VPS..."
$remoteCmd = "cd $REMOTE_PATH"
# Extrair arquivos e renomear Caddyfile
$remoteCmd += " && tar -xf $tarFile && rm $tarFile && mv Caddyfile.docker Caddyfile"
# Garantir que Docker está instalado (simples check)
$remoteCmd += " && (docker -v || echo 'Docker não encontrado!')"
# Subir containers (rebuild forçado para garantir código novo)
$remoteCmd += " && docker-compose down || true"
$remoteCmd += " && docker-compose up -d --build"
# Limpar imagens antigas para economizar espaço
$remoteCmd += " && docker image prune -f"

ssh -o StrictHostKeyChecking=no ($USER + "@" + $IP) $remoteCmd

Write-Host "Deploy Concluído! Acesse: https://projectdone.com.br"
Write-Host "Se for o primeiro deploy, pode levar alguns segundos para o banco iniciar e o Caddy obter o certificado SSL."
