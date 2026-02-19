---
description: Como fazer deploy do projeto na VPS usando Docker
---

# Deploy na VPS com Docker

Este workflow automatiza o envio e inicialização do projeto na VPS usando Docker e Caddy (para HTTPS automático).

## 1. Pré-requisitos na VPS

Acesse sua VPS via SSH (`ssh root@72.60.251.183`) e certifique-se de que o **Docker** e **Docker Compose** estão instalados.

Se não estiverem, execute (para Ubuntu/Debian):

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
# Plugin Compose geralmente vem junto nas versões atuais
```

## 2. Configuração Local

O script `deploy-docker.ps1` já está configurado com:

- IP: `72.60.251.183`
- Usuário: `root`
- Destino: `/root/web-portal-docker`

Se precisar alterar, abra o arquivo e edite as primeiras linhas.

## 3. Executando o Deploy

No terminal do VS Code (PowerShell), entre na pasta `SITE/web-portal` e execute:

```powershell
./deploy-docker.ps1
```

O script irá:

1. Testar a conexão SSH.
2. Empacotar todos os arquivos necessários do projeto.
3. Enviar para a VPS.
4. Parar os containers antigos (se houver).
5. Rodar `docker-compose up -d --build` para reconstruir e iniciar.
6. Limpar imagens antigas para economizar espaço.

## 4. Pós-Deploy

Acesse `https://projectdone.com.br`.

- Na primeira vez, o Caddy pode levar alguns segundos para gerar o certificado SSL com a Let's Encrypt.
- O Banco de Dados estará rodando dentro do container `db` e a aplicação se conectará automaticamente a ele.

## Solução de Problemas

Se algo der errado, acesse a VPS e verifique os logs:

```bash
cd /root/web-portal-docker
docker-compose logs -f web    # Logs da aplicação Next.js
docker-compose logs -f db     # Logs do Banco de Dados
docker-compose logs -f caddy  # Logs do Servidor Web
```
