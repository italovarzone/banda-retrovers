import React from 'react'

function toAppleEmbed(url){
  if (!url) return null
  try {
    // Typical: https://music.apple.com/br/playlist/...
    return url.replace('https://music.apple.com', 'https://embed.music.apple.com')
  } catch {
    return url
  }
}

export default function PlaylistEmbeds({ appleUrl }){
  const appleEmbed = toAppleEmbed(appleUrl)

  const hasAny = !!(appleEmbed)

  return (
    <div className="playlist-grid">
      {appleEmbed && (
        <article className="playlist-card">
          <iframe
            title="Playlist no Apple Music"
            src={appleEmbed}
            width="100%"
            height="380"
            allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
            loading="lazy"
            style={{ border: 'none', borderRadius: 12 }}
          />
        </article>
      )}

      {!hasAny && (
        <article className="playlist-card">
          <p className="muted">Adicione os links das playlists para exibir aqui.</p>
        </article>
      )}
    </div>
  )
}
