import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import BusinessDNA from './pages/BusinessDNA'
import AdsLibrary from './pages/AdsLibrary'
import CloneCanvas from './pages/CloneCanvas'
import Studio from './pages/Studio'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dna" element={<BusinessDNA />} />
        <Route path="/library" element={<AdsLibrary />} />
        <Route path="/canvas" element={<CloneCanvas />} />
        <Route path="/canvas/:adId" element={<CloneCanvas />} />
        <Route path="/studio" element={<Studio />} />
      </Routes>
    </Layout>
  )
}
