import { useState } from 'react'
import { CheckCircle2, Dna, Palette, Users, MessageSquare, Target, Globe, Loader2, Sparkles } from 'lucide-react'
import { useApp } from '../context/AppContext'
import styles from './BusinessDNA.module.css'

async function extractBrandFromUrl(url) {
  // 1 — Fetch site HTML via CORS proxy
  let siteText = ''
  try {
    const proxyRes = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`)
    const proxyData = await proxyRes.json()
    // Strip HTML tags, collapse whitespace, cap at 6000 chars for the prompt
    siteText = (proxyData.contents || '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 6000)
  } catch {
    siteText = `Website URL: ${url}`
  }

  // 2 — Ask DeepSeek to extract brand info as JSON
  const key = import.meta.env.VITE_DEEPSEEK_API_KEY
  const system = `You are a brand analyst. Extract brand information from website content and return ONLY a JSON object — no markdown, no explanation, just raw JSON.

Return exactly this shape:
{
  "brandName": string,
  "tagline": string or "",
  "industry": one of ["E-commerce","SaaS / Tech","Fashion & Apparel","Food & Beverage","Health & Wellness","Finance","Automotive","Real Estate","Education","Entertainment","Travel","Other"],
  "toneOfVoice": one of ["professional","friendly","bold","playful","inspirational","minimalist"],
  "targetAudience": string (1-2 sentences),
  "usp": string (1-2 sentences),
  "keywords": string (comma-separated, 4-6 words),
  "primaryColor": hex color string that best represents the brand (e.g. "#3b82f6")
}`

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Website: ${url}\n\nContent:\n${siteText}` },
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
  })
  if (!res.ok) throw new Error(`DeepSeek ${res.status}`)
  const data = await res.json()
  const raw = data.choices[0].message.content.trim()
  // Parse — handle if model wraps in ```json
  const jsonStr = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/, '').trim()
  return JSON.parse(jsonStr)
}

const industries = [
  'E-commerce', 'SaaS / Tech', 'Fashion & Apparel', 'Food & Beverage',
  'Health & Wellness', 'Finance', 'Automotive', 'Real Estate',
  'Education', 'Entertainment', 'Travel', 'Other',
]

const tones = [
  { value: 'professional', label: 'Professional', desc: 'Formal, authoritative' },
  { value: 'friendly',     label: 'Friendly',     desc: 'Warm, approachable' },
  { value: 'bold',         label: 'Bold',         desc: 'Confident, direct' },
  { value: 'playful',      label: 'Playful',       desc: 'Fun, energetic' },
  { value: 'inspirational',label: 'Inspirational', desc: 'Motivating, uplifting' },
  { value: 'minimalist',   label: 'Minimalist',   desc: 'Clean, simple' },
]

const fonts = ['Inter', 'Roboto', 'Playfair Display', 'Montserrat', 'Poppins', 'DM Sans', 'Space Grotesk']

export default function BusinessDNA() {
  const { dna, saveDNA, dnaComplete } = useApp()
  const [form, setForm] = useState(dna)
  const [saved, setSaved] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState('')

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    saveDNA(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleExtract() {
    const url = urlInput.trim()
    if (!url) return
    setExtracting(true)
    setExtractError('')
    try {
      const brand = await extractBrandFromUrl(url.startsWith('http') ? url : `https://${url}`)
      setForm(f => ({
        ...f,
        brandName:      brand.brandName      || f.brandName,
        tagline:        brand.tagline        || f.tagline,
        industry:       brand.industry       || f.industry,
        toneOfVoice:    brand.toneOfVoice    || f.toneOfVoice,
        targetAudience: brand.targetAudience || f.targetAudience,
        usp:            brand.usp            || f.usp,
        keywords:       brand.keywords       || f.keywords,
        primaryColor:   brand.primaryColor   || f.primaryColor,
        website:        url,
      }))
    } catch (err) {
      setExtractError(`Could not extract brand info: ${err.message}`)
    } finally {
      setExtracting(false)
    }
  }

  const completedFields = [
    form.brandName, form.industry, form.toneOfVoice,
    form.targetAudience, form.usp, form.primaryColor,
  ].filter(Boolean).length

  const progress = Math.round((completedFields / 6) * 100)

  return (
    <div className={styles.page}>

      {/* Left: form */}
      <form className={styles.formCol} onSubmit={handleSubmit}>

        {/* ── URL Extractor ── */}
        <div className={`card ${styles.section} ${styles.extractSection}`}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon} style={{ background: '#f0fdf4', color: '#22c55e' }}>
              <Globe size={18} />
            </div>
            <div>
              <h2 className={styles.sectionTitle}>Import from Website</h2>
              <p className={styles.sectionSub}>Paste your website URL and AI will fill in your brand details</p>
            </div>
          </div>

          <div className={styles.urlRow}>
            <div className={styles.urlInputWrap}>
              <Globe size={14} className={styles.urlIcon} />
              <input
                className={`input ${styles.urlInput}`}
                placeholder="yourwebsite.com"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleExtract()}
              />
            </div>
            <button
              type="button"
              className={`btn btn-primary ${styles.extractBtn}`}
              onClick={handleExtract}
              disabled={!urlInput.trim() || extracting}
            >
              {extracting
                ? <><Loader2 size={14} className={styles.spin} /> Extracting…</>
                : <><Sparkles size={14} /> Extract Brand Info</>}
            </button>
          </div>

          {extractError && <p className={styles.extractError}>{extractError}</p>}
          {extracting && (
            <div className={styles.extractProgress}>
              <div className={styles.extractProgressBar} />
            </div>
          )}
        </div>

        {/* Section: Brand Info */}
        <div className={`card ${styles.section}`}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon} style={{ background: '#eff6ff', color: '#3b82f6' }}>
              <Dna size={18} />
            </div>
            <div>
              <h2 className={styles.sectionTitle}>Brand Identity</h2>
              <p className={styles.sectionSub}>Core information about your brand</p>
            </div>
          </div>

          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label className="label">Brand Name *</label>
              <input className="input" placeholder="e.g. Acme Inc." value={form.brandName} onChange={e => set('brandName', e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className="label">Website</label>
              <input className="input" placeholder="https://yoursite.com" value={form.website} onChange={e => set('website', e.target.value)} />
            </div>
          </div>

          <div className={styles.field}>
            <label className="label">Tagline / Slogan</label>
            <input className="input" placeholder="e.g. Just Do It" value={form.tagline} onChange={e => set('tagline', e.target.value)} />
          </div>

          <div className={styles.field}>
            <label className="label">Industry *</label>
            <div className={styles.pillGrid}>
              {industries.map(ind => (
                <button
                  key={ind} type="button"
                  className={`${styles.pill} ${form.industry === ind ? styles.pillActive : ''}`}
                  onClick={() => set('industry', ind)}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section: Visual Identity */}
        <div className={`card ${styles.section}`}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon} style={{ background: '#fff7ed', color: '#f97316' }}>
              <Palette size={18} />
            </div>
            <div>
              <h2 className={styles.sectionTitle}>Visual Identity</h2>
              <p className={styles.sectionSub}>Colors and typography</p>
            </div>
          </div>

          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label className="label">Primary Color</label>
              <div className={styles.colorRow}>
                <input type="color" className={styles.colorPicker} value={form.primaryColor} onChange={e => set('primaryColor', e.target.value)} />
                <input className="input" value={form.primaryColor} onChange={e => set('primaryColor', e.target.value)} style={{ flex: 1 }} />
              </div>
            </div>
            <div className={styles.field}>
              <label className="label">Secondary Color</label>
              <div className={styles.colorRow}>
                <input type="color" className={styles.colorPicker} value={form.secondaryColor} onChange={e => set('secondaryColor', e.target.value)} />
                <input className="input" value={form.secondaryColor} onChange={e => set('secondaryColor', e.target.value)} style={{ flex: 1 }} />
              </div>
            </div>
          </div>

          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label className="label">Heading Font</label>
              <select className="input" value={form.fontHeading} onChange={e => set('fontHeading', e.target.value)}>
                {fonts.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className="label">Body Font</label>
              <select className="input" value={form.fontBody} onChange={e => set('fontBody', e.target.value)}>
                {fonts.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Section: Tone */}
        <div className={`card ${styles.section}`}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon} style={{ background: '#f0fdf4', color: '#22c55e' }}>
              <MessageSquare size={18} />
            </div>
            <div>
              <h2 className={styles.sectionTitle}>Tone of Voice *</h2>
              <p className={styles.sectionSub}>How your brand communicates</p>
            </div>
          </div>
          <div className={styles.toneGrid}>
            {tones.map(t => (
              <button
                key={t.value} type="button"
                className={`${styles.toneCard} ${form.toneOfVoice === t.value ? styles.toneActive : ''}`}
                onClick={() => set('toneOfVoice', t.value)}
              >
                <p className={styles.toneLabel}>{t.label}</p>
                <p className={styles.toneDesc}>{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Section: Audience */}
        <div className={`card ${styles.section}`}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon} style={{ background: '#faf5ff', color: '#a855f7' }}>
              <Users size={18} />
            </div>
            <div>
              <h2 className={styles.sectionTitle}>Target Audience & Positioning</h2>
              <p className={styles.sectionSub}>Who you're selling to</p>
            </div>
          </div>

          <div className={styles.field}>
            <label className="label">Target Audience *</label>
            <textarea
              className="input" rows={2}
              placeholder="e.g. Millennial women 25-35 interested in sustainable fashion"
              value={form.targetAudience}
              onChange={e => set('targetAudience', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className="label">Unique Selling Proposition *</label>
            <textarea
              className="input" rows={2}
              placeholder="e.g. Premium quality at affordable prices with 30-day returns"
              value={form.usp}
              onChange={e => set('usp', e.target.value)}
            />
          </div>
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label className="label">Brand Keywords</label>
              <input className="input" placeholder="innovative, bold, clean, fast…" value={form.keywords} onChange={e => set('keywords', e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className="label">Top Competitors</label>
              <input className="input" placeholder="Brand A, Brand B…" value={form.competitors} onChange={e => set('competitors', e.target.value)} />
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" style={{ alignSelf: 'flex-start' }}>
          {saved ? <><CheckCircle2 size={17} /> Saved!</> : 'Save Business DNA'}
        </button>
      </form>

      {/* Right: preview */}
      <div className={styles.previewCol}>
        {/* Progress */}
        <div className={`card ${styles.progressCard}`}>
          <div className={styles.progressHeader}>
            <Target size={16} style={{ color: 'var(--orange-500)' }} />
            <h3>Profile Strength</h3>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <p className={styles.progressPct}>{progress}% complete</p>
          <ul className={styles.progressChecks}>
            {[
              ['Brand name', form.brandName],
              ['Industry', form.industry],
              ['Tone of voice', form.toneOfVoice],
              ['Target audience', form.targetAudience],
              ['USP', form.usp],
              ['Brand color', form.primaryColor !== '#F97316' || form.primaryColor],
            ].map(([label, done]) => (
              <li key={label} className={`${styles.progressCheck} ${done ? styles.progressCheckDone : ''}`}>
                <CheckCircle2 size={14} />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Live preview card */}
        <div className={`card ${styles.brandPreview}`}>
          <p className={styles.previewLabel}>Brand Preview</p>
          <div className={styles.previewBanner} style={{ background: form.primaryColor }}>
            <p className={styles.previewBrandName} style={{ fontFamily: form.fontHeading }}>
              {form.brandName || 'Your Brand'}
            </p>
            {form.tagline && <p className={styles.previewTagline}>{form.tagline}</p>}
          </div>
          <div className={styles.previewBody}>
            {form.industry && <span className="badge badge-orange">{form.industry}</span>}
            {form.toneOfVoice && <span className="badge badge-gray" style={{ marginLeft: 6 }}>{form.toneOfVoice}</span>}
            {form.usp && <p className={styles.previewUsp}>{form.usp}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
