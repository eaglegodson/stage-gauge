'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [productions, setProductions] = useState<any[]>([])
  const [typeFilter, setTypeFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')
  const [user, setUser] = useState<any>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
  }, [])

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus()
    }
  }, [searchOpen])

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('production_listing')
        .select('*')
        .or(`title.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%,venue.ilike.%${searchQuery}%`)
        .order('combined_score', { ascending: false, nullsFirst: false })
        .limit(8)
      setSearchResults(data || [])
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    async function fetchProductions() {
      let query = supabase
        .from('production_listing')
        .select('*')
        .not('combined_score', 'is', null)
        .order('combined_score', { ascending: false })

      if (typeFilter !== 'all') query = query.eq('type', typeFilter)
      if (cityFilter !== 'all') query = query.eq('city', cityFilter)

      const { data, error } = await query
      if (!error) setProductions(data)
    }
    fetchProductions()
  }, [typeFilter, cityFilter])

  const typeFilters = ['all', 'theatre', 'musical', 'opera', 'ballet', 'dance']
  const cityFilters = ['all', 'Melbourne', 'Sydney', 'Brisbane', 'Perth', 'Adelaide', 'Canberra', 'Hobart', 'Auckland', 'Wellington', 'Christchurch', 'London']

  return (
    <main style={{minHeight: '100vh', backgroundColor: 'white'}}>
      <header style={{borderBottom: '1px solid #f3f4f6', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div>
          <h1 style={{fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '600', color: '#111827', margin: 0}}>Stage Gauge</h1>
          <p style={{fontSize: '11px', color: '#9ca3af', margin: '2px 0 0 0'}}>The home for live performance reviews</p>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
          <button onClick={() => { setSearchOpen(!searchOpen); setSearchQuery(''); setSearchResults([]) }} style={{fontSize: '14px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer'}}>
            {searchOpen ? '✕ Close' : '🔍 Search'}
          </button>
          {user ? (
            <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
              <span style={{fontSize: '14px', color: '#4b5563'}}>{user.user_metadata?.display_name || user.email}</span>
              <button onClick={async () => { await supabase.auth.signOut(); setUser(null) }} style={{fontSize: '14px', color: '#6b7280', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer'}}>Sign out</button>
            </div>
          ) : (
            <a href="/auth" style={{fontSize: '14px', color: 'white', padding: '8px 16px', borderRadius: '20px', backgroundColor: '#1D9E75', textDecoration: 'none'}}>Sign in</a>
          )}
        </div>
      </header>

      {searchOpen && (
        <div style={{borderBottom: '1px solid #f3f4f6', padding: '16px 24px', backgroundColor: '#f9fafb'}}>
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shows, companies, venues..."
            style={{width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px 16px', fontSize: '15px', color: '#111827', backgroundColor: '#fff', outline: 'none', boxSizing: 'border-box'}}
          />
          {searchQuery && (
            <div style={{marginTop: '8px'}}>
              {searching && <p style={{fontSize: '14px', color: '#9ca3af', padding: '8px 0'}}>Searching...</p>}
              {!searching && searchResults.length === 0 && searchQuery && (
                <p style={{fontSize: '14px', color: '#9ca3af', padding: '8px 0'}}>No results for "{searchQuery}"</p>
              )}
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px'}}>
                {searchResults.map((p) => (
                  <a key={p.production_id} href={"/show/" + p.production_id} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #f3f4f6', textDecoration: 'none', color: 'inherit'}}>
                    <div>
                      <div style={{fontFamily: 'Georgia, serif', fontSize: '16px', fontWeight: '600', color: '#111827'}}>{p.title}</div>
                      <div style={{fontSize: '13px', color: '#6b7280'}}>{p.company} · {p.city}</div>
                    </div>
                    {p.combined_score && <div style={{fontSize: '18px', fontWeight: 'bold', color: '#1D9E75'}}>{Math.round(p.combined_score)}</div>}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{borderBottom: '1px solid #f3f4f6', padding: '12px 24px', display: 'flex', gap: '8px', overflowX: 'auto'}}>
        {typeFilters.map((f) => (
          <button key={f} onClick={() => setTypeFilter(f)} style={{fontSize: '12px', fontWeight: '500', padding: '6px 12px', borderRadius: '20px', whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', backgroundColor: typeFilter === f ? '#1D9E75' : '#f3f4f6', color: typeFilter === f ? 'white' : '#6b7280'}}>
            {f === 'all' ? 'All types' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div style={{borderBottom: '1px solid #f3f4f6', padding: '12px 24px', display: 'flex', gap: '8px', overflowX: 'auto'}}>
        {cityFilters.map((c) => (
          <button key={c} onClick={() => setCityFilter(c)} style={{fontSize: '12px', fontWeight: '500', padding: '6px 12px', borderRadius: '20px', whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', backgroundColor: cityFilter === c ? '#111827' : '#f3f4f6', color: cityFilter === c ? 'white' : '#6b7280'}}>
            {c === 'all' ? 'All cities' : c}
          </button>
        ))}
      </div>

      <div style={{maxWidth: '672px', margin: '0 auto', padding: '32px 24px'}}>
        <h2 style={{fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', marginBottom: '24px'}}>Now showing</h2>
        <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
          {productions?.map((p) => {
            const score = p.combined_score ? Math.round(p.combined_score) : null
            return (
              <a key={p.production_id} href={"/show/" + p.production_id} style={{display: 'block', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '16px', textDecoration: 'none', color: 'inherit'}}>
                <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px'}}>
                  <div style={{flex: 1, minWidth: 0}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px'}}>
                      <span style={{fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: '20px', backgroundColor: '#f3f4f6', color: '#4b5563', textTransform: 'capitalize'}}>{p.type}</span>
                      <span style={{fontSize: '11px', color: '#9ca3af'}}>{p.city}</span>
                    </div>
                    <h3 style={{fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: '600', color: '#111827', lineHeight: '1.3', margin: '0 0 4px 0'}}>{p.title}</h3>
                    <p style={{fontSize: '14px', color: '#6b7280', margin: 0}}>{p.company} · {p.venue}</p>
                  </div>
                  {score && (
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0}}>
                      <div style={{fontSize: '24px', fontWeight: 'bold', color: '#1D9E75'}}>{score}</div>
                      <div style={{display: 'flex', gap: '2px', marginTop: '4px'}}>
                        {[1,2,3,4,5].map((bar) => (
                          <div key={bar} style={{width: '6px', height: '16px', borderRadius: '2px', backgroundColor: score >= bar * 20 ? '#1D9E75' : '#e5e7eb'}}></div>
                        ))}
                      </div>
                      <div style={{fontSize: '11px', color: '#9ca3af', marginTop: '4px'}}>{(p.critic_count || 0) + (p.audience_count || 0)} reviews</div>
                    </div>
                  )}
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </main>
  )
}
