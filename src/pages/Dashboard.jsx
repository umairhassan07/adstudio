import { useNavigate } from 'react-router-dom'
import { Images, Copy, TrendingUp, Dna, ArrowRight, Zap, Star, Wand2, Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const { ads, dna, dnaComplete, setActiveCanvasAd } = useApp()
  const navigate = useNavigate()

  const totalClones   = ads.reduce((s, a) => s + (a.clones || 0), 0)
  const platformCount = new Set(ads.map(a => a.platform).filter(Boolean)).size

  const stats = [
    { label: 'Total Ads',    value: ads.length,                       icon: Images,    color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Total Clones', value: totalClones,                      icon: Copy,      color: '#f97316', bg: '#fff7ed' },
    { label: 'Platforms',    value: platformCount || 0,               icon: TrendingUp, color: '#22c55e', bg: '#f0fdf4' },
    { label: 'Brand DNA',    value: dnaComplete ? 'Active' : 'Setup', icon: Dna,       color: '#a855f7', bg: '#faf5ff' },
  ]

  function openCanvas(ad) {
    setActiveCanvasAd(ad)
    navigate('/canvas')
  }

  const hasAds = ads.length > 0

  return (
    <div className={styles.page}>

      {/* DNA setup banner */}
      {!dnaComplete && (
        <div className={styles.setupBanner} onClick={() => navigate('/dna')}>
          <div className={styles.setupBannerLeft}>
            <Zap size={20} />
            <div>
              <p className={styles.setupBannerTitle}>Set up your Business DNA</p>
              <p className={styles.setupBannerSub}>Add your brand details to unlock AI-powered ad generation</p>
            </div>
          </div>
          <button className="btn btn-primary btn-sm">
            Get Started <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className={styles.statsGrid}>
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`card ${styles.statCard}`}>
            <div className={styles.statIcon} style={{ background: bg, color }}>
              <Icon size={20} />
            </div>
            <div>
              <p className={styles.statValue}>{value}</p>
              <p className={styles.statLabel}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two-column */}
      <div className={styles.twoCol}>

        {/* Recent Ads */}
        <div className={`card ${styles.recentCard}`}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Recent Ads</h2>
            {hasAds && (
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/library')}>
                View all <ArrowRight size={13} />
              </button>
            )}
          </div>

          {hasAds ? (
            <div className={styles.recentList}>
              {ads.slice(0, 4).map(ad => (
                <div key={ad.id} className={styles.recentItem}>
                  <img src={ad.thumbnail} alt={ad.title} className={styles.recentThumb} />
                  <div className={styles.recentInfo}>
                    <p className={styles.recentTitle}>{ad.title}</p>
                    <p className={styles.recentMeta}>{ad.brand} · {ad.platform}</p>
                  </div>
                  <div className={styles.recentRight}>
                    <span className={styles.recentClones}>{ad.clones || 0} clones</span>
                    <button className="btn btn-outline btn-sm" onClick={() => openCanvas(ad)}>
                      Clone
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyAds}>
              <Wand2 size={32} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>No ads yet</p>
              <p className={styles.emptySub}>Generate your first ad with AI Studio or upload one to the library</p>
              <div className={styles.emptyActions}>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/studio')}>
                  <Wand2 size={14} /> AI Studio
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => navigate('/library')}>
                  <Plus size={14} /> Upload Ad
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions + Top Cloned */}
        <div className={styles.rightCol}>
          <div className={`card ${styles.quickCard}`}>
            <h2 className={styles.cardTitle} style={{ marginBottom: 14 }}>Quick Actions</h2>
            <div className={styles.quickGrid}>
              {[
                { label: 'AI Studio',  icon: Wand2,      onClick: () => navigate('/studio'),  primary: true },
                { label: 'Add Ad',     icon: Plus,       onClick: () => navigate('/library') },
                { label: 'Edit DNA',   icon: Dna,        onClick: () => navigate('/dna') },
                { label: 'Library',    icon: Images,     onClick: () => navigate('/library') },
              ].map(({ label, icon: Icon, onClick, primary }) => (
                <button
                  key={label}
                  className={`${styles.quickBtn} ${primary ? styles.quickBtnPrimary : ''}`}
                  onClick={onClick}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={`card ${styles.topCard}`}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Top Cloned</h2>
              <Star size={16} style={{ color: 'var(--orange-500)' }} />
            </div>
            {hasAds ? (
              <div className={styles.topList}>
                {[...ads].sort((a, b) => (b.clones || 0) - (a.clones || 0)).slice(0, 3).map((ad, i) => (
                  <div key={ad.id} className={styles.topItem}>
                    <span className={styles.topRank}>{i + 1}</span>
                    <img src={ad.thumbnail} alt={ad.title} className={styles.topThumb} />
                    <div>
                      <p className={styles.topTitle}>{ad.title}</p>
                      <p className={styles.topClones}>{ad.clones || 0} clones</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptySub} style={{ padding: '8px 0' }}>No clones yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
