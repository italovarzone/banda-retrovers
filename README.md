# Banda Retrovers — Landing Page (Next.js)

 Landing page minimalista e moderna em Next.js (App Router), abastecida por Firestore via endpoints.

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000

## Onde editar o conteúdo

- Dados principais via Firestore (`band/main`) acessados pelo endpoint `GET /api/band`:
  - `name`: nome da banda
  - `members`: artistas (nome, função, imagem)
  - `about.paragraphs`: textos da seção Sobre
  - `formats`: descrições de Acústico e Elétrico
  - `contact.whatsapp`: número com DDI (ex.: Brasil = 55) + DDD + número (ex.: `5519996538569`)
  - `contact.message`: mensagem padrão do WhatsApp
- Imagens (PNG): agora servidas via Google Drive
  - Em vez de `public/images`, as imagens são buscadas de uma pasta no Google Drive.
  - Configure as variáveis de ambiente (ver seção Google Drive abaixo) e suba seus arquivos na pasta compartilhada.
  - Para referenciar uma imagem, use o caminho lógico `/images/<arquivo>` (ex.: `/images/italo.jpeg`); o app converte para `/api/images/by-name?name=<arquivo>` e faz proxy do arquivo do Drive.

## Logo de fundo

- Use `logo.png` e `logo_preto.png` na pasta do Drive e referencie como `/images/logo.png` e `/images/logo_preto.png`. O componente já usa `/api/images/by-name` por baixo.

## WhatsApp (Contate-nos)

- O botão "Contate-nos" usa os dados em Firestore (`band.main.contact`) via `https://wa.me/<numero>?text=<mensagem>`.
- Certifique-se de usar o formato com DDI: ex.: `5519996538569` para +55 (Brasil), DDD 19.

## Estrutura das seções

- Herói: título, subtítulo e CTAs (Próximos Shows, Contate-nos)
- Próximos Shows (destaque): cards com imagem, data/hora formatadas pt-BR, descrição e link do local
- Artistas: 3 integrantes (guitarra/vocal, baixo/vocal, bateria)
- Sobre a Banda: história (parágrafos) + 3 imagens representando gerações
- Formatos: Acústico e Elétrico

## Backend (Firebase)

- Configure `.env.local` com variáveis do Firebase Admin:
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY` (com quebras de linha como `\n`)
  - `ADMIN_USERNAME` e `ADMIN_PASSWORD` (login para obter token)
  - `JWT_SECRET` (segredo do JWT)
  - `JWT_TTL_SECONDS` (opcional, validade do token em segundos)

## Google Drive (Blob Storage)

- O app usa a API do Google Drive para servir imagens da sua pasta.
- Compartilhe a pasta com o e-mail da sua Service Account (Leitor) e obtenha o `folderId` (ID da pasta na URL do Drive).
- Adicione ao `.env.local`:

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL="sa-name@seu-projeto.iam.gserviceaccount.com"
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

- Como funciona:
  - O frontend usa caminhos tipo `/images/arquivo.png`.
  - O servidor resolve para `/api/images/by-name?name=arquivo.png`, procura na pasta do Drive e retorna o binário.
  - Headers de cache: `Cache-Control: public, max-age=86400, immutable`.

> Importante: A Service Account não tem acesso ao seu Drive pessoal por padrão. Compartilhe explicitamente a pasta com o e-mail da Service Account.

- Endpoints:
  - `GET /api/shows?upcoming=1` — lista próximos shows ordenados por data
  - `POST /api/auth` — faz login e retorna token JWT.
    - Exemplo:

      ```bash
      curl -X POST http://localhost:3000/api/auth \
        -H "Content-Type: application/json" \
        -d '{"username":"admin","password":"SUA_SENHA"}'
      ```

      Resposta:

      ```json
      { "token": "<JWT>", "expiresIn": 43200 }
      ```

  - `POST /api/shows` — cria/atualiza show. Header: `Authorization: Bearer <JWT>`
    - Body exemplo:

      ```json
      {
        "id": "sp-07",
        "venue": "Meu Lugar",
        "city": "Cidade/SP",
        "date": "2026-03-01T20:00:00-03:00",
        "image": "/images/meulugar.png",
        "description": "Show elétrico",
        "link": "https://maps.app.goo.gl/...",
        "location": { "lat": -22.0, "lng": -47.0, "address": "Endereço" },
        "postUrl": "https://www.instagram.com/p/.../"
      }
      ```

- A página principal agora busca os shows via o endpoint (`/api/shows`).
 - A página principal também busca os dados da banda via `GET /api/band`.

- Migração dos shows do `data/band.json` para Firestore:
  - Após configurar `.env.local`, execute:

    ```bash
    npm run migrate:shows
    ```

## Repertório (Playlists)

- A seção "Repertório" exibe players incorporados do Spotify e Apple Music.
- Configure os links em Firestore no doc `band/main`:

```json
{
  "playlists": {
    "spotify": "https://open.spotify.com/playlist/SEU_PLAYLIST_ID",
    "apple": "https://music.apple.com/br/playlist/SEU_PLAYLIST"
  }
}
```

- Dicas:
  - Spotify: cole o link da playlist; o site converte para `open.spotify.com/embed/...` automaticamente.
  - Apple Music: use o link público; será convertido para `embed.music.apple.com/...` automaticamente.
  - Se os links não forem definidos, um aviso amigável aparecerá na seção.

## Band (Firestore)

- Endpoint para ler/atualizar dados da banda:
  - `GET /api/band` — retorna doc `band/main`
  - `POST /api/band` — atualiza doc; Header: `Authorization: Bearer <JWT>`
    - Body exemplo:

      ```json
      {
        "name": "Retrôvers",
        "about": { "paragraphs": ["Texto 1", "Texto 2"] },
        "members": [
          { "name": "Ítalo Varzone", "role": "Guitarra / Vocal", "image": "/images/italo.jpeg" }
        ],
        "formats": {
          "acoustic": "Ideal para ambientes...",
          "electric": "Para eventos maiores..."
        },
        "contact": {
          "whatsapp": "5519991480440",
          "message": "Olá! Gostaria de mais informações..."
        },
        "playlists": {
          "apple": "https://music.apple.com/..."
        }
      }
      ```

## Build e produção

```bash
npm run build
npm start
```

Hospede em qualquer ambiente Node ou exporte com sua estratégia preferida (Vercel, etc.).

## Tema e cores

- O site opera em tema escuro por padrão (sem alternância de tema).
- Cor principal: `#AD9310` (dourado), com variações próximas configuradas em `app/globals.css` (`--accent-*`).
- Ajuste as variáveis de cor conforme sua identidade visual.
