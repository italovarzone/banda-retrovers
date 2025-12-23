# Banda Retrovers — Landing Page (Next.js)

Landing page minimalista e moderna em Next.js (App Router), abastecida por um JSON simples.

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000

## Onde editar o conteúdo

- Dados principais: `data/band.json`
  - `name`: nome da banda
  - `members`: artistas (nome, função, imagem)
  - `about.paragraphs`: textos da seção Sobre
  - `about.generations`: 3 imagens (legendas diferentes por geração)
  - `formats`: descrições de Acústico e Elétrico
  - `shows`: lista com imagem do lugar, descrição, data/hora (ISO) e link opcional do local
  - `contact.whatsapp`: número com DDI (ex.: Brasil = 55) + DDD + número (ex.: `5519996538569`)
  - `contact.message`: mensagem padrão do WhatsApp

- Imagens (PNG): pasta `public/images/`
  - Você pode usar placeholders PNG remotos temporários (já configurados no JSON via `placehold.co`).
  - Ao adicionar seus PNGs locais em `public/images/`, troque os caminhos no JSON para o arquivo local.

## Logo de fundo

- Coloque seu arquivo PNG em `public/logo.png`. O herói usa esse logo em grande escala.
  - Se preferir um placeholder temporário, mantenha o fundo sem logo ou substitua a regra em `app/globals.css` por uma URL remota.

## WhatsApp (Contate-nos)

- O botão "Contate-nos" abre a conversa com o número definido em `data/band.json` via `https://wa.me/<numero>?text=<mensagem>`.
- Certifique-se de usar o formato com DDI: ex.: `5519996538569` para +55 (Brasil), DDD 19.

## Estrutura das seções

- Herói: título, subtítulo e CTAs (Próximos Shows, Contate-nos)
- Próximos Shows (destaque): cards com imagem, data/hora formatadas pt-BR, descrição e link do local
- Artistas: 3 integrantes (guitarra/vocal, baixo/vocal, bateria)
- Sobre a Banda: história (parágrafos) + 3 imagens representando gerações
- Formatos: Acústico e Elétrico

## Repertório (Playlists)

- A seção "Repertório" exibe players incorporados do Spotify e Apple Music.
- Configure os links adicionando opcionalmente em `data/band.json` o objeto:

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
