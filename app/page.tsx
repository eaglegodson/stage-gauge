'use client'

import Header from './components/Header'

const tiles = [
  {
    icon: '🗺️',
    title: "Discover what's on near you",
    desc: 'Browse current and upcoming productions in your city and beyond.',
    href: '/browse',
    gradient: 'linear-gradient(160deg, #0f2744 0%, #1a6bb5 100%)',
    accent: '#4A90D9',
  },
  {
    icon: '📰',
    title: 'Read critic and audience reviews',
    desc: 'Aggregated reviews from leading outlets alongside real audience voices.',
    href: '/browse',
    gradient: 'linear-gradient(160deg, #2d0f4a 0%, #8b2fc9 100%)',
    accent: '#C084FC',
  },
  {
    icon: '⭐',
    title: "Rate and review shows you've seen",
    desc: 'Share your take and contribute to the Stage Gauge score.',
    href: '/auth',
    gradient: 'linear-gradient(160deg, #0f2d1a 0%, #0f8f5a 100%)',
    accent: '#34D399',
  },
  {
    icon: '🔖',
    title: 'Save shows to your watchlist',
    desc: 'Keep track of shows you want to see and never miss an opening.',
    href: '/auth',
    gradient: 'linear-gradient(160deg, #2d230f 0%, #b57d10 100%)',
    accent: '#FBBF24',
  },
]

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#14141f' }}>
      <Header />

      {/* Hero */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 24px 60px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '20px', padding: '6px 16px', fontSize: '12px', color: '#1D9E75', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '24px' }}>
          Now in Beta
        </div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '52px', fontWeight: '600', color: '#f1f5f9', lineHeight: '1.15', margin: '0 0 20px 0', letterSpacing: '-1px' }}>
          The home for live<br />performance reviews
        </h1>
        <p style={{ fontSize: '18px', color: '#6b7280', margin: '0 0 40px 0', lineHeight: '1.6', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto' }}>
          Stage Gauge aggregates critic and audience reviews for theatre, opera, ballet, musicals and dance — across Australia, New Zealand and London.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/browse" style={{ fontSize: '15px', fontWeight: '600', color: 'white', padding: '12px 28px', borderRadius: '8px', backgroundColor: '#1D9E75', textDecoration: 'none' }}>
            Browse shows
          </a>
          <a href="/auth" style={{ fontSize: '15px', fontWeight: '500', color: '#9ca3af', padding: '12px 28px', borderRadius: '8px', border: '1px solid #2a2a3e', textDecoration: 'none', backgroundColor: '#1e1e2e' }}>
            Create account
          </a>
        </div>
      </div>

      {/* Tiles */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {tiles.map((tile, i) => (
            <a key={i} href={tile.href} style={{ textDecoration: 'none', display: 'block' }}>
              <div
                style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #2a2a3e', transition: 'transform 0.15s, border-color 0.15s', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.borderColor = tile.accent + '66' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.borderColor = '#2a2a3e' }}
              >
                <div style={{ background: tile.gradient, height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                  {tile.icon}
                </div>
                <div style={{ background: '#1e1e2e', padding: '16px' }}>
                  <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '14px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 6px 0', lineHeight: '1.3' }}>{tile.title}</h3>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, lineHeight: '1.5' }}>{tile.desc}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ borderTop: '1px solid #1e1e2e', padding: '32px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap' }}>
          {[
            { number: '380+', label: 'Productions' },
            { number: '10+', label: 'Cities' },
            { number: '150+', label: 'Reviews' },
            { number: '16', label: 'Outlets' },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: '600', color: '#1D9E75' }}>{stat.number}</div>
              <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
