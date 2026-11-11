# Servidor Windows — Node.js + Nginx + HTTPS + Cloudflare

Este guia configura um site Node.js em uma VPS Windows usando:

* Windows Server
* Node.js na porta `3000`
* Nginx como Reverse Proxy
* HTTP na porta `80`
* HTTPS na porta `443`
* Win-ACME / Let's Encrypt para certificado
* Cloudflare como DNS e Proxy
* Redirecionamento HTTP → HTTPS

---

# 0. Componentes e downloads (Windows) — ordem de instalação

Instale nesta ordem:

| Ordem | Componente | Para que serve | Download (Windows) |
| :---: | --- | --- | --- |
| 1 | Git for Windows | Fornece o `sh` usado pelo `npm start` e permite clonar o projeto | https://git-scm.com/download/win |
| 2 | Node.js (LTS) | Executa o servidor/bot na porta `3000` | https://nodejs.org/en/download |
| 3 | Nginx | Reverse Proxy HTTP/HTTPS | https://nginx.org/download/nginx-1.28.0.zip (outras versões: https://nginx.org/en/download.html) |
| 4 | Conta Cloudflare | DNS e Proxy (não há instalador, é pelo site) | https://dash.cloudflare.com/sign-up |
| 5 | Win-ACME (`wacs.exe`) | Gera o certificado Let's Encrypt | https://github.com/win-acme/win-acme/releases/download/v2.2.9.1701/win-acme.v2.2.9.1701.x64.pluggable.zip |

Observações:

* O `config.json` não vai para o GitHub (tem tokens). Depois de clonar, copie `config.example.json` para `config.json` e preencha `token` e as chaves do `lofypay`.
* O Puppeteer baixa o Chromium sozinho durante o `npm install`.
* Após instalar Git e Node.js, feche e abra o PowerShell novamente para o PATH ser atualizado.
* O Nginx e o Win-ACME não têm instalador: basta extrair o `.zip` (veja a estrutura abaixo).

---

# 1. Liberar portas (Inbound Rules)

Este é o primeiro passo: libere as portas de entrada (Inbound Rules) antes de configurar qualquer outra coisa.

## 1.1 No painel do provedor da VPS

Em Firewall / Security Group / Inbound Rules do provedor, libere:

```text
TCP 80   (HTTP)
TCP 443  (HTTPS)
```

## 1.2 No Windows Firewall — pela interface (Windows em inglês)

Repita os passos abaixo duas vezes: uma para a porta `80` e outra para a porta `443`.

1. Clique em **Start**, digite `Windows Defender Firewall with Advanced Security` e abra.
2. No menu da esquerda, clique em **Inbound Rules**.
3. No menu da direita, clique em **New Rule...**
4. Em *Rule Type*, marque **Port** e clique em **Next**.
5. Marque **TCP**. Marque **Specific local ports** e digite `80` (na segunda vez, `443`). Clique em **Next**.
6. Em *Action*, marque **Allow the connection** e clique em **Next**.
7. Em *Profile*, deixe **Domain**, **Private** e **Public** marcados e clique em **Next**.
8. Em *Name*, digite `Nginx HTTP` (na segunda vez, `Nginx HTTPS`) e clique em **Finish**.

A regra aparece na lista de **Inbound Rules** com um ícone verde. Se aparecer, está liberada.

## 1.3 No Windows Firewall — pelo PowerShell (mais rápido)

Se preferir, faça o mesmo pelo comando. Abra PowerShell como Administrador.

Não coloque `C:\Windows\System32>` antes do comando.

Execute:

```powershell
New-NetFirewallRule -DisplayName "Nginx HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
```

E:

```powershell
New-NetFirewallRule -DisplayName "Nginx HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
```

Verifique:

```powershell
Get-NetFirewallRule -DisplayName "Nginx HTTP"
```

---

# 2. Estrutura utilizada

Exemplo:

```text
C:\Users\Administrator\Desktop\
│
├── OLXMAINATUAL\
│   ├── .well-known\
│   │   └── acme-challenge\
│   │
│   └── arquivos do site
│
├── nginx-1.28.0\
│   ├── nginx.exe
│   ├── conf\
│   │   └── nginx.conf
│   └── logs\
│
└── certificado\
    ├── liberacaodevendasolx.site-crt.pem
    └── liberacaodevendasolx.site-key.pem
```

O Node.js fica rodando em:

```text
http://localhost:3000
```

O Nginx recebe:

```text
HTTP  → porta 80
HTTPS → porta 443
```

E encaminha para:

```text
localhost:3000
```

---

# 3. Instalar Node.js

Instale o Git for Windows (https://git-scm.com/download/win) e depois o Node.js LTS (https://nodejs.org/en/download) na VPS.

Depois confirme:

```powershell
node -v
```

E:

```powershell
npm -v
```

Entre na pasta do projeto:

```powershell
cd C:\Users\Administrator\Desktop\OLXMAINATUAL
```

Instale as dependências:

```powershell
npm install
```

Inicie o sistema:

```powershell
npm start
```

Teste localmente:

```text
http://localhost:3000
```

O site precisa funcionar antes de configurar o Nginx.

---

# 4. Instalar / colocar o Nginx

Baixe o Nginx para Windows: https://nginx.org/download/nginx-1.28.0.zip

Extraia o `.zip` em:

```text
C:\Users\Administrator\Desktop\nginx-1.28.0
```

Confirme:

```powershell
cd C:\Users\Administrator\Desktop\nginx-1.28.0
```

Teste o Nginx:

```powershell
.\nginx.exe -t
```

Resultado esperado:

```text
syntax is ok
test is successful
```

---

# 5. Criar a pasta para validação do Let's Encrypt

Dentro da raiz do site:

```powershell
cd C:\Users\Administrator\Desktop\OLXMAINATUAL
```

Crie:

```powershell
mkdir .well-known
mkdir .well-known\acme-challenge
```

Crie um arquivo de teste:

```powershell
echo funcionando > .well-known\acme-challenge\teste.txt
```

---

# 6. Configuração inicial do Nginx — HTTP

Antes de configurar HTTPS, use HTTP para testar.

Arquivo:

```text
C:\Users\Administrator\Desktop\nginx-1.28.0\conf\nginx.conf
```

Configuração:

```nginx
worker_processes 1;

events {
    worker_connections 1024;
}

http {
    include mime.types;
    default_type application/octet-stream;

    sendfile on;
    keepalive_timeout 65;

    server {
        listen 80;

        server_name SEU-DOMINIO.COM www.SEU-DOMINIO.COM;

        location /.well-known/acme-challenge/ {
            root C:/Users/Administrator/Desktop/OLXMAINATUAL;
            default_type text/plain;
        }

        location / {
            proxy_pass http://localhost:3000;

            proxy_http_version 1.1;

            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;

            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

---

# 7. Testar o Nginx

Na pasta do Nginx:

```powershell
cd C:\Users\Administrator\Desktop\nginx-1.28.0
```

Teste:

```powershell
.\nginx.exe -t
```

Se estiver correto:

```powershell
.\nginx.exe
```

Se o Nginx já estiver rodando:

```powershell
.\nginx.exe -s reload
```

---

# 8. Verificar se o Nginx está rodando

No PowerShell:

```powershell
Get-Process nginx
```

No CMD:

```cmd
tasklist | findstr nginx
```

Verificar porta 80:

```cmd
netstat -ano | findstr :80
```

Deve aparecer:

```text
TCP    0.0.0.0:80    0.0.0.0:0    LISTENING
```

---

# 9. Configurar DNS

No provedor onde o domínio está registrado, configure:

```text
Tipo: A
Nome: @
Valor: IP_PUBLICO_DA_VPS
```

E:

```text
Tipo: A
Nome: www
Valor: IP_PUBLICO_DA_VPS
```

Teste:

```powershell
nslookup SEU-DOMINIO.COM
```

Antes do Cloudflare, deverá aparecer o IP da VPS.

---

# 10. Configurar Cloudflare

Crie a conta em https://dash.cloudflare.com/sign-up e adicione o domínio ao Cloudflare.

O Cloudflare fornecerá dois nameservers.

No registrador do domínio, substitua os nameservers atuais pelos nameservers fornecidos pelo Cloudflare.

Depois, no Cloudflare → DNS:

```text
A    @      IP_DA_VPS       Proxied
A    www    IP_DA_VPS       Proxied
```

A nuvem deve ficar:

```text
🟠 Proxied
```

Quando estiver funcionando, o DNS público não deverá mostrar diretamente o IP da VPS.

Teste:

```powershell
nslookup SEU-DOMINIO.COM
```

Com o proxy ativo, normalmente aparecerão IPs do Cloudflare em vez do IP da VPS.

---

# 11. IMPORTANTE — Cloudflare

Não use apenas `ping` para determinar se o Cloudflare está funcionando.

O teste mais importante é:

```powershell
nslookup SEU-DOMINIO.COM
```

Se aparecerem IPs do Cloudflare, como:

```text
104.x.x.x
172.67.x.x
2606:4700:...
```

o proxy DNS está ativo.

---

# 12. Testar a validação HTTP

Antes de gerar o certificado, crie:

```text
C:\Users\Administrator\Desktop\OLXMAINATUAL\.well-known\acme-challenge\teste.txt
```

Conteúdo:

```text
funcionando
```

Acesse:

```text
http://SEU-DOMINIO.COM/.well-known/acme-challenge/teste.txt
```

Tem que aparecer:

```text
funcionando
```

Se aparecer `404`, o `location /.well-known/acme-challenge/` está errado.

Se der timeout, verifique:

* Firewall do Windows
* Firewall da VPS/provedor
* DNS
* Porta 80
* Nginx

---

# 13. Instalar Win-ACME

Baixe o Win-ACME: https://github.com/win-acme/win-acme/releases/download/v2.2.9.1701/win-acme.v2.2.9.1701.x64.pluggable.zip e extraia o `.zip`.

Execute o Win-ACME (`wacs.exe`) como administrador.

Escolha a criação de certificado.

Para domínio manual:

```text
SEU-DOMINIO.COM
```

Se quiser também:

```text
www.SEU-DOMINIO.COM
```

---

# 14. Validação do domínio

Quando aparecer:

```text
How would you like prove ownership for the domain(s)?
```

Escolha:

```text
1
```

Ou seja:

```text
Save verification files on (network) path
```

Informe:

```text
C:\Users\Administrator\Desktop\OLXMAINATUAL
```

Quando perguntar:

```text
Copy default web.config before validation? (y/n)
```

Use:

```text
n
```

Porque estamos usando Nginx, não IIS.

---

# 15. Tipo de chave

Quando perguntar:

```text
What kind of private key should be used?
```

Escolha:

```text
2
```

RSA.

---

# 16. Onde salvar o certificado

Escolha:

```text
2: PEM encoded files (Apache, nginx, etc.)
```

Isso é o formato adequado para Nginx.

---

# 17. Installation step

Quando aparecer:

```text
Which installation step should run first?
```

Escolha:

```text
3: No (additional) installation steps
```

O Nginx será configurado manualmente.

---

# 18. Certificados

Se você optar por salvar manualmente os arquivos em:

```text
C:\Users\Administrator\Desktop\certificado
```

os arquivos podem ficar:

```text
C:\Users\Administrator\Desktop\certificado\SEU-DOMINIO-crt.pem
```

e:

```text
C:\Users\Administrator\Desktop\certificado\SEU-DOMINIO-key.pem
```

Confirme os nomes reais dos arquivos antes de colocar no Nginx.

---

# 19. Configuração final do Nginx com HTTPS

Arquivo:

```text
C:\Users\Administrator\Desktop\nginx-1.28.0\conf\nginx.conf
```

Use:

```nginx
worker_processes 1;

events {
    worker_connections 1024;
}

http {
    include mime.types;
    default_type application/octet-stream;

    sendfile on;
    keepalive_timeout 65;

    # =========================================
    # HTTP
    # =========================================

    server {
        listen 80;

        server_name SEU-DOMINIO.COM www.SEU-DOMINIO.COM;

        # IMPORTANTE:
        # A validação do Let's Encrypt precisa continuar
        # funcionando pela porta 80.

        location /.well-known/acme-challenge/ {
            root C:/Users/Administrator/Desktop/OLXMAINATUAL;
            default_type text/plain;
        }

        # Todo o restante vai para HTTPS
        location / {
            return 301 https://$host$request_uri;
        }
    }

    # =========================================
    # HTTPS
    # =========================================

    server {
        listen 443 ssl;

        server_name SEU-DOMINIO.COM www.SEU-DOMINIO.COM;

        ssl_certificate "C:/Users/Administrator/Desktop/certificado/SEU-DOMINIO-crt.pem";

        ssl_certificate_key "C:/Users/Administrator/Desktop/certificado/SEU-DOMINIO-key.pem";

        ssl_protocols TLSv1.2 TLSv1.3;

        ssl_ciphers HIGH:!aNULL:!MD5;

        ssl_prefer_server_ciphers on;

        # =====================================
        # Node.js
        # =====================================

        location / {
            proxy_pass http://localhost:3000;

            proxy_http_version 1.1;

            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            proxy_set_header Host $host;

            proxy_set_header X-Real-IP $remote_addr;

            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

            proxy_set_header X-Forwarded-Proto $scheme;

            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

Substitua:

```text
SEU-DOMINIO.COM
```

pelo domínio real.

---

# 20. Muito importante sobre o HTTP → HTTPS

Não faça isto:

```nginx
server {
    listen 80;

    return 301 https://$host$request_uri;

    location /.well-known/acme-challenge/ {
        ...
    }
}
```

O `return` no nível do `server` pode impedir a validação HTTP.

Use:

```nginx
location /.well-known/acme-challenge/ {
    ...
}

location / {
    return 301 https://$host$request_uri;
}
```

Assim:

```text
/.well-known/acme-challenge/
```

continua funcionando em HTTP.

---

# 21. Testar a configuração

Entre na pasta:

```powershell
cd C:\Users\Administrator\Desktop\nginx-1.28.0
```

Teste:

```powershell
.\nginx.exe -t
```

Tem que aparecer:

```text
syntax is ok
test is successful
```

Depois:

```powershell
.\nginx.exe -s reload
```

---

# 22. Se quiser reiniciar completamente o Nginx

CMD:

```cmd
taskkill /IM nginx.exe /F
```

Depois:

```cmd
nginx.exe
```

Ou PowerShell:

```powershell
Stop-Process -Name nginx -Force
```

Depois:

```powershell
.\nginx.exe
```

---

# 23. Verificar portas

HTTP:

```cmd
netstat -ano | findstr :80
```

HTTPS:

```cmd
netstat -ano | findstr :443
```

Esperado:

```text
0.0.0.0:80     LISTENING
0.0.0.0:443    LISTENING
```

---

# 24. Testar localmente

Node.js:

```text
http://localhost:3000
```

Nginx HTTP:

```text
http://localhost
```

HTTPS:

```text
https://localhost
```

Observação: o certificado do domínio pode gerar aviso quando usado em `localhost`, porque o certificado foi emitido para o domínio, não para `localhost`.

O teste correto do certificado é:

```text
https://SEU-DOMINIO.COM
```

---

# 25. Testar pelo domínio

HTTP:

```text
http://SEU-DOMINIO.COM
```

Deve redirecionar para:

```text
https://SEU-DOMINIO.COM
```

HTTPS:

```text
https://SEU-DOMINIO.COM
```

Deve abrir o Node.js através do Nginx.

---

# 26. Cloudflare SSL/TLS

No Cloudflare:

```text
SSL/TLS
```

Use:

```text
Full (strict)
```

quando o servidor de origem tiver um certificado válido para a conexão Cloudflare → VPS.

Evite usar `Flexible` para essa configuração.

Fluxo desejado:

```text
USUÁRIO
   │
   │ HTTPS
   ▼
CLOUDFLARE
   │
   │ HTTPS
   ▼
VPS WINDOWS
   │
   ▼
NGINX :443
   │
   ▼
NODE.JS :3000
```

---

# 27. Se estiver usando certificado Let's Encrypt

O certificado público fica válido para o domínio.

O Nginx usa:

```nginx
ssl_certificate "...-crt.pem";
ssl_certificate_key "...-key.pem";
```

Confirme que a chave privada corresponde ao certificado.

Se o Nginx não iniciar depois de adicionar o certificado:

```powershell
.\nginx.exe -t
```

Leia o erro apresentado.

---

# 28. Se estiver usando Cloudflare Origin Certificate

Outra possibilidade é usar o certificado de origem fornecido pelo Cloudflare.

Nesse caso:

```nginx
ssl_certificate "C:/caminho/origin.pem";
ssl_certificate_key "C:/caminho/origin-key.pem";
```

E no Cloudflare:

```text
SSL/TLS → Full (strict)
```

O certificado apresentado aos visitantes continuará sendo o certificado do Cloudflare.

---

# 29. Checklist final

Antes de considerar o servidor pronto:

```text
[ ] Node.js instalado
[ ] npm funcionando
[ ] Site funcionando em localhost:3000
[ ] Nginx instalado
[ ] nginx.conf configurado
[ ] nginx -t funcionando
[ ] Porta 80 liberada no Windows Firewall
[ ] Porta 443 liberada no Windows Firewall
[ ] Firewall do provedor liberado
[ ] DNS configurado
[ ] Cloudflare configurado
[ ] Nameservers alterados para Cloudflare
[ ] Proxy Cloudflare (nuvem laranja) ativo
[ ] .well-known/acme-challenge funcionando
[ ] Certificado emitido
[ ] Certificado configurado no Nginx
[ ] HTTPS funcionando
[ ] HTTP redirecionando para HTTPS
[ ] Node.js funcionando através do domínio
```

---

# 30. Comandos mais usados

### Testar Nginx

```powershell
.\nginx.exe -t
```

### Recarregar Nginx

```powershell
.\nginx.exe -s reload
```

### Iniciar Nginx

```powershell
.\nginx.exe
```

### Parar todos os Nginx

```powershell
Stop-Process -Name nginx -Force
```

ou:

```cmd
taskkill /IM nginx.exe /F
```

### Ver processos

PowerShell:

```powershell
Get-Process nginx
```

CMD:

```cmd
tasklist | findstr nginx
```

### Ver porta 80

```cmd
netstat -ano | findstr :80
```

### Ver porta 443

```cmd
netstat -ano | findstr :443
```

### Ver DNS

```powershell
nslookup SEU-DOMINIO.COM
```

### Testar Node.js

```text
http://localhost:3000
```

---

# 31. Fluxo resumido

A configuração final fica:

```text
DOMÍNIO
   │
   ▼
CLOUDFLARE
   │
   │ HTTPS
   ▼
IP DA VPS
   │
   ▼
WINDOWS FIREWALL
   │
   ├── 80
   └── 443
        │
        ▼
      NGINX
        │
        │ proxy_pass
        ▼
   localhost:3000
        │
        ▼
      NODE.JS
```

O ponto mais importante é:

```text
Cloudflare
     ↓
Nginx :443
     ↓
Node.js :3000
```

O Node.js não precisa ficar exposto diretamente na Internet.

A porta `3000` deve ser usada apenas internamente pelo Nginx.
