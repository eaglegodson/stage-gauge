'use client'

import Header from '../components/Header'

export default function About() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#14141f' }}>
      <Header />

      <div style={{ borderBottom: '1px solid #1e1e2e', padding: '80px 24px 48px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(29,158,117,0.15)', border: '1px solid rgba(29,158,117,0.3)', borderRadius: '20px', padding: '6px 16px', fontSize: '12px', color: '#1D9E75', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '24px' }}>
            About StageGauge
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '42px', fontWeight: '600', color: '#f1f5f9', lineHeight: '1.2', margin: '0 0 20px 0', letterSpacing: '-0.5px' }}>
            You care about what you see. So do we.
          </h1>
          <p style={{ fontSize: '18px', color: '#9ca3af', lineHeight: '1.7', margin: 0 }}>
            StageGauge is a review aggregator for live performance — theatre, opera, ballet, musicals and dance.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px' }}>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 12px 0' }}>What StageGauge does</h2>
          <p style={{ fontSize: '15px', color: '#9ca3af', lineHeight: '1.8', margin: '0 0 12px 0' }}>
            Every night, StageGauge pulls reviews from leading arts publications across Australia, New Zealand and London. We extract the star rating, pull a representative quote, and attach the review to the right production in our database.
          </p>
          <p style={{ fontSize: '15px', color: '#9ca3af', lineHeight: '1.8', margin: 0 }}>
            The result is a single place where you can see how a show is tracking across all the critics — plus what real audience members think. No more hunting across a dozen websites to figure out if something is worth your time and money.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 12px 0' }}>How the score works</h2>
          <p style={{ fontSize: '15px', color: '#9ca3af', lineHeight: '1.8', margin: '0 0 12px 0' }}>
            The StageGauge score is a straight average of explicit star ratings — from critics and audience members combined. We only count ratings that are explicitly stated. We do not infer scores from sentiment or language.
          </p>
          <p style={{ fontSize: '15px', color: '#9ca3af', lineHeight: '1.8', margin: 0 }}>
            Critic reviews and audience reviews are displayed separately on each show page, so you can see how professional opinion stacks up against the room.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 12px 0' }}>Where we cover</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px', marginTop: '16px' }}>
            {[
              { city: 'Melbourne', flag: 'AU' },
              { city: 'Sydney', flag: 'AU' },
              { city: 'Brisbane', flag: 'AU' },
              { city: 'Perth', flag: 'AU' },
              { city: 'Adelaide', flag: 'AU' },
              { city: 'Canberra', flag: 'AU' },
              { city: 'Hobart', flag: 'AU' },
              { city: 'Auckland', flag: 'NZ' },
              { city: 'Wellington', flag: 'NZ' },
              { city: 'London', flag: 'GB' },
            ].map((c, i) => (
              <div key={i} style={{ background: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563' }}>{c.flag}</span>
                <span style={{ fontSize: '14px', color: '#f1f5f9', fontWeight: '500' }}>{c.city}</span>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 12px 0' }}>We are in beta</h2>
          <p style={{ fontSize: '15px', color: '#9ca3af', lineHeight: '1.8', margin: '0 0 12px 0' }}>
            StageGauge is new. The pipeline runs every night and the database grows daily — but there will be gaps, missing shows, and the occasional matching error. We are working on it.
          </p>
          <p style={{ fontSize: '15px', color: '#9ca3af', lineHeight: '1.8', margin: 0 }}>
            If you spot a show that is missing, a review that is wrong, or anything that does not look right — please let us know. Every piece of feedback makes the product better.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 12px 0' }}>Get in touch</h2>
          <p style={{ fontSize: '15px', color: '#9ca3af', lineHeight: '1.8', margin: '0 0 20px 0' }}>
            StageGauge is built and maintained by a small team in Melbourne. We would love to hear from you — whether it is feedback, a bug report, or just to say hello.
          </p>
          <a href="mailto:hello@stagegauge.com" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: 'white', padding: '12px 24px', borderRadius: '8px', backgroundColor: '#1D9E75', textDecoration: 'none' }}>
            hello@stagegauge.com
          </a>
        </section>

        <div style={{ background: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 10px 0' }}>Ready to explore?</h3>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 20px 0', lineHeight: '1.6' }}>Browse 485+ productions across 10 cities and see what the critics are saying.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/browse" style={{ fontSize: '14px', fontWeight: '600', color: 'white', padding: '10px 24px', borderRadius: '8px', backgroundColor: '#1D9E75', textDecoration: 'none' }}>Browse shows</a>
            <a href="/auth" style={{ fontSize: '14px', fontWeight: '500', color: '#9ca3af', padding: '10px 24px', borderRadius: '8px', border: '1px solid #2a2a3e', textDecoration: 'none' }}>Create account</a>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #1e1e2e', padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: '#4b5563', margin: 0 }}>2026 StageGauge</p>
      </div>
    </main>
  )
}