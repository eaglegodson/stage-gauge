'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import posthog from 'posthog-js'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    const { data } = await supabase
      .from('production_listing')
      .select('*')
      .or(`title.ilike.%${query}%,company.ilike.%${query}%,venue.ilike.%${query}%`)
      .order('combined_score', { ascending: false, nullsFirst: false })
    setResults(data || [])
    posthog.capture('search_performed', { query: query.trim(), result_count: (data || []).length })
    setLoading(false)
  }

  return (
    <div style={{minHeight: '100vh', backgroundColor: 'white'}}>
      <header style={{borderBottom: '1px solid #f3f4f6', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <a href="/" style={{fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '600', color: '#111827', textDecoration: 'none'}}>StageGauge</a>
      </header>

      <div style={{maxWidth: '672px', margin: '0 auto', padding: '32px 24px'}}>
        <h1 style={{fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: '600', color: '#111827', marginBottom: '24px'}}>Search</h1>

        <div style={{display: 'flex', gap: '8px', marginBottom: '32px'}}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search shows, companies, venues..."
            style={{flex: 1, border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px 16px', fontSize: '15px', color: '#111827', backgroundColor: '#fff', outline: 'none'}}
          />
          <button
            onClick={handleSearch}
            style={{backgroundColor: '#1D9E75', color: 'white', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', border: 'none', cursor: 'pointer'}}
          >
            Search
          </button>
        </div>

        {loading && <p style={{fontSize: '14px', color: '#9ca3af'}}>Searching...</p>}

        {!loading && searched && results.length === 0 && (
          <p style={{fontSize: '14px', color: '#9ca3af'}}>No results for "{query}"</p>
        )}

        <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
          {results.map((p) => {
            const score = p.combined_score ? Math.round(p.combined_score) : null
            return (
              <a key={p.production_id} href={"/show/" + p.production_id} style={{display: 'block', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '16px', textDecoration: 'none', color: 'inherit'}}>
                <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px'}}>
                  <div style={{flex: 1}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px'}}>
                      <span style={{fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: '20px', backgroundColor: '#f3f4f6', color: '#4b5563', textTransform: 'capitalize'}}>{p.type}</span>
                      <span style={{fontSize: '11px', color: '#9ca3af'}}>{p.city}</span>
                    </div>
                    <h3 style={{fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 4px 0'}}>{p.title}</h3>
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
                    </div>
                  )}
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}
