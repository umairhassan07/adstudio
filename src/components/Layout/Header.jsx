import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Search, Plus } from 'lucide-react'
import styles from './Header.module.css'

const titles = {
  '/dashboard': { title: 'Dashboard', sub: 'Welcome back, let\'s create something great' },
  '/dna':       { title: 'Business DNA', sub: 'Define your brand identity' },
  '/library':   { title: 'Ads Library', sub: 'Browse and manage your ad collection' },
  '/canvas':    { title: 'Clone Canvas', sub: 'Edit and customise your ad' },
}

export default function Header() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const page = titles[pathname] || titles['/dashboard']

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.title}>{page.title}</h1>
        <p className={styles.sub}>{page.sub}</p>
      </div>

      <div className={styles.right}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.search}
            type="text"
            placeholder="Search ads..."
          />
        </div>

        <button className={styles.iconBtn} aria-label="Notifications">
          <Bell size={18} />
          <span className={styles.notifDot} />
        </button>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/canvas')}
        >
          <Plus size={15} />
          New Clone
        </button>
      </div>
    </header>
  )
}
