'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

export default function ThemeLogo({ className = 'img contain', sizes = '(max-width: 1100px) 40vw, 30vw', alt = 'Logo' }){
  const [isLight, setIsLight] = useState(false)
  useEffect(() => {
    const el = document.documentElement
    const update = () => setIsLight(el.getAttribute('data-theme') === 'light')
    update()
    const obs = new MutationObserver(update)
    obs.observe(el, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  const src = isLight ? '/logo_preto.png' : '/logo.png'
  return (
    <Image src={src} alt={alt} fill className={className} sizes={sizes} />
  )
}
