import { createContext, useContext, useState, useEffect } from 'react'
import { sampleAds } from '../data/sampleAds'
import { supabase, getSessionId } from '../lib/supabase'

const AppContext = createContext(null)

const defaultDNA = {
  brandName: '', industry: '', website: '', tagline: '',
  primaryColor: '#F97316', secondaryColor: '#1A1A1A',
  fontHeading: 'Inter', fontBody: 'Inter',
  toneOfVoice: '', targetAudience: '', usp: '',
  keywords: '', competitors: '',
}

export function AppProvider({ children }) {
  const [ads, setAds]                   = useState([])
  const [dna, setDna]                   = useState(defaultDNA)
  const [dnaComplete, setDnaComplete]   = useState(false)
  const [activeCanvasAd, setActiveCanvasAd] = useState(null)
  const [loading, setLoading]           = useState(true)   // true until DB resolves

  const sessionId = getSessionId()

  /* ── Load from Supabase on mount ── */
  useEffect(() => {
    if (!supabase) {
      // No Supabase configured — fall back to sample data
      setAds(sampleAds)
      setLoading(false)
      return
    }

    async function load() {
      try {
        const [dnaRes, adsRes] = await Promise.all([
          supabase
            .from('business_dna')
            .select('data')
            .eq('session_id', sessionId)
            .single(),
          supabase
            .from('ads')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: false }),
        ])

        // DNA
        if (dnaRes.data?.data) {
          setDna(dnaRes.data.data)
          setDnaComplete(true)
        }

        // Ads — show real ads if any, otherwise show sample ads so UI isn't empty
        const realAds = adsRes.data || []
        setAds(realAds.length ? realAds : sampleAds)
      } catch (err) {
        console.error('Supabase load error:', err)
        setAds(sampleAds)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  /* ── Add ad ── */
  async function addAd(ad) {
    const newAd = {
      ...ad,
      id: crypto.randomUUID(),
      clones: 0,
      created_at: new Date().toISOString(),
    }
    // If we were showing sample ads, replace them with just the new real ad
    setAds(prev => {
      const isSample = prev.every(a => sampleAds.some(s => s.id === a.id))
      return isSample ? [newAd] : [newAd, ...prev]
    })

    if (supabase) {
      const { error } = await supabase.from('ads').insert({
        id:         newAd.id,
        session_id: sessionId,
        title:      ad.title,
        brand:      ad.brand,
        platform:   ad.platform,
        format:     ad.format,
        category:   ad.category,
        thumbnail:  ad.thumbnail,
        tags:       ad.tags || [],
        clones:     0,
      })
      if (error) console.error('addAd error:', error)
    }
  }

  /* ── Delete ad ── */
  async function deleteAd(id) {
    setAds(prev => prev.filter(a => a.id !== id))
    if (supabase) {
      await supabase.from('ads').delete().eq('id', id).eq('session_id', sessionId)
    }
  }

  /* ── Increment clone count ── */
  async function incrementClones(id) {
    setAds(prev => prev.map(a => a.id === id ? { ...a, clones: (a.clones || 0) + 1 } : a))
    if (supabase) {
      const ad = ads.find(a => a.id === id)
      if (ad) {
        await supabase.from('ads').update({ clones: (ad.clones || 0) + 1 }).eq('id', id)
      }
    }
  }

  /* ── Save DNA ── */
  async function saveDNA(data) {
    setDna(data)
    setDnaComplete(true)

    if (supabase) {
      const { error } = await supabase.from('business_dna').upsert({
        session_id: sessionId,
        data,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'session_id' })
      if (error) {
        console.error('saveDNA error:', error)
        throw new Error(error.message)
      }
    }
  }

  return (
    <AppContext.Provider value={{
      ads, addAd, deleteAd, incrementClones,
      dna, saveDNA, dnaComplete,
      activeCanvasAd, setActiveCanvasAd,
      loading,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
