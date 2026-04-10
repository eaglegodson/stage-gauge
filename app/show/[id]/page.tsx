'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import Header from '../../components/Header'
import ReviewForm from './review'

function StarDisplay({ score, size = 'sm' }: { score: number, size?: 'sm' | 'lg' }) {
  const stars = []
  const fullStars = Math.floor(score)
  const hasHalf = score - fullStars >= 0.25 && score - fullStars < 0.75
  const roundedUp = score - fullStars >= 0.75
  const total = roundedUp ? fullStars + 1 : fullStars
  const fontSize = size === 'lg' ? '28px' : '16px'

  for (let i = 1; i <= 5; i++) {
    if (i <= total) {
      stars.push(<span key={i} style={{color: '#1D9E75', fontSize}}>★</span>)
    } else if (i === fullStars + 1 && hasHalf) {
      stars.push(<span key={i} style={{color: '#1D9E75', fontSize}}>½</span>)
    } else {
      stars.push(<span key={i} style={{color: '#E2DDD6', fontSize}}>★</span>)
    }
  }
  return <span style={{display: 'flex', alignItems: 'center', gap: '1px', lineHeight: 1}}>{stars}</span>
}

export default function ShowPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [production, setProduction] = useState<any>(null)
  const [scores, setScores] = useState<any>(null)
  const [criticReviews, setCriticReviews] = useState<any[]>([])
  const [audienceReviews, setAudienceReviews] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [watchlisted, setWatchlisted] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    supabase.from('productions')
      .select('*, shows(*)')
      .eq('id', id)
      .single()
      .then(({ data }) => setProduction(data))

    supabase.from('show_scores')
      .select('*')
      .eq('production_id', id)
      .single()
      .then(({ data }) => setScores(data))

    supabase.from('critic_reviews')
      .select('*')
      .eq('production_id', id)
      .eq('status', 'approved')
      .order('published_date', { ascending: false })
      .then(({ data }) => setCriticReviews(data || []))

    supabase.from('audience_reviews')
      .select('*, profiles(display_name)')
      .eq('production_id', id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .then(({ data }) => setAudienceReviews(data || []))
  }, [id])

  useEffect(() => {
    if (!user) return
    supabase.from('watchlist')
      .select('id')
      .eq('production_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setWatchlisted(!!data))
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
    <div style={{minHeight: '100vh', backgroundColor: '#F5F0E8'}}>
      <Header />
      <div style={{maxWidth: '800px', margin: '0 auto', padding: '60px 24px', textAlign: 'center'}}>
        <p style={{color: '#9ca3af'}}>Loading...</p>
      </div>
    </div>
  )

  const show = production.shows
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{minHeight: '100vh', backgroundColor: '#F5F0E8'}}>
      <Header />

      <div style={{maxWidth: '800px', margin: '0 auto', padding: '40px 24px'}}>

        <a href="/" style={{fontSize: '13px', color: '#9ca3af', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px'}}>← All shows</a>

        <div style={{backgroundColor: 'white', border: '1px solid #E2DDD6', borderRadius: '4px', padding: '32px', marginBottom: '24px'}}>
          <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px'}}>
            <div style={{flex: 1}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px'}}>
                <span style={{fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af'}}>{show?.type}</span>
                <span style={{fontSize: '11px', color: '#D1CBC0'}}>·</span>
                <span style={{fontSize: '11px', color: '#9ca3af'}}>{production.city}</span>
                {production.season_start && <><span style={{fontSize: '11px', color: '#D1CBC0'}}>·</span><span style={{fontSize: '11px', color: '#9ca3af'}}>{fmt(production.season_start)}{production.season_end ? ' – ' + fmt(production.season_end) : ''}</span></>}
              </div>
              <h1 style={{fontFamily: 'Georgia, serif', fontSize: '32px', fontWeight: '600', color: '#111827', lineHeight: '1.2', margin: '0 0 8px 0'}}>{show?.title}</h1>
              <p style={{fontSize: '16px', color: '#4b5563', margin: '0 0 4px 0', fontWeight: '500'}}>{show?.company}</p>
              <p style={{fontSize: '14px', color: '#9ca3af', margin: 0}}>{production.venue}</p>
            </div>

            {scores?.combined_score && (
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0, borderLeft: '1px solid #E2DDD6', paddingLeft: '24px'}}>
                <StarDisplay score={scores.combined_score} size="lg" />
                <div style={{fontSize: '15px', fontWeight: '600', color: '#1D9E75'}}>{Number(scores.combined_score).toFixed(1)} / 5</div>
                <div style={{fontSize: '11px', color: '#9ca3af', textAlign: 'center'}}>
                  {scores.critic_count > 0 && <div>{scores.critic_count} critic{scores.critic_count !== 1 ? 's' : ''}</div>}
                  {scores.audience_count > 0 && <div>{scores.audience_count} audience</div>}
                </div>
              </div>
            )}
          </div>

          <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
            <button
              onClick={toggleWatchlist}
              style={{fontSize: '13px', padding: '8px 18px', borderRadius: '4px', border: '1px solid #E2DDD6', backgroundColor: watchlisted ? '#1D9E75' : 'white', color: watchlisted ? 'white' : '#4b5563', cursor: 'pointer', fontWeight: '500'}}
            >
              {watchlisted ? '✓ Watchlisted' : '+ Watchlist'}
            </button>
          </div>
        </div>

        <div style={{marginBottom: '24px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px'}}>
            <h2 style={{fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', margin: 0}}>Critic reviews · {criticReviews.length}</h2>
            <div style={{flex: 1, height: '1px', backgroundColor: '#E2DDD6'}}></div>
          </div>
          {criticReviews.length > 0 ? (
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              {criticReviews.map((review) => (
                <div key={review.id} style={{backgroundColor: 'white', border: '1px solid #E2DDD6', borderRadius: '4px', padding: '20px'}}>
                  <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px'}}>
                    <div style={{flex: 1}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap'}}>
                        <span style={{fontSize: '14px', fontWeight: '600', color: '#111827'}}>{review.outlet}</span>
                        {review.reviewer && <span style={{fontSize: '13px', color: '#9ca3af'}}>{review.reviewer}</span>}
                        {review.published_date && <span style={{fontSize: '12px', color: '#D1CBC0'}}>{new Date(review.published_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                      </div>
                      {review.pull_quote && <p style={{fontSize: '14px', color: '#4b5563', fontStyle: 'italic', margin: '0 0 10px 0', lineHeight: '1.6'}}>"{review.pull_quote}"</p>}
                      {review.source_url && <a href={review.source_url} target="_blank" rel="noopener noreferrer" style={{fontSize: '12px', color: '#1D9E75', textDecoration: 'none'}}>Read full review →</a>}
                    </div>
                    {review.star_rating && <StarDisplay score={review.star_rating} />}
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

        <div>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '16px', flex: 1}}>
              <h2 style={{fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', margin: 0}}>Audience reviews · {audienceReviews.length}</h2>
              <div style={{flex: 1, height: '1px', backgroundColor: '#E2DDD6'}}></div>
            </div>
            <div style={{marginLeft: '16px'}}>
              {user ? (
                <button onClick={() => setShowReviewForm(true)} style={{fontSize: '13px', color: 'white', padding: '7px 16px', borderRadius: '4px', backgroundColor: '#1D9E75', border: 'none', cursor: 'pointer'}}>Write a review</button>
              ) : (
                <a href="/auth" style={{fontSize: '13px', color: '#1D9E75', textDecoration: 'underline'}}>Sign in to review</a>
              )}
            </div>
          </div>
          {audienceReviews.length > 0 ? (
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              {audienceReviews.map((review) => (
                <div key={review.id} style={{backgroundColor: 'white', border: '1px solid #E2DDD6', borderRadius: '4px', padding: '20px'}}>
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px'}}>
                    <span style={{fontSize: '14px', fontWeight: '600', color: '#111827'}}>{review.profiles?.display_name || 'Anonymous'}</span>
                    <StarDisplay score={review.star_rating} />
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
