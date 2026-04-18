'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '../components/Header'
import Footer from '../components/Footer'

function FeedbackForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const searchParams = useSearchParams()

  useEffect(() => {
    const show = searchParams.get('show')
    const company = searchParams.get('company')
    const city = searchParams.get('city')
    const production_id = searchParams.get('production_id')
    if (show) {
      setMessage(`Issue report\nShow: ${show}\nCompany: ${company || ''}\nCity: ${city || ''}\nProduction ID: ${production_id || ''}\n\nPlease describe the issue:\n`)
    }
  }, [])

  const handleSubmit = async () => {
    if (!name || !email || !message) return
    setStatus('sending')

    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message }),
    })

    if (res.ok) {
      setStatus('sent')
    } else {
      setStatus('error')
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#14141f', color: '#e5e7eb', fontFamily: 'sans-serif' }}>
      <Header />
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '60px 24px' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', marginBottom: '8px', color: '#f9fafb' }}>
          Feedback
        </h1>
        <p style={{ color: '#9ca3af', marginBottom: '40px' }}>
          Found a bug, missing show, or have a suggestion? We'd love to hear from you.
        </p>

        {status === 'sent' ? (
          <div style={{ backgroundColor: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
            <p style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Thanks for the feedback.</p>
            <p style={{ color: '#9ca3af' }}>We'll be in touch if we have questions.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: '#9ca3af', fontSize: '0.875rem' }}>Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', backgroundColor: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '8px', color: '#f9fafb', fontSize: '1rem', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: '#9ca3af', fontSize: '0.875rem' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', backgroundColor: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '8px', color: '#f9fafb', fontSize: '1rem', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: '#9ca3af', fontSize: '0.875rem' }}>Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={6}
                style={{ width: '100%', padding: '10px 14px', backgroundColor: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '8px', color: '#f9fafb', fontSize: '1rem', boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={status === 'sending'}
              style={{ backgroundColor: '#1D9E75', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '1rem', cursor: 'pointer', alignSelf: 'flex-start' }}
            >
              {status === 'sending' ? 'Sending...' : 'Send feedback'}
            </button>
            {status === 'error' && (
              <p style={{ color: '#ef4444' }}>Something went wrong. Please try again or email hello@stage-gauge.com directly.</p>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={null}>
      <FeedbackForm />
    </Suspense>
  )
}
