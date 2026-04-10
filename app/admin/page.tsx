'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Header from '../components/Header'

export default function AdminPage() {
  const [criticReviews, setCriticReviews] = useState<any[]>([])
  const [audienceReviews, setAudienceReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReviews()
  }, [])

  async function fetchReviews() {
    const [critics, audience] = await Promise.all([
      supabase
        .from('critic_reviews')
        .select('*, productions(show_id, venue, city, shows(title))')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabase
        .from('audience_reviews')
        .select('*, productions(show_id, venue, city, shows(title))')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
    ])
    setCriticReviews(critics.data || [])
    setAudienceReviews(audience.data || [])
    setLoading(false)
  }

  async function updateCritic(id: string, status: string) {
    await supabase.from('critic_reviews').update({ status }).eq('id', id)
    setCriticReviews(criticReviews.filter(r => r.id !== id))
  }

  async function updateAudience(id: string, status: string) {
    await supabase.from('audience_reviews').update({ status }).eq('id', id)
    setAudienceReviews(audienceReviews.filter(r => r.id !== id))
  }

  const total = criticReviews.length + audienceReviews.length

  return (
    <div style={{minHeight: '100vh', backgroundColor: '#F5F0E8'}}>
      <Header />
      <div style={{maxWidth: '800px', margin: '0 auto', padding: '40px 24px'}}>
        <h1 style={{fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: '600', color: '#111827', marginBottom: '4px'}}>Moderation queue</h1>
        <p style={{fontSize: '14px', color: '#9ca3af', marginBottom: '40px'}}>{total} pending item{total !== 1 ? 's' : ''}</p>

        {loading && <p style={{color: '#9ca3af'}}>Loading...</p>}
        {!loading && total === 0 && <p style={{fontSize: '14px', color: '#9ca3af'}}>Queue is empty.</p>}

        {/* Critic Reviews */}
        {criticReviews.length > 0 && (
          <div style={{marginBottom: '40px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', margin: 0}}>Critic reviews · {criticReviews.length}</h2>
              <div style={{flex: 1, height: '1px', backgroundColor: '#E2DDD6'}}></div>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              {criticReviews.map((review) => (
                <div key={review.id} style={{backgroundColor: 'white', border: '1px solid #E2DDD6', borderRadius: '4px', padding: '20px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px'}}>
                    <div>
                      <span style={{fontSize: '14px', fontWeight: '600', color: '#111827'}}>{review.productions?.shows?.title}</span>
                      <span style={{fontSize: '12px', color: '#9ca3af', marginLeft: '8px'}}>{review.outlet}</span>
                      {review.reviewer && <span style={{fontSize: '12px', color: '#9ca3af', marginLeft: '8px'}}>· {review.reviewer}</span>}
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      {review.star_rating && <span style={{fontSize: '13px', color: '#1D9E75'}}>{review.star_rating}★</span>}
                      <span style={{fontSize: '11px', color: '#9ca3af'}}>confidence: {Math.round((review.confidence_score || 0) * 100)}%</span>
                    </div>
                  </div>
                  {review.pull_quote && <p style={{fontSize: '13px', color: '#4b5563', fontStyle: 'italic', margin: '0 0 12px 0'}}>"{review.pull_quote}"</p>}
                  {review.source_url && <a href={review.source_url} target="_blank" rel="noopener noreferrer" style={{fontSize: '12px', color: '#1D9E75', textDecoration: 'none', display: 'block', marginBottom: '12px'}}>Read full review →</a>}
                  <div style={{display: 'flex', gap: '8px'}}>
                    <button onClick={() => updateCritic(review.id, 'approved')} style={{flex: 1, backgroundColor: '#1D9E75', color: 'white', padding: '8px', borderRadius: '4px', fontSize: '13px', fontWeight: '500', border: 'none', cursor: 'pointer'}}>✓ Approve</button>
                    <button onClick={() => updateCritic(review.id, 'rejected')} style={{flex: 1, backgroundColor: '#f3f4f6', color: '#6b7280', padding: '8px', borderRadius: '4px', fontSize: '13px', fontWeight: '500', border: 'none', cursor: 'pointer'}}>✕ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audience Reviews */}
        {audienceReviews.length > 0 && (
          <div>
            <div style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', margin: 0}}>Audience reviews · {audienceReviews.length}</h2>
              <div style={{flex: 1, height: '1px', backgroundColor: '#E2DDD6'}}></div>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              {audienceReviews.map((review) => (
                <div key={review.id} style={{backgroundColor: 'white', border: '1px solid #E2DDD6', borderRadius: '4px', padding: '20px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                    <span style={{fontSize: '14px', fontWeight: '600', color: '#111827'}}>{review.productions?.shows?.title}</span>
                    <span style={{fontSize: '13px', color: '#1D9E75'}}>{review.star_rating}★</span>
                  </div>
                  {review.review_text && <p style={{fontSize: '13px', color: '#4b5563', fontStyle: 'italic', margin: '0 0 12px 0'}}>"{review.review_text}"</p>}
                  <div style={{display: 'flex', gap: '8px'}}>
                    <button onClick={() => updateAudience(review.id, 'approved')} style={{flex: 1, backgroundColor: '#1D9E75', color: 'white', padding: '8px', borderRadius: '4px', fontSize: '13px', fontWeight: '500', border: 'none', cursor: 'pointer'}}>✓ Approve</button>
                    <button onClick={() => updateAudience(review.id, 'rejected')} style={{flex: 1, backgroundColor: '#f3f4f6', color: '#6b7280', padding: '8px', borderRadius: '4px', fontSize: '13px', fontWeight: '500', border: 'none', cursor: 'pointer'}}>✕ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
