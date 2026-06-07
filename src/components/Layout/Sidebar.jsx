import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Dna, Images, Palette,
  Sparkles, ChevronRight, Wand2,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import styles from './Sidebar.module.css'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dna',       icon: Dna,             label: 'Business DNA' },
  { to: '/library',   icon: Images,           label: 'Ads Library' },
  { to: '/studio',    icon: Wand2,            label: 'AI Studio',   badge: 'New' },
  { to: '/canvas',    icon: Palette,          label: 'Clone Canvas' },
]

export default function Sidebar() {
  const { dna, dnaComplete } = useApp()

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <Sparkles size={18} />
        </div>
        <span className={styles.logoText}>AdStudio</span>
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        <p className={styles.navSection}>Main</p>
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
            {badge && (
              <span className={`badge badge-orange ${styles.pill}`}>{badge}</span>
            )}
            {to === '/dna' && !dnaComplete && (
              <span className={`badge badge-orange ${styles.pill}`}>Setup</span>
            )}
            {to === '/dna' && dnaComplete && (
              <span className={`badge badge-green ${styles.pill}`}>Done</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Brand DNA mini card */}
      {dnaComplete && (
        <div className={styles.dnaCard}>
          <div className={styles.dnaCardDot} style={{ background: dna.primaryColor }} />
          <div>
            <p className={styles.dnaCardName}>{dna.brandName || 'My Brand'}</p>
            <p className={styles.dnaCardIndustry}>{dna.industry}</p>
          </div>
          <ChevronRight size={14} className={styles.dnaCardArrow} />
        </div>
      )}

      {/* Footer */}
      <div className={styles.sidebarFooter}>
        <p>AdStudio v0.1</p>
      </div>
    </aside>
  )
}
