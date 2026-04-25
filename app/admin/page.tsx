'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function AdminPage() {
  const [tab, setTab] = useState<'unmatched' | 'unknown' | 'community' | 'audience' | 'edit'>('unmatched')
  const [communitySubmissions, setCommunitySubmissions] = useState<any[]>([])
  const [audienceReviews, setAudienceReviews] = useState<any[]>([])
  const [unmatched, setUnmatched] = useState<any[]>([])
  const [unknownTitles, setUnknownTitles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [creating, setCreating] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', company: '', venue: '', city: '', country: '', type: 'theatre', season_start: '', season_end: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [editSearch, setEditSearch] = useState('')
  const [editResults, setEditResults] = useState<any[]>([])
  const [editSelected, setEditSelected] = useState<any>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [editSaving, setEditSaving] = useState(false)
  const [editMessage, setEditMessage] = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [aud, unm] = await Promise.all([
      supabase.from('audience_reviews').select('*, productions(show_id, venue, city, shows(title))').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('unmatched_reviews').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('community_submissions').select('*').eq('status', 'pending').order('created_at', { ascending: false })
    ])
    const allUnmatched = unm.data || []
    setAudienceReviews(aud.data || [])
    setUnmatched(allUnmatched.filter(r => r.show_title && r.show_title !== 'Unknown'))
    setUnknownTitles(allUnmatched.filter(r => !r.show_title || r.show_title === 'Unknown'))
    setLoading(false)
  }

  async function updateAudience(id: string, status: string) {
    await supabase.from('audience_reviews').update({ status }).eq('id', id)
    setAudienceReviews(audienceReviews.filter(r => r.id !== id))
  }

  async function dismissUnmatched(id: string) {
    await supabase.from('unmatched_reviews').update({ status: 'dismissed' }).eq('id', id)
    setUnmatched(unmatched.filter(r => r.id !== id))
    setUnknownTitles(unknownTitles.filter(r => r.id !== id))
    setCreating(null)
  }

  async function approveCommunity(item: any) {
    if (item.submission_type === 'audition') {
      await supabase.from('auditions').insert({
        show_title: item.show_title, company: item.company, city: item.city,
        country: item.country, venue: item.venue || null,
        audition_date: item.audition_date || null, audition_date_end: item.audition_date_end || null,
        show_date_start: item.show_date_start || null, show_date_end: item.show_date_end || null,
        roles: item.roles || null, contact_url: item.contact_url || item.website_url || null,
        contact_email: item.contact_email || null, description: item.description || null,
        status: 'active',
      })
    } else {
      const { data: showData } = await supabase.from('shows').insert({
        title: item.show_title, company: item.company, type: item.show_type || 'community',
      }).select().single()
      if (showData) {
        await supabase.from('productions').insert({
          show_id: showData.id, venue: item.venue || null, city: item.city, country: item.country,
          season_start: item.season_start || null, season_end: item.season_end || null,
          ticket_url: item.ticket_url || item.website_url || null,
        })
      }
    }
    await supabase.from('community_submissions').update({ status: 'approved' }).eq('id', item.id)
    setCommunitySubmissions(communitySubmissions.filter(r => r.id !== item.id))
  }

  async function dismissCommunity(id: string) {
    await supabase.from('community_submissions').update({ status: 'dismissed' }).eq('id', id)
    setCommunitySubmissions(communitySubmissions.filter(r => r.id !== id))
  }

  function startCreate(item: any) {
    setCreating(item.id)
    setForm({
      title: item.show_title || '',
      company: item.company || '',
      venue: '',
      city: item.city || '',
      country: item.country || '',
      type: 'theatre',
      season_start: item.published_date || '',
      season_end: '',
    })
    setMessage('')
  }

  async function createAndApprove(item: any) {
    setSaving(true)
    setMessage('')
    try {
      let showId: string | null = null
      const { data: existingShow } = await supabase
        .from('shows')
        .select('id')
        .ilike('title', form.title)
        .eq('company', form.company)
        .maybeSingle()

      if (existingShow) {
        showId = existingShow.id
      } else {
        const { data: newShow, error: showErr } = await supabase
          .from('shows')
          .insert({ title: form.title, company: form.company, type: form.type })
          .select('id')
          .single()
        if (showErr) throw new Error('Failed to create show: ' + showErr.message)
        showId = newShow.id
      }

      const { data: newProd, error: prodErr } = await supabase
        .from('productions')
        .insert({
          show_id: showId,
          venue: form.venue,
          city: form.city,
          country: form.country,
          season_start: form.season_start || null,
          season_end: form.season_end || null,
        })
        .select('id')
        .single()
      if (prodErr) throw new Error('Failed to create production: ' + prodErr.message)

      await supabase.from('critic_reviews').insert({
        production_id: newProd.id,
        outlet: item.outlet,
        reviewer: item.reviewer,
        published_date: item.published_date,
        star_rating: item.star_rating,
        normalised_score: item.star_rating ? Math.round(item.star_rating * 20) : null,
        pull_quote: item.pull_quote,
        source_url: item.source_url,
        auto_imported: true,
        confidence_score: item.confidence,
        status: 'approved',
      })

      await supabase.rpc('recalculate_all_scores')
      await supabase.from('unmatched_reviews').update({ status: 'approved' }).eq('id', item.id)

      setUnmatched(unmatched.filter(r => r.id !== item.id))
      setUnknownTitles(unknownTitles.filter(r => r.id !== item.id))
      setCreating(null)
      setMessage('')
    } catch (err: any) {
      setMessage(err.message)
    }
    setSaving(false)
  }

  async function searchProductions() {
    if (!editSearch.trim()) return
    const { data } = await supabase
      .from('production_listing')
      .select('*')
      .or('title.ilike.%' + editSearch + '%,company.ilike.%' + editSearch + '%')
      .limit(10)
    setEditResults(data || [])
  }

  function selectProduction(p: any) {
    setEditSelected(p)
    setEditForm({
      title: p.title || '',
      company: p.company || '',
      type: p.type || 'theatre',
      subtype: p.subtype || '',
      composer_or_playwright: p.composer_or_playwright || '',
      venue: p.venue || '',
      city: p.city || '',
      country: p.country || '',
      season_start: p.season_start || '',
      season_end: p.season_end || '',
      ticket_url: p.ticket_url || '',
    })
    setEditMessage('')
  }

  async function saveEdit() {
    if (!editSelected) return
    setEditSaving(true)
    setEditMessage('')
    try {
      await supabase.from('shows').update({
        title: editForm.title,
        company: editForm.company,
        type: editForm.type,
        subtype: editForm.subtype || null,
        composer_or_playwright: editForm.composer_or_playwright || null,
      }).eq('id', editSelected.show_id)
      await supabase.from('productions').update({
        venue: editForm.venue || null,
        city: editForm.city,
        country: editForm.country,
        season_start: editForm.season_start || null,
        season_end: editForm.season_end || null,
        ticket_url: editForm.ticket_url || null,
      }).eq('id', editSelected.production_id)
      setEditMessage('✓ Saved successfully')
    } catch (err: any) {
      setEditMessage('Error: ' + err.message)
    }
    setEditSaving(false)
  }

  const tabStyle = (t: string) => ({
    fontSize: '13px',
    fontWeight: tab === t ? '600' : '400',
    padding: '12px 20px',
    border: 'none',
    borderBottom: tab === t ? '2px solid #1D9E75' : '2px solid transparent',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: tab === t ? '#f1f5f9' : '#6b7280',
    whiteSpace: 'nowrap' as const,
  })

  const Badge = ({ count, muted }: { count: number; muted?: boolean }) =>
    count > 0 ? (
      <span style={{ marginLeft: '6px', background: muted ? '#4b5563' : '#1D9E75', color: 'white', fontSize: '11px', padding: '1px 6px', borderRadius: '10px' }}>
        {count}
      </span>
    ) : null

  function renderCard(item: any, isUnknown = false) {
    return (
      <div key={item.id} style={{ background: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '10px', padding: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
          <div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: '16px', fontWeight: '600', color: isUnknown ? '#6b7280' : '#f1f5f9', marginBottom: '3px', fontStyle: isUnknown ? 'italic' : 'normal' }}>
              {isUnknown ? 'Unknown title — manual review needed' : item.show_title}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {item.outlet}
              {item.reviewer && ` · ${item.reviewer}`}
              {item.city && item.city !== 'Unknown' && ` · ${item.city}`}
              {item.published_date && ` · ${item.published_date}`}
              {item.star_rating && ` · ${item.star_rating}★`}
            </div>
          </div>
          {!isUnknown && (
            <div style={{ fontSize: '11px', color: '#4b5563', flexShrink: 0 }}>
              {Math.round((item.confidence || 0) * 100)}% conf
            </div>
          )}
        </div>

        {item.pull_quote && (
          <p style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', margin: '0 0 10px 0', lineHeight: '1.5' }}>
            "{item.pull_quote}"
          </p>
        )}
        {isUnknown && !item.pull_quote && (
          <p style={{ fontSize: '13px', color: '#4b5563', margin: '0 0 10px 0' }}>No pull quote extracted.</p>
        )}

        {item.source_url && (
          <a href={item.source_url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '12px', color: '#1D9E75', textDecoration: 'none', display: 'block', marginBottom: '12px' }}>
            {isUnknown ? '→ Read original review to identify show' : 'Read review →'}
          </a>
        )}

        {creating === item.id ? (
          <div style={{ background: '#14141f', border: '1px solid #2a2a3e', borderRadius: '8px', padding: '16px', marginTop: '8px' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Create show & production
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              {[
                { label: 'Show title', key: 'title' },
                { label: 'Company', key: 'company' },
                { label: 'Venue', key: 'venue' },
                { label: 'City', key: 'city' },
                { label: 'Country (AU/GB/NZ)', key: 'country' },
                { label: 'Season start (YYYY-MM-DD)', key: 'season_start' },
                { label: 'Season end (YYYY-MM-DD)', key: 'season_end' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>{f.label}</label>
                  <input
                    value={(form as any)[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    style={{ width: '100%', background: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '6px', padding: '7px 10px', fontSize: '13px', color: '#f1f5f9', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  style={{ width: '100%', background: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '6px', padding: '7px 10px', fontSize: '13px', color: '#f1f5f9' }}
                >
                  {['theatre', 'musical', 'opera', 'ballet', 'dance', 'concert'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            {message && <p style={{ fontSize: '13px', color: '#f87171', margin: '0 0 10px 0' }}>{message}</p>}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => createAndApprove(item)} disabled={saving}
                style={{ flex: 1, background: '#1D9E75', color: 'white', border: 'none', borderRadius: '6px', padding: '9px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : '✓ Create show & approve review'}
              </button>
              <button onClick={() => setCreating(null)}
                style={{ background: 'none', border: '1px solid #2a2a3e', color: '#6b7280', borderRadius: '6px', padding: '9px 14px', fontSize: '13px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => startCreate(item)}
              style={{ flex: 1, background: '#1D9E75', color: 'white', border: 'none', borderRadius: '6px', padding: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              + Create show & approve
            </button>
            <button onClick={() => dismissUnmatched(item.id)}
              style={{ background: 'none', border: '1px solid #2a2a3e', color: '#6b7280', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer' }}>
              Dismiss
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#14141f', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px', flex: 1, width: '100%' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '26px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 4px 0' }}>Admin</h1>
        <p style={{ fontSize: '14px', color: '#4b5563', margin: '0 0 24px 0' }}>Moderation and show management</p>

        <div style={{ display: 'flex', borderBottom: '1px solid #1e1e2e', marginBottom: '24px' }}>
          <button style={tabStyle('unmatched')} onClick={() => setTab('unmatched')}>
            Unmatched reviews <Badge count={unmatched.length} />
          </button>
          <button style={tabStyle('unknown')} onClick={() => setTab('unknown')}>
            Unknown titles <Badge count={unknownTitles.length} muted />
          </button>
          <button style={tabStyle('community')} onClick={() => setTab('community')}>
            Community queue <Badge count={communitySubmissions.length} />
          </button>
          <button style={tabStyle('audience')} onClick={() => setTab('audience')}>
            Audience queue <Badge count={audienceReviews.length} muted />
          </button>
          <button style={tabStyle('edit')} onClick={() => setTab('edit')}>
            Edit shows
          </button>
        </div>

        {loading && <p style={{ color: '#4b5563' }}>Loading...</p>}

        {!loading && tab === 'unmatched' && (
          <div>
            <p style={{ fontSize: '13px', color: '#4b5563', margin: '0 0 16px 0' }}>
              Reviews where the pipeline extracted a show title but couldn't match it to a production. The processor handles these automatically — check here if anything needs a manual push.
            </p>
            {unmatched.length === 0 && (
              <p style={{ color: '#4b5563', fontSize: '14px' }}>Queue is clear — pipeline is matching everything.</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {unmatched.map(item => renderCard(item, false))}
            </div>
          </div>
        )}

        {!loading && tab === 'unknown' && (
          <div>
            <p style={{ fontSize: '13px', color: '#4b5563', margin: '0 0 16px 0' }}>
              Reviews where no show title could be extracted. Read the pull quote and open the original review to identify the show, then create it manually or dismiss.
            </p>
            {unknownTitles.length === 0 && (
              <p style={{ color: '#4b5563', fontSize: '14px' }}>No unknown titles — all reviews have extractable show names.</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {unknownTitles.map(item => renderCard(item, true))}
            </div>
          </div>
        )}

        {!loading && tab === 'community' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {communitySubmissions.length === 0 && <p style={{ color: '#4b5563', fontSize: '14px' }}>No pending community submissions.</p>}
            {communitySubmissions.map(item => (
              <div key={item.id} style={{ background: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#a78bfa', background: '#1a1530', border: '1px solid #a78bfa44', borderRadius: '4px', padding: '2px 7px' }}>
                        {item.submission_type}
                      </span>
                      {item.show_type && item.submission_type === 'production' && (
                        <span style={{ fontSize: '11px', color: '#6b7280', background: '#14141f', border: '1px solid #2a2a3e', borderRadius: '4px', padding: '2px 7px' }}>
                          {item.show_type}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '16px', color: '#f1f5f9', margin: '0 0 2px 0' }}>{item.show_title}</h3>
                    <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>{item.company} · {item.city}</p>
                  </div>
                  <p style={{ fontSize: '11px', color: '#4b5563', margin: 0, flexShrink: 0 }}>{new Date(item.created_at).toLocaleDateString('en-AU')}</p>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '12px', color: '#6b7280' }}>
                  {item.venue && <span>📍 {item.venue}</span>}
                  {item.season_start && <span>🗓 {item.season_start}{item.season_end ? ' – ' + item.season_end : ''}</span>}
                  {item.audition_date && <span>🎤 Auditions: {item.audition_date}{item.audition_date_end ? ' – ' + item.audition_date_end : ''}</span>}
                  {item.show_date_start && <span>🎭 Show: {item.show_date_start}{item.show_date_end ? ' – ' + item.show_date_end : ''}</span>}
                  {item.roles && <span>👥 {item.roles}</span>}
                  {item.ticket_url && <a href={item.ticket_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1D9E75' }}>Tickets ↗</a>}
                  {item.website_url && <a href={item.website_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1D9E75' }}>Website ↗</a>}
                  {item.contact_url && <a href={item.contact_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1D9E75' }}>Audition info ↗</a>}
                </div>
                {item.description && <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: '1.5' }}>{item.description}</p>}
                {item.contact_name && <p style={{ fontSize: '12px', color: '#4b5563', margin: 0 }}>Submitted by: {item.contact_name} · {item.contact_email}</p>}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => approveCommunity(item)}
                    style={{ flex: 1, padding: '8px', background: '#a78bfa', color: '#0f0f1a', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    ✓ Approve & publish
                  </button>
                  <button onClick={() => dismissCommunity(item.id)}
                    style={{ padding: '8px 16px', background: 'none', color: '#6b7280', border: '1px solid #2a2a3e', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === 'audience' && (
          <div>
            {audienceReviews.length === 0 && <p style={{ color: '#4b5563', fontSize: '14px' }}>Queue is empty.</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {audienceReviews.map(review => (
                <div key={review.id} style={{ background: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '10px', padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'Georgia, serif', fontSize: '15px', color: '#f1f5f9' }}>
                      {(review.productions as any)?.shows?.title}
                    </span>
                    <span style={{ color: '#1D9E75' }}>{'★'.repeat(review.star_rating)}</span>
                  </div>
                  {review.review_text && (
                    <p style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', margin: '0 0 12px 0' }}>"{review.review_text}"</p>
                  )}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => updateAudience(review.id, 'approved')}
                      style={{ flex: 1, background: '#1D9E75', color: 'white', border: 'none', borderRadius: '6px', padding: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                      ✓ Approve
                    </button>
                    <button onClick={() => updateAudience(review.id, 'rejected')}
                      style={{ flex: 1, background: 'none', border: '1px solid #2a2a3e', color: '#6b7280', borderRadius: '6px', padding: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {!loading && tab === 'edit' && (
          <div>
            <p style={{ fontSize: '13px', color: '#4b5563', margin: '0 0 16px 0' }}>
              Search for a production to edit its details.
            </p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                value={editSearch}
                onChange={e => setEditSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchProductions()}
                placeholder="Search by show title or company..."
                style={{ flex: 1, background: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', color: '#f1f5f9', outline: 'none' }}
              />
              <button onClick={searchProductions}
                style={{ padding: '9px 18px', background: '#1D9E75', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                Search
              </button>
            </div>
            {editResults.length > 0 && !editSelected && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                {editResults.map(p => (
                  <button key={p.production_id} onClick={() => selectProduction(p)}
                    style={{ textAlign: 'left', background: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '8px', padding: '12px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '14px', color: '#f1f5f9', fontWeight: '600' }}>{p.title}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{p.company} · {p.city} · {p.season_start}</div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#1D9E75' }}>Edit →</span>
                  </button>
                ))}
              </div>
            )}
            {editSelected && (
              <div style={{ background: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '10px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '16px', color: '#f1f5f9', margin: 0 }}>
                    Editing: {editSelected.title} · {editSelected.city}
                  </h3>
                  <button onClick={() => { setEditSelected(null); setEditResults([]); setEditSearch(''); setEditMessage('') }}
                    style={{ background: 'none', border: '1px solid #2a2a3e', color: '#6b7280', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer' }}>
                    ← Back
                  </button>
                </div>
                <p style={{ fontSize: '11px', fontWeight: '600', color: '#4b5563', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px 0' }}>Show details</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                  {[
                    { label: 'Title', key: 'title' },
                    { label: 'Company', key: 'company' },
                    { label: 'Composer / Playwright', key: 'composer_or_playwright' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>{f.label}</label>
                      <input value={editForm[f.key] || ''} onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })}
                        style={{ width: '100%', background: '#14141f', border: '1px solid #2a2a3e', borderRadius: '6px', padding: '7px 10px', fontSize: '13px', color: '#f1f5f9', boxSizing: 'border-box' as const }} />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Type</label>
                    <select value={editForm.type || 'theatre'} onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                      style={{ width: '100%', background: '#14141f', border: '1px solid #2a2a3e', borderRadius: '6px', padding: '7px 10px', fontSize: '13px', color: '#f1f5f9' }}>
                      {['theatre', 'musical', 'opera', 'ballet', 'dance', 'concert', 'community'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Subtype (for community shows)</label>
                    <select value={editForm.subtype || ''} onChange={e => setEditForm({ ...editForm, subtype: e.target.value })}
                      style={{ width: '100%', background: '#14141f', border: '1px solid #2a2a3e', borderRadius: '6px', padding: '7px 10px', fontSize: '13px', color: '#f1f5f9' }}>
                      <option value=''>None</option>
                      {['theatre', 'musical', 'opera', 'ballet', 'dance', 'concert'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <p style={{ fontSize: '11px', fontWeight: '600', color: '#4b5563', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px 0' }}>Production details</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                  {[
                    { label: 'Venue', key: 'venue' },
                    { label: 'City', key: 'city' },
                    { label: 'Country (AU/GB/NZ)', key: 'country' },
                    { label: 'Season start (YYYY-MM-DD)', key: 'season_start' },
                    { label: 'Season end (YYYY-MM-DD)', key: 'season_end' },
                    { label: 'Ticket URL', key: 'ticket_url' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>{f.label}</label>
                      <input value={editForm[f.key] || ''} onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })}
                        style={{ width: '100%', background: '#14141f', border: '1px solid #2a2a3e', borderRadius: '6px', padding: '7px 10px', fontSize: '13px', color: '#f1f5f9', boxSizing: 'border-box' as const }} />
                    </div>
                  ))}
                </div>
                {editMessage && (
                  <p style={{ fontSize: '13px', color: editMessage.startsWith('✓') ? '#1D9E75' : '#f87171', margin: '0 0 12px 0' }}>{editMessage}</p>
                )}
                <button onClick={saveEdit} disabled={editSaving}
                  style={{ width: '100%', background: '#1D9E75', color: 'white', border: 'none', borderRadius: '6px', padding: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', opacity: editSaving ? 0.7 : 1 }}>
                  {editSaving ? 'Saving...' : '✓ Save changes'}
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      <Footer />
    </main>
  )
}