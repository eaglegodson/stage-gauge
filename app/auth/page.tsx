'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Header from '../components/Header'

export default function AuthPage() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')
  const [loading, setLoading] = useState(false)

  const inputStyle = {
    width: '100%',
    border: '1px solid #2a2a3e',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '14px',
    color: '#f1f5f9',
    backgroundColor: '#0f0f1a',
    boxSizing: 'border-box' as const,
    outline: 'none',
  }

  const labelStyle = {
    fontSize: '12px',
    fontWeight: '500' as const,
    color: '#9ca3af',
    display: 'block' as const,
    marginBottom: '6px',
  }

  async function handleSignUp() {
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      setMessageType('error')
      return
    }
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.')
      setMessageType('error')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } }
    })
    setLoading(false)
    if (error) {
      setMessage(error.message)
      setMessageType('error')
    } else {
      setMessage('Account created! You can now sign in.')
      setMessageType('success')
      setMode('signin')
    }
  }

  async function handleSignIn() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setMessage(error.message)
      setMessageType('error')
    } else {
      window.location.href = '/browse'
    }
  }

  return (
    <div style={{ backgroundColor: '#14141f', minHeight: '100vh' }}>
      <Header />
      <div style={{ maxWidth: '380px', margin: '60px auto', padding: '0 24px' }}>
        <div style={{ background: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '12px', padding: '32px' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: '600', color: '#f1f5f9', marginBottom: '6px', marginTop: 0 }}>
            {mode === 'signup' ? 'Create account' : 'Sign in'}
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '28px', marginTop: 0 }}>
            {mode === 'signup' ? 'Join the StageGauge community' : 'Welcome back'}
          </p>

          {mode === 'signup' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Display name</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" style={inputStyle} />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />
          </div>

          <div style={{ marginBottom: mode === 'signup' ? '16px' : '24px' }}>
            <label style={labelStyle}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
          </div>

          {mode === 'signup' && (
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Confirm password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
            </div>
          )}

          {message && (
            <p style={{ fontSize: '13px', color: messageType === 'error' ? '#f87171' : '#1D9E75', marginBottom: '16px', marginTop: 0, fontWeight: '500' }}>{message}</p>
          )}

          <button
            onClick={mode === 'signup' ? handleSignUp : handleSignIn}
            disabled={loading}
            style={{ width: '100%', backgroundColor: '#1D9E75', color: 'white', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', border: 'none', cursor: 'pointer', marginBottom: '20px', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>

          <p style={{ fontSize: '13px', textAlign: 'center', color: '#6b7280', margin: 0 }}>
            {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
            <span
              onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setMessage('') }}
              style={{ color: '#1D9E75', fontWeight: '500', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {mode === 'signup' ? 'Sign in' : 'Sign up'}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
