'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchWatchlist(session.user.id)
      } else {
        setLoading(false)
      }
    })
  }, [])

  async function fetchWatchlist(userId: string) {
    const { data } = await supabase
      .from('watchlist')
      .select('*, productions(id, show_id, venue, city, shows(title, type, company))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setWatchlist(data || [])
    setLoading(false)
  }

  async function removeFromWatchlist(id: string) {
    await supabase.from('watchlist').delete().eq('id', id)
    setWatchlist(watchlist.filter(w => w.id !== id))
  }

  return (
    <div style={{minHeight: '100vh', backgroundColor: '#1e1e2e'}}>
      <header style={{borderBottom: '1px solid #f3f4f6', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <a href="/" style={{fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '600', color: '#f1f5f9', textDecoration: 'none'}}>Stage Gauge</a>
        {user && <span style={{fontSize: '14px', color: '#9ca3af'}}>{user.user_metadata?.display_name || user.email}</span>}
      </header>

      <div style={{maxWidth: '672px', margin: '0 auto', padding: '32px 24px'}}>
        <a href="/" style={{fontSize: '14px', color: '#9ca3af', textDecoration: 'none', display: 'block', marginBottom: '24px'}}>← Back</a>
        <h1 style={{fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: '600', color: '#f1f5f9', marginBottom: '8px'}}>Watchlist</h1>

        {!user && !loading && (
          <div style={{textAlign: 'center', padding: '48px 0'}}>
            <p style={{fontSize: '16px', color: '#6b7280', marginBottom: '16px'}}>Sign in to save shows to your watchlist</p>
            <a href="/auth" style={{fontSize: '14px', color: 'white', padding: '10px 24px', borderRadius: '20px', backgroundColor: '#1D9E75', textDecoration: 'none'}}>Sign in</a>
          </div>
        )}

        {loading && <p style={{color: '#9ca3af'}}>Loading...</p>}

        {user && !loading && watchlist.length === 0 && (
          <div style={{textAlign: 'center', padding: '48px 0'}}>
            <p style={{fontSize: '16px', color: '#6b7280', marginBottom: '8px'}}>Your watchlist is empty</p>
            <p style={{fontSize: '14px', color: '#9ca3af'}}>Add shows from their page to keep track of what you want to see</p>
          </div>
        )}

        <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
          {watchlist.map((item) => {
            const prod = item.productions
            const show = prod?.shows
            if (!show) return null
            return (
              <div key={item.id} style={{border: '1px solid #f3f4f6', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px'}}>
                <a href={"/show/" + prod.id} style={{flex: 1, textDecoration: 'none', color: 'inherit'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px'}}>
                    <span style={{fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: '20px', backgroundColor: '#f3f4f6', color: '#9ca3af', textTransform: 'capitalize'}}>{show.type}</span>
                    <span style={{fontSize: '11px', color: '#9ca3af'}}>{prod.city}</span>
                  </div>
                  <div style={{fontFamily: 'Georgia, serif', fontSize: '17px', fontWeight: '600', color: '#f1f5f9'}}>{show.title}</div>
                  <div style={{fontSize: '13px', color: '#6b7280'}}>{show.company} · {prod.venue}</div>
                </a>
                <button
                  onClick={() => removeFromWatchlist(item.id)}
                  style={{fontSize: '13px', color: '#9ca3af', background: 'none', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', whiteSpace: 'nowrap'}}
                >
                  Remove
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
