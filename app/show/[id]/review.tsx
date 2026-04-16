'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function ReviewForm({ productionId, user, onClose }: { productionId: string, user: any, onClose: () => void }) {
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [dateAttended, setDateAttended] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit() {
    if (!rating) { setMessage('Please select a star rating'); return }
    setLoading(true)
    const { error } = await supabase.from('audience_reviews').insert({
      production_id: productionId,
      user_id: user.id,
      star_rating: rating,
      review_text: reviewText,
      date_attended: dateAttended || null,
      city_attended: null,
      status: 'pending'
    })
    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Review submitted! It will appear after moderation.')
    }
    setLoading(false)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px'}}>
      <div style={{backgroundColor: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '480px'}}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px'}}>
          <h2 style={{fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '600', color: '#111827'}}>Write a review</h2>
          <button onClick={onClose} style={{fontSize: '20px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer'}}>✕</button>
        </div>

        <div style={{marginBottom: '20px'}}>
          <label style={{fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '8px'}}>Your rating</label>
          <div style={{display: 'flex', gap: '8px'}}>
            {[1,2,3,4,5].map((star) => (
              <button key={star} onClick={() => setRating(star)} style={{fontSize: '28px', background: 'none', border: 'none', cursor: 'pointer', opacity: star <= rating ? 1 : 0.3}}>★</button>
            ))}
          </div>
        </div>

        <div style={{marginBottom: '20px'}}>
          <label style={{fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '8px'}}>Date attended (optional)</label>
          <input
            type="date"
            value={dateAttended}
            max={today}
            onChange={(e) => setDateAttended(e.target.value)}
            style={{width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: '#111827', backgroundColor: '#fff', boxSizing: 'border-box'}}
          />
        </div>

        <div style={{marginBottom: '24px'}}>
          <label style={{fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '8px'}}>Your review (optional)</label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="What did you think?"
            rows={4}
            style={{width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: '#111827', backgroundColor: '#fff', boxSizing: 'border-box', resize: 'vertical'}}
          />
        </div>

        {message && <p style={{fontSize: '14px', color: '#1D9E75', marginBottom: '16px', fontWeight: '500'}}>{message}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{width: '100%', backgroundColor: '#1D9E75', color: 'white', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', border: 'none', cursor: 'pointer'}}
        >
          {loading ? 'Submitting...' : 'Submit review'}
        </button>
      </div>
    </div>
  )
}