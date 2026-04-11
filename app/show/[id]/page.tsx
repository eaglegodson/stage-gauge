'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import Header from '../../components/Header'
import ReviewForm from './review'

const typeConfig: Record<string, { gradient: string, accent: string, emoji: string }> = {
  theatre:  { gradient: 'linear-gradient(160deg, #0f2744 0%, #1a6bb5 100%)', accent: '#4A90D9', emoji: '🎭' },
  musical:  { gradient: 'linear-gradient(160deg, #2d0f4a 0%, #8b2fc9 100%)', accent: '#C084FC', emoji: '🎵' },
  opera:    { gradient: 'linear-gradient(160deg, #4a0f0f 0%, #c93030 100%)', accent: '#F87171', emoji: '🎼' },
  ballet:   { gradient: 'linear-gradient(160deg, #0f1a44 0%, #2050b5 100%)', accent: '#60A5FA', emoji: '🩰' },
  dance:    { gradient: 'linear-gradient(160deg, #0f2d1a 0%, #0f8f5a 100%)', accent: '#34D399', emoji: '💃' },
  concert:  { gradient: 'linear-gradient(160deg, #2d230f 0%, #b57d10 100%)', accent: '#FBBF24', emoji: '🎻' },
}


const ticketingUrls: Record<string, string> = {
  'Melbourne Theatre Company': 'https://www.mtc.com.au/tickets',
  'Sydney Theatre Company': 'https://www.sydneytheatre.com.au/whats-on',
  'Belvoir St Theatre': 'https://belvoir.com.au/whats-on',
  'Malthouse Theatre': 'https://malthousetheatre.com.au/whats-on',
  'Griffin Theatre Company': 'https://griffintheatre.com.au/whats-on',
  'Ensemble Theatre': 'https://ensembletheatre.com.au/whats-on',
  'Queensland Theatre': 'https://queenslandtheatre.com.au/whats-on',
  'Queensland Theatre Company': 'https://queenslandtheatre.com.au/whats-on',
  'Opera Australia': 'https://opera.org.au/performances',
  'Australian Ballet': 'https://australianballet.com.au/performances',
  'Bangarra Dance Theatre': 'https://bangarra.com.au/performances',
  'Australian Ballet and Bangarra Dance Theatre': 'https://australianballet.com.au/performances',
  'Queensland Ballet': 'https://queenslandballet.com.au/performances',
  'West Australian Ballet': 'https://waballet.com.au/performances',
  'West Australian Opera': 'https://waopera.asn.au/performances',
  'Victorian Opera': 'https://victorianopera.com.au/performances',
  'Black Swan State Theatre Company': 'https://blackswantheatre.com.au/whats-on',
  'State Theatre Company South Australia': 'https://statetheatrecompany.com.au/whats-on',
  'State Opera South Australia': 'https://stateopera.com.au/performances',
  'Opera Queensland': 'https://operaqld.com.au/performances',
  'Bell Shakespeare': 'https://bellshakespeare.com.au/performances',
  'Red Stitch Actors Theatre': 'https://redstitch.net/whats-on',
  'La Mama Theatre': 'https://lamama.com.au/whats-on',
  'Canberra Theatre Centre': 'https://canberratheatrecentre.com.au/whats-on',
  'Marriner Theatres': 'https://www.ticketmaster.com.au',
  'Michael Cassel Group': 'https://www.ticketmaster.com.au',
  'Crossroads Live': 'https://www.ticketmaster.com.au',
  'John Frost for Crossroads Live': 'https://www.ticketmaster.com.au',
  'Disney Theatrical': 'https://www.ticketmaster.com.au',
  'Disney Theatrical Productions': 'https://www.ticketmaster.com.au',
  'QPAC': 'https://www.qpac.com.au/whats-on',
  'BIG Live': 'https://www.ticketmaster.com.au',
  'On Your Feet Australia': 'https://www.ticketmaster.com.au',
  'Soho Theatre': 'https://sohotheatre.com',
  'West End': 'https://www.ticketmaster.com.au',
}

function getTicketUrl(company: string, city: string, title: string, country: string): string {
  if (country === 'GB') {
    return 'https://www.todaytix.com/search?q=' + encodeURIComponent(title)
  }
  if (country === 'NZ') {
    return 'https://www.ticketmaster.co.nz/search?q=' + encodeURIComponent(title)
  }
  return ticketingUrls[company] || ('https://www.ticketmaster.com.au/search?q=' + encodeURIComponent(title))
}

function StarDisplay({ score, size = 'sm' }: { score: number, size?: 'sm' | 'lg' }) {
  const stars = []
  const fullStars = Math.floor(score)
  const hasHalf = score - fullStars >= 0.25 && score - fullStars < 0.75
  const roundedUp = score - fullStars >= 0.75
  const total = roundedUp ? fullStars + 1 : fullStars
  const fontSize = size === 'lg' ? '28px' : '16px'
  for (let i = 1; i <= 5; i++) {
    if (i <= total) stars.push(<span key={i} style={{ color: '#1D9E75', fontSize }}>★</span>)
    else if (i === fullStars + 1 && hasHalf) stars.push(<span key={i} style={{ color: '#1D9E75', fontSize }}>½</span>)
    else stars.push(<span key={i} style={{ color: '#2a2a3e', fontSize }}>★</span>)
  }
  return <span style={{ display: 'flex', alignItems: 'center', gap: '1px', lineHeight: 1 }}>{stars}</span>
}

export default function ShowPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState('')
  const [production, setProduction] = useState<any>(null)
  const [scores, setScores] = useState<any>(null)
  const [criticReviews, setCriticReviews] = useState<any[]>([])
  const [audienceReviews, setAudienceReviews] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [watchlisted, setWatchlisted] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)

  useEffect(() => { params.then(({ id }) => setId(id)) }, [params])

  useEffect(() => {
    if (!id) return
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    supabase.from('productions').select('*, shows(*)').eq('id', id).single().then(({ data }) => setProduction(data))
    supabase.from('show_scores').select('*').eq('production_id', id).single().then(({ data }) => setScores(data))
    supabase.from('critic_reviews').select('*').eq('production_id', id).eq('status', 'approved')
      .order('published_date', { ascending: false }).then(({ data }) => setCriticReviews(data || []))
    supabase.from('audience_reviews').select('*, profiles(display_name)').eq('production_id', id)
      .eq('status', 'approved').order('created_at', { ascending: false }).then(({ data }) => setAudienceReviews(data || []))
  }, [id])

  useEffect(() => {
    if (!user || !id) return
    supabase.from('watchlist').select('id').eq('production_id', id).eq('user_id', user.id)
      .maybeSingle().then(({ data }) => setWatchlisted(!!data))
  }, [user, id])

  async function toggleWatchlist() {
    if (!user) return window.location.href = '/auth'
    if (watchlisted) {
      await supabase.from('watchlist').delete().eq('production_id', id).eq('user_id', user.id)
      setWatchlisted(false)
    } else {
      await supabase.from('watchlist').insert({ production_id: id, user_id: user.id })
      setWatchlisted(true)
    }
  }

  if (!production) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#14141f' }}>
      <Header />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
        <p style={{ color: '#4b5563' }}>Loading...</p>
      </div>
    </div>
  )

  const show = production.shows
  const cfg = typeConfig[show?.type] || typeConfig.theatre
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#14141f' }}>
      <Header />

      {/* Hero banner */}
      <div style={{ background: cfg.gradient, padding: '48px 24px 32px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <a href="/" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>← All shows</a>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '28px' }}>
            <div style={{ width: '100px', height: '130px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '36px' }}>{cfg.emoji}</span>
              <div style={{ width: '24px', height: '2px', borderRadius: '1px', background: cfg.accent }}></div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: cfg.accent }}>{show?.type}</span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{production.city}</span>
                {production.season_start && (
                  <>
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{fmt(production.season_start)}{production.season_end ? ` – ${fmt(production.season_end)}` : ''}</span>
                  </>
                )}
              </div>
              <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: '600', color: '#ffffff', lineHeight: '1.2', margin: '0 0 8px 0' }}>{show?.title}</h1>
              <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)', margin: '0 0 4px 0', fontWeight: '500' }}>{show?.company}</p>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{production.venue}</p>
            </div>
            {scores?.combined_score && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <StarDisplay score={scores.combined_score} size="lg" />
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#1D9E75' }}>{Number(scores.combined_score).toFixed(1)} / 5</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                  {scores.critic_count > 0 && <div>{scores.critic_count} critic{scores.critic_count !== 1 ? 's' : ''}</div>}
                  {scores.audience_count > 0 && <div>{scores.audience_count} audience</div>}
                </div>
              </div>
            )}
          </div>
          <div style={{ marginTop: '24px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a href={getTicketUrl(show?.company, production.city, show?.title, production.country)} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', padding: '8px 18px', borderRadius: '6px', backgroundColor: '#1D9E75', color: 'white', textDecoration: 'none', fontWeight: '600', display: 'inline-block' }}>Buy tickets</a>
            <button
              onClick={toggleWatchlist}
              style={{ fontSize: '13px', padding: '8px 18px', borderRadius: '6px', border: `1px solid ${watchlisted ? '#1D9E75' : 'rgba(255,255,255,0.2)'}`, backgroundColor: watchlisted ? '#1D9E75' : 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontWeight: '500' }}
            >
              {watchlisted ? '✓ Watchlisted' : '+ Watchlist'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Critic Reviews */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4b5563', margin: 0 }}>Critic reviews · {criticReviews.length}</h2>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#1e1e2e' }}></div>
          </div>
          {criticReviews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {criticReviews.map(review => (
                <div key={review.id} style={{ backgroundColor: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '10px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9' }}>{review.outlet}</span>
                        {review.reviewer && <span style={{ fontSize: '13px', color: '#6b7280' }}>{review.reviewer}</span>}
                        {review.published_date && <span style={{ fontSize: '12px', color: '#374151' }}>{new Date(review.published_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                      </div>
                      {review.pull_quote && <p style={{ fontSize: '14px', color: '#9ca3af', fontStyle: 'italic', margin: '0 0 10px 0', lineHeight: '1.6' }}>"{review.pull_quote}"</p>}
                      {review.source_url && <a href={review.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#1D9E75', textDecoration: 'none' }}>Read full review →</a>}
                    </div>
                    {review.star_rating && <StarDisplay score={review.star_rating} />}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ backgroundColor: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '10px', padding: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>No critic reviews yet.</p>
            </div>
          )}
        </div>

        {/* Audience Reviews */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
              <h2 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4b5563', margin: 0 }}>Audience reviews · {audienceReviews.length}</h2>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#1e1e2e' }}></div>
            </div>
            <div style={{ marginLeft: '16px' }}>
              {user ? (
                <button onClick={() => setShowReviewForm(true)} style={{ fontSize: '13px', color: 'white', padding: '7px 16px', borderRadius: '6px', backgroundColor: '#1D9E75', border: 'none', cursor: 'pointer' }}>Write a review</button>
              ) : (
                <a href="/auth" style={{ fontSize: '13px', color: '#1D9E75', textDecoration: 'underline' }}>Sign in to review</a>
              )}
            </div>
          </div>
          {audienceReviews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {audienceReviews.map(review => (
                <div key={review.id} style={{ backgroundColor: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '10px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9' }}>{review.profiles?.display_name || 'Anonymous'}</span>
                    <StarDisplay score={review.star_rating} />
                  </div>
                  {review.review_text && <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0, lineHeight: '1.6' }}>{review.review_text}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ backgroundColor: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '10px', padding: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#4b5563', margin: '0 0 12px 0' }}>No audience reviews yet. Be the first!</p>
              {!user && <a href="/auth" style={{ fontSize: '13px', color: '#1D9E75', textDecoration: 'underline' }}>Sign in to write a review</a>}
            </div>
          )}
        </div>
      </div>

      {showReviewForm && user && (
        <ReviewForm productionId={id} user={user} onClose={() => setShowReviewForm(false)} />
      )}
    </div>
  )
}
