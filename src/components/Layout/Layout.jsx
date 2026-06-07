import Sidebar from './Sidebar'
import Header from './Header'
import { useApp } from '../../context/AppContext'
import styles from './Layout.module.css'

export default function Layout({ children }) {
  const { loading } = useApp()

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingLogo}>
          <div className={styles.loadingSpinner} />
          <span>AdStudio</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.main}>
        <Header />
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  )
}
