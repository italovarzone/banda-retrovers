import Image from 'next/image'
import band from '../data/band.json'
import ShowCard from '@/components/ShowCard'
import ThemeLogo from '@/components/ThemeLogo'
import PlaylistEmbeds from '@/components/PlaylistEmbeds'

function formatDate(dateOrIso) {
  try {
    const d = dateOrIso instanceof Date ? dateOrIso : new Date(dateOrIso)
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'America/Sao_Paulo'
    }).format(d)
  } catch (e) {
    return String(dateOrIso)
  }
}

function parseShowDate(iso) {
  if (!iso || typeof iso !== 'string') return new Date(NaN)
  const hasTZ = /([+-]\d{2}:\d{2}|Z)$/i.test(iso)
  const normalized = iso.replace(' ', 'T')
  const sp = hasTZ ? normalized : `${normalized}-03:00`
  return new Date(sp)
}

function WhatsAppButton({ className = '', label = 'Contate-nos' }) {
  const phone = band?.contact?.whatsapp || '5519996538569'
  const message = encodeURIComponent(band?.contact?.message || 'Olá! Quero contratar a banda para um show.')
  const href = `https://wa.me/${phone}?text=${message}`
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`btn btn-accent ${className}`}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
        <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.46.03.11 5.38.11 12c0 2.11.55 4.18 1.6 6.01L0 24l6.15-1.6A11.87 11.87 0 0 0 12.06 24c6.62 0 11.97-5.35 11.97-12 0-3.2-1.25-6.21-3.51-8.52ZM12.06 22c-1.86 0-3.68-.5-5.27-1.44l-.38-.23-3.65.95.98-3.56-.25-.4A9.9 9.9 0 0 1 2.11 12C2.1 6.47 6.53 2.04 12.06 2.04c2.64 0 5.12 1.03 6.98 2.9a9.89 9.89 0 0 1 2.98 7.06c0 5.53-4.51 10-9.96 10Zm5.7-7.44c-.31-.16-1.83-.9-2.12-1-.29-.11-.5-.16-.72.16-.21.31-.82 1-.99 1.2-.18.2-.36.22-.67.06-.31-.16-1.32-.49-2.51-1.56-.93-.83-1.56-1.86-1.74-2.17-.18-.31-.02-.48.14-.64.14-.14.31-.36.47-.54.16-.18.21-.31.31-.52.1-.2.05-.39-.03-.55-.08-.16-.72-1.75-.98-2.4-.26-.62-.52-.54-.72-.55l-.61-.01c-.2 0-.52.07-.79.39-.27.31-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.11 3.23 5.11 4.53.71.31 1.26.5 1.69.64.71.23 1.36.2 1.87.12.57-.08 1.83-.75 2.09-1.49.26-.73.26-1.35.18-1.49-.08-.14-.28-.22-.59-.38Z"/>
      </svg>
      <span>{label}</span>
    </a>
  )
}

export default function Page() {
  const now = Date.now()
  const shows = (band.shows || [])
    .slice()
    .map(s => ({...s, _date: parseShowDate(s.date)}))
    .filter(s => s._date instanceof Date && !isNaN(s._date) && s._date.getTime() >= now)
    .sort((a, b) => a._date - b._date)
    .map(({ _date, ...s }) => ({...s, whenFormatted: formatDate(_date)}))

  const nextShow = shows[0]
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: band.name,
    url: 'https://retrovers.com.br/',
    genre: 'Rock',
    image: 'https://retrovers.com.br/logo.png',
    member: band.members.map(m => ({ '@type': 'Person', name: m.name })),
    sameAs: [
      band.playlists?.apple
    ].filter(Boolean),
    event: nextShow ? {
      '@type': 'Event',
      name: `${band.name} - ${nextShow.venue}`,
      startDate: nextShow.date,
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      image: nextShow.image ? `https://retrovers.com.br${nextShow.image}` : 'https://retrovers.com.br/logo.png',
      location: {
        '@type': 'Place',
        name: nextShow.venue,
        address: nextShow.location?.address || nextShow.city,
      },
      description: nextShow.description,
      url: 'https://retrovers.com.br/',
    } : undefined,
  }

  return (
    <main>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Hero with logo background */}
      <section className="hero">
        <div className="hero-inner">
          <h1 className="title">{band.name}</h1>
          <p className="subtitle">Rock nacional anos 80 a 2000 — shows acústico e elétrico</p>
          <div className="hero-actions">
            <a href="#shows" className="btn">Próximos Shows</a>
            <WhatsAppButton />
          </div>
        </div>
      </section>

      {/* Próximos Shows - destaque */}
      <section id="shows" className="section">
        <h2 className="section-title">Próximos Shows</h2>
        <div className="shows-grid">
          {shows.length === 0 && (
            <p className="muted">Em breve divulgaremos novas datas.</p>
          )}
          {shows.map((s) => (
            <ShowCard key={s.id} show={s} />
          ))}
        </div>
      </section>

      {/* Sobre a banda */}
      <section id="sobre" className="section">
        <h2 className="section-title">Sobre a banda</h2>
        <div className="about">
          <div className="about-side">
            <Image src={"/foto.png"} alt={band.name} fill className="img contain" sizes="(max-width: 1100px) 90vw, 40vw" />
          </div>
          <div className="about-text">
            {band.about.paragraphs.map((p, i) => (
              <p key={i} className="para">{p}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Artistas */}
      <section id="artistas" className="section">
        <h2 className="section-title">Artistas</h2>
        <div className="members-grid">
          {band.members.map((m) => (
            <article key={m.name} className="member-card">
              <div className="avatar">
                <Image src={m.image} alt={m.name} fill className="img" sizes="128px" />
              </div>
              <div>
                <h3 className="member-name">{m.name}</h3>
                <p className="member-role">{m.role}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Formatos */}
      <section id="formatos" className="section">
        <h2 className="section-title">Formatos</h2>
        <div className="plans">
          <article className="plan plan-acoustic">
            <h3>Acústico</h3>
            <p className="plan-desc">{band.formats.acoustic}</p>
            <ul className="plan-list">
              <li>Volume controlado e clima intimista</li>
              <li>Violões e percussões leves</li>
              <li>Ideal para restaurantes, lounges e eventos sociais</li>
            </ul>
          </article>
          <article className="plan plan-electric featured">
            <div className="badge">Mais pedido</div>
            <h3>Elétrico</h3>
            <p className="plan-desc">{band.formats.electric}</p>
            <ul className="plan-list">
              <li>Energia alta e presença de palco</li>
              <li>Guitarras marcantes e repertório de hits</li>
              <li>Perfeito para festas e eventos maiores</li>
            </ul>
            <WhatsAppButton className="plan-cta" label="Reservar Elétrico" />
          </article>
        </div>
      </section>

      {/* Repertório (Playlists) */}
      <section id="repertorio" className="section">
        <h2 className="section-title">Repertório</h2>
        <PlaylistEmbeds
          appleUrl={band.playlists?.apple}
        />
      </section>

      {/* Floating WhatsApp */}
      <WhatsAppButton className="floating" />

      <footer className="footer">
        <small>© {new Date().getFullYear()} {band.name}. Todos os direitos reservados.</small>
      </footer>
    </main>
  )
}
