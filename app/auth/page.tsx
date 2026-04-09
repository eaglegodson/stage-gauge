'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  async function handleSignUp() {
    setMessage('Trying...')
    console.log('signing up with', email)
    const { data, error } = await supabase.auth.signUp({ email, password })
    console.log('result', data, error)
    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Account created!')
    }
  }

  return (
<div style={{padding: '40px', maxWidth: '400px', margin: '0 auto', backgroundColor: 'white', minHeight: '100vh'}}>
          <h1 style={{marginBottom: '20px'}}>Create Account</h1>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        style={{display: 'block', width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ccc', color: '#000'}}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        style={{display: 'block', width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ccc', color: '#000'}}
      />
      <button
        onClick={handleSignUp}
        style={{backgroundColor: '#1D9E75', color: 'white', padding: '10px 20px', border: 'none', cursor: 'pointer'}}
      >
        Sign Up
      </button>
      {message && <p style={{marginTop: '10px', color: 'green'}}>{message}</p>}
    </div>
  )
}