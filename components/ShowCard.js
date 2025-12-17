'use client'

import Image from 'next/image'
import { useMemo, useRef, useState } from 'react'

function providerLinks(show){
  const name = `${show.venue} — ${show.city}`
  const encName = encodeURIComponent(name)
  const hasLL = !!(show.location && typeof show.location.lat === 'number' && typeof show.location.lng === 'number')
  const lat = show.location?.lat
  const lng = show.location?.lng

  const destParam = hasLL ? `${lat},${lng}` : encName

  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${destParam}`,
    waze: hasLL ? `https://waze.com/ul?ll=${lat}%2C${lng}&navigate=yes&zoom=17` : `https://waze.com/ul?q=${encName}&navigate=yes` ,
    apple: hasLL ? `https://maps.apple.com/?daddr=${lat},${lng}` : `https://maps.apple.com/?daddr=${encName}`
  }
}

export default function ShowCard({ show }){
  const [open,setOpen] = useState(false)
  const startY = useRef(null)
  const currentY = useRef(0)
  const panelRef = useRef(null)
  const links = useMemo(()=>providerLinks(show),[show])

  function onPointerDown(e){
    startY.current = e.clientY || e.touches?.[0]?.clientY
    currentY.current = 0
    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', onPointerUp)
  }
  function onPointerMove(e){
    const y = e.clientY
    if (startY.current == null) return
    const dy = Math.max(0, y - startY.current)
    currentY.current = dy
    if (panelRef.current){
      panelRef.current.style.transform = `translateY(${dy}px)`
    }
  }
  function onPointerUp(){
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)
    const dy = currentY.current
    if (dy > 120){
      setOpen(false)
    } else if (panelRef.current){
      panelRef.current.style.transform = ''
    }
    startY.current = null
    currentY.current = 0
  }

  return (
    <article className="show-card">
      <div className="media">
        <Image src={show.image} alt={`Show em ${show.venue}`} fill className="img" sizes="(max-width: 900px) 100vw, 50vw" />
      </div>
      <div className="content">
        <h3 className="show-title">{show.venue} — {show.city}</h3>
        <p className="show-when">{show.whenFormatted}</p>
        <p className="show-desc">{show.description}</p>
        <div className="show-actions">
          <button className="btn btn-outline-accent" onClick={()=>setOpen(true)}>Rotas</button>
          {show.postUrl && (
            <a className="btn btn-accent" href={show.postUrl} target="_blank" rel="noopener noreferrer">Ver publicação</a>
          )}
        </div>
      </div>

      {/* Bottom Sheet for route providers */}
      {open && (
        <div className="sheet" role="dialog" aria-modal="true" aria-label={`Rotas para ${show.venue}`}>
          <div className="sheet-backdrop" onClick={()=>setOpen(false)} />
          <div className="sheet-panel" ref={panelRef} style={{touchAction:'none'}}>
            <div className="sheet-handle" onPointerDown={onPointerDown}>
              <span className="sheet-grip" />
            </div>
            <div className="sheet-content">
              <h4 className="sheet-title">Abrir rota</h4>
              <p className="sheet-sub">Escolha seu app de navegação</p>
              <div className="sheet-actions">
                <a className="btn btn-accent" href={links.google} target="_blank" rel="noopener noreferrer">Google Maps</a>
                <a className="btn" href={links.waze} target="_blank" rel="noopener noreferrer">Waze</a>
                <a className="btn" href={links.apple} target="_blank" rel="noopener noreferrer">Maps Apple</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}
