'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const NAV_H = 60
const TOP_H = 56

const C = {
  bg: '#0b0d10',
  card: '#121417',
  surface: '#1a1d22',
  accent: '#b89607',
  accentText: '#d6c25b',
  accentDim: 'rgba(184,150,7,0.12)',
  text: '#f1f5f9',
  muted: '#9aa3ad',
  soft: '#cbd5e1',
  border: 'rgba(255,255,255,0.08)',
  danger: '#f87171',
  dangerDim: 'rgba(248,113,113,0.10)',
  dangerBorder: 'rgba(248,113,113,0.28)',
  successDim: 'rgba(74,222,128,0.10)',
  successBorder: 'rgba(74,222,128,0.30)',
  success: '#4ade80',
}

// ─── helpers ──────────────────────────────────────────────────────────────────

// Normaliza qualquer formato legado do campo image para filename puro
// Ex: "/images/bar.png" → "bar.png" | "/api/images/by-name?name=bar.png" → "bar.png"
function normalizeImageName(image) {
  if (!image) return ''
  if (image.startsWith('/images/')) return image.slice('/images/'.length)
  if (image.includes('/by-name?name=')) {
    try { return decodeURIComponent(image.split('?name=')[1]) } catch { return '' }
  }
  return image
}

// Retorna a URL correta para exibir qualquer valor do campo image
function imgSrc(image) {
  if (!image) return null
  if (image.startsWith('http')) return image
  // Drive by-ID direto
  if (/^\/api\/images\/[^?/]+$/.test(image)) return image
  // qualquer outro formato → normaliza e passa pelo by-name
  // (by-name checa local primeiro, depois Drive)
  const name = normalizeImageName(image)
  return `/api/images/by-name?name=${encodeURIComponent(name)}`
}

function isoToLocal(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const p = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
  } catch { return '' }
}

function fmtDate(iso) {
  if (!iso) return { day: '—', time: '' }
  const d = new Date(iso)
  return {
    day: d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }),
    time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + 'h',
  }
}

const EMPTY_SHOW = { id: '', venue: '', city: '', date: '', description: '', link: '', postUrl: '', image: '', valor: '', tipo: '', particular: false }

// ─── atoms ────────────────────────────────────────────────────────────────────

function ErrorMsg({ msg }) {
  if (!msg) return null
  return (
    <div style={{ background: C.dangerDim, border: `1px solid ${C.dangerBorder}`, borderRadius: '10px', padding: '0.65rem 0.9rem', color: C.danger, fontSize: '13px', marginBottom: '1rem' }}>
      {msg}
    </div>
  )
}

function SuccessMsg({ msg }) {
  if (!msg) return null
  return (
    <div style={{ background: C.successDim, border: `1px solid ${C.successBorder}`, borderRadius: '10px', padding: '0.65rem 0.9rem', color: C.success, fontSize: '13px', marginBottom: '1rem' }}>
      {msg}
    </div>
  )
}

function Field({ label, children, required }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', color: C.soft, fontSize: '11px', fontWeight: 700, marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}{required && ' *'}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', background: C.surface, border: `1px solid ${C.border}`,
  borderRadius: '10px', padding: '0.7rem 0.85rem', color: C.text,
  fontSize: '15px', boxSizing: 'border-box', outline: 'none',
}

function TextInput({ label, value, onChange, type = 'text', required, placeholder }) {
  return (
    <Field label={label} required={required}>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} style={inputStyle} required={required} />
    </Field>
  )
}

function Textarea({ label, value, onChange, rows = 6, onGenerate, generating }) {
  return (
    <Field label={label}>
      <div style={{ position: 'relative' }}>
        <textarea value={value} onChange={e => onChange(e.target.value)}
          rows={rows} style={{ ...inputStyle, resize: 'vertical', paddingBottom: onGenerate ? '2.6rem' : undefined }} />
        {onGenerate && (
          <button type="button" onClick={onGenerate} disabled={generating}
            style={{ position: 'absolute', bottom: '8px', right: '8px', background: C.accentDim, border: `1px solid rgba(184,150,7,0.35)`, borderRadius: '6px', padding: '4px 10px', color: generating ? C.muted : C.accentText, fontSize: '12px', fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: 'opacity 0.15s' }}>
            <i className={generating ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-wand-magic-sparkles'} />
            {generating ? 'Gerando...' : 'Gerar'}
          </button>
        )}
      </div>
    </Field>
  )
}

function PrimaryBtn({ children, onClick, disabled, type = 'button', style: extra }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ background: disabled ? '#5a4a05' : C.accent, color: '#0b0d10', border: 'none', borderRadius: '12px', padding: '0.8rem 1.25rem', fontWeight: 800, fontSize: '15px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.7 : 1, ...extra }}>
      {children}
    </button>
  )
}

function GhostBtn({ children, onClick, type = 'button', danger }) {
  return (
    <button type={type} onClick={onClick}
      style={{ background: 'transparent', color: danger ? C.danger : C.soft, border: `1px solid ${danger ? C.dangerBorder : C.border}`, borderRadius: '10px', padding: '0.7rem 1rem', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
      {children}
    </button>
  )
}

// ─── places autocomplete ──────────────────────────────────────────────────────

function PlacesInput({ value, onChangeName, onSelect }) {
  const [query, setQuery] = useState(value || '')
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const timer = useRef(null)

  useEffect(() => { setQuery(value || '') }, [value])

  function handleChange(v) {
    setQuery(v)
    onChangeName(v)
    clearTimeout(timer.current)
    if (v.length < 2) { setItems([]); setOpen(false); return }
    setBusy(true)
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(v)}`)
        const data = await res.json()
        setItems(Array.isArray(data) ? data : [])
        setOpen(true)
      } catch { setItems([]) }
      finally { setBusy(false) }
    }, 420)
  }

  async function pick(place) {
    setItems([])
    setOpen(false)
    setBusy(true)
    try {
      let details
      if (place.needsDetails) {
        // Google Places: precisa de uma segunda chamada para coordenadas
        const res = await fetch(`/api/places/details?id=${encodeURIComponent(place.id)}`)
        details = await res.json()
        if (details.error) throw new Error(details.error)
      } else {
        // Nominatim: já temos tudo
        details = {
          name: place.name,
          city: place.city || '',
          lat: place.lat,
          lng: place.lng,
          link: place.link,
        }
      }
      setQuery(details.name)
      onSelect(details)
    } catch (err) {
      console.error('PlacesInput pick error', err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input type="text" value={query} required
          onChange={e => handleChange(e.target.value)}
          onFocus={() => items.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          style={inputStyle} />
        {busy && (
          <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: C.muted, fontSize: '11px' }}>
            buscando...
          </span>
        )}
      </div>
      {open && items.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', zIndex: 200, maxHeight: '230px', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          {items.map((place, i) => (
            <button key={place.id || i} type="button" onMouseDown={() => pick(place)}
              style={{ display: 'block', width: '100%', background: 'none', border: 'none', borderBottom: i < items.length - 1 ? `1px solid ${C.border}` : 'none', padding: '0.7rem 0.9rem', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ color: C.text, fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.name}</div>
              <div style={{ color: C.muted, fontSize: '11px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.address}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function FAB({ onClick }) {
  return (
    <button onClick={onClick}
      style={{ position: 'fixed', bottom: `${NAV_H + 16}px`, right: '1rem', width: '54px', height: '54px', borderRadius: '50%', background: C.accent, border: 'none', color: '#0b0d10', fontSize: '1.4rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 24px rgba(184,150,7,0.45)', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
      <i className="fa-solid fa-plus" />
    </button>
  )
}

// ─── bottom sheet ─────────────────────────────────────────────────────────────

function Sheet({ open, onClose, title, children, zIndex = 50 }) {
  return (
    <>
      {open && (
        <div onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: zIndex - 1 }} />
      )}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%',
        transform: `translateX(-50%) translateY(${open ? '0' : '110%'})`,
        width: '100%', maxWidth: '430px', background: C.card,
        borderRadius: '20px 20px 0 0', zIndex, transition: 'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
        maxHeight: '92dvh', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '0.85rem 1.25rem 0.65rem', flexShrink: 0 }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: C.border, margin: '0 auto 0.85rem' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: C.text }}>{title}</span>
            <button onClick={onClose}
              style={{ background: C.surface, border: 'none', color: C.muted, cursor: 'pointer', width: '28px', height: '28px', borderRadius: '50%', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </div>
        <div style={{ overflowY: 'auto', padding: '0 1.25rem 2rem', flex: 1 }}>
          {children}
        </div>
      </div>
    </>
  )
}

// ─── image picker ─────────────────────────────────────────────────────────────

function ImagePicker({ open, onClose, onSelect, current }) {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)

useEffect(() => {
  if (!open) return

  setLoading(true)

  fetch('/api/images')
    .then(r => r.json())
    .then(d => {
      console.log('API RETORNOU:', d)
      setImages(Array.isArray(d) ? d : [])
      setLoading(false)
    })
    .catch(err => {
      console.error(err)
      setLoading(false)
    })
}, [open])

useEffect(() => {
  console.log('IMAGES STATE:', images)
}, [images])

  return (
    <Sheet open={open} onClose={onClose} title="Selecionar imagem" zIndex={60}>
      {loading && <p style={{ color: C.muted, textAlign: 'center', padding: '2rem 0' }}>Carregando imagens...</p>}
      {!loading && images.length === 0 && (
        <p style={{ color: C.muted, textAlign: 'center', padding: '2rem 0' }}>
          Nenhuma imagem cadastrada.<br />
          <span style={{ fontSize: '12px' }}>Cadastre um bar na aba Bares.</span>
        </p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem', paddingTop: '0.25rem' }}>
        {images.map(img => {
          const sel = normalizeImageName(current) === img.name
          return (
            <button key={img.id} onClick={() => { onSelect(img.name); onClose() }}
              style={{ background: sel ? C.accentDim : C.surface, border: `2px solid ${sel ? C.accent : 'transparent'}`, borderRadius: '12px', padding: 0, cursor: 'pointer', overflow: 'hidden', aspectRatio: '4/3', position: 'relative', display: 'block', width: '100%' }}>
              <img src={img.src} alt={img.name} loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.75))', padding: '0.75rem 0.5rem 0.4rem' }}>
                <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700, lineHeight: 1 }}>
                  {img.name.replace(/\.[^.]+$/, '')}
                </span>
              </div>
              {sel && (
                <div style={{ position: 'absolute', top: '6px', right: '6px', background: C.accent, borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: '#0b0d10' }}><i className="fa-solid fa-check" /></div>
              )}
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}

// ─── show form sheet ──────────────────────────────────────────────────────────

function ShowForm({ open, onClose, editing, onSaved }) {
  const [form, setForm] = useState(EMPTY_SHOW)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [generating, setGenerating] = useState(false)

  async function generateDescription() {
    setGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venue: form.venue, city: form.city, date: form.date }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar')
      setForm(p => ({ ...p, description: data.description }))
    } catch (e) { setError(e.message) }
    finally { setGenerating(false) }
  }

  useEffect(() => {
    if (!open) return
    setError('')
    setForm(editing
      ? { id: editing.id, venue: editing.venue || '', city: editing.city || '', date: isoToLocal(editing.date), description: editing.description || '', link: editing.link || '', postUrl: editing.postUrl || '', image: editing.image || '', valor: editing.valor ? String(editing.valor) : '', tipo: editing.tipo || '', particular: !!editing.particular }
      : EMPTY_SHOW)
  }, [open, editing])

  const set = (k) => (v) => setForm(p => ({ ...p, [k]: v }))

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const body = { ...form, date: form.date ? new Date(form.date).toISOString() : '' }
      if (!body.id) delete body.id
      const res = await fetch('/api/shows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar')
      onSaved()
      onClose()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <>
      <Sheet open={open && !pickerOpen} onClose={onClose} title={editing ? 'Editar Show' : 'Novo Show'}>
        <form onSubmit={submit}>
          <ErrorMsg msg={error} />
          <Field label={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Local / Venue <span style={{ color: C.danger }}>*</span></span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: form.particular ? C.accentText : C.muted }}>
                  <i className="fa-solid fa-lock" style={{ marginRight: '3px' }} />Evento Particular
                </span>
                <span onClick={() => setForm(p => ({ ...p, particular: !p.particular }))}
                  style={{ position: 'relative', display: 'inline-block', width: '34px', height: '18px', borderRadius: '9px', background: form.particular ? C.accent : C.surface, border: `1px solid ${form.particular ? C.accent : C.border}`, transition: 'background 0.2s, border 0.2s', flexShrink: 0, cursor: 'pointer' }}>
                  <span style={{ position: 'absolute', top: '2px', left: form.particular ? '16px' : '2px', width: '12px', height: '12px', borderRadius: '50%', background: form.particular ? '#0b0d10' : C.muted, transition: 'left 0.2s, background 0.2s' }} />
                </span>
              </label>
            </div>
          }>
            {form.particular
              ? <input value={form.venue} onChange={e => set('venue')(e.target.value)} placeholder="Nome do local ou evento" required style={inputStyle} />
              : <PlacesInput
                  key={editing?.id ?? 'new'}
                  value={form.venue}
                  onChangeName={set('venue')}
                  onSelect={({ name, city, lat, lng, link }) =>
                    setForm(p => ({ ...p, venue: name, city, link, location: { lat, lng, address: name } }))
                  }
                />
            }
          </Field>
          <TextInput label="Cidade" value={form.city} onChange={set('city')} required />
          <TextInput label="Data e hora" type="datetime-local" value={form.date} onChange={set('date')} required />

          {/* image selector */}
          <Field label="Imagem">
            <button type="button" onClick={() => setPickerOpen(true)}
              style={{ width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '0', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left' }}>
              {form.image ? (
                <>
                  <img src={imgSrc(form.image)} alt=""
                    style={{ width: '64px', height: '48px', objectFit: 'cover', flexShrink: 0 }} />
                  <span style={{ color: C.accentText, fontSize: '14px', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {form.image.replace(/\.[^.]+$/, '')}
                  </span>
                </>
              ) : (
                <span style={{ color: C.muted, fontSize: '14px', padding: '0.7rem 0.85rem' }}>Toque para selecionar...</span>
              )}
              <span style={{ color: C.muted, paddingRight: '0.85rem', fontSize: '14px' }}><i className="fa-solid fa-chevron-right" /></span>
            </button>
            {form.image && (
              <button type="button" onClick={() => set('image')('')}
                style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: '12px', marginTop: '0.3rem', padding: 0 }}>
                Remover imagem
              </button>
            )}
          </Field>

          <Field label="Tipo de show">
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[{ id: 'eletrico', label: 'Elétrico', icon: 'fa-solid fa-bolt' }, { id: 'acustico', label: 'Acústico', icon: 'fa-solid fa-music' }].map(t => (
                <button key={t.id} type="button" onClick={() => set('tipo')(form.tipo === t.id ? '' : t.id)}
                  style={{ flex: 1, background: form.tipo === t.id ? C.accentDim : C.surface, border: `1px solid ${form.tipo === t.id ? C.accent : C.border}`, borderRadius: '10px', padding: '0.65rem', color: form.tipo === t.id ? C.accentText : C.muted, fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  <i className={t.icon} /> {t.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Valor (R$)">
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: C.muted, fontSize: '14px', pointerEvents: 'none' }}>R$</span>
              <input type="number" value={form.valor} onChange={e => set('valor')(e.target.value)} min="0" step="any" placeholder="0"
                style={{ ...inputStyle, paddingLeft: '2.5rem' }} />
            </div>
          </Field>

          <Textarea label="Descrição" value={form.description} onChange={set('description')} onGenerate={generateDescription} generating={generating} />
          <TextInput label="Link do mapa (Google Maps)" value={form.link} onChange={set('link')} />
          <TextInput label="Link do post (Instagram)" value={form.postUrl} onChange={set('postUrl')} />

          <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.5rem' }}>
            <GhostBtn onClick={onClose}>Cancelar</GhostBtn>
            <PrimaryBtn type="submit" disabled={loading} style={{ flex: 1 }}>
              {loading ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar show'}
            </PrimaryBtn>
          </div>
        </form>
      </Sheet>

      <ImagePicker open={pickerOpen} onClose={() => setPickerOpen(false)}
        onSelect={set('image')} current={form.image} />
    </>
  )
}

// ─── shows tab ────────────────────────────────────────────────────────────────

function relativeTimeLabel(showDate, now) {
  const sd = new Date(showDate.getFullYear(), showDate.getMonth(), showDate.getDate())
  const nd = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.round((sd - nd) / 86400000)

  if (days === 0)  return { label: 'Hoje!',             color: C.success }
  if (days === 1)  return { label: 'Amanhã',            color: C.accentText }
  if (days === 2)  return { label: 'Daqui 2 dias',      color: C.accentText }
  if (days > 2 && days < 7)  return { label: `Daqui ${days} dias`,  color: C.accentText }
  if (days === 7)  return { label: 'Daqui uma semana',  color: C.muted }
  if (days < 14)   return { label: `Daqui ${days} dias`, color: C.muted }
  if (days === 14) return { label: 'Daqui 2 semanas',   color: C.muted }
  if (days < 60)   return { label: `Daqui ${Math.round(days / 7)} semanas`, color: C.muted }
  const m = Math.round(days / 30)
  return { label: `Daqui ${m} ${m === 1 ? 'mês' : 'meses'}`, color: C.muted }
}

function pastTimeLabel(showDate, now) {
  const sd = new Date(showDate.getFullYear(), showDate.getMonth(), showDate.getDate())
  const nd = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.round((nd - sd) / 86400000)

  if (days === 0)  return 'Hoje'
  if (days === 1)  return 'Ontem'
  if (days < 7)   return `${days} dias atrás`
  if (days < 14)  return 'Uma semana atrás'
  if (days < 60)  return `${Math.round(days / 7)} semanas atrás`
  const m = Math.round(days / 30)
  return `${m} ${m === 1 ? 'mês' : 'meses'} atrás`
}

function ShowsTab() {
  const [shows, setShows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState('upcoming')
  const [paymentShow, setPaymentShow] = useState(null)
  const [swipeOpen, setSwipeOpen] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/shows')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setShows(data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete(id) {
    if (!confirm('Deletar este show? Esta ação não pode ser desfeita.')) return
    try {
      const res = await fetch(`/api/shows?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao deletar')
      setShows(p => p.filter(s => s.id !== id))
    } catch (e) { setError(e.message) }
  }

  async function handleCancel(show) {
    const undo = show.cancelado
    if (!confirm(undo ? 'Reativar este show?' : 'Cancelar este show?')) return
    try {
      const res = await fetch('/api/shows', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: show.id, cancelado: !undo }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar')
      const updated = await res.json()
      setShows(p => p.map(s => s.id === show.id ? updated : s))
    } catch (e) { setError(e.message) }
  }

  const now = new Date()

  const upcoming = shows
    .filter(s => !s.cancelado && new Date(s.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const past = shows
    .filter(s => !s.cancelado && new Date(s.date) < now)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const cancelados = shows
    .filter(s => s.cancelado)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const filtered =
    filter === 'upcoming'  ? upcoming  :
    filter === 'past'      ? past      :
    filter === 'cancelados'? cancelados:
    [...upcoming, ...past]

  const FILTERS = [
    { id: 'all',       label: 'Todos' },
    { id: 'upcoming',  label: `Próximos (${upcoming.length})` },
    { id: 'past',      label: `Passados (${past.length})` },
    { id: 'cancelados',label: `Cancelados (${cancelados.length})` },
  ]

  return (
    <div style={{ paddingBottom: `${NAV_H + 24}px` }}>
      <ErrorMsg msg={error} />

      {/* filtros */}
      {!loading && shows.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{ background: filter === f.id ? C.accent : C.surface, color: filter === f.id ? '#0b0d10' : C.muted, border: 'none', borderRadius: '20px', padding: '0.35rem 0.85rem', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s' }}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {loading && <p style={{ textAlign: 'center', color: C.muted, padding: '3rem 0' }}>Carregando...</p>}

      {!loading && shows.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: C.muted }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', color: C.muted }}><i className="fa-solid fa-guitar" /></div>
          <p style={{ margin: 0 }}>Nenhum show cadastrado.</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '13px' }}>Toque no + para adicionar.</p>
        </div>
      )}

      {!loading && filtered.length === 0 && shows.length > 0 && (
        <p style={{ textAlign: 'center', color: C.muted, padding: '2rem 0', fontSize: '13px' }}>
          Nenhum show nessa categoria.
        </p>
      )}

      {/* lista full-bleed: escapa o padding do <main> com margem negativa */}
      <div style={{ margin: '0 -1rem' }}>
        {filtered.map((show, idx) => {
          const d = new Date(show.date)
          const past = d < now
          const isNext = !past && idx === 0 && filter !== 'past'
          const { day, time } = fmtDate(show.date)
          const rel = past
            ? { label: pastTimeLabel(d, now), color: C.muted }
            : relativeTimeLabel(d, now)

          const actions = [
            { key: 'edit', icon: 'fa-solid fa-pen', label: 'Editar', color: C.accentText, onClick: () => { setEditing(show); setFormOpen(true) } },
            ...(show.valor > 0 ? [{ key: 'pay', icon: 'fa-brands fa-pix', label: 'Pagar', color: C.success, onClick: () => setPaymentShow(show) }] : []),
            { key: 'cancel', icon: show.cancelado ? 'fa-solid fa-rotate-left' : 'fa-solid fa-ban', label: show.cancelado ? 'Reativar' : 'Cancelar', color: show.cancelado ? C.success : C.muted, onClick: () => handleCancel(show) },
            { key: 'delete', icon: 'fa-solid fa-trash', label: 'Deletar', color: C.danger, onClick: () => handleDelete(show.id) },
          ]
          const ACTION_W = 64
          const panelWidth = actions.length * ACTION_W
          const isOpen = swipeOpen === show.id

          return (
            <div key={show.id} style={{ position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${C.border}` }}>
              {/* ── painel de ações (revelado ao deslizar) ── */}
              <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, display: 'flex' }}>
                {actions.map(a => (
                  <button key={a.key} onClick={() => { a.onClick(); setSwipeOpen(null) }}
                    style={{ width: `${ACTION_W}px`, background: C.surface, border: 'none', borderLeft: `1px solid ${C.border}`, color: a.color, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 700 }}>
                    <i className={a.icon} style={{ fontSize: '15px' }} />
                    {a.label}
                  </button>
                ))}
              </div>

              {/* ── conteúdo do card (deslizável) ── */}
              <div onClick={() => setSwipeOpen(isOpen ? null : show.id)}
                style={{
                  position: 'relative', background: C.card,
                  borderLeft: isNext && !show.cancelado ? `3px solid ${C.accent}` : show.cancelado ? `3px solid ${C.dangerBorder}` : '3px solid transparent',
                  cursor: 'pointer',
                  transform: isOpen ? `translateX(-${panelWidth}px)` : 'translateX(0)',
                  transition: 'transform 0.28s cubic-bezier(0.32,0.72,0,1)',
                }}>

                {/* cabeçalho: status + data */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.9rem 0.4rem', gap: '0.5rem' }}>
                  {show.cancelado
                    ? <span style={{ fontSize: '11px', fontWeight: 800, color: C.danger, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <i className="fa-solid fa-ban" /> Cancelado
                      </span>
                    : isNext
                      ? <span style={{ fontSize: '11px', fontWeight: 800, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <i className="fa-solid fa-star" /> Próximo show
                        </span>
                      : <span style={{ fontSize: '12px', fontWeight: 700, color: rel.color }}>{rel.label}</span>
                  }
                  <span style={{ fontSize: '12px', color: C.muted, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-regular fa-calendar" style={{ marginRight: '2px' }} />
                    {day} · {time}
                    <i className="fa-solid fa-chevron-left" style={{ fontSize: '9px', color: C.muted, opacity: 0.6 }} />
                  </span>
                </div>

                {/* corpo: imagem + info */}
                <div style={{ display: 'flex', gap: '0.75rem', padding: '0.4rem 0.9rem 0.75rem' }}>
                  {show.image ? (
                    <div style={{ width: '52px', height: '52px', borderRadius: '9px', overflow: 'hidden', flexShrink: 0 }}>
                      <img src={imgSrc(show.image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: (past || show.cancelado) ? 'grayscale(0.5) brightness(0.7)' : 'none' }} />
                    </div>
                  ) : (
                    <div style={{ background: (past || show.cancelado) ? C.surface : C.accentDim, borderRadius: '9px', width: '52px', height: '52px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ color: (past || show.cancelado) ? C.muted : C.accentText, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>
                        {d.toLocaleDateString('pt-BR', { month: 'short' })}
                      </div>
                      <div style={{ color: (past || show.cancelado) ? C.soft : C.accent, fontSize: '18px', fontWeight: 900, lineHeight: 1.1 }}>
                        {String(d.getDate()).padStart(2, '0')}
                      </div>
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px', justifyContent: 'center' }}>
                    <div style={{ fontWeight: 800, color: show.cancelado ? C.muted : past ? C.soft : C.text, fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: show.cancelado ? 'line-through' : 'none' }}>
                      {show.venue}
                    </div>
                    <div style={{ color: C.muted, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <i className="fa-solid fa-location-dot" style={{ marginRight: '4px', fontSize: '10px' }} />
                      {show.city}
                    </div>

                    {(show.tipo || show.valor > 0 || show.particular) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px', flexWrap: 'wrap' }}>
                        {show.particular && (
                          <span style={{ fontSize: '10px', fontWeight: 700, color: C.muted, background: C.surface, border: `1px solid ${C.border}`, borderRadius: '5px', padding: '1px 6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <i className="fa-solid fa-lock" style={{ fontSize: '9px' }} />Particular
                          </span>
                        )}
                        {show.tipo && (
                          <span style={{ fontSize: '10px', fontWeight: 700, color: C.accentText, background: C.accentDim, border: `1px solid rgba(184,150,7,0.25)`, borderRadius: '5px', padding: '1px 6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <i className={show.tipo === 'eletrico' ? 'fa-solid fa-bolt' : 'fa-solid fa-music'} style={{ fontSize: '9px' }} />
                            {show.tipo === 'eletrico' ? 'Elétrico' : 'Acústico'}
                          </span>
                        )}
                        {show.valor > 0 && (
                          <span style={{ fontSize: '11px', fontWeight: 800, color: C.success }}>
                            {show.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <FAB onClick={() => { setEditing(null); setFormOpen(true) }} />

      <ShowForm open={formOpen} onClose={() => setFormOpen(false)}
        editing={editing} onSaved={load} />

      <PaymentSheet open={!!paymentShow} onClose={() => setPaymentShow(null)} show={paymentShow} />
    </div>
  )
}

// ─── bares tab ────────────────────────────────────────────────────────────────

function BaresTab() {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // create
  const [createOpen, setCreateOpen] = useState(false)
  const [barName, setBarName] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  // edit
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState(null) // img object
  const [editName, setEditName] = useState('')
  const [editFile, setEditFile] = useState(null)
  const [editPreview, setEditPreview] = useState(null)
  const editFileRef = useRef()

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/images')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setImages(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(`Erro ao carregar imagens: ${e.message}`)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() { setError(''); setBarName(''); setFile(null); setPreview(null); setCreateOpen(true) }

  function openEdit(img) {
    setEditing(img)
    setEditName(img.name.replace(/\.[^.]+$/, ''))
    setEditFile(null)
    setEditPreview(null)
    setError('')
    setEditOpen(true)
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!barName.trim() || !file) return
    setSaving(true); setError(''); setSuccess('')
    try {
      const fd = new FormData()
      fd.append('name', barName.trim())
      fd.append('file', file)
      const res = await fetch('/api/images', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar')
      setSuccess(`"${data.name.replace(/\.[^.]+$/, '')}" cadastrado!`)
      setBarName(''); setFile(null); setPreview(null)
      if (fileRef.current) fileRef.current.value = ''
      setCreateOpen(false)
      await load()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function handleEdit(e) {
    e.preventDefault()
    if (!editName.trim()) return
    setSaving(true); setError(''); setSuccess('')
    try {
      const fd = new FormData()
      fd.append('oldName', editing.name)
      fd.append('newName', editName.trim())
      if (editFile) fd.append('file', editFile)
      const res = await fetch('/api/images', { method: 'PUT', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao editar')
      setSuccess(`"${data.name.replace(/\.[^.]+$/, '')}" atualizado!`)
      setEditOpen(false)
      await load()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(img) {
    if (!confirm(`Deletar "${img.name.replace(/\.[^.]+$/, '')}"?`)) return
    setError(''); setSuccess('')
    try {
      const params = img.local !== false
        ? `name=${encodeURIComponent(img.name)}`
        : `id=${encodeURIComponent(img.id)}&name=${encodeURIComponent(img.name)}`
      const res = await fetch(`/api/images?${params}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao deletar')
      setImages(p => p.filter(i => i.name !== img.name))
      setSuccess(`"${img.name.replace(/\.[^.]+$/, '')}" removido.`)
    } catch (e) { setError(e.message) }
  }

  return (
    <div style={{ paddingBottom: `${NAV_H + 24}px` }}>
      <SuccessMsg msg={success} />
      <ErrorMsg msg={error} />

      {loading && <p style={{ textAlign: 'center', color: C.muted, padding: '3rem 0' }}>Carregando...</p>}

      {!loading && images.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: C.muted }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', color: C.muted }}><i className="fa-solid fa-house" /></div>
          <p style={{ margin: 0 }}>Nenhum bar cadastrado ainda.</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '13px' }}>Toque no + para adicionar.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
        {images.map(img => (
          <div key={img.name} style={{ background: C.card, borderRadius: '14px', overflow: 'hidden', border: `1px solid ${C.border}` }}>
            <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
              <img src={img.src} alt={img.name} loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            <div style={{ padding: '0.5rem 0.75rem 0' }}>
              <div style={{ color: C.soft, fontSize: '13px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {img.name.replace(/\.[^.]+$/, '')}
              </div>
            </div>
            <div style={{ display: 'flex', borderTop: `1px solid ${C.border}`, marginTop: '0.5rem' }}>
              <button onClick={() => openEdit(img)}
                style={{ flex: 1, background: 'none', border: 'none', color: C.accentText, padding: '0.65rem', fontWeight: 700, fontSize: '12px', cursor: 'pointer', borderRight: `1px solid ${C.border}` }}>
                <i className="fa-solid fa-pen" /> Editar
              </button>
              <button onClick={() => handleDelete(img)}
                style={{ flex: 1, background: 'none', border: 'none', color: C.danger, padding: '0.65rem', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                <i className="fa-solid fa-trash" /> Deletar
              </button>
            </div>
          </div>
        ))}
      </div>

      <FAB onClick={openCreate} />

      {/* ── sheet: criar ── */}
      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="Cadastrar Bar">
        <form onSubmit={handleUpload}>
          <ErrorMsg msg={error} />
          <TextInput label="Nome do bar" value={barName} onChange={setBarName} required placeholder="Ex: Bar do Zé" />
          <Field label="Foto do bar *">
            <input ref={fileRef} type="file" accept="image/*" required
              onChange={e => { const f = e.target.files[0]; setFile(f||null); setPreview(f ? URL.createObjectURL(f) : null) }}
              style={{ color: C.soft, fontSize: '14px', width: '100%', cursor: 'pointer' }} />
          </Field>
          {preview && (
            <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '1.25rem', maxHeight: '200px' }}>
              <img src={preview} alt="preview" style={{ width: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <GhostBtn onClick={() => setCreateOpen(false)}>Cancelar</GhostBtn>
            <PrimaryBtn type="submit" disabled={saving || !barName.trim() || !file} style={{ flex: 1 }}>
              {saving ? 'Enviando...' : 'Cadastrar bar'}
            </PrimaryBtn>
          </div>
        </form>
      </Sheet>

      {/* ── sheet: editar ── */}
      <Sheet open={editOpen} onClose={() => setEditOpen(false)} title="Editar Bar">
        <form onSubmit={handleEdit}>
          <ErrorMsg msg={error} />
          <TextInput label="Nome do bar" value={editName} onChange={setEditName} required />
          <Field label="Nova foto (opcional)">
            <input ref={editFileRef} type="file" accept="image/*"
              onChange={e => { const f = e.target.files[0]; setEditFile(f||null); setEditPreview(f ? URL.createObjectURL(f) : null) }}
              style={{ color: C.soft, fontSize: '14px', width: '100%', cursor: 'pointer' }} />
          </Field>
          {editPreview && (
            <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '1.25rem', maxHeight: '200px' }}>
              <img src={editPreview} alt="preview" style={{ width: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          )}
          {!editPreview && editing && (
            <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '1.25rem', maxHeight: '160px', border: `1px solid ${C.border}` }}>
              <img src={editing.src} alt={editing.name} style={{ width: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <GhostBtn onClick={() => setEditOpen(false)}>Cancelar</GhostBtn>
            <PrimaryBtn type="submit" disabled={saving || !editName.trim()} style={{ flex: 1 }}>
              {saving ? 'Salvando...' : 'Salvar'}
            </PrimaryBtn>
          </div>
        </form>
      </Sheet>
    </div>
  )
}

// ─── login ────────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Credenciais inválidas')
      onLogin()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: '1.5rem', background: C.bg }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: C.accentText }}><i className="fa-solid fa-guitar" /></div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: C.text, letterSpacing: '-0.03em' }}>Admin</h1>
          <p style={{ margin: '0.25rem 0 0', color: C.muted, fontSize: '14px' }}>Banda Retrovers</p>
        </div>
        <div style={{ background: C.card, borderRadius: '20px', padding: '1.75rem', border: `1px solid ${C.border}` }}>
          <ErrorMsg msg={error} />
          <form onSubmit={submit}>
            <TextInput label="Usuário" value={form.username} onChange={v => setForm(p => ({ ...p, username: v }))} required />
            <TextInput label="Senha" type="password" value={form.password} onChange={v => setForm(p => ({ ...p, password: v }))} required />
            <PrimaryBtn type="submit" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
              {loading ? 'Entrando...' : 'Entrar'}
            </PrimaryBtn>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── members sheet ────────────────────────────────────────────────────────────

const EMPTY_MEMBER = { id: '', name: '', pixKey: '', city: '' }

function MembersSheet({ open, onClose }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(null) // null = lista, {} = form
  const [form, setForm]       = useState(EMPTY_MEMBER)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const setF = k => v => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setEditing(null)
    setError('')
    fetch('/api/members')
      .then(r => r.json())
      .then(d => setMembers(Array.isArray(d) ? d : []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [open])

  function openNew()  { setForm(EMPTY_MEMBER); setEditing('new') }
  function openEdit(m){ setForm({ ...m });     setEditing(m.id)  }

  async function save(e) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const res  = await fetch('/api/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar')
      if (form.id) { setMembers(p => p.map(m => m.id === form.id ? data : m)) }
      else         { setMembers(p => [...p, data].sort((a,b) => a.name.localeCompare(b.name))) }
      setEditing(null)
    } catch(e) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function del(m) {
    if (!confirm(`Remover ${m.name}?`)) return
    await fetch(`/api/members?id=${m.id}`, { method: 'DELETE' })
    setMembers(p => p.filter(x => x.id !== m.id))
  }

  return (
    <Sheet open={open} onClose={onClose} title="Integrantes">
      {error && <div style={{ background: C.dangerDim, border: `1px solid ${C.dangerBorder}`, borderRadius: '10px', padding: '0.65rem 0.9rem', color: C.danger, fontSize: '13px', marginBottom: '1rem' }}>{error}</div>}

      {editing ? (
        <form onSubmit={save}>
          <TextInput label="Nome" value={form.name} onChange={setF('name')} required />
          <TextInput label="Chave PIX (CPF, e-mail, telefone ou aleatória)" value={form.pixKey} onChange={setF('pixKey')} />
          <TextInput label="Cidade" value={form.city} onChange={setF('city')} />
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => setEditing(null)}
              style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '0.75rem', color: C.muted, fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              style={{ flex: 2, background: C.accent, border: 'none', borderRadius: '10px', padding: '0.75rem', color: '#0b0d10', fontWeight: 800, fontSize: '14px', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      ) : (
        <>
          {loading && <p style={{ textAlign: 'center', color: C.muted }}>Carregando...</p>}
          {!loading && members.length === 0 && (
            <p style={{ textAlign: 'center', color: C.muted, fontSize: '13px' }}>Nenhum integrante cadastrado.</p>
          )}
          {members.map(m => (
            <div key={m.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '0.75rem 0.9rem', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: C.text, fontSize: '14px' }}>{m.name}</div>
                {m.pixKey && <div style={{ color: C.muted, fontSize: '12px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><i className="fa-solid fa-key" style={{ marginRight: '4px', fontSize: '10px' }} />{m.pixKey}</div>}
                {m.city   && <div style={{ color: C.muted, fontSize: '12px' }}><i className="fa-solid fa-location-dot" style={{ marginRight: '4px', fontSize: '10px' }} />{m.city}</div>}
              </div>
              <button onClick={() => openEdit(m)} style={{ background: 'none', border: 'none', color: C.accentText, cursor: 'pointer', padding: '0.35rem', fontSize: '14px' }}><i className="fa-solid fa-pen" /></button>
              <button onClick={() => del(m)}       style={{ background: 'none', border: 'none', color: C.danger,     cursor: 'pointer', padding: '0.35rem', fontSize: '14px' }}><i className="fa-solid fa-trash" /></button>
            </div>
          ))}
          <button onClick={openNew}
            style={{ width: '100%', background: C.accentDim, border: `1px dashed ${C.accent}`, borderRadius: '12px', padding: '0.75rem', color: C.accentText, fontWeight: 700, fontSize: '14px', cursor: 'pointer', marginTop: '0.25rem' }}>
            <i className="fa-solid fa-plus" style={{ marginRight: '6px' }} />Adicionar integrante
          </button>
        </>
      )}
    </Sheet>
  )
}

// ─── payment sheet ────────────────────────────────────────────────────────────

function PaymentSheet({ open, onClose, show }) {
  const [members, setMembers]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [selected, setSelected] = useState([])
  const [splits, setSplits]     = useState({})
  const [locked, setLocked]     = useState(new Set()) // ids com valor fixado manualmente
  const [copied, setCopied]     = useState(null)
  const [pixInfo, setPixInfo]   = useState({})

  const total  = show?.valor || 0
  const fmtBRL = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })

  // Distribui igualmente entre ids, respeitando os travados
  function buildEqualSplits(ids, currentSplits, lockedSet) {
    const free   = ids.filter(id => !lockedSet.has(id))
    const fixed  = ids.filter(id =>  lockedSet.has(id))
    const usedByFixed = fixed.reduce((acc, id) => acc + (parseFloat(currentSplits[id]) || 0), 0)
    const remaining   = parseFloat((total - usedByFixed).toFixed(2))
    const map = { ...currentSplits }
    if (free.length === 0) return map
    const each = parseFloat((remaining / free.length).toFixed(2))
    free.forEach((id, i) => {
      map[id] = String(i === free.length - 1
        ? parseFloat((remaining - each * (free.length - 1)).toFixed(2))
        : each)
    })
    return map
  }

  useEffect(() => {
    if (!open) { setSelected([]); setSplits({}); setLocked(new Set()); setCopied(null); setPixInfo({}); return }
    setLoading(true)
    fetch('/api/members')
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d) ? d : []
        setMembers(list)
        const ids = list.map(m => m.id)
        setSelected(ids)
        setLocked(new Set())
        setSplits(buildEqualSplits(ids, {}, new Set()))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, total])

  function toggleMember(id) {
    const next = selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]
    setSelected(next)
    const nextLocked = new Set([...locked].filter(x => next.includes(x)))
    setLocked(nextLocked)
    setSplits(p => buildEqualSplits(next, p, nextLocked))
  }

  // "Redistribuir igual" — zera todos os travamentos
  function redistributeEqual() {
    setLocked(new Set())
    setSplits(buildEqualSplits(selected, {}, new Set()))
  }

  // Ajuste manual: trava o integrante e redistribui o restante
  function setAmount(id, val) {
    const nextSplits = { ...splits, [id]: val }
    const nextLocked = new Set(locked).add(id)
    setLocked(nextLocked)
    // Só redistribui se o valor já está preenchido (não enquanto digita)
    const num = parseFloat(val)
    if (!isNaN(num) && val !== '' && val !== '-') {
      setSplits(buildEqualSplits(selected, nextSplits, nextLocked))
    } else {
      setSplits(nextSplits)
    }
  }

  const splitSum = selected.reduce((acc, id) => acc + (parseFloat(splits[id]) || 0), 0)
  const remainder = parseFloat((total - splitSum).toFixed(2))
  const balanced  = Math.abs(remainder) < 0.01

  async function copyPix(member) {
    const amount = parseFloat(splits[member.id]) || 0
    if (!member.pixKey) { alert('Integrante sem chave PIX cadastrada.'); return }
    try {
      const res  = await fetch('/api/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pixKey: member.pixKey, amount, name: member.name, city: member.city }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar PIX')
      setPixInfo(p => ({ ...p, [member.id]: { payload: data.payload, normalizedKey: data.normalizedKey } }))
      await navigator.clipboard.writeText(data.payload)
      setCopied(member.id)
      setTimeout(() => setCopied(null), 2500)
    } catch (e) {
      alert(`Erro ao gerar PIX: ${e.message}`)
    }
  }

  if (!show) return null

  return (
    <Sheet open={open} onClose={onClose} title="Pagamento do Show">
      {/* resumo do show */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1rem' }}>
        <div style={{ fontWeight: 800, color: C.text, fontSize: '15px', marginBottom: '2px' }}>{show.venue}</div>
        <div style={{ color: C.muted, fontSize: '12px', marginBottom: '0.5rem' }}><i className="fa-solid fa-location-dot" style={{ marginRight: '4px' }} />{show.city}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{ color: C.muted, fontSize: '12px' }}>Valor total:</span>
          <span style={{ color: C.success, fontWeight: 900, fontSize: '20px' }}>{fmtBRL(total)}</span>
        </div>
      </div>

      {loading && <p style={{ textAlign: 'center', color: C.muted, fontSize: '13px' }}>Carregando integrantes...</p>}

      {!loading && members.length === 0 && (
        <p style={{ textAlign: 'center', color: C.muted, fontSize: '13px' }}>
          Cadastre integrantes no Dashboard → Gerenciar Integrantes.
        </p>
      )}

      {!loading && members.length > 0 && (
        <>
          {/* cabeçalho divisão */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Dividir entre {selected.length} integrante{selected.length !== 1 ? 's' : ''}
            </span>
            <button onClick={redistributeEqual}
              style={{ background: 'none', border: 'none', color: locked.size > 0 ? C.accentText : C.muted, fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
              <i className="fa-solid fa-rotate" style={{ marginRight: '3px' }} />Redistribuir igual{locked.size > 0 ? ` (${locked.size} fixado${locked.size > 1 ? 's' : ''})` : ''}
            </button>
          </div>

          {/* lista de integrantes */}
          {members.map(m => {
            const sel    = selected.includes(m.id)
            const isLock = locked.has(m.id)
            const amount = parseFloat(splits[m.id]) || 0
            const isCop  = copied === m.id
            return (
              <div key={m.id} style={{ background: sel ? C.card : C.surface, border: `1px solid ${sel ? C.border : 'transparent'}`, borderRadius: '12px', padding: '0.75rem 0.9rem', marginBottom: '0.55rem', transition: 'background 0.2s' }}>
                {/* linha nome + toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: sel ? '0.6rem' : 0 }}>
                  <span onClick={() => toggleMember(m.id)}
                    style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${sel ? C.accent : C.border}`, background: sel ? C.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' }}>
                    {sel && <i className="fa-solid fa-check" style={{ fontSize: '9px', color: '#0b0d10' }} />}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: sel ? C.text : C.muted, fontSize: '14px' }}>{m.name}</div>
                    {m.pixKey && <div style={{ color: C.muted, fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.pixKey}</div>}
                  </div>
                  {sel && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span style={{ color: isLock ? C.accentText : C.success, fontWeight: 800, fontSize: '14px' }}>{fmtBRL(amount)}</span>
                      <button onClick={() => {
                        if (isLock) {
                          const next = new Set(locked); next.delete(m.id); setLocked(next)
                          setSplits(p => buildEqualSplits(selected, p, next))
                        }
                      }} title={isLock ? 'Clique para liberar e redistribuir' : 'Valor livre'}
                        style={{ background: 'none', border: 'none', cursor: isLock ? 'pointer' : 'default', color: isLock ? C.accentText : 'transparent', fontSize: '11px', padding: 0, lineHeight: 1 }}>
                        <i className={isLock ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open'} />
                      </button>
                    </div>
                  )}
                </div>

                {/* controles de valor + botão pagar */}
                {sel && (
                  <>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <span style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: C.muted, fontSize: '12px', pointerEvents: 'none' }}>R$</span>
                        <input type="number" value={splits[m.id] ?? ''} min="0" step="0.01"
                          onChange={e => setAmount(m.id, e.target.value)}
                          style={{ width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '0.45rem 0.7rem 0.45rem 2.2rem', color: C.text, fontSize: '14px', fontWeight: 700, boxSizing: 'border-box', outline: 'none' }} />
                      </div>
                      <button onClick={() => copyPix(m)} disabled={!m.pixKey || amount <= 0}
                        style={{ background: isCop ? C.success : C.accent, border: 'none', borderRadius: '8px', padding: '0.45rem 0.85rem', color: '#0b0d10', fontWeight: 800, fontSize: '12px', cursor: m.pixKey && amount > 0 ? 'pointer' : 'not-allowed', opacity: (!m.pixKey || amount <= 0) ? 0.5 : 1, whiteSpace: 'nowrap', transition: 'background 0.25s', flexShrink: 0 }}>
                        {isCop
                          ? <><i className="fa-solid fa-check" style={{ marginRight: '4px' }} />Copiado!</>
                          : <><i className="fa-brands fa-pix" style={{ marginRight: '4px' }} />Copiar PIX</>
                        }
                      </button>
                    </div>
                    {pixInfo[m.id] && (
                      <div style={{ marginTop: '0.45rem', background: C.bg, borderRadius: '7px', padding: '0.5rem 0.65rem' }}>
                        <div style={{ color: C.muted, fontSize: '10px', marginBottom: '3px' }}>
                          Chave: <strong style={{ color: C.accentText }}>{pixInfo[m.id].normalizedKey}</strong>
                        </div>
                        <div style={{ color: C.muted, fontSize: '9px', wordBreak: 'break-all', lineHeight: 1.4, fontFamily: 'monospace' }}>
                          {pixInfo[m.id].payload}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}

          {/* rodapé com saldo */}
          <div style={{ background: balanced ? C.successDim : C.dangerDim, border: `1px solid ${balanced ? C.successBorder : C.dangerBorder}`, borderRadius: '10px', padding: '0.65rem 0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: balanced ? C.success : C.danger }}>
              {balanced ? <><i className="fa-solid fa-circle-check" style={{ marginRight: '5px' }} />Divisão ok</> : <><i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '5px' }} />{remainder > 0 ? `Faltam ${fmtBRL(remainder)}` : `Excede ${fmtBRL(-remainder)}`}</>}
            </span>
            <span style={{ fontSize: '12px', color: C.muted }}>
              Total: <strong style={{ color: C.text }}>{fmtBRL(splitSum)}</strong> / {fmtBRL(total)}
            </span>
          </div>
        </>
      )}
    </Sheet>
  )
}

// ─── dashboard tab ────────────────────────────────────────────────────────────

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const DASH_CSS = `
  @keyframes dashFadeUp {
    from { opacity:0; transform:translateY(10px); }
    to   { opacity:1; transform:translateY(0);    }
  }
  @keyframes dashNumPop {
    0%   { opacity:0; transform:scale(0.8);  }
    65%  {            transform:scale(1.06); }
    100% { opacity:1; transform:scale(1);    }
  }
  @keyframes dashBarGrow {
    from { transform:scaleX(0); transform-origin:left; }
    to   { transform:scaleX(1); transform-origin:left; }
  }
`

function useAnimatedValue(target, duration = 480) {
  const [val, setVal] = useState(target)
  const fromRef = useRef(target)
  const rafRef  = useRef(null)
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const from = fromRef.current
    const t0   = performance.now()
    function tick(now) {
      const t = Math.min((now - t0) / duration, 1)
      const e = 1 - Math.pow(1 - t, 3)
      setVal(Math.round(from + (target - from) * e))
      if (t < 1) { rafRef.current = requestAnimationFrame(tick) }
      else { fromRef.current = target; rafRef.current = null }
    }
    rafRef.current = requestAnimationFrame(tick)
    const raf = rafRef.current
    return () => { if (raf) cancelAnimationFrame(raf) }
  }, [target, duration])
  return val
}

function MetricCard({ label, numericValue, format, icon, color, delay = 0 }) {
  const animated = useAnimatedValue(numericValue)
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '1rem', flex: 1, minWidth: 0, animation: `dashFadeUp 0.35s ease ${delay}s both` }}>
      <div style={{ color: color || C.muted, fontSize: '1.2rem', marginBottom: '0.4rem' }}><i className={icon} /></div>
      <div key={numericValue} style={{ color: C.text, fontSize: '1.15rem', fontWeight: 900, lineHeight: 1, animation: 'dashNumPop 0.3s ease both' }}>
        {format ? format(animated) : animated}
      </div>
      <div style={{ color: C.muted, fontSize: '11px', fontWeight: 700, marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  )
}

function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ flex: 1, height: '6px', background: C.surface, borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color || C.accent, borderRadius: '3px', transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)' }} />
    </div>
  )
}

function DashboardTab() {
  const [shows, setShows]         = useState([])
  const [loading, setLoading]     = useState(false)
  const [year, setYear]           = useState(new Date().getFullYear())
  const _curMonth = new Date().getMonth()
  const [range, setRange]         = useState([_curMonth, _curMonth])
  const [membersOpen, setMembersOpen] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch('/api/shows')
      .then(r => r.json())
      .then(d => setShows(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ── lógica de seleção de range ──────────────────────────────────────────────
  function handleMonthClick(i) {
    if (!range) {
      setRange([i, i])
    } else {
      const [a, b] = range
      if (a === b && a === i) {
        setRange(null) // deseleciona mês único
      } else if (a === b) {
        setRange([Math.min(a, i), Math.max(a, i)]) // forma o range
      } else {
        setRange(null) // terceiro clique sempre limpa
      }
    }
  }

  function monthState(i) {
    if (!range) return 'none'
    const [a, b] = range
    if (i === a || i === b) return 'edge'
    if (i > a && i < b) return 'middle'
    return 'none'
  }

  // ── derivações ──────────────────────────────────────────────────────────────
  const now = new Date()
  const fmt = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

  function inPeriod(s) {
    const d = new Date(s.date)
    if (d.getFullYear() !== year) return false
    if (range) {
      const m = d.getMonth()
      if (m < range[0] || m > range[1]) return false
    }
    return true
  }

  const realizados = shows.filter(s => !s.cancelado && new Date(s.date) < now  && inPeriod(s))
  const cancelados = shows.filter(s =>  s.cancelado                            && inPeriod(s))
  const proximos   = shows.filter(s => !s.cancelado && new Date(s.date) >= now && inPeriod(s))

  const faturamento = realizados.reduce((a, s) => a + (s.valor || 0), 0)
  const total       = realizados.length + cancelados.length
  const taxaCanc    = total > 0 ? Math.round((cancelados.length / total) * 100) : 0

  const showsPorMes = MESES.map((_, i) => {
    const mes = shows.filter(s => {
      const d = new Date(s.date)
      return d.getFullYear() === year && d.getMonth() === i && !s.cancelado
    })
    return { idx: i, label: MESES[i], count: mes.length, valor: mes.reduce((a, s) => a + (s.valor || 0), 0) }
  })
  const maxShows = Math.max(...showsPorMes.map(m => m.count), 1)

  const cidadeMap = {}
  realizados.forEach(s => { if (s.city) cidadeMap[s.city] = (cidadeMap[s.city] || 0) + 1 })
  const cidades   = Object.entries(cidadeMap).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const maxCidade = Math.max(...cidades.map(([, n]) => n), 1)

  const eletricos = realizados.filter(s => s.tipo === 'eletrico').length
  const acusticos = realizados.filter(s => s.tipo === 'acustico').length

  const periodoLabel = !range
    ? String(year)
    : range[0] === range[1]
      ? `${MESES[range[0]]}/${year}`
      : `${MESES[range[0]]}–${MESES[range[1]]}/${year}`

  // instrução exibida abaixo dos meses
  const rangeHint = !range
    ? 'Clique para selecionar mês ou intervalo'
    : range[0] === range[1]
      ? 'Clique em outro mês para formar intervalo'
      : 'Clique novamente para limpar'

  return (
    <div style={{ paddingBottom: `${NAV_H + 24}px` }}>
      <style>{DASH_CSS}</style>

      {/* botão gerenciar integrantes */}
      <button onClick={() => setMembersOpen(true)}
        style={{ width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '0.75rem 1rem', color: C.accentText, fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <i className="fa-solid fa-users" />
        <span style={{ flex: 1, textAlign: 'left' }}>Gerenciar Integrantes</span>
        <i className="fa-solid fa-chevron-right" style={{ color: C.muted, fontSize: '11px' }} />
      </button>

      <MembersSheet open={membersOpen} onClose={() => setMembersOpen(false)} />

      {loading && <p style={{ textAlign: 'center', color: C.muted, padding: '3rem 0' }}>Carregando...</p>}

      {!loading && (
        <>
          {/* ── seletor de período ──────────────────────────────── */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '0.8rem 0.9rem', marginBottom: '1rem', animation: 'dashFadeUp 0.3s ease both' }}>
            {/* linha do ano */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.7rem' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <i className="fa-solid fa-filter" style={{ marginRight: '5px' }} />Período
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button onClick={() => { setYear(y => y - 1); setRange(null) }}
                  style={{ background: C.surface, border: 'none', borderRadius: '6px', padding: '3px 11px', color: C.muted, cursor: 'pointer', fontSize: '14px' }}>‹</button>
                <span style={{ color: C.text, fontWeight: 800, fontSize: '15px', minWidth: '44px', textAlign: 'center' }}>{year}</span>
                <button onClick={() => { setYear(y => y + 1); setRange(null) }}
                  style={{ background: C.surface, border: 'none', borderRadius: '6px', padding: '3px 11px', color: C.muted, cursor: 'pointer', fontSize: '14px' }}>›</button>
              </div>
            </div>

            {/* grade de meses 4×3 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px', marginBottom: '0.5rem' }}>
              <button onClick={() => setRange(null)}
                style={{ gridColumn: 'span 4', background: !range ? C.accent : C.surface, border: 'none', borderRadius: '7px', padding: '5px 0', color: !range ? '#0b0d10' : C.muted, fontSize: '11px', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s, color 0.2s' }}>
                Todos os meses
              </button>
              {MESES.map((m, i) => {
                const st = monthState(i)
                const isEdge   = st === 'edge'
                const isMid    = st === 'middle'
                const bg       = isEdge ? C.accent : isMid ? C.accentDim : C.surface
                const clr      = isEdge ? '#0b0d10' : isMid ? C.accentText : C.muted
                const brd      = isMid ? `1px solid rgba(184,150,7,0.3)` : '1px solid transparent'
                return (
                  <button key={i} onClick={() => handleMonthClick(i)}
                    style={{ background: bg, border: brd, borderRadius: '7px', padding: '5px 0', color: clr, fontSize: '11px', fontWeight: isEdge ? 800 : 600, cursor: 'pointer', transition: 'background 0.2s, color 0.2s, border 0.2s' }}>
                    {m}
                  </button>
                )
              })}
            </div>

            {/* label do período selecionado */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: C.muted, fontStyle: 'italic' }}>{rangeHint}</span>
              {range && (
                <span style={{ fontSize: '11px', fontWeight: 800, color: C.accentText }}>
                  <i className="fa-solid fa-calendar-week" style={{ marginRight: '4px' }} />{periodoLabel}
                </span>
              )}
            </div>
          </div>

          {/* ── cards de resumo ─────────────────────────────────── */}
          <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '0.65rem' }}>
            <MetricCard label={`Faturamento`} numericValue={faturamento} format={fmt} icon="fa-solid fa-wallet" color={C.accentText} delay={0.05} />
            <MetricCard label="Próximos" numericValue={proximos.length} icon="fa-solid fa-calendar-days" color={C.accentText} delay={0.1} />
          </div>
          <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1rem' }}>
            <MetricCard label="Realizados" numericValue={realizados.length} icon="fa-solid fa-circle-check" color={C.success} delay={0.15} />
            <MetricCard label="Cancelados" numericValue={cancelados.length} icon="fa-solid fa-ban" color={C.danger} delay={0.2} />
          </div>

          {/* ── shows por mês ───────────────────────────────────── */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '0.85rem 1rem', marginBottom: '0.75rem', animation: 'dashFadeUp 0.35s ease 0.25s both' }}>
            <div style={{ color: C.muted, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Shows por mês — {year}
            </div>
            {showsPorMes.map(({ idx, label, count, valor }) => {
              const st = monthState(idx)
              const active = st !== 'none'
              return (
                <button key={idx} onClick={() => handleMonthClick(idx)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.45rem', width: '100%', background: active ? (st === 'edge' ? 'rgba(184,150,7,0.18)' : 'rgba(184,150,7,0.08)') : 'transparent', border: `1px solid ${active ? (st === 'edge' ? C.accent : 'rgba(184,150,7,0.25)') : 'transparent'}`, borderRadius: '7px', padding: '4px 6px', cursor: 'pointer', transition: 'background 0.2s, border 0.2s' }}>
                  <span style={{ color: active ? C.accentText : C.muted, fontSize: '11px', fontWeight: active ? 800 : 400, width: '28px', flexShrink: 0, textAlign: 'left', transition: 'color 0.2s' }}>{label}</span>
                  <MiniBar value={count} max={maxShows} color={active ? C.accent : C.surface} />
                  <span style={{ color: count > 0 ? C.text : C.muted, fontSize: '12px', fontWeight: 700, width: '16px', textAlign: 'right', flexShrink: 0 }}>{count}</span>
                  {valor > 0 && <span style={{ color: active ? C.accentText : C.muted, fontSize: '11px', width: '62px', textAlign: 'right', flexShrink: 0, transition: 'color 0.2s' }}>{fmt(valor)}</span>}
                </button>
              )
            })}
          </div>

          {/* ── cidades ─────────────────────────────────────────── */}
          {cidades.length > 0 && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '0.85rem 1rem', marginBottom: '0.75rem', animation: 'dashFadeUp 0.35s ease 0.3s both' }}>
              <div style={{ color: C.muted, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                <i className="fa-solid fa-location-dot" style={{ marginRight: '5px' }} />Por cidade — {periodoLabel}
              </div>
              {cidades.map(([cidade, count]) => (
                <div key={cidade} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.55rem' }}>
                  <span style={{ color: C.soft, fontSize: '12px', width: '90px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cidade}</span>
                  <MiniBar value={count} max={maxCidade} color={C.accentText} />
                  <span style={{ color: C.text, fontSize: '12px', fontWeight: 700, width: '16px', textAlign: 'right', flexShrink: 0 }}>{count}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── realizados vs cancelados ────────────────────────── */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '0.85rem 1rem', marginBottom: '0.75rem', animation: 'dashFadeUp 0.35s ease 0.35s both' }}>
            <div style={{ color: C.muted, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Realizados vs Cancelados — {periodoLabel}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.55rem' }}>
              <span style={{ color: C.success, fontSize: '11px', width: '80px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}><i className="fa-solid fa-circle-check" /> Realizados</span>
              <MiniBar value={realizados.length} max={Math.max(realizados.length, cancelados.length, 1)} color={C.success} />
              <span style={{ color: C.text, fontSize: '12px', fontWeight: 700, width: '24px', textAlign: 'right', flexShrink: 0 }}>{realizados.length}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.65rem' }}>
              <span style={{ color: C.danger, fontSize: '11px', width: '80px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}><i className="fa-solid fa-ban" /> Cancelados</span>
              <MiniBar value={cancelados.length} max={Math.max(realizados.length, cancelados.length, 1)} color={C.danger} />
              <span style={{ color: C.text, fontSize: '12px', fontWeight: 700, width: '24px', textAlign: 'right', flexShrink: 0 }}>{cancelados.length}</span>
            </div>
            <div style={{ color: C.muted, fontSize: '11px', textAlign: 'right' }}>
              Taxa de cancelamento: <strong style={{ color: taxaCanc > 20 ? C.danger : C.muted }}>{taxaCanc}%</strong>
            </div>
          </div>

          {/* ── tipo de show ────────────────────────────────────── */}
          {(eletricos > 0 || acusticos > 0) && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '0.85rem 1rem', animation: 'dashFadeUp 0.35s ease 0.4s both' }}>
              <div style={{ color: C.muted, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                Tipo — {periodoLabel}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.55rem' }}>
                <span style={{ color: C.accentText, fontSize: '11px', width: '80px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}><i className="fa-solid fa-bolt" /> Elétrico</span>
                <MiniBar value={eletricos} max={Math.max(eletricos, acusticos, 1)} color={C.accent} />
                <span style={{ color: C.text, fontSize: '12px', fontWeight: 700, width: '24px', textAlign: 'right', flexShrink: 0 }}>{eletricos}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ color: C.soft, fontSize: '11px', width: '80px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}><i className="fa-solid fa-music" /> Acústico</span>
                <MiniBar value={acusticos} max={Math.max(eletricos, acusticos, 1)} color={C.soft} />
                <span style={{ color: C.text, fontSize: '12px', fontWeight: 700, width: '24px', textAlign: 'right', flexShrink: 0 }}>{acusticos}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── root ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'shows', icon: 'fa-solid fa-guitar', label: 'Shows' },
  { id: 'bares', icon: 'fa-solid fa-house', label: 'Bares' },
  { id: 'dashboard', icon: 'fa-solid fa-chart-bar', label: 'Dashboard' },
]

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(null) // null = verificando, false = não logado, true = logado
  const [tab, setTab] = useState('shows')

  useEffect(() => {
    fetch('/api/auth')
      .then(r => setLoggedIn(r.ok))
      .catch(() => setLoggedIn(false))
  }, [])

  function login() { setLoggedIn(true) }

  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' })
    setLoggedIn(false)
  }

  if (loggedIn === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', background: '#0b0d10' }}>
        <span style={{ color: '#9aa3ad', fontSize: '14px' }}>Verificando sessão...</span>
      </div>
    )
  }

  if (!loggedIn) return <LoginScreen onLogin={login} />

  const tabTitle = TABS.find(t => t.id === tab)

  return (
    <div style={{ background: C.bg, minHeight: '100dvh', color: C.text, fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '14px' }}>
      {/* top bar */}
      <header style={{ position: 'sticky', top: 0, zIndex: 30, background: C.card, borderBottom: `1px solid ${C.border}`, height: `${TOP_H}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.25rem' }}>
        <span style={{ fontWeight: 900, fontSize: '1rem', color: C.text, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className={tabTitle?.icon} /> {tabTitle?.label}
        </span>
        <button onClick={logout}
          style={{ background: C.surface, border: 'none', borderRadius: '8px', color: C.muted, padding: '0.45rem 1rem', cursor: 'pointer', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <i className="fa-solid fa-right-from-bracket" /> Sair
        </button>
      </header>

      {/* content */}
      <main style={{ padding: '1rem', maxWidth: '430px', margin: '0 auto' }}>
        {tab === 'shows'     && <ShowsTab key="shows" />}
        {tab === 'bares'     && <BaresTab key="bares" />}
        {tab === 'dashboard' && <DashboardTab key="dashboard" />}
      </main>

      {/* bottom nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '430px', height: `${NAV_H}px`, background: C.card, borderTop: `1px solid ${C.border}`, display: 'flex', zIndex: 30 }}>
        {TABS.map(({ id, icon, label }) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', color: tab === id ? C.accentText : C.muted, borderTop: `2px solid ${tab === id ? C.accent : 'transparent'}`, paddingTop: '2px' }}>
            <span style={{ fontSize: '1.25rem', lineHeight: 1 }}><i className={icon} /></span>
            <span style={{ fontSize: '11px', fontWeight: 700 }}>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
