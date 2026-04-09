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
        setUser(session?.user ?? null)
      })
    })
  }, [params])

  if (!production) return <div style={{padding: '40px', color: '#111'}}>Loading...</div>

  const score = production.combined_score ? Math.round(production.combined_score) : null

  return (
    <div style={{minHeight: '100vh', backgroundColor: 'white'}}>
      <header style={{borderBottom: '1px solid #f3f4f6', padding: '16px 24px'}}>
        <a href="/" style={{fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '600', color: '#111827', textDecoration: 'none'}}>Stage Gauge</a>
      </header>

      <div style={{maxWidth: '672px', margin: '0 auto', padding: '32px 24px'}}>
        <a href="/" style={{fontSize: '14px', color: '#9ca3af', textDecoration: 'none', display: 'block', marginBottom: '24px'}}>← Back</a>

        <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', marginBottom: '32px'}}>
          <div style={{flex: 1}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
              <span style={{fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: '20px', backgroundColor: '#f3f4f6', color: '#4b5563', textTransform: 'capitalize'}}>{production.type}</span>
              <span style={{fontSize: '11px', color: '#9ca3af'}}>{production.city}</span>
            </div>
            <h1 style={{fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: '600', color: '#111827', lineHeight: '1.3', margin: '0 0 8px 0'}}>{production.title}</h1>
            <p style={{fontSize: '16px', color: '#4b5563', margin: '0 0 4px 0'}}>{production.company}</p>
            <p style={{fontSize: '14px', color: '#9ca3af', margin: '0 0 4px 0'}}>{production.venue}</p>
            {production.director && <p style={{fontSize: '14px', color: '#9ca3af', margin: '0 0 4px 0'}}>Dir. {production.director}</p>}
            {production.lead_performer && <p style={{fontSize: '14px', color: '#9ca3af', margin: 0}}>Starring {production.lead_performer}</p>}
          </div>

          {score && (
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: '16px', padding: '20px', flexShrink: 0}}>
              <div style={{fontSize: '40px', fontWeight: 'bold', color: '#1D9E75'}}>{score}</div>
              <div style={{display: 'flex', gap: '3px', margin: '8px 0'}}>
                {[1,2,3,4,5].map((bar) => (
                  <div key={bar} style={{width: '8px', height: '24px', borderRadius: '3px', backgroundColor: score >= bar * 20 ? '#1D9E75' : '#e5e7eb'}}></div>
                ))}
              </div>
              <div style={{fontSize: '11px', color: '#9ca3af', textAlign: 'center', marginBottom: '8px'}}>Stage Gauge score</div>
              {production.critic_score && (
                <div style={{fontSize: '12px', color: '#6b7280', textAlign: 'center'}}>
                  <div>Critics: <strong>{Math.round(production.critic_score)}</strong></div>
                  <div>Audience: <strong>{Math.round(production.audience_score || 0)}</strong></div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{marginBottom: '32px'}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px'}}>
            <h2 style={{fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', margin: 0}}>Audience reviews · {audienceReviews.length}</h2>
            {user ? (
              <button onClick={() => setShowReviewForm(true)} style={{fontSize: '13px', color: 'white', padding: '8px 16px', borderRadius: '20px', backgroundColor: '#1D9E75', border: 'none', cursor: 'pointer'}}>Write a review</button>
            ) : (
              <a href="/auth" style={{fontSize: '13px', color: '#1D9E75', textDecoration: 'underline'}}>Sign in to review</a>
            )}
          </div>
          {audienceReviews.length > 0 ? (
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              {audienceReviews.map((review) => (
                <div key={review.id} style={{border: '1px solid #f3f4f6', borderRadius: '12px', padding: '16px'}}>
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px'}}>
                    <span style={{fontSize: '14px', fontWeight: '600', color: '#111827'}}>{review.display_name || 'Anonymous'}</span>
                    <span style={{fontSize: '18px', color: '#1D9E75'}}>{'★'.repeat(review.star_rating)}{'☆'.repeat(5 - review.star_rating)}</span>
                  </div>
                  {review.review_text && <p style={{fontSize: '14px', color: '#4b5563', margin: 0}}>{review.review_text}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p style={{fontSize: '14px', color: '#9ca3af'}}>No audience reviews yet. Be the first!</p>
          )}
        </div>

        <div>
          <h2 style={{fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', marginBottom: '16px'}}>Critic reviews · {criticReviews.length}</h2>
          {criticReviews.length > 0 ? (
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              {criticReviews.map((review) => (
                <div key={review.id} style={{border: '1px solid #f3f4f6', borderRadius: '12px', padding: '16px'}}>
                  <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px'}}>
                    <div style={{flex: 1}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                        <span style={{fontSize: '14px', fontWeight: '600', color: '#111827'}}>{review.outlet}</span>
                        {review.reviewer && <span style={{fontSize: '14px', color: '#9ca3af'}}>{review.reviewer}</span>}
                      </div>
                      {review.pull_quote && <p style={{fontSize: '14px', color: '#4b5563', fontStyle: 'italic', margin: 0}}>"{review.pull_quote}"</p>}
                    </div>
                    {review.normalised_score && (
                      <div style={{fontSize: '22px', fontWeight: 'bold', color: '#1D9E75', flexShrink: 0}}>{review.normalised_score}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{fontSize: '14px', color: '#9ca3af'}}>No critic reviews yet.</p>
          )}
        </div>
      </div>

      {showReviewForm && user && (
        <ReviewForm productionId={id} user={user} onClose={() => setShowReviewForm(false)} />
      )}
    </div>
  )
}