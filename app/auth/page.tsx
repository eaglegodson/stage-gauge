'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AuthPage() {
  const [mode, setMode] = useState('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignUp() {
    setMessage('Trying...')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } }
    })
    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Account created! You can now sign in.')
      setMode('signin')
    }
  }

  async function handleSignIn() {
    setMessage('Signing in...')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage(error.message)
    } else {
      window.location.href = '/'
    }
  }

  return (
    <div style={{backgroundColor: '#1e1e2e', minHeight: '100vh', padding: '0'}}>
      <div style={{borderBottom: '1px solid #f3f4f6', padding: '16px 24px'}}>
        <a href="/" style={{fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '600', color: '#f1f5f9', textDecoration: 'none'}}>Stage Gauge</a>
      </div>

      <div style={{maxWidth: '380px', margin: '60px auto', padding: '0 24px'}}>
        <h1 style={{fontFamily: 'Georgia, serif', fontSize: '26px', fontWeight: '600', color: '#f1f5f9', marginBottom: '8px'}}>
          {mode === 'signup' ? 'Create account' : 'Sign in'}
        </h1>
        <p style={{fontSize: '14px', color: '#6b7280', marginBottom: '32px'}}>
          {mode === 'signup' ? 'Join the Stage Gauge community' : 'Welcome back'}
        </p>

        {mode === 'signup' && (
          <div style={{marginBottom: '16px'}}>
            <label style={{fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px'}}>Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Eaglegodson"
              style={{width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: '#f1f5f9', backgroundColor: '#fff', boxSizing: 'border-box'}}
            />
          </div>
        )}

        <div style={{marginBottom: '16px'}}>
          <label style={{fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px'}}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: '#f1f5f9', backgroundColor: '#fff', boxSizing: 'border-box'}}
          />
        </div>

        <div style={{marginBottom: '24px'}}>
          <label style={{fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px'}}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: '#f1f5f9', backgroundColor: '#fff', boxSizing: 'border-box'}}
          />
        </div>

        {message && (
          <p style={{fontSize: '14px', color: '#1D9E75', textAlign: 'center', marginBottom: '16px', fontWeight: '500'}}>{message}</p>
        )}

        <button
          onClick={mode === 'signup' ? handleSignUp : handleSignIn}
          style={{width: '100%', backgroundColor: '#1D9E75', color: 'white', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', border: 'none', cursor: 'pointer', marginBottom: '16px'}}
        >
          {loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Sign in'}
        </button>

        <p style={{fontSize: '14px', textAlign: 'center', color: '#6b7280'}}>
          {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
          <span
            onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setMessage('') }}
            style={{color: '#1D9E75', fontWeight: '500', cursor: 'pointer', textDecoration: 'underline'}}
          >
            {mode === 'signup' ? 'Sign in' : 'Sign up'}
          </span>
        </p>
      </div>
    </div>
  )
}
