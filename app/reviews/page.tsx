'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import Header from '../components/Header'
import Footer from '../components/Footer'

const TYPE_CONFIG: Record<string, { gradient: string; accent: string }> = {
  theatre:  { gradient: 'linear-gradient(135deg, #1a3a5c 0%, #2d6a9f 100%)', accent: '#4A90D9' },
  musical:  { gradient: 'linear-gradient(135deg, #3b1f5e 0%, #7c3aed 100%)', accent: '#C084FC' },
  opera:    { gradient: 'linear-gradient(135deg, #5c1a1a 0%, #9f2d2d 100%)', accent: '#F87171' },
  ballet:   { gradient: 'linear-gradient(135deg, #1a3347 0%, #2d6a8f 100%)', accent: '#38BDF8' },
  dance:    { gradient: 'linear-gradient(135deg, #1a4a3a 0%, #1D9E75 100%)', accent: '#34D399' },
  concert:  { gradient: 'linear-gradient(135deg, #4a3a1a 0%, #9f7c2d 100%)', accent: '#FBBF24' },
}

function StarDisplay({ score }: { score: number }) {
  const full = Math.floor(score)
  const half = score - full >= 0.5
  return (
    <span style={{ color: '#1D9E75', fontSize: '14px', letterSpacing: '1px' }}>
      {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(5 - full - (half ? 1 : 0))}
    </span>
  )
}

const COVERED = ['Melbourne','Sydney','Brisbane','Perth','Adelaide','Hobart','Canberra','Auckland','Wellington','London']

function FilterDropdown({ label, options, values, onChange, allKey = 'all' }: { label: string, options: string[], values: string[], onChange: (v: string[]) => void, allKey?: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])
  const isAll = values.length === 0 || (values.length === 1 && values[0] === allKey)
  const active = !isAll
  function toggle(opt: string) {
    if (opt === allKey) { onChange([allKey]); return }
    const without = values.filter(v => v !== allKey)
    if (without.includes(opt)) {
      const next = without.filter(v => v !== opt)
      onChange(next.length === 0 ? [allKey] : next)
    } else {
      onChange([...without, opt])
    }
  }
  const displayLabel = active ? values.length === 1 ? values[0] : label + ' (' + values.length + ')' : label
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ background: active ? '#0f2d1a' : '#0f0f1a', border: '1px solid ' + (active ? '#1D9E75' : '#2a2a3e'), borderRadius: '6px', padding: '7px 12px', fontSize: '12px', color: active ? '#1D9E75' : '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
        {displayLabel}<span style={{ fontSize: '9px', opacity: 0.6 }}>▾</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '8px', overflow: 'hidden', zIndex: 100, minWidth: '200px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          {options.map(opt => {
            const selected = values.includes(opt)
            return (
              <button key={opt} onClick={() => toggle(opt)} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '9px 14px', textAlign: 'left', fontSize: '12px', color: selected ? '#1D9E75' : '#9ca3af', background: selected ? '#0f2d1a' : 'transparent', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = '#1e1e2e' }}
                onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <span style={{ width: '14px', height: '14px', border: '1px solid ' + (selected ? '#1D9E75' : '#4b5563'), borderRadius: '3px', background: selected ? '#1D9E75' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '9px', color: '#14141f' }}>{selected ? '✓' : ''}</span>
                {opt === allKey ? 'All publications' : opt}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function ReviewsPage() {
  const [reviewType, setReviewType] = useState<'critic' | 'audience'>('critic')
  const [reviews, setReviews] = useState<any[]>([])
  const [audienceReviews, setAudienceReviews] = useState<any[]>([])
  const [cityFilter, setCityFilter] = useState<string>('all')
  const [outletFilter, setOutletFilter] = useState<string[]>(['all'])
  const [availableOutlets, setAvailableOutlets] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timezoneToCity: Record<string, string> = {
      'Australia/Melbourne': 'Melbourne', 'Australia/Sydney': 'Sydney',
      'Australia/Brisbane': 'Brisbane', 'Australia/Perth': 'Perth',
      'Australia/Adelaide': 'Adelaide', 'Australia/Hobart': 'Hobart',
      'Australia/Darwin': 'Melbourne', 'Australia/ACT': 'Canberra',
      'Australia/Canberra': 'Canberra', 'Pacific/Auckland': 'Auckland',
      'Pacific/Wellington': 'Wellington', 'Europe/London': 'London',
    }
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const city = timezoneToCity[timezone]
    if (city) setCityFilter(city)
  }, [])

  useEffect(() => {
    fetchCriticReviews()
  }, [cityFilter, outletFilter])

  useEffect(() => {
    fetchAudienceReviews()
  }, [cityFilter])

  async function fetchCriticReviews() {
    setLoading(true)
    const { data, error } = await supabase
      .from('critic_reviews')
      .select(`
        id, outlet, reviewer, published_date, star_rating, pull_quote, source_url,
        productions (
          id, city, country,
          shows ( title, type, company )
        )
      `)
      .eq('status', 'approved')
      .not('productions', 'is', null)
      .order('published_date', { ascending: false })
      .limit(200)

    if (error) { setLoading(false); return }

    let filtered = (data || []).filter(r => r.productions)

    if (cityFilter !== 'all') {
      filtered = filtered.filter(r => (r.productions as any)?.city === cityFilter)
    }

    const outlets = Array.from(new Set(filtered.map((r: any) => r.outlet).filter(Boolean))).sort() as string[]
    setAvailableOutlets(outlets)

    const activeOutlets = outletFilter.filter(o => o !== 'all')
    if (activeOutlets.length > 0) {
      filtered = filtered.filter(r => activeOutlets.includes(r.outlet))
    }

    setReviews(filtered.slice(0, 60))
    setLoading(false)
  }

  async function fetchAudienceReviews() {
    const { data, error } = await supabase
      .from('audience_reviews')
      .select(`
        id, star_rating, review_text, created_at,
        productions (
          id, city,
          shows ( title, type, company )
        )
      `)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(60)

    if (error) return

    let filtered = (data || []).filter(r => r.productions)

    if (cityFilter !== 'all') {
      filtered = filtered.filter(r => (r.productions as any)?.city === cityFilter)
    }

    setAudienceReviews(filtered)
  }

  const isLoadingCurrent = loading && reviewType === 'critic'

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#14141f', display: 'flex', flexDirection: 'column' }}>
      <Header />

      {/* City filter bar */}
      <div style={{ backgroundColor: '#0d0d1a', borderBottom: '1px solid #1e1e2e', position: 'sticky', top: '56px', zIndex: 90 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', overflowX: 'auto', padding: '0 24px' }}>
          {['all', ...COVERED].map(c => (
            <button
              key={c}
              onClick={() => { setCityFilter(c); setOutletFilter(['all']) }}
              style={{
                fontSize: '12px',
                fontWeight: cityFilter === c ? '600' : '400',
                padding: '12px 16px',
                whiteSpace: 'nowrap',
                border: 'none',
                borderBottom: cityFilter === c ? '2px solid #1D9E75' : '2px solid transparent',
                cursor: 'pointer',
                backgroundColor: 'transparent',
                color: cityFilter === c ? '#f1f5f9' : '#6b7280',
                flexShrink: 0,
              }}
            >
              {c === 'all' ? 'All cities' : c}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px', flex: 1, width: '100%', boxSizing: 'border-box' }}>

        {/* Critic / Audience toggle */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {(['critic', 'audience'] as const).map(type => (
            <button
              key={type}
              onClick={() => setReviewType(type)}
              style={{
                padding: '8px 20px',
                borderRadius: '6px',
                border: reviewType === type ? 'none' : '1px solid #2a2a3e',
                background: reviewType === type ? '#1D9E75' : '#1e1e2e',
                color: reviewType === type ? '#fff' : '#9ca3af',
                fontWeight: reviewType === type ? 600 : 400,
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              {type === 'critic' ? 'Critic reviews' : 'Audience reviews'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 6px 0' }}>
              Latest reviews
            </h1>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
              {cityFilter === 'all' ? 'All cities' : cityFilter} · {reviewType === 'critic' ? 'critic reviews' : 'audience reviews'}
            </p>
          </div>
          {reviewType === 'critic' && availableOutlets.length > 0 && (
            <FilterDropdown
              label="Publication"
              options={['all', ...availableOutlets]}
              values={outletFilter}
              onChange={setOutletFilter}
            />
          )}
        </div>

        {isLoadingCurrent && <p style={{ color: '#4b5563', fontSize: '14px' }}>Loading...</p>}

        {/* Critic reviews */}
        {reviewType === 'critic' && !loading && (
          <>
            {reviews.length === 0 && <p style={{ color: '#4b5563', fontSize: '14px' }}>No reviews found.</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reviews.map(review => {
                const prod = review.productions as any
                const show = prod?.shows
                const cfg = TYPE_CONFIG[show?.type] || TYPE_CONFIG.theatre
                return (
                  <div key={review.id} style={{ background: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', gap: '0' }}>
                      <div style={{ width: '6px', background: cfg.accent, flexShrink: 0 }} />
                      <div style={{ padding: '16px 18px', flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                          <a href={'/show/' + prod?.id} style={{ textDecoration: 'none' }}>
                            <span style={{ fontFamily: 'Georgia, serif', fontSize: '16px', fontWeight: '600', color: '#f1f5f9', lineHeight: '1.3' }}>
                              {show?.title}
                            </span>
                          </a>
                          <span style={{ fontSize: '11px', color: '#4b5563', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {prod?.city}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: review.pull_quote ? '10px' : '0', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af' }}>{review.outlet}</span>
                          {review.reviewer && (
                            <>
                              <span style={{ fontSize: '11px', color: '#2a2a3e' }}>·</span>
                              <span style={{ fontSize: '12px', color: '#6b7280' }}>{review.reviewer}</span>
                            </>
                          )}
                          {review.star_rating && (
                            <>
                              <span style={{ fontSize: '11px', color: '#2a2a3e' }}>·</span>
                              <StarDisplay score={review.star_rating} />
                            </>
                          )}
                          {review.published_date && (
                            <>
                              <span style={{ fontSize: '11px', color: '#2a2a3e' }}>·</span>
                              <span style={{ fontSize: '11px', color: '#4b5563' }}>
                                {new Date(review.published_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </>
                          )}
                        </div>
                        {review.pull_quote && (
                          <p style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', margin: '0 0 10px 0', lineHeight: '1.6' }}>
                            "{review.pull_quote}"
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: '12px' }}>
                          {review.source_url && (
                            <a href={review.source_url} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: '12px', color: '#1D9E75', textDecoration: 'none', fontWeight: '500' }}>
                              Read full review →
                            </a>
                          )}
                          <a href={'/show/' + prod?.id}
                            style={{ fontSize: '12px', color: '#4b5563', textDecoration: 'none' }}>
                            Show page
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Audience reviews */}
        {reviewType === 'audience' && (
          <>
            {audienceReviews.length === 0 && (
              <p style={{ color: '#4b5563', fontSize: '14px' }}>
                No audience reviews yet{cityFilter !== 'all' ? ` for ${cityFilter}` : ''}.{' '}
                <a href="/browse" style={{ color: '#1D9E75', textDecoration: 'none' }}>Browse shows</a> and be the first.
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {audienceReviews.map(review => {
                const prod = review.productions as any
                const show = prod?.shows
                const cfg = TYPE_CONFIG[show?.type] || TYPE_CONFIG.theatre
                return (
                  <div key={review.id} style={{ background: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex' }}>
                      <div style={{ width: '6px', background: cfg.accent, flexShrink: 0 }} />
                      <div style={{ padding: '16px 18px', flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                          <a href={'/show/' + prod?.id} style={{ textDecoration: 'none' }}>
                            <span style={{ fontFamily: 'Georgia, serif', fontSize: '16px', fontWeight: '600', color: '#f1f5f9', lineHeight: '1.3' }}>
                              {show?.title}
                            </span>
                          </a>
                          <span style={{ fontSize: '11px', color: '#4b5563', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {prod?.city}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: review.review_text ? '10px' : '0', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>{show?.company}</span>
                          {review.star_rating && (
                            <>
                              <span style={{ fontSize: '11px', color: '#2a2a3e' }}>·</span>
                              <StarDisplay score={review.star_rating} />
                            </>
                          )}
                          {review.created_at && (
                            <>
                              <span style={{ fontSize: '11px', color: '#2a2a3e' }}>·</span>
                              <span style={{ fontSize: '11px', color: '#4b5563' }}>
                                {new Date(review.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </>
                          )}
                        </div>
                        {review.review_text && (
                          <p style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', margin: '0 0 10px 0', lineHeight: '1.6' }}>
                            "{review.review_text}"
                          </p>
                        )}
                        <a href={'/show/' + prod?.id}
                          style={{ fontSize: '12px', color: '#4b5563', textDecoration: 'none' }}>
                          Show page
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

      </div>

      <Footer />
    </main>
  )
}