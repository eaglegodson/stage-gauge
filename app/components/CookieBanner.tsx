'use client'

import { useState, useEffect } from 'react'
import posthog from 'posthog-js'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) {
      setVisible(true)
    } else if (consent === 'declined') {
      posthog.opt_out_capturing()
    }
  }, [])

  const accept = () => {
    localStorage.setItem('cookie_consent', 'accepted')
    posthog.opt_in_capturing()
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem('cookie_consent', 'declined')
    posthog.opt_out_capturing()
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#1e1e2e',
      border: '1px solid #2a2a3e',
      borderRadius: '12px',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      zIndex: 1000,
      maxWidth: '560px',
      width: 'calc(100% - 48px)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)'
    }}>
      <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', flex: 1 }}>
        We use cookies to understand how people use StageGauge. No ads, no data selling.{' '}
        <a href="/about" style={{ color: '#1D9E75', textDecoration: 'none' }}>Learn more</a>
      </p>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button onClick={decline} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #2a2a3e', backgroundColor: 'transparent', color: '#9ca3af', fontSize: '13px', cursor: 'pointer' }}>
          Decline
        </button>
        <button onClick={accept} style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#1D9E75', color: '#fff', fontSize: '13px', cursor: 'pointer' }}>
          Accept
        </button>
      </div>
    </div>
  )
}
