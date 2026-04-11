'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Header({ onSearch }: { onSearch?: () => void }) {
  const [user, setUser] = useState<any>(null)
  const [lightMode, setLightMode] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Load saved preference
    const saved = localStorage.getItem('stagegauge-theme')
    if (saved === 'light') {
      setLightMode(true)
      applyLightMode(true)
    }
  }, [])

  function applyLightMode(on: boolean) {
    const root = document.documentElement
    if (on) {
      root.style.setProperty('--bg-primary', '#ffffff')
      root.style.setProperty('--bg-secondary', '#f3f4f6')
      root.style.setProperty('--bg-card', '#ffffff')
      root.style.setProperty('--border-color', '#e5e7eb')
      root.style.setProperty('--text-primary', '#111827')
      root.style.setProperty('--text-secondary', '#6b7280')
      root.style.setProperty('--header-bg', '#ffffff')
      root.style.setProperty('--header-border', '#e5e7eb')
      document.body.style.backgroundColor = '#f3f4f6'
      document.body.style.color = '#111827'
    } else {
      root.style.setProperty('--bg-primary', '#14141f')
      root.style.setProperty('--bg-secondary', '#1e1e2e')
      root.style.setProperty('--bg-card', '#1e1e2e')
      root.style.setProperty('--border-color', '#2a2a3e')
      root.style.setProperty('--text-primary', '#f1f5f9')
      root.style.setProperty('--text-secondary', '#9ca3af')
      root.style.setProperty('--header-bg', '#0f0f1a')
      root.style.setProperty('--header-border', '#1e1e2e')
      document.body.style.backgroundColor = '#14141f'
      document.body.style.color = '#f1f5f9'
    }
  }

  function toggleMode() {
    const next = !lightMode
    setLightMode(next)
    applyLightMode(next)
    localStorage.setItem('stagegauge-theme', next ? 'light' : 'dark')
  }

  const headerBg = lightMode ? '#ffffff' : '#0f0f1a'
  const headerBorder = lightMode ? '#e5e7eb' : '#1e1e2e'
  const textColor = lightMode ? '#111827' : '#f1f5f9'
  const mutedColor = lightMode ? '#6b7280' : '#9ca3af'
  const navBorder = lightMode ? '#e5e7eb' : '#2a2a3e'

  return (
    <header style={{
      backgroundColor: headerBg,
      borderBottom: `1px solid ${headerBorder}`,
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '56px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      transition: 'background-color 0.2s ease, border-color 0.2s ease'
    }}>
      <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '600', color: textColor, letterSpacing: '-0.3px' }}>StageGauge</span>
        <span style={{ fontSize: '10px', color: '#1D9E75', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: '600' }}>Beta</span>
      </a>
      <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {onSearch && (
          <button onClick={onSearch} style={{ fontSize: '13px', color: mutedColor, background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Search
          </button>
        )}
        {user && (
          <>
            <a href="/watchlist" style={{ fontSize: '13px', color: mutedColor, textDecoration: 'none' }}>Watchlist</a>
            <a href="/admin" style={{ fontSize: '13px', color: mutedColor, textDecoration: 'none' }}>Moderation</a>
          </>
        )}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: mutedColor }}>{user.user_metadata?.display_name || user.email}</span>
            <button
              onClick={async () => { await supabase.auth.signOut(); window.location.reload() }}
              style={{ fontSize: '13px', color: mutedColor, background: 'none', border: `1px solid ${navBorder}`, borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <a href="/auth" style={{ fontSize: '13px', color: 'white', padding: '6px 14px', borderRadius: '6px', backgroundColor: '#1D9E75', textDecoration: 'none', fontWeight: '500' }}>
            Sign in
          </a>
        )}

        {/* Light/Dark toggle */}
        <button
          onClick={toggleMode}
          title={lightMode ? 'Switch to dark mode' : 'Switch to light mode'}
          style={{
            fontSize: '13px',
            color: mutedColor,
            background: 'none',
            border: `1px solid ${navBorder}`,
            borderRadius: '6px',
            padding: '4px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            whiteSpace: 'nowrap',
            transition: 'border-color 0.2s ease'
          }}
        >
          {lightMode ? '🌙 Dark mode' : '☀️ Light mode'}
        </button>
      </nav>
    </header>
  )
}