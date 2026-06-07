import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { Search, Filter, Upload, Copy, Grid3x3, List, X, Wand2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { platforms, categories } from '../data/sampleAds'
import styles from './AdsLibrary.module.css'

export default function AdsLibrary() {
  const { ads, addAd, setActiveCanvasAd } = useApp()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [platform, setPlatform] = useState('All')
  const [category, setCategory] = useState('All')
  const [view, setView] = useState('grid')
  const [showUpload, setShowUpload] = useState(false)

  const hasFilters = !!(query || platform !== 'All' || category !== 'All')

  const filtered = ads.filter(ad => {
    const q = query.toLowerCase()
    const matchQ = !q || ad.title?.toLowerCase().includes(q) || ad.brand?.toLowerCase().includes(q)
    const matchP = platform === 'All' || ad.platform === platform
    const matchC = category === 'All' || ad.category === category
    return matchQ && matchP && matchC
  })

  function openCanvas(ad) {
    setActiveCanvasAd(ad)
    navigate('/canvas')
  }

  return (
    <div className={styles.page}>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={`input ${styles.search}`}
            placeholder="Search by title or brand…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button className={styles.clearBtn} onClick={() => setQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className={styles.filters}>
          <Filter size={14} style={{ color: 'var(--text-muted)' }} />
          <select className={`input ${styles.select}`} value={platform} onChange={e => setPlatform(e.target.value)}>
            {platforms.map(p => <option key={p}>{p}</option>)}
          </select>
          <select className={`input ${styles.select}`} value={category} onChange={e => setCategory(e.target.value)}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className={styles.toolbarRight}>
          <div className={styles.viewToggle}>
            <button className={`${styles.viewBtn} ${view === 'grid' ? styles.viewActive : ''}`} onClick={() => setView('grid')}>
              <Grid3x3 size={15} />
            </button>
            <button className={`${styles.viewBtn} ${view === 'list' ? styles.viewActive : ''}`} onClick={() => setView('list')}>
              <List size={15} />
            </button>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowUpload(true)}>
            <Upload size={14} /> Upload Ad
          </button>
        </div>
      </div>

      {/* Results count */}
      <p className={styles.resultCount}>
        {filtered.length} ad{filtered.length !== 1 ? 's' : ''} found
        {(platform !== 'All' || category !== 'All' || query) && (
          <button className={styles.clearFilters} onClick={() => { setPlatform('All'); setCategory('All'); setQuery('') }}>
            Clear filters
          </button>
        )}
      </p>

      {/* Grid */}
      {view === 'grid' ? (
        <div className={styles.grid}>
          {filtered.map(ad => (
            <AdCard key={ad.id} ad={ad} onClone={() => openCanvas(ad)} />
          ))}
          {filtered.length === 0 && <EmptyState hasFilters={hasFilters} onNavigate={navigate} />}
        </div>
      ) : (
        <div className={styles.listView}>
          {filtered.map(ad => (
            <AdRow key={ad.id} ad={ad} onClone={() => openCanvas(ad)} />
          ))}
          {filtered.length === 0 && <EmptyState hasFilters={hasFilters} onNavigate={navigate} />}
        </div>
      )}

      {/* Upload modal */}
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onAdd={addAd} />}
    </div>
  )
}

/* ── Ad Card (Grid) ── */
function AdCard({ ad, onClone }) {
  return (
    <div className={styles.adCard}>
      <div className={styles.adThumbWrap}>
        <img src={ad.thumbnail} alt={ad.title} className={styles.adThumb} />
        <div className={styles.adOverlay}>
          <button className="btn btn-primary btn-sm" onClick={onClone}>
            <Copy size={13} /> Clone
          </button>
        </div>
        <span className={`badge badge-orange ${styles.platformBadge}`}>{ad.platform}</span>
      </div>
      <div className={styles.adBody}>
        <p className={styles.adTitle}>{ad.title}</p>
        <p className={styles.adMeta}>{ad.brand} · {ad.format}</p>
        <div className={styles.adFooter}>
          <span className={styles.adClones}>{ad.clones} clones</span>
          <span className="badge badge-gray">{ad.category}</span>
        </div>
      </div>
    </div>
  )
}

/* ── Ad Row (List) ── */
function AdRow({ ad, onClone }) {
  return (
    <div className={styles.adRow}>
      <img src={ad.thumbnail} alt={ad.title} className={styles.rowThumb} />
      <div className={styles.rowInfo}>
        <p className={styles.adTitle}>{ad.title}</p>
        <p className={styles.adMeta}>{ad.brand}</p>
      </div>
      <span className={`badge badge-orange`}>{ad.platform}</span>
      <span className={`badge badge-gray`}>{ad.category}</span>
      <span className={styles.adMeta}>{ad.format}</span>
      <span className={styles.adClones}>{ad.clones} clones</span>
      <button className="btn btn-primary btn-sm" onClick={onClone}>
        <Copy size={13} /> Clone
      </button>
    </div>
  )
}

/* ── Empty State ── */
function EmptyState({ hasFilters, onNavigate }) {
  if (hasFilters) {
    return (
      <div className={styles.empty}>
        <Search size={36} style={{ color: 'var(--gray-300)' }} />
        <p>No ads match your filters</p>
      </div>
    )
  }
  return (
    <div className={styles.empty}>
      <Wand2 size={36} style={{ color: 'var(--gray-300)' }} />
      <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Your library is empty</p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 260, textAlign: 'center', lineHeight: 1.5 }}>
        Generate ads with AI Studio or upload your own creatives
      </p>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-primary btn-sm" onClick={() => onNavigate('/studio')}>
          <Wand2 size={13} /> AI Studio
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => onNavigate('/library#upload')}>
          <Upload size={13} /> Upload
        </button>
      </div>
    </div>
  )
}

/* ── Upload Modal ── */
function UploadModal({ onClose, onAdd }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [form, setForm] = useState({ title: '', brand: '', platform: 'Facebook', category: 'E-commerce' })

  const onDrop = useCallback(files => {
    const f = files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1,
  })

  function handleAdd() {
    if (!form.title || !preview) return
    onAdd({ ...form, thumbnail: preview, tags: [] })
    onClose()
  }

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`card ${styles.modal}`}>
        <div className={styles.modalHeader}>
          <h2>Upload New Ad</h2>
          <button className={styles.modalClose} onClick={onClose}><X size={18} /></button>
        </div>

        <div {...getRootProps()} className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ''}`}>
          <input {...getInputProps()} />
          {preview ? (
            <img src={preview} alt="preview" className={styles.dropPreview} />
          ) : (
            <>
              <Upload size={28} style={{ color: 'var(--text-muted)' }} />
              <p>Drop an image here, or <span className={styles.browseLink}>browse</span></p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>PNG, JPG, WEBP up to 10MB</p>
            </>
          )}
        </div>

        <div className={styles.modalFields}>
          <div><label className="label">Ad Title *</label><input className="input" placeholder="Summer Sale Banner" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
          <div><label className="label">Brand</label><input className="input" placeholder="Brand name" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} /></div>
          <div>
            <label className="label">Platform</label>
            <select className="input" value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}>
              {platforms.slice(1).map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {categories.slice(1).map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAdd} disabled={!form.title || !preview}>
            Add to Library
          </button>
        </div>
      </div>
    </div>
  )
}
