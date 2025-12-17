'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle(){
  const [theme,setTheme] = useState('dark')
  useEffect(()=>{
    const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
    const initial = stored || 'dark'
    setTheme(initial)
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', initial)
    }
  },[])

  function toggle(){
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', next)
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', next)
    }
  }

  const isLight = theme === 'light'

  return (
    <div className="theme-toggle" role="presentation">
      <button aria-label={isLight ? 'Ativar tema escuro' : 'Ativar tema claro'} onClick={toggle} title={isLight ? 'Escuro' : 'Claro'}>
        {isLight ? (
          // Moon icon
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M21.75 14.5A9.75 9.75 0 0 1 9.5 2.25 9.75 9.75 0 1 0 21.75 14.5Z"/>
          </svg>
        ) : (
          // Sun icon
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm0 4a1 1 0 0 1-1-1v-1.5a1 1 0 1 1 2 0V21a1 1 0 0 1-1 1Zm0-18a1 1 0 0 1-1-1V1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1Zm10 8a1 1 0 0 1-1 1h-2a1 1 0 1 1 0-2h2a1 1 0 0 1 1 1ZM5 12a1 1 0 0 1-1 1H2a1 1 0 1 1 0-2h2a1 1 0 0 1 1 1Zm12.657 6.657a1 1 0 0 1-1.414 0l-1.06-1.06a1 1 0 1 1 1.414-1.415l1.06 1.06a1 1 0 0 1 0 1.415ZM8.817 7.403a1 1 0 0 1-1.415 0L6.343 6.343A1 1 0 0 1 7.757 4.93l1.06 1.06a1 1 0 0 1 0 1.415Zm8.425-1.06a1 1 0 0 1 0-1.415l1.06-1.06A1 1 0 0 1 19.757 4.93l-1.06 1.06a1 1 0 0 1-1.415 0ZM5.403 17.243a1 1 0 0 1 0 1.414l-1.06 1.06A1 1 0 1 1 2.93 18.303l1.06-1.06a1 1 0 0 1 1.414 0Z"/>
          </svg>
        )}
      </button>
    </div>
  )
}
