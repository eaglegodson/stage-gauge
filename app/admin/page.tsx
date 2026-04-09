'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReviews()
  }, [])

  async function fetchReviews() {
    const { data } = await supabase
      .from('audience_reviews')
      .select('*, productions(show_id, venue, city)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    setReviews(data || [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('audience_reviews').update({ status }).eq('id', id)
    setReviews(reviews.filter(r => r.id !== id))
  }

  return (
    <div style={{minHeight: '100vh', backgroundColor: 'white'}}>
      <header style={{borderBottom: '1px solid #f3f4f6', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <a href="/" style={{fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '600', color: '#111827', textDecoration: 'none'}}>Stage Gauge</a>
        <span style={{fontSize: '14px', color: '#9ca3af'}}>Moderation queue</span>
      </header>

      <div style={{maxWidth: '672px', margin: '0 auto', padding: '32px 24px'}}>
        <h1 style={{fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: '600', color: '#111827', marginBottom: '8px'}}>Moderation queue</h1>
        <p style={{fontSize: '14px', color: '#9ca3af', marginBottom: '32px'}}>{reviews.length} pending review{reviews.length !== 1 ? 's' : ''}</p>

        {loading && <p style={{color: '#9ca3af'}}>Loading...</p>}

        {!loading && reviews.length === 0 && (
          <p style={{fontSize: '14px', color: '#9ca3af'}}>Queue is empty — nothing to moderate.</p>
        )}

        <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
          {reviews.map((review) => (
            <div key={review.id} style={{border: '1px solid #f3f4f6', borderRadius: '12px', padding: '20px'}}>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px'}}>
                <div>
                  <span style={{fontSize: '18px', color: '#1D9E75'}}>{'★'.repeat(review.star_rating)}{'☆'.repeat(5 - review.star_rating)}</span>
                  <span style={{fontSize: '12px', color: '#9ca3af', marginLeft: '8px'}}>{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
                <span style={{fontSize: '11px', color: '#9ca3af'}}>{review.productions?.city}</span>
              </div>

              {review.review_text && (
                <p style={{fontSize: '14px', color: '#4b5563', marginBottom: '16px', fontStyle: 'italic'}}>"{review.review_text}"</p>
              )}

              <div style={{display: 'flex', gap: '8px'}}>
                <button
                  onClick={() => updateStatus(review.id, 'approved')}
                  style={{flex: 1, backgroundColor: '#1D9E75', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', border: 'none', cursor: 'pointer'}}
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => updateStatus(review.id, 'rejected')}
                  style={{flex: 1, backgroundColor: '#f3f4f6', color: '#6b7280', padding: '10px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', border: 'none', cursor: 'pointer'}}
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}