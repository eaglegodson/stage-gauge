'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Header() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
  }, [])

  return (
    <header style={{
      backgroundColor: '#0F1A14',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '56px',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <a href="/" style={{textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: '10px'}}>
        <span style={{fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '600', color: '#ffffff', letterSpacing: '-0.3px'}}>Stage Gauge</span>
        <span style={{fontSize: '11px', color: '#4ade80', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: '500'}}>Beta</span>
      </a>
      <nav style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
        {user && (
          <>
            <a href="/watchlist" style={{fontSize: '13px', color: '#9ca3af', textDecoration: 'none'}}>Watchlist</a>
            <a href="/admin" style={{fontSize: '13px', color: '#9ca3af', textDecoration: 'none'}}>Moderation</a>
          </>
        )}
        {user ? (
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <span style={{fontSize: '13px', color: '#6b7280'}}>{user.user_metadata?.display_name || user.email}</span>
            <button
              onClick={async () => { await supabase.auth.signOut(); window.location.reload() }}
              style={{fontSize: '13px', color: '#6b7280', textDecoration: 'none', background: 'none', border: '1px solid #374151', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer'}}
            >
              Sign out
            </button>
          </div>
        ) : (
          <a href="/auth" style={{fontSize: '13px', color: 'white', padding: '6px 14px', borderRadius: '6px', backgroundColor: '#1D9E75', textDecoration: 'none', fontWeight: '500'}}>
            Sign in
          </a>
        )}
      </nav>
    </header>
  )
}
