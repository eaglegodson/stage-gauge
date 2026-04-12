'use client'

import { useState, useEffect } from 'react'
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

const CITY_MAP: Record<string, string> = {
  melbourne: 'Melbourne', sydney: 'Sydney', brisbane: 'Brisbane',
  perth: 'Perth', adelaide: 'Adelaide', hobart: 'Hobart', canberra: 'Canberra',
  auckland: 'Auckland', wellington: 'Wellington', london: 'London',
}
const COVERED = ['Melbourne','Sydney','Brisbane','Perth','Adelaide','Hobart','Canberra','Auckland','Wellington','London']

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [cityFilter, setCityFilter] = useState<string>('all')
  const [geoLoaded, setGeoLoaded] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => {
        const mapped = CITY_MAP[(data.city || '').toLowerCase()]
        if (mapped && COVERED.includes(mapped)) setCityFilter(mapped)
      })
      .catch(() => {})
      .finally(() => setGeoLoaded(true))
  }, [])

  useEffect(() => {
    if (!geoLoaded) return
    fetchReviews()
  }, [cityFilter, geoLoaded])

  async function fetchReviews() {
    setLoading(true)
    let query = supabase
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
      .limit(60)

    const { data, error } = await query
    if (error) { setLoading(false); return }

    let filtered = (data || []).filter(r => r.productions)
    if (cityFilter !== 'all') {
      filtered = filtered.filter(r => (r.productions as any)?.city === cityFilter)
    }

    setReviews(filtered)
    setLoading(false)
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#14141f', display: 'flex', flexDirection: 'column' }}>
      <Header />

      {/* City filter bar */}
      <div style={{ backgroundColor: '#0d0d1a', borderBottom: '1px solid #1e1e2e', position: 'sticky', top: '56px', zIndex: 90 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', overflowX: 'auto', padding: '0 24px' }}>
          {['all', ...COVERED].map(c => (
            <button
              key={c}
              onClick={() => setCityFilter(c)}
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

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px', flex: 1, width: '100%' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 6px 0' }}>
            Latest reviews
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            {cityFilter === 'all' ? 'All cities' : cityFilter} · critic reviews
          </p>
        </div>

        {loading && (
          <p style={{ color: '#4b5563', fontSize: '14px' }}>Loading...</p>
        )}

        {!loading && reviews.length === 0 && (
          <p style={{ color: '#4b5563', fontSize: '14px' }}>No reviews found for this city yet.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {reviews.map(review => {
            const prod = review.productions as any
            const show = prod?.shows
            const cfg = TYPE_CONFIG[show?.type] || TYPE_CONFIG.theatre
            return (
              <div key={review.id} style={{ background: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: '0' }}>
                  {/* Colour stripe */}
                  <div style={{ width: '6px', background: cfg.accent, flexShrink: 0 }} />

                  <div style={{ padding: '16px 18px', flex: 1, minWidth: 0 }}>
                    {/* Show title + city */}
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

                    {/* Outlet + reviewer + date */}
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

                    {/* Pull quote */}
                    {review.pull_quote && (
                      <p style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', margin: '0 0 10px 0', lineHeight: '1.6' }}>
                        "{review.pull_quote}"
                      </p>
                    )}

                    {/* Links */}
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
      </div>

      <Footer />
    </main>
  )
}
