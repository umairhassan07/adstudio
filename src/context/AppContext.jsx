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
  const [ads, setAds]               = useState(sampleAds)
  const [dna, setDna]               = useState(defaultDNA)
  const [dnaComplete, setDnaComplete] = useState(false)
  const [activeCanvasAd, setActiveCanvasAd] = useState(null)
  const [dbReady, setDbReady]       = useState(false)

  const sessionId = getSessionId()

  /* ── Load from Supabase on mount ── */
  useEffect(() => {
    if (!supabase) { setDbReady(true); return }

    async function load() {
      // Load DNA
      const { data: dnaRow } = await supabase
        .from('business_dna')
        .select('data')
        .eq('session_id', sessionId)
        .single()

      if (dnaRow?.data) {
        setDna(dnaRow.data)
        setDnaComplete(true)
      }

      // Load ads (user-created ones, prepend to sample ads)
      const { data: adsRows } = await supabase
        .from('ads')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })

      if (adsRows?.length) {
        setAds([...adsRows.map(r => ({ ...r, id: r.id })), ...sampleAds])
      }

      setDbReady(true)
    }

    load()
  }, [])

  /* ── Add ad — local + Supabase ── */
  async function addAd(ad) {
    const newAd = {
      ...ad,
      id: Date.now().toString(),
      clones: 0,
      createdAt: new Date().toISOString().split('T')[0],
    }
    setAds(prev => [newAd, ...prev])

    if (supabase) {
      await supabase.from('ads').insert({
        session_id: sessionId,
        title:      ad.title,
        brand:      ad.brand,
        platform:   ad.platform,
        format:     ad.format,
        category:   ad.category,
        thumbnail:  ad.thumbnail,
        tags:       ad.tags || [],
      })
    }
  }

  /* ── Save DNA — local + Supabase ── */
  async function saveDNA(data) {
    setDna(data)
    setDnaComplete(true)

    if (supabase) {
      await supabase.from('business_dna').upsert({
        session_id: sessionId,
        data,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'session_id' })
    }
  }

  return (
    <AppContext.Provider value={{
      ads, addAd,
      dna, saveDNA, dnaComplete,
      activeCanvasAd, setActiveCanvasAd,
      dbReady,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
