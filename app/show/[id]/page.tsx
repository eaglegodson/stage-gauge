'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import ReviewForm from './review'

export default function ShowPage({ params }: { params: Promise<{ id: string }> }) {
  const [production, setProduction] = useState<any>(null)
  const [criticReviews, setCriticReviews] = useState<any[]>([])
  const [audienceReviews, setAudienceReviews] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [id, setId] = useState<string>('')
  const [onWatchlist, setOnWatchlist] = useState(false)
  const [watchlistId, setWatchlistId] = useState<string | null>(null)

  useEffect(() => {
    params.then(({ id }) => {
      setId(id)
      Promise.all([
        supabase.from('production_listing').select('*').eq('production_id', id).single(),
        supabase.from('approved_critic_reviews').select('*').eq('production_id', id).order('published_date', { ascending: false }),
        supabase.from('approved_audience_reviews').select('*').eq('production_id', id).order('created_at', { ascending: false }),
        supabase.auth.getSession()
      ]).then(([{ data: prod }, { data: critics }, { data: audience }, { data: { session } }]) => {
        setProduction(prod)
        setCriticReviews(critics || [])
        setAudienceReviews(audience || [])
        const u = session?.user ?? null
        setUser(u)
        if (u) {
          supabase.from('watchlist').select('id').eq('user_id', u.id).eq('production_id', id).single()
            .then(({ data }) => {
              if (data) { setOnWatchlist(true); setWatchlistId(data.id) }
            })
        }
      })
    })
  }, [params])

  async function toggleWatchlist() {
    if (!user) { window.location.href = '/auth'; return }
    if (onWatchlist && watchlistId) {
      await supabase.from('watchlist').delete().eq('id', watchlistId)
      setOnWatchlist(false)
      setWatchlistId(null)
    } else {
      const { data } = await supabase.from('watchlist').insert({ user_id: user.id, production_id: id }).select().single()
      if (data) { setOnWatchlist(true); setWatchlistId(data.id) }
    }
  }

  if (!production) return <div style={{padding: '40px', color: '#111', backgroundColor: '#F5F0E8', minHeight: '100vh'}}>Loading...</div>

  const score = production.combined_score ? Math.round(production.combined_score) : null

  return (
    <div style={{minHeight: '100vh', backgroundColor: '#F5F0E8'}}>
      <header style={{backgroundColor: '#0F1A14', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px'}}>
        <a href="/" style={{fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '600', color: '#ffffff', textDecoration: 'none'}}>Stage Gauge</a>
        <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
          <a href="/watchlist" style={{fontSize: '13px', color: '#9ca3af', textDecoration: 'none'}}>Watchlist</a>
          {user && <a href="/admin" style={{fontSize: '13px', color: '#9ca3af', textDecoration: 'none'}}>Moderation</a>}
        </div>
      </header>

      <div style={{maxWidth: '740px', margin: '0 auto', padding: '32px 24px'}}>
        <a href="/" style={{fontSize: '13px', color: '#9ca3af', textDecoration: 'none', display: 'block', marginBottom: '24px'}}>← Back</a>

        {/* Show hero */}
        <div style={{backgroundColor: 'white', border: '1px solid #E2DDD6', borderRadius: '4px', padding: '32px', marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)'}}>
          <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px'}}>
            <div style={{flex: 1}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px'}}>
                <span style={{fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', backgroundColor: '#f0fdf4', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em'}}>{production.type}</span>
                <span style={{fontSize: '11px', color: '#9ca3af'}}>{production.city}</span>
              </div>
              <h1 style={{fontFamily: 'Georgia, serif', fontSize: '32px', fontWeight: '600', color: '#111827', lineHeight: '1.2', margin: '0 0 10px 0'}}>{production.title}</h1>
              <p style={{fontSize: '16px', color: '#4b5563', margin: '0 0 4px 0', fontWeight: '500'}}>{production.company}</p>
              <p style={{fontSize: '14px', color: '#9ca3af', margin: '0 0 4px 0'}}>{production.venue}</p>
              {production.director && <p style={{fontSize: '14px', color: '#9ca3af', margin: '0 0 4px 0'}}>Dir. {production.director}</p>}
              {production.lead_performer && <p style={{fontSize: '14px', color: '#9ca3af', margin: '0 0 16px 0'}}>Starring {production.lead_performer}</p>}
              <button
                onClick={toggleWatchlist}
                style={{fontSize: '13px', color: onWatchlist ? '#1D9E75' : '#6b7280', padding: '7px 16px', borderRadius: '20px', border: onWatchlist ? '1px solid #1D9E75' : '1px solid #E2DDD6', backgroundColor: 'white', cursor: 'pointer', marginTop: '8px'}}
              >
                {onWatchlist ? '✓ On watchlist' : '+ Add to watchlist'}
              </button>
            </div>

            {score && (
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#F5F0E8', borderRadius: '8px', padding: '24px 20px', flexShrink: 0, minWidth: '120px'}}>
                <div style={{fontSize: '52px', fontWeight: '700', color: '#1D9E75', lineHeight: 1}}>{score}</div>
                <div style={{display: 'flex', gap: '3px', margin: '10px 0'}}>
                  {[1,2,3,4,5].map((bar) => (
                    <div key={bar} style={{width: '7px', height: '20px', borderRadius: '2px', backgroundColor: score >= bar * 20 ? '#1D9E75' : '#E2DDD6'}}></div>
                  ))}
                </div>
                <div style={{fontSize: '11px', color: '#9ca3af', textAlign: 'center', lineHeight: '1.5', marginBottom: '8px'}}>Stage Gauge<br/>score</div>
                {production.critic_score && (
                  <div style={{fontSize: '11px', color: '#9ca3af', textAlign: 'center', borderTop: '1px solid #E2DDD6', paddingTop: '8px', width: '100%'}}>
                    <div>Critics: <strong style={{color: '#4b5563'}}>{Math.round(production.critic_score)}</strong></div>
                    <div>Audience: <strong style={{color: '#4b5563'}}>{Math.round(production.audience_score || 0)}</strong></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Critic Reviews */}
        <div style={{marginBottom: '24px'}}>
          <h2 style={{fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '12px'}}>Critic reviews · {criticReviews.length}</h2>
          {criticReviews.length > 0 ? (
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              {criticReviews.map((review) => (
                <div key={review.id} style={{backgroundColor: 'white', border: '1px solid #E2DDD6', borderRadius: '4px', padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)'}}>
                  <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px'}}>
                    <div style={{flex: 1}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
                        <span style={{fontSize: '14px', fontWeight: '700', color: '#111827'}}>{review.outlet}</span>
                        {review.reviewer && <span style={{fontSize: '13px', color: '#9ca3af'}}>{review.reviewer}</span>}
                        {review.published_date && <span style={{fontSize: '12px', color: '#D1CBC0'}}>{new Date(review.published_date).toLocaleDateString('en-AU', {day: 'numeric', month: 'short', year: 'numeric'})}</span>}
                      </div>
                      {review.pull_quote && (
                        <p style={{fontSize: '15px', color: '#374151', fontStyle: 'italic', lineHeight: '1.6', margin: '0 0 12px 0'}}>"{review.pull_quote}"</p>
                      )}
                      {review.source_url && (
                        <a href={review.source_url} target="_blank" rel="noopener noreferrer" style={{fontSize: '12px', color: '#1D9E75', textDecoration: 'none', fontWeight: '500'}}>
                          Read full review →
                        </a>
                      )}
                    </div>
                    {review.normalised_score && (
                      <div style={{fontSize: '26px', fontWeight: '700', color: '#1D9E75', flexShrink: 0}}>{review.normalised_score}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{backgroundColor: 'white', border: '1px solid #E2DDD6', borderRadius: '4px', padding: '24px', textAlign: 'center'}}>
              <p style={{fontSize: '14px', color: '#9ca3af', margin: 0}}>No critic reviews yet.</p>
            </div>
          )}
        </div>

        {/* Audience Reviews */}
        <div>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px'}}>
            <h2 style={{fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', margin: 0}}>Audience reviews · {audienceReviews.length}</h2>
            {user ? (
              <button onClick={() => setShowReviewForm(true)} style={{fontSize: '13px', color: 'white', padding: '7px 16px', borderRadius: '20px', backgroundColor: '#1D9E75', border: 'none', cursor: 'pointer'}}>Write a review</button>
            ) : (
              <a href="/auth" style={{fontSize: '13px', color: '#1D9E75', textDecoration: 'underline'}}>Sign in to review</a>
            )}
          </div>
          {audienceReviews.length > 0 ? (
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              {audienceReviews.map((review) => (
                <div key={review.id} style={{backgroundColor: 'white', border: '1px solid #E2DDD6', borderRadius: '4px', padding: '20px'}}>
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px'}}>
                    <span style={{fontSize: '14px', fontWeight: '600', color: '#111827'}}>{review.display_name || 'Anonymous'}</span>
                    <span style={{fontSize: '18px', color: '#1D9E75'}}>{'★'.repeat(review.star_rating)}{'☆'.repeat(5 - review.star_rating)}</span>
                  </div>
                  {review.review_text && <p style={{fontSize: '14px', color: '#4b5563', margin: 0, lineHeight: '1.6'}}>{review.review_text}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{backgroundColor: 'white', border: '1px solid #E2DDD6', borderRadius: '4px', padding: '24px', textAlign: 'center'}}>
              <p style={{fontSize: '14px', color: '#9ca3af', margin: '0 0 12px 0'}}>No audience reviews yet. Be the first!</p>
              {!user && <a href="/auth" style={{fontSize: '13px', color: '#1D9E75', textDecoration: 'underline'}}>Sign in to write a review</a>}
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
