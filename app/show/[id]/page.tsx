'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import ReviewForm from './review'
import posthog from 'posthog-js'

const typeConfig: Record<string, { gradient: string, accent: string, emoji: string }> = {
  theatre:  { gradient: 'linear-gradient(160deg, #0f2744 0%, #1a6bb5 100%)', accent: '#4A90D9', emoji: '🎭' },
  musical:  { gradient: 'linear-gradient(160deg, #2d0f4a 0%, #8b2fc9 100%)', accent: '#C084FC', emoji: '🎵' },
  opera:    { gradient: 'linear-gradient(160deg, #4a0f0f 0%, #c93030 100%)', accent: '#F87171', emoji: '🎼' },
  ballet:   { gradient: 'linear-gradient(160deg, #0f1a44 0%, #2050b5 100%)', accent: '#60A5FA', emoji: '🩰' },
  dance:    { gradient: 'linear-gradient(160deg, #0f2d1a 0%, #0f8f5a 100%)', accent: '#34D399', emoji: '💃' },
  concert:  { gradient: 'linear-gradient(160deg, #2d230f 0%, #b57d10 100%)', accent: '#FBBF24', emoji: '🎻' },
}

function getTicketUrl(company: string, city: string, title: string, country: string): string {
  const t = encodeURIComponent(title)
  const companyDirect: Record<string, string> = {
    'Melbourne Theatre Company': 'https://www.mtc.com.au/whats-on/',
    'Malthouse Theatre': 'https://www.malthousetheatre.com.au/whats-on/',
    'Red Stitch Actors Theatre': 'https://www.redstitch.net/whats-on/',
    'Victorian Opera': 'https://www.victorianopera.com.au/whats-on/',
    'Sydney Theatre Company': 'https://www.sydneytheatre.com.au/whats-on/',
    'Belvoir St Theatre': 'https://belvoir.com.au/whats-on/',
    'Griffin Theatre Company': 'https://griffintheatre.com.au/whats-on/',
    'Ensemble Theatre': 'https://www.ensemble.com.au/whats-on/',
    'Hayes Theatre Co': 'https://hayestheatre.com.au/whats-on/',
    'Queensland Theatre': 'https://www.queenslandtheatre.com.au/whats-on/',
    'Opera Queensland': 'https://www.operaqueensland.com.au/whats-on/',
    'Queensland Ballet': 'https://www.queenslandballet.com.au/whats-on/',
    'Black Swan State Theatre': 'https://www.bsstc.com.au/whats-on/',
    'West Australian Opera': 'https://www.waopera.asn.au/whats-on/',
    'West Australian Ballet': 'https://waballet.com.au/whats-on/',
    'State Theatre Company SA': 'https://statetheatrecompany.com.au/whats-on/',
    'State Opera SA': 'https://stateopera.com.au/whats-on/',
    'Opera Australia': 'https://opera.org.au/whats-on/',
    'Australian Ballet': 'https://australianballet.com.au/whats-on/',
    'Bangarra Dance Theatre': 'https://bangarra.com.au/whats-on/',
    'Bell Shakespeare': 'https://www.bellshakespeare.com.au/whats-on/',
    'Canberra Theatre Centre': 'https://www.canberratheatrecentre.com.au/whats-on/',
    'Auckland Theatre Company': 'https://atc.co.nz/whats-on/',
    'Circa Wellington': 'https://www.circa.co.nz/whats-on/',
    'National Theatre': 'https://www.nationaltheatre.org.uk/whats-on/',
    'Donmar Warehouse': 'https://www.donmarwarehouse.com/whats-on/',
    'Almeida Theatre': 'https://almeida.co.uk/whats-on/',
    'Old Vic': 'https://www.oldvictheatre.com/whats-on/',
    'Royal Court Theatre': 'https://royalcourttheatre.com/whats-on/',
    "Shakespeare's Globe": 'https://www.shakespearesglobe.com/whats-on/',
    'CLOC Musical Theatre': 'https://www.cloc.org.au/',
    'PLOS Musical Productions': 'https://www.plos.asn.au/',
    'Williamstown Musical Theatre Company': 'https://www.wmtc.org.au/',
    'Upstage Theatre Company': 'https://www.upstagetheatrecompany.com/',
    'Heidelberg Theatre Co': 'https://htc.org.au/',
    'Essendon Theatre Company': 'https://essendontheatrecompany.com.au/',
    'Brighton Theatre Company': 'https://brightontheatre.com.au/',
    'Malvern Theatre Company': 'https://malverntheatre.com.au/',
    'The 1812 Theatre': 'http://www.1812theatre.com.au/',
    'Frankston Theatre Group': 'https://frankstontheatregroup.org.au/',
    'Strathmore Theatre Arts Group': 'https://www.stagtheatre.org/',
    'BATS Theatre Company': 'https://www.batstheatre.org.au/',
    'CPP Community Theatre': 'https://cppcommunitytheatre.com.au/',
    'Lilydale Athenaeum Theatre': 'https://www.lilydaleatc.com/',
    'Eltham Little Theatre': 'https://elthamlittletheatre.org.au/',
    'Willoughby Theatre Company': 'https://willoughbytheatreco.com.au/',
    'The Regals Musical Society': 'https://theregals.com.au/',
    'Genesian Theatre Company': 'https://genesiantheatre.com.au/',
    'Engadine Musical Society': 'https://engadinemusicalsociety.com.au/',
    'Mosman Musical Society': 'https://www.mosmanmusicalsociety.com.au/',
    'Hornsby Musical Society': 'https://hornsbymusicalsociety.com.au/',
    'Strathfield Musical Society': 'https://strathfieldmusicalsociety.com.au/',
    'Hunters Hill Theatre': 'https://www.huntershilltheatre.com.au/',
    'Inner West Theatre Co': 'https://www.innerwesttheatre.com.au/',
    'Berowra Musical Society': 'https://www.bmsi.org.au/',
    'Adelaide Repertory Theatre': 'https://www.adelaiderep.com/',
    'Tea Tree Players': 'https://teatreeplayers.com/',
    'Metropolitan Musical Theatre Company of SA': 'https://www.metmusicals.com.au/',
    'Therry Dramatic Society': 'https://therry.org.au/',
    'Brisbane Arts Theatre': 'https://www.artstheatre.com.au/',
    'Villanova Players': 'https://www.villanovaplayers.com/',
    'Growl Theatre': 'https://growltheatre.org.au/',
    'Old Mill Theatre': 'https://www.oldmilltheatre.com.au/',
    'Garrick Theatre': 'https://garricktheatre.com.au/',
    'Koorliny Arts Centre': 'https://www.koorliny.com.au/',
    'Roleystone Theatre': 'https://www.roleystonetheatre.com.au/',
    'Free Rain Theatre Co': 'https://www.freeraintheatre.com/',
    'Canberra Philharmonic Society': 'https://www.philo.org.au/',
    'GRADS Theatre Company': 'https://www.grads.org.au/',
    'Bel Canto Performing Arts': 'https://www.belcantoperformingarts.com.au/',
    'Hills Musical Company': 'https://hillsmusical.org.au/',
    'Adelaide University Theatre Guild': 'https://adelaide.edu.au/partners-and-community/theatre-guild/',
    'Canberra Repertory Society': 'https://canberrarep.org.au/',
    'Mordialloc Theatre Company': 'https://mordialloctheatre.com.au/',
    'Peridot Theatre': 'https://www.peridot.com.au/',
    'Williamstown Little Theatre': 'https://www.wlt.org.au/',
    'Mountain District Musical Society': 'https://mdms.org.au/',
    'Babirra Music Theatre': 'https://babirra.org.au/',
    'The Mount Players': 'https://www.themountplayers.com/',
    'Windmill Theatre Company': 'https://www.windmilltheatre.com.au/',
  }
  if (companyDirect[company]) return companyDirect[company]
  if (country === 'GB') return 'https://www.todaytix.com/london/search?q=' + t
  if (country === 'NZ') return 'https://www.ticketmaster.co.nz/search?tm_link=tm_homeA_header_search&q=' + t
  return 'https://www.ticketmaster.com.au/search?q=' + t
}

function StarDisplay({ score, size = 'sm' }: { score: number, size?: 'sm' | 'lg' }) {
  const stars = []
  const fullStars = Math.floor(score)
  const hasHalf = score - fullStars >= 0.25 && score - fullStars < 0.75
  const roundedUp = score - fullStars >= 0.75
  const total = roundedUp ? fullStars + 1 : fullStars
  const fontSize = size === 'lg' ? '24px' : '16px'
  for (let i = 1; i <= 5; i++) {
    if (i <= total) stars.push(<span key={i} style={{ color: '#1D9E75', fontSize }}>★</span>)
    else if (i === fullStars + 1 && hasHalf) stars.push(<span key={i} style={{ color: '#1D9E75', fontSize }}>½</span>)
    else stars.push(<span key={i} style={{ color: '#2a2a3e', fontSize }}>★</span>)
  }
  return <span style={{ display: 'flex', alignItems: 'center', gap: '1px', lineHeight: 1 }}>{stars}</span>
}

export default function ShowPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState('')
  const [production, setProduction] = useState<any>(null)
  const [scores, setScores] = useState<any>(null)
  const [criticReviews, setCriticReviews] = useState<any[]>([])
  const [audienceReviews, setAudienceReviews] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [watchlisted, setWatchlisted] = useState(false)
  const [seen, setSeen] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [authPrompt, setAuthPrompt] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [editSaving, setEditSaving] = useState(false)
  const [editMessage, setEditMessage] = useState('')

  useEffect(() => { params.then(({ id }) => setId(id)) }, [params])

  useEffect(() => {
    if (!id) return
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    supabase.from('productions').select('*, shows(*)').eq('id', id).single().then(({ data }) => {
      setProduction(data)
      if (data) {
        posthog.capture('show_page_viewed', {
          production_id: id,
          show_title: data.shows?.title,
          show_type: data.shows?.type,
          company: data.shows?.company,
          city: data.city,
          venue: data.venue,
        })
      }
    })
    supabase.from('show_scores').select('*').eq('production_id', id).single().then(({ data }) => setScores(data))
    supabase.from('critic_reviews').select('*').eq('production_id', id).eq('status', 'approved')
      .order('published_date', { ascending: false }).then(({ data }) => setCriticReviews(data || []))
    supabase.from('audience_reviews').select('*').eq('production_id', id)
      .eq('status', 'approved').order('created_at', { ascending: false }).then(({ data }) => setAudienceReviews(data || []))
  }, [id])

  useEffect(() => {
    if (!user || !id) return
    supabase.from('watchlist').select('id').eq('production_id', id).eq('user_id', user.id)
      .maybeSingle().then(({ data }) => setWatchlisted(!!data))
    supabase.from('seen').select('id').eq('production_id', id).eq('user_id', user.id)
      .maybeSingle().then(({ data }) => setSeen(!!data))
  }, [user, id])

  async function toggleSeen() {
    if (!user) return setAuthPrompt('seen')
    const show = production?.shows
    if (seen) {
      await supabase.from('seen').delete().eq('production_id', id).eq('user_id', user.id)
      setSeen(false)
      posthog.capture('show_unmarked_seen', { production_id: id, show_title: show?.title, show_type: show?.type, city: production?.city })
    } else {
      await supabase.from('seen').insert({ production_id: id, user_id: user.id })
      setSeen(true)
      posthog.capture('show_marked_seen', { production_id: id, show_title: show?.title, show_type: show?.type, city: production?.city })
      await supabase.from('watchlist').delete().eq('production_id', id).eq('user_id', user.id)
      setWatchlisted(false)
    }
  }

  async function toggleWatchlist() {
    if (!user) return setAuthPrompt('watchlist')
    const show = production?.shows
    if (watchlisted) {
      await supabase.from('watchlist').delete().eq('production_id', id).eq('user_id', user.id)
      setWatchlisted(false)
    } else {
      await supabase.from('watchlist').insert({ production_id: id, user_id: user.id })
      setWatchlisted(true)
      posthog.capture('show_watchlisted', { production_id: id, show_title: show?.title, show_type: show?.type, city: production?.city })
    }
  }

  function openEdit() {
    const s = production?.shows
    setEditForm({
      title: s?.title || '',
      company: s?.company || '',
      type: s?.type || 'theatre',
      subtype: s?.subtype || '',
      composer_or_playwright: s?.composer_or_playwright || '',
      venue: production?.venue || '',
      city: production?.city || '',
      country: production?.country || '',
      season_start: production?.season_start || '',
      season_end: production?.season_end || '',
      ticket_url: production?.ticket_url || '',
    })
    setEditMessage('')
    setShowEditModal(true)
  }

  async function saveEdit() {
    setEditSaving(true)
    setEditMessage('')
    const s = production?.shows
    const res = await fetch('/api/admin/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        show_id: s?.id,
        production_id: id,
        userEmail: user?.email,
        showData: {
          title: editForm.title,
          company: editForm.company,
          type: editForm.type,
          subtype: editForm.subtype || null,
          composer_or_playwright: editForm.composer_or_playwright || null,
        },
        productionData: {
          venue: editForm.venue || null,
          city: editForm.city,
          country: editForm.country,
          season_start: editForm.season_start || null,
          season_end: editForm.season_end || null,
          ticket_url: editForm.ticket_url || null,
        },
      }),
    })
    const data = await res.json()
    if (data.error) {
      setEditMessage('Error: ' + data.error)
    } else {
      setEditMessage('✓ Saved — reload to see changes')
    }
    setEditSaving(false)
  }

  if (!production) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#14141f', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 24px', textAlign: 'center', flex: 1 }}>
        <p style={{ color: '#4b5563' }}>Loading...</p>
      </div>
      <Footer />
    </div>
  )

  const show = production.shows
  const cfg = typeConfig[show?.type] || typeConfig.theatre
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
  const reportHref = `/feedback?show=${encodeURIComponent(show?.title || '')}&company=${encodeURIComponent(show?.company || '')}&city=${encodeURIComponent(production.city || '')}&production_id=${id}`

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#14141f', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      <Header />

      <div style={{ background: cfg.gradient, padding: '40px 16px 28px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <button onClick={() => window.history.back()} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '20px', padding: 0 }}>← Back</button>
          {/* Top row: poster + text */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ width: '72px', height: '96px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '28px' }}>{cfg.emoji}</span>
              <div style={{ width: '20px', height: '2px', borderRadius: '1px', background: cfg.accent }}></div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: cfg.accent }}>{show?.type}</span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{production.city}</span>
              </div>
              <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(20px, 5vw, 34px)', fontWeight: '600', color: '#ffffff', lineHeight: '1.2', margin: '0 0 6px 0' }}>{show?.title}</h1>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: '0 0 2px 0', fontWeight: '500' }}>{show?.company}</p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: '0 0 4px 0' }}>{production.venue}</p>
              {production.season_start && (
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                  {fmt(production.season_start)}{production.season_end ? ` – ${fmt(production.season_end)}` : ''}
                </p>
              )}
            </div>
          </div>

          {/* Score row — sits below on all screens */}
          {scores?.combined_score && (
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <StarDisplay score={scores.combined_score} size="lg" />
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#1D9E75' }}>{Number(scores.combined_score).toFixed(1)} / 5</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                {scores.critic_count > 0 && <span>{scores.critic_count} critic{scores.critic_count !== 1 ? 's' : ''}</span>}
                {scores.critic_count > 0 && scores.audience_count > 0 && <span> · </span>}
                {scores.audience_count > 0 && <span>{scores.audience_count} audience</span>}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a href={production.ticket_url || getTicketUrl(show?.company, production.city, show?.title, production.country)} target="_blank" rel="noopener noreferrer" onClick={() => posthog.capture('tickets_link_clicked', { production_id: id, show_title: show?.title, company: show?.company, city: production.city })} style={{ fontSize: '13px', padding: '8px 18px', borderRadius: '6px', backgroundColor: '#1D9E75', color: 'white', textDecoration: 'none', fontWeight: '600', display: 'inline-block' }}>Buy tickets</a>
            <button onClick={toggleWatchlist} style={{ fontSize: '13px', padding: '8px 18px', borderRadius: '6px', border: `1px solid ${watchlisted ? '#1D9E75' : 'rgba(255,255,255,0.2)'}`, backgroundColor: watchlisted ? '#1D9E75' : 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontWeight: '500' }}>
              {watchlisted ? '✓ Watchlisted' : '+ Watchlist'}
            </button>
            <button onClick={toggleSeen} style={{ fontSize: '13px', padding: '8px 18px', borderRadius: '6px', border: `1px solid ${seen ? '#f1f5f9' : 'rgba(255,255,255,0.2)'}`, backgroundColor: seen ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontWeight: '500' }}>
              {seen ? '✓ Seen this' : '👁 I saw this'}
            </button>
            {user?.email === 'hadimaz@gmail.com' && (
              <button onClick={openEdit} style={{ fontSize: '13px', padding: '8px 18px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontWeight: '500' }}>
                ✏️ Edit
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 16px', flex: 1, width: '100%', boxSizing: 'border-box' }}>

        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4b5563', margin: 0 }}>Critic reviews · {criticReviews.length}</h2>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#1e1e2e' }}></div>
          </div>
          {criticReviews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {criticReviews.map(review => (
                <div key={review.id} style={{ backgroundColor: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9' }}>{review.outlet}</span>
                        {review.reviewer && <span style={{ fontSize: '13px', color: '#6b7280' }}>{review.reviewer}</span>}
                        {review.published_date && <span style={{ fontSize: '12px', color: '#374151' }}>{new Date(review.published_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                      </div>
                      {review.pull_quote && <p style={{ fontSize: '14px', color: '#9ca3af', fontStyle: 'italic', margin: '0 0 10px 0', lineHeight: '1.6' }}>"{review.pull_quote}"</p>}
                      {review.source_url && <a href={review.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#1D9E75', textDecoration: 'none' }}>Read full review →</a>}
                    </div>
                    {review.star_rating && <div style={{ flexShrink: 0 }}><StarDisplay score={review.star_rating} /></div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ backgroundColor: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '10px', padding: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>No critic reviews yet.</p>
            </div>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4b5563', margin: 0, whiteSpace: 'nowrap' }}>Audience reviews · {audienceReviews.length}</h2>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#1e1e2e' }}></div>
            </div>
            <div style={{ marginLeft: '16px', flexShrink: 0 }}>
              {user ? (
                <button onClick={() => setShowReviewForm(true)} style={{ fontSize: '13px', color: 'white', padding: '7px 16px', borderRadius: '6px', backgroundColor: '#1D9E75', border: 'none', cursor: 'pointer' }}>Write a review</button>
              ) : (
                <button onClick={() => setAuthPrompt('review')} style={{ fontSize: '13px', color: 'white', padding: '7px 16px', borderRadius: '6px', backgroundColor: '#1D9E75', border: 'none', cursor: 'pointer' }}>Write a review</button>
              )}
            </div>
          </div>
          {audienceReviews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {audienceReviews.map(review => (
                <div key={review.id} style={{ backgroundColor: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9' }}>Anonymous</span>
                    <StarDisplay score={review.star_rating} />
                  </div>
                  {review.review_text && <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0, lineHeight: '1.6' }}>{review.review_text}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ backgroundColor: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '10px', padding: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#4b5563', margin: '0 0 12px 0' }}>No audience reviews yet. Be the first!</p>
              {!user && <a href="/auth" style={{ fontSize: '13px', color: '#1D9E75', textDecoration: 'underline' }}>Sign in to write a review</a>}
            </div>
          )}
        </div>

        <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid #1e1e2e', textAlign: 'center' }}>
          <a href={reportHref} style={{ fontSize: '12px', color: '#374151', textDecoration: 'none' }}>Report an issue with this page</a>
        </div>
      </div>



      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', overflowY: 'auto' }} onClick={() => setShowEditModal(false)}>
          <div style={{ backgroundColor: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '12px', padding: '28px', maxWidth: '560px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: '#f1f5f9', margin: 0 }}>Edit show</h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: '1px solid #2a2a3e', color: '#6b7280', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer' }}>Close</button>
            </div>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#4b5563', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px 0' }}>Show details</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              {[
                { label: 'Title', key: 'title' },
                { label: 'Company', key: 'company' },
                { label: 'Composer / Playwright', key: 'composer_or_playwright' },
              ].map((f: any) => (
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
                <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '3px' }}>Subtype</label>
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
              ].map((f: any) => (
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
        </div>
      )}
      {authPrompt && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setAuthPrompt(null)}>
          <div style={{ backgroundColor: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '12px', padding: '32px', maxWidth: '380px', width: '100%', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>
              {authPrompt === 'watchlist' ? '🔖' : authPrompt === 'seen' ? '👁' : '✍️'}
            </div>
            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: '#f1f5f9', margin: '0 0 10px 0' }}>
              {authPrompt === 'watchlist' ? 'Save to your watchlist' : authPrompt === 'seen' ? 'Mark as seen' : 'Write a review'}
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px 0', lineHeight: '1.6' }}>
              {authPrompt === 'watchlist' ? 'Sign in to save shows to your watchlist and get notified when reviews come in.' : authPrompt === 'seen' ? 'Sign in to track the shows you have seen.' : 'Sign in to share your experience with this show.'}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <a href="/auth" style={{ fontSize: '14px', fontWeight: '600', color: 'white', padding: '10px 24px', borderRadius: '7px', backgroundColor: '#1D9E75', textDecoration: 'none' }}>Sign in</a>
              <button onClick={() => setAuthPrompt(null)} style={{ fontSize: '14px', color: '#6b7280', padding: '10px 24px', borderRadius: '7px', border: '1px solid #2a2a3e', backgroundColor: 'transparent', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {showReviewForm && user && (
        <ReviewForm productionId={id} user={user} onClose={() => setShowReviewForm(false)} />
      )}

      <Footer />
    </div>
  )
}