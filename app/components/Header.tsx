'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function Header({ onSearch }: { onSearch?: () => void }) {
  const [user, setUser] = useState<any>(null)
  const pathname = usePathname()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
  }, [])

  function handleSearch() {
    if (onSearch) {
      onSearch()
    } else {
      window.location.href = '/browse'
    }
  }

  const isCommunity = pathname === '/community'
  const isProfessional = pathname === '/browse' || pathname === '/reviews' || pathname.startsWith('/show/')

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 100, width: '100%' }}>
      <header style={{
        backgroundColor: '#0f0f1a',
        borderBottom: '1px solid #1e1e2e',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '56px',
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        minWidth: 0,
      }}>
        <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: '8px', flexShrink: 0 }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '600', color: '#f1f5f9', letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>StageGauge</span>
        </a>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, overflow: 'hidden' }}>
          <button onClick={handleSearch} style={{ fontSize: '13px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </button>
          <a href="/about" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>About</a>
          {user && (
            <a href="/watchlist" style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>Watchlist</a>
          )}
          {user ? (
            <button
              onClick={async () => { await supabase.auth.signOut(); window.location.reload() }}
              style={{ fontSize: '13px', color: '#9ca3af', background: 'none', border: '1px solid #2a2a3e', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              Sign out
            </button>
          ) : (
            <a href="/auth" style={{ fontSize: '13px', color: 'white', padding: '6px 14px', borderRadius: '6px', backgroundColor: '#1D9E75', textDecoration: 'none', fontWeight: '500', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Sign in
            </a>
          )}
        </nav>
      </header>
      <div style={{ backgroundColor: '#0a0a14', borderBottom: '1px solid #2a2a3e', display: 'flex', alignItems: 'center', height: '36px', paddingLeft: '16px' }}>
        <a href="/browse" style={{ fontSize: '12px', fontWeight: isProfessional ? '600' : '400', color: isProfessional ? '#f1f5f9' : '#6b7280', textDecoration: 'none', padding: '0 16px', height: '100%', display: 'flex', alignItems: 'center', borderBottom: isProfessional ? '2px solid #1D9E75' : '2px solid transparent', whiteSpace: 'nowrap' }}>
          Professional Shows
        </a>
        <a href="/community" style={{ fontSize: '12px', fontWeight: isCommunity ? '600' : '400', color: isCommunity ? '#a78bfa' : '#6b7280', textDecoration: 'none', padding: '0 16px', height: '100%', display: 'flex', alignItems: 'center', borderBottom: isCommunity ? '2px solid #a78bfa' : '2px solid transparent', whiteSpace: 'nowrap' }}>
          Community Theatre
        </a>
      </div>
    </div>
  )
}
