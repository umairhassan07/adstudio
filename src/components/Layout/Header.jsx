import { useLocation } from 'react-router-dom'
import styles from './Header.module.css'

const titles = {
  '/dashboard': { title: 'Dashboard',    sub: 'Welcome back, let\'s create something great' },
  '/dna':       { title: 'Business DNA', sub: 'Define your brand identity' },
  '/library':   { title: 'Ads Library',  sub: 'Browse and manage your ad collection' },
  '/canvas':    { title: 'Clone Canvas', sub: 'Edit and customise your ad' },
  '/studio':    { title: 'AI Studio',    sub: 'Generate ads with AI' },
}

export default function Header() {
  const { pathname } = useLocation()
  const page = titles[pathname] || titles['/dashboard']

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.title}>{page.title}</h1>
        <p className={styles.sub}>{page.sub}</p>
      </div>
    </header>
  )
}
