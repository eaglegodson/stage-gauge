export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid #1e1e2e',
      padding: '24px',
      textAlign: 'center',
      marginTop: 'auto'
    }}>
      <p style={{ fontSize: '13px', color: '#4b5563', margin: 0 }}>
        2026 StageGauge
        <span style={{ margin: '0 10px', color: '#2a2a3e' }}>·</span>
        <a href="/about" style={{ color: '#4b5563', textDecoration: 'none' }}>About</a>
        <span style={{ margin: '0 10px', color: '#2a2a3e' }}>·</span>
        <a href="mailto:hello@stage-gauge.com" style={{ color: '#4b5563', textDecoration: 'none' }}>Feedback</a>
        <span style={{ margin: '0 10px', color: '#2a2a3e' }}>·</span>
        <a href="/admin" style={{ color: '#2a2a3e', textDecoration: 'none' }}>Mod</a>
      </p>
    </footer>
  )
}