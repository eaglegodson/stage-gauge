'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Header from '../components/Header'

const typeColors: Record<string, { bg: string, accent: string, emoji: string }> = {
  theatre:  { bg: '#1C2B3A', accent: '#4A90D9', emoji: '🎭' },
  musical:  { bg: '#2D1B3D', accent: '#C084FC', emoji: '🎵' },
  opera:    { bg: '#2B1A1A', accent: '#F87171', emoji: '🎶' },
  ballet:   { bg: '#1A2440', accent: '#60A5FA', emoji: '🩰' },
  dance:    { bg: '#1A2D2A', accent: '#34D399', emoji: '💃' },
  concert:  { bg: '#2D2A1A', accent: '#FBBF24', emoji: '🎻' },
}

function TypeTile({ type }: { type: string }) {
  const colors = typeColors[type] || typeColors.theatre
  return (
    <div style={{width: '56px', height: '72px', borderRadius: '4px', backgroundColor: colors.bg, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', border: `1px solid ${colors.accent}22`}}>
      <span style={{fontSize: '20px'}}>{colors.emoji}</span>
      <div style={{width: '20px', height: '2px', backgroundColor: colors.accent, borderRadius: '1px'}}></div>
    </div>
  )
}

export default function ArchivePage() {
  const [productions, setProductions] = useState<any[]>([])
  const [typeFilter, setTypeFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')

  useEffect(() => {
    async function fetchProductions() {
      const today = new Date().toISOString().split('T')[0]
      let query = supabase
        .from('production_listing')
        .select('*')
        .lt('season_end', today)
        .order('season_end', { ascending: false })

      if (typeFilter !== 'all') query = query.eq('type', typeFilter)
      if (cityFilter !== 'all') query = query.eq('city', cityFilter)

      const { data, error } = await query
      if (!error) setProductions(data || [])
    }
    fetchProductions()
  }, [typeFilter, cityFilter])

  const typeFilters = ['all', 'theatre', 'musical', 'opera', 'ballet', 'dance']
  const cityFilters = ['all', 'Melbourne', 'Sydney', 'Brisbane', 'Perth', 'Adelaide', 'Auckland', 'Wellington', 'London']

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <main style={{minHeight: '100vh', backgroundColor: '#F5F0E8'}}>
      <Header />

      <div style={{backgroundColor: '#1a2e1a', borderBottom: '1px solid #162316', padding: '0 24px'}}>
        <div style={{maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', overflowX: 'auto'}}>
          {typeFilters.map((f) => (
            <button key={f} onClick={() => setTypeFilter(f)} style={{fontSize: '12px', fontWeight: typeFilter === f ? '600' : '400', padding: '10px 14px', whiteSpace: 'nowrap', border: 'none', borderBottom: typeFilter === f ? '2px solid #1D9E75' : '2px solid transparent', cursor: 'pointer', backgroundColor: 'transparent', color: typeFilter === f ? '#ffffff' : '#6b7280', marginBottom: '-1px', flexShrink: 0}}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <div style={{width: '1px', height: '16px', backgroundColor: '#243824', margin: '0 8px', flexShrink: 0}}></div>
          {cityFilters.map((c) => (
            <button key={c} onClick={() => setCityFilter(c)} style={{fontSize: '12px', fontWeight: cityFilter === c ? '600' : '400', padding: '10px 14px', whiteSpace: 'nowrap', border: 'none', borderBottom: cityFilter === c ? '2px solid #ffffff' : '2px solid transparent', cursor: 'pointer', backgroundColor: 'transparent', color: cityFilter === c ? '#ffffff' : '#6b7280', marginBottom: '-1px', flexShrink: 0}}>
              {c === 'all' ? 'All cities' : c}
            </button>
          ))}
        </div>
      </div>

      <div style={{maxWidth: '1100px', margin: '0 auto', padding: '40px 24px'}}>
        <div style={{marginBottom: '32px'}}>
          <h1 style={{fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0'}}>Archive</h1>
          <p style={{fontSize: '14px', color: '#9ca3af', margin: 0}}>Past productions — {productions.length} shows</p>
        </div>

        <div style={{backgroundColor: 'white', border: '1px solid #E2DDD6', borderRadius: '4px', overflow: 'hidden'}}>
          {productions.length === 0 && (
            <p style={{padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: '14px'}}>No past productions found.</p>
          )}
          {productions.map((p, i) => {
            const score = p.combined_score ? Math.round(p.combined_score) : null
            return (
              <a key={p.production_id} href={"/show/" + p.production_id} style={{display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 20px', textDecoration: 'none', color: 'inherit', borderBottom: i < productions.length - 1 ? '1px solid #F5F0E8' : 'none', opacity: 0.75}}>
                <TypeTile type={p.type} />
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap'}}>
                    <span style={{fontFamily: 'Georgia, serif', fontSize: '15px', fontWeight: '600', color: '#111827'}}>{p.title}</span>
                    <span style={{fontSize: '12px', color: '#9ca3af'}}>{p.company}</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px'}}>
                    <span style={{fontSize: '11px', color: '#9ca3af', textTransform: 'capitalize'}}>{p.type}</span>
                    <span style={{fontSize: '11px', color: '#D1CBC0'}}>·</span>
                    <span style={{fontSize: '11px', color: '#9ca3af'}}>{p.city}</span>
                    {p.season_start && p.season_end && <>
                      <span style={{fontSize: '11px', color: '#D1CBC0'}}>·</span>
                      <span style={{fontSize: '11px', color: '#9ca3af'}}>{fmt(p.season_start)} – {fmt(p.season_end)}</span>
                    </>}
                  </div>
                </div>
                {score && (
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0}}>
                    <div style={{display: 'flex', gap: '2px'}}>
                      {[1,2,3,4,5].map((bar) => (
                        <div key={bar} style={{width: '4px', height: '14px', borderRadius: '1px', backgroundColor: score >= bar * 20 ? '#1D9E75' : '#E8E3DC'}}></div>
                      ))}
                    </div>
                    <span style={{fontSize: '17px', fontWeight: '700', color: '#1D9E75', width: '32px', textAlign: 'right'}}>{score}</span>
                  </div>
                )}
              </a>
            )
          })}
        </div>
      </div>
    </main>
  )
}