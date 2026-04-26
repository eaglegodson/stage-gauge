'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

const CITIES = ['Melbourne', 'Sydney', 'Brisbane', 'Perth', 'Adelaide', 'Hobart', 'Canberra', 'Auckland', 'Wellington', 'London']
const TYPES = ['theatre', 'musical', 'opera', 'ballet', 'dance', 'concert']

function CommunitySubmitPageInner() {
  const searchParams = useSearchParams()
  const [submissionType, setSubmissionType] = useState<'production' | 'audition'>('production')

  useEffect(() => {
    if (searchParams.get('type') === 'audition') setSubmissionType('audition')
    else setSubmissionType('production')
  }, [searchParams])
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    show_title: '', company: '', city: '', contact_name: '', contact_email: '',
    description: '', website_url: '', venue: '', show_type: 'musical',
    season_start: '', season_end: '', ticket_url: '',
    audition_date: '', audition_date_end: '', show_date_start: '', show_date_end: '',
    roles: '', contact_url: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.show_title || !form.company || !form.city) { setError('Please fill in show title, company and city.'); return }
    if (!form.contact_email) { setError('Please provide a contact email.'); return }
    setSubmitting(true); setError('')
    const country = form.city === 'London' ? 'GB' : (form.city === 'Auckland' || form.city === 'Wellington') ? 'NZ' : 'AU'
    const payload: any = {
      submission_type: submissionType, show_title: form.show_title, company: form.company,
      city: form.city, country, contact_name: form.contact_name || null,
      contact_email: form.contact_email, description: form.description || null,
      website_url: form.website_url || null, venue: form.venue || null,
    }
    if (submissionType === 'production') {
      Object.assign(payload, { show_type: form.show_type, season_start: form.season_start || null, season_end: form.season_end || null, ticket_url: form.ticket_url || null })
    } else {
      Object.assign(payload, { audition_date: form.audition_date || null, audition_date_end: form.audition_date_end || null, show_date_start: form.show_date_start || null, show_date_end: form.show_date_end || null, roles: form.roles || null, contact_url: form.contact_url || null })
    }
    const { error: err } = await supabase.from('community_submissions').insert(payload)
    setSubmitting(false)
    if (err) { setError('Something went wrong. Please try again or email hello@stage-gauge.com'); return }
    setSubmitted(true)
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', background: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '6px', color: '#f1f5f9', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: '500' }

  if (submitted) return (
    <main style={{ minHeight: '100vh', backgroundColor: '#14141f', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ maxWidth: '480px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', color: '#f1f5f9', margin: '0 0 12px 0' }}>Submission received</h1>
          <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: '1.6', margin: '0 0 24px 0' }}>
            Thanks for listing your {submissionType === 'production' ? 'production' : 'audition'}. We'll review it and add it to the community page shortly.
          </p>
          <a href="/community" style={{ display: 'inline-block', padding: '10px 20px', background: '#a78bfa', color: '#0f0f1a', borderRadius: '6px', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}>
            Back to Community Theatre
          </a>
        </div>
      </div>
      <Footer />
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#14141f', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ backgroundColor: '#0f0f1a', borderBottom: '1px solid #1e1e2e', padding: '24px' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '26px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 4px 0' }}>List your show or audition</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Free for all community theatre companies. We'll review and publish within 24 hours.</p>
        </div>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 24px', flex: 1, width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
          {(['production', 'audition'] as const).map(t => (
            <button key={t} onClick={() => setSubmissionType(t)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid', fontSize: '14px', fontWeight: '600', cursor: 'pointer', borderColor: submissionType === t ? '#a78bfa' : '#2a2a3e', background: submissionType === t ? '#1a1530' : '#1e1e2e', color: submissionType === t ? '#a78bfa' : '#6b7280' }}>
              {t === 'production' ? '🎭 Production' : '📢 Audition'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Show title *</label>
            <input style={inputStyle} value={form.show_title} onChange={e => set('show_title', e.target.value)} placeholder="e.g. Les Misérables" />
          </div>
          <div>
            <label style={labelStyle}>Company name *</label>
            <input style={inputStyle} value={form.company} onChange={e => set('company', e.target.value)} placeholder="e.g. CLOC Musical Theatre" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>City *</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.city} onChange={e => set('city', e.target.value)}>
                <option value="">Select city</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Venue</label>
              <input style={inputStyle} value={form.venue} onChange={e => set('venue', e.target.value)} placeholder="e.g. Shirley Burke Theatre" />
            </div>
          </div>

          {submissionType === 'production' && <>
            <div>
              <label style={labelStyle}>Show type</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.show_type} onChange={e => set('show_type', e.target.value)}>
                {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><label style={labelStyle}>Opening night</label><input style={inputStyle} type="date" value={form.season_start} onChange={e => set('season_start', e.target.value)} /></div>
              <div><label style={labelStyle}>Closing night</label><input style={inputStyle} type="date" value={form.season_end} onChange={e => set('season_end', e.target.value)} /></div>
            </div>
            <div>
              <label style={labelStyle}>Ticket / booking URL</label>
              <input style={inputStyle} value={form.ticket_url} onChange={e => set('ticket_url', e.target.value)} placeholder="https://www.trybooking.com/..." />
            </div>
          </>}

          {submissionType === 'audition' && <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><label style={labelStyle}>Audition date</label><input style={inputStyle} type="date" value={form.audition_date} onChange={e => set('audition_date', e.target.value)} /></div>
              <div><label style={labelStyle}>Audition end date</label><input style={inputStyle} type="date" value={form.audition_date_end} onChange={e => set('audition_date_end', e.target.value)} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><label style={labelStyle}>Show opens</label><input style={inputStyle} type="date" value={form.show_date_start} onChange={e => set('show_date_start', e.target.value)} /></div>
              <div><label style={labelStyle}>Show closes</label><input style={inputStyle} type="date" value={form.show_date_end} onChange={e => set('show_date_end', e.target.value)} /></div>
            </div>
            <div>
              <label style={labelStyle}>Roles being cast</label>
              <input style={inputStyle} value={form.roles} onChange={e => set('roles', e.target.value)} placeholder="e.g. All roles, female leads, ensemble" />
            </div>
            <div>
              <label style={labelStyle}>Audition info URL</label>
              <input style={inputStyle} value={form.contact_url} onChange={e => set('contact_url', e.target.value)} placeholder="https://..." />
            </div>
          </>}

          <div>
            <label style={labelStyle}>Brief description (optional)</label>
            <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' as const, fontFamily: 'inherit' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="A short description of the show or what you're looking for in auditions" />
          </div>
          <div>
            <label style={labelStyle}>Company website</label>
            <input style={inputStyle} value={form.website_url} onChange={e => set('website_url', e.target.value)} placeholder="https://yourcompany.com.au" />
          </div>
          <div style={{ borderTop: '1px solid #1e1e2e', paddingTop: '16px' }}>
            <p style={{ fontSize: '12px', color: '#4b5563', margin: '0 0 12px 0' }}>Your contact details — not published, just so we can follow up if needed.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><label style={labelStyle}>Your name</label><input style={inputStyle} value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="Jane Smith" /></div>
              <div><label style={labelStyle}>Your email *</label><input style={inputStyle} type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="jane@yourcompany.com.au" /></div>
            </div>
          </div>

          {error && <p style={{ color: '#F87171', fontSize: '13px', margin: 0 }}>{error}</p>}

          <button onClick={handleSubmit} disabled={submitting} style={{ padding: '12px', background: submitting ? '#2a2a3e' : '#a78bfa', color: submitting ? '#6b7280' : '#0f0f1a', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer' }}>
            {submitting ? 'Submitting...' : 'Submit listing'}
          </button>
          <p style={{ fontSize: '12px', color: '#374151', margin: 0, textAlign: 'center' as const }}>Listings are reviewed before publishing. Usually within 24 hours.</p>
        </div>
      </div>
      <Footer />
    </main>
  )
}

export default function CommunitySubmitPage() {
  return (
    <Suspense fallback={null}>
      <CommunitySubmitPageInner />
    </Suspense>
  )
}
