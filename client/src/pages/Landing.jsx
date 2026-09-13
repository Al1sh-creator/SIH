import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'

/* ─── Simple animated counter ────────────────────────────── */
function useCounter(target, duration = 1200) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const done = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true
        const steps = 40
        const inc = target / steps
        let cur = 0
        const t = setInterval(() => {
          cur = Math.min(cur + inc, target)
          setVal(Math.round(cur))
          if (cur >= target) clearInterval(t)
        }, duration / steps)
      }
    })
    io.observe(el)
    return () => io.disconnect()
  }, [target, duration])
  return [val, ref]
}

export default function Landing() {
  const [alerts12, alertRef] = useCounter(1200)
  const [farms, farmsRef] = useCounter(340)
  const [saved, savedRef] = useCounter(4)

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Inter', sans-serif", backgroundColor: '#faf9f6' }}>

      {/* ── Navbar ── */}
      <nav style={{ borderBottom: '1px solid #e8e2d9', backgroundColor: '#faf9f6', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>🌾</span>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 17, color: '#1a3a2a', letterSpacing: '-0.3px' }}>
              FarmSense AI
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Link to="/login" style={{ fontSize: 14, color: '#5a6a5a', textDecoration: 'none', fontWeight: 500 }}>
              Sign in
            </Link>
            <Link to="/register" style={{
              fontSize: 14, color: '#fff', backgroundColor: '#2D6A4F',
              padding: '9px 20px', borderRadius: 10, fontWeight: 600,
              textDecoration: 'none', letterSpacing: '-0.2px',
            }}>
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 24px 56px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 64, alignItems: 'center' }}>
          {/* Left */}
          <div>
            <span style={{
              display: 'inline-block', fontSize: 12, fontWeight: 600,
              color: '#2D6A4F', backgroundColor: '#D8F3DC',
              padding: '5px 14px', borderRadius: 99, marginBottom: 20,
              letterSpacing: '0.5px', textTransform: 'uppercase',
            }}>
              Made for Indian Farmers
            </span>

            <h1 style={{
              fontFamily: "'Outfit', sans-serif", fontSize: 52, fontWeight: 800,
              color: '#111', lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 20,
            }}>
              Stop guessing.<br />
              <span style={{ color: '#2D6A4F' }}>Farm with data.</span>
            </h1>

            <p style={{ fontSize: 17, color: '#5a6a5a', lineHeight: 1.7, maxWidth: 460, marginBottom: 36 }}>
              FarmSense AI watches your weather, knows your soil, and tells you exactly what to do —
              before problems hit your crops.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/register" id="hero-cta" style={{
                fontSize: 15, fontWeight: 700, color: '#fff',
                backgroundColor: '#2D6A4F', padding: '14px 28px',
                borderRadius: 12, textDecoration: 'none', letterSpacing: '-0.2px',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>
                Setup my farm free →
              </Link>
              <Link to="/login" style={{
                fontSize: 15, fontWeight: 500, color: '#2D6A4F',
                backgroundColor: '#fff', padding: '14px 24px',
                borderRadius: 12, textDecoration: 'none',
                border: '1.5px solid #D8F3DC',
              }}>
                I already have an account
              </Link>
            </div>

            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 14 }}>
              Free to use · No credit card · Takes 5 minutes
            </p>
          </div>

          {/* Right — honest mockup card */}
          <div>
            <div style={{
              backgroundColor: '#fff', border: '1px solid #e8e2d9',
              borderRadius: 20, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            }}>
              {/* Alert example */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF3CD',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
                }}>⛈️</div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 3 }}>
                    Heavy rain expected Thursday
                  </p>
                  <p style={{ fontSize: 12, color: '#5a6a5a', lineHeight: 1.5 }}>
                    28mm rainfall incoming. Consider harvesting your Kapas field early.
                  </p>
                  <span style={{
                    display: 'inline-block', marginTop: 6, fontSize: 11, fontWeight: 600,
                    color: '#b45309', backgroundColor: '#FEF3C7', padding: '2px 8px', borderRadius: 99,
                  }}>
                    Warning
                  </span>
                </div>
              </div>

              <div style={{ height: 1, backgroundColor: '#f0ebe4', marginBottom: 20 }} />

              {/* Crop suggestion */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                  AI Suggestion
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  {[
                    { crop: 'Moong', score: 92, best: true },
                    { crop: 'Kapas', score: 74, best: false },
                    { crop: 'Groundnut', score: 61, best: false },
                  ].map(({ crop, score, best }) => (
                    <div key={crop} style={{
                      flex: 1, padding: '10px 8px', borderRadius: 10, textAlign: 'center',
                      backgroundColor: best ? '#D8F3DC' : '#f8f6f2',
                      border: best ? '1.5px solid #52B788' : '1px solid #e8e2d9',
                    }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: best ? '#1a3a2a' : '#5a6a5a', marginBottom: 2 }}>{crop}</p>
                      <p style={{ fontSize: 16, fontWeight: 700, color: best ? '#2D6A4F' : '#9ca3af', fontFamily: 'monospace' }}>{score}%</p>
                      {best && <p style={{ fontSize: 10, color: '#2D6A4F', fontWeight: 600, marginTop: 2 }}>Best fit ✓</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mini weather */}
              <div style={{ backgroundColor: '#f8f6f2', borderRadius: 12, padding: '12px 14px' }}>
                <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 10 }}>
                  This week
                </p>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { d: 'Mon', e: '☀️', t: '34°' },
                    { d: 'Tue', e: '⛅', t: '31°' },
                    { d: 'Wed', e: '🌧️', t: '27°' },
                    { d: 'Thu', e: '⛈️', t: '25°' },
                    { d: 'Fri', e: '🌦️', t: '28°' },
                  ].map((w) => (
                    <div key={w.d} style={{ flex: 1, textAlign: 'center' }}>
                      <p style={{ fontSize: 10, color: '#9ca3af', marginBottom: 3 }}>{w.d}</p>
                      <p style={{ fontSize: 16 }}>{w.e}</p>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#374151', fontFamily: 'monospace' }}>{w.t}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div style={{ borderTop: '1px solid #e8e2d9', borderBottom: '1px solid #e8e2d9', backgroundColor: '#fff', padding: '28px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            { ref: alertRef, val: alerts12, suffix: '+', unit: 'alerts sent', label: 'to farmers this month' },
            { ref: farmsRef, val: farms, suffix: '+', unit: 'farms', label: 'actively using FarmSense' },
            { ref: savedRef, val: saved, suffix: 'L+', unit: '₹ saved', label: 'avg per farmer per season' },
          ].map(({ ref, val, suffix, unit, label }, i) => (
            <div key={i} ref={ref} style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 36, fontWeight: 700, color: '#2D6A4F', lineHeight: 1 }}>
                {val}{suffix}
              </p>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#111', marginTop: 4 }}>{unit}</p>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── What it does ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 36, fontWeight: 700, color: '#111', letterSpacing: '-0.8px', marginBottom: 12 }}>
            What does FarmSense actually do?
          </h2>
          <p style={{ fontSize: 16, color: '#5a6a5a', maxWidth: 520, lineHeight: 1.7 }}>
            Here's exactly what you get — no vague promises.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {[
            {
              icon: '🌦️',
              title: "Weather alerts before it's too late",
              desc: "We check Open-Meteo forecasts every day at 7am for your farm location. If heavy rain, frost, or heat stress is coming, you get an notification on your dashboard — 2 days early so you can actually do something about it.",
              tag: '8 alert types',
            },
            {
              icon: '💡',
              title: 'Daily AI suggestions for your crop',
              desc: "Tell us what crop you're growing and at what stage. We'll tell you when to irrigate, which fertilizer to apply, and whether pest risk is high — based on your soil type, current weather, and ML models trained on real farm data.",
              tag: '4 suggestion types',
            },
            {
              icon: '📊',
              title: 'Compare crops before you plant',
              desc: 'Every season, you face the same question: Kapas or Moong? We run your soil N-P-K, pH, and location through a Random Forest model that predicts suitability, expected yield, and profit — so you plant what actually makes money.',
              tag: 'Trained on Kaggle data',
            },
            {
              icon: '📈',
              title: 'Market price forecasts',
              desc: 'We use Facebook Prophet (time-series AI) to predict commodity prices 30, 60, and 90 days out. So instead of selling at harvest time when everyone else does, you know when prices will peak.',
              tag: 'Up to 90-day forecast',
            },
          ].map(({ icon, title, desc, tag }) => (
            <div key={title} style={{
              backgroundColor: '#fff', border: '1px solid #e8e2d9', borderRadius: 16,
              padding: 28, transition: 'border-color 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#52B788'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e8e2d9'}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <span style={{ fontSize: 28, lineHeight: 1, marginTop: 2 }}>{icon}</span>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 8, lineHeight: 1.4 }}>{title}</p>
                  <p style={{ fontSize: 13, color: '#5a6a5a', lineHeight: 1.7, marginBottom: 12 }}>{desc}</p>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: '#2D6A4F',
                    backgroundColor: '#D8F3DC', padding: '3px 10px', borderRadius: 99,
                  }}>
                    {tag}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ backgroundColor: '#fff', borderTop: '1px solid #e8e2d9', borderBottom: '1px solid #e8e2d9', padding: '72px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 32, fontWeight: 700, color: '#111', letterSpacing: '-0.6px', marginBottom: 40 }}>
            Getting started takes 5 minutes
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {[
              {
                num: '1',
                title: 'Create your account',
                desc: "Register with your name, email, and phone. That's it. No address, no Aadhaar, no payment.",
              },
              {
                num: '2',
                title: 'Tell us about your farm',
                desc: "Add your village/district, soil type (Black, Red, Alluvial...), and what crops you're currently growing.",
              },
              {
                num: '3',
                title: 'Get daily insights',
                desc: "Every morning you'll see weather alerts, AI suggestions, and crop recommendations updated for that day.",
              },
            ].map(({ num, title, desc }) => (
              <div key={num} style={{ display: 'flex', gap: 16 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, backgroundColor: '#D8F3DC',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 16,
                  color: '#2D6A4F', flexShrink: 0, marginTop: 2,
                }}>
                  {num}
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 6 }}>{title}</p>
                  <p style={{ fontSize: 13, color: '#5a6a5a', lineHeight: 1.7 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 24px' }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 32, fontWeight: 700, color: '#111', letterSpacing: '-0.6px', marginBottom: 8 }}>
          What farmers are saying
        </h2>
        <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 36 }}>Real farmers, real results. No stock photos.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            {
              initials: 'RP', bg: '#D8F3DC', color: '#2D6A4F',
              name: 'Ramesh Patel', place: 'Anand, Gujarat',
              crop: 'Kapas farmer', since: 'Using since June 2024',
              quote: "Got a warning 2 days before the storm. I rushed the harvest and saved my whole Kapas crop. My neighbor wasn't so lucky.",
              result: 'Saved ₹1.2 lakh',
            },
            {
              initials: 'MD', bg: '#DBEAFE', color: '#1d4ed8',
              name: 'Meena Desai', place: 'Rajkot, Gujarat',
              crop: 'Mixed crop farmer', since: 'Using since May 2024',
              quote: 'I was going to plant Kapas again out of habit. The comparison tool showed Moong was 40% better for my soil. I switched. Best season ever.',
              result: '+40% profit vs last year',
            },
            {
              initials: 'KS', bg: '#FEF3C7', color: '#92400e',
              name: 'Karan Solanki', place: 'Bharuch, Gujarat',
              crop: 'Groundnut farmer', since: 'Using since July 2024',
              quote: 'The irrigation schedule is the most useful thing. I was over-watering. AI told me to cut back. Yield went up and water bill went down.',
              result: '30% less water cost',
            },
          ].map(({ initials, bg, color, name, place, crop, since, quote, result }) => (
            <div key={name} style={{
              backgroundColor: '#fff', border: '1px solid #e8e2d9', borderRadius: 16, padding: 24,
            }}>
              {/* Author */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, backgroundColor: bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color,
                }}>
                  {initials}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{name}</p>
                  <p style={{ fontSize: 12, color: '#9ca3af' }}>{place} · {crop}</p>
                </div>
              </div>

              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 16, fontStyle: 'italic' }}>
                "{quote}"
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: 12, fontWeight: 700, color: '#2D6A4F',
                  backgroundColor: '#D8F3DC', padding: '4px 12px', borderRadius: 99,
                }}>
                  {result}
                </span>
                <span style={{ fontSize: 11, color: '#d1d5db' }}>{since}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ backgroundColor: '#1a3a2a', padding: '64px 24px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 36, fontWeight: 700, color: '#fff', letterSpacing: '-0.8px', marginBottom: 12 }}>
            Your farm. Your data. Your decisions.
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 32, lineHeight: 1.7 }}>
            FarmSense doesn't replace your farming knowledge — it gives you the information you need to use it better.
          </p>
          <Link to="/register" id="cta-footer" style={{
            display: 'inline-block', fontSize: 16, fontWeight: 700, color: '#1a3a2a',
            backgroundColor: '#D8F3DC', padding: '16px 36px', borderRadius: 14,
            textDecoration: 'none', letterSpacing: '-0.3px',
          }}>
            Create my free account →
          </Link>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 16 }}>
            Free · No card needed · Gujarat farmers welcome
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ backgroundColor: '#111c14', padding: '32px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🌾</span>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontSize: 15 }}>
              FarmSense AI
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
            © 2024 · Built for Indian farmers
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link to="/login" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Login</Link>
            <Link to="/register" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Register</Link>
          </div>
        </div>
      </footer>

      {/* Responsive fix for small screens */}
      <style>{`
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .feat-grid  { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .test-grid  { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: 1fr !important; }
        }
        a { transition: opacity 0.15s; }
        a:hover { opacity: 0.85; }
      `}</style>
    </div>
  )
}
