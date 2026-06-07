import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import {
  Sparkles, Send, Upload, Download, RefreshCw,
  Trash2, ImageIcon, Monitor, Smartphone, X,
  ZoomIn, ZoomOut, Maximize2, Wand2, PanelRight, PanelRightClose,
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { useApp } from '../context/AppContext'
import styles from './Studio.module.css'

const FORMATS = [
  { id: 'story',     label: 'Story',     ratio: '9:16',   w: 1080, h: 1920, aspect: 9/16,   platform: 'Instagram · TikTok · Snapchat', mobile: true  },
  { id: 'portrait',  label: 'Portrait',  ratio: '4:5',    w: 1080, h: 1350, aspect: 4/5,   platform: 'Instagram · Facebook',          mobile: true  },
  { id: 'square',    label: 'Square',    ratio: '1:1',    w: 1080, h: 1080, aspect: 1,     platform: 'Instagram · Facebook · Twitter', mobile: true  },
  { id: 'landscape', label: 'Landscape', ratio: '16:9',   w: 1920, h: 1080, aspect: 16/9,  platform: 'YouTube · Twitter · LinkedIn',   mobile: false },
  { id: 'banner',    label: 'Banner',    ratio: '1.91:1', w: 1200, h: 628,  aspect: 1.91,  platform: 'Facebook · Google Display',      mobile: false },
]

/* ── Style presets — world's best ad aesthetics ── */
const AD_STYLES = [
  {
    id: 'apple', label: 'Apple', icon: '⬜',
    desc: 'Apple-style ultra-minimalist: pure white background, single product floating with perfect studio lighting, razor-sharp edges, massive negative space, one 2-word headline in SF Pro Display Black, premium product photography, absolutely no clutter',
  },
  {
    id: 'nike', label: 'Nike', icon: '⚡',
    desc: 'Nike-style raw power: athlete in explosive motion against dark bg, diagonal dynamic composition, one motivational 2-word headline bold white with drop shadow, cinematic high-contrast sports photography, gritty texture overlay, intense dramatic lighting',
  },
  {
    id: 'spotify', label: 'Spotify', icon: '🎵',
    desc: 'Spotify-style vibrant duotone: electric green #1DB954 and deep black, bold rounded typography, floating music-inspired geometric shapes, energetic youthful gradient, album-art composition, neon glow accents',
  },
  {
    id: 'luxury', label: 'Luxury', icon: '💎',
    desc: 'Ultra-luxury: near-black background #0A0A0A, gold #D4AF37 and champagne accents, single product lit with one dramatic shaft of light, extreme negative space, elegant serif headline whisper-thin, Chanel/Rolex advertising aesthetic',
  },
  {
    id: 'cyber', label: 'Cyber', icon: '🔮',
    desc: 'Cyberpunk futuristic: dark neon cityscape, electric blue #00D4FF and hot magenta #FF006E neon glows, holographic glass surfaces, tech grid-lines, matrix data streams, Blade Runner atmosphere, sci-fi product placement',
  },
  {
    id: 'bold', label: 'Bold', icon: '🔥',
    desc: 'Maximum impact bold: oversized typography fills 70% of frame, extreme red and black contrast, distressed grunge texture, punk streetwear energy, aggressive in-your-face layout, one powerful word dominates, Kanye/Supreme aesthetic',
  },
  {
    id: 'fashion', label: 'Fashion', icon: '✨',
    desc: 'High fashion editorial: unexpected color blocking, asymmetric avant-garde layout, Vogue/Harper\'s Bazaar aesthetic, model in artistic pose, bold color contrast, sophisticated minimalist typography, gallery-worthy composition',
  },
  {
    id: 'natural', label: 'Natural', icon: '🌿',
    desc: 'Organic lifestyle: warm golden-hour sunlight, natural textures linen and wood, earthy palette warm sand #D4A96A and sage green #7B9E87, artisanal flat-lay, soft bokeh, wholesome authentic feel, Patagonia/Aesop aesthetic',
  },
]

/* Compute canvas display size to fill ~80% of container */
function calcDisplay(aspect, containerW, containerH) {
  const maxH = Math.floor(containerH * 0.82)
  const maxW = Math.floor(containerW * 0.82)
  let h = maxH
  let w = Math.floor(h * aspect)
  if (w > maxW) { w = maxW; h = Math.floor(w / aspect) }
  return { w: Math.max(w, 60), h: Math.max(h, 60) }
}

const MIN_CHAT_W = 280
const MAX_CHAT_W = 600

/* ── Mock stream for dev (no API key) ── */
async function* mockStream(text, delay = 18) {
  for (const char of text) {
    yield char
    await new Promise(r => setTimeout(r, delay))
  }
}

/* ── DeepSeek streaming ── */
async function* streamDeepSeek(messages, dna) {
  const key = import.meta.env.VITE_DEEPSEEK_API_KEY
  const last = messages.at(-1)?.content || 'creative ad'

  if (!key || key === 'your_deepseek_key_here') {
    const mock = `Here's your high-impact ad.\n\n<prompt>Ultra-vibrant professional mobile ad, ${last}, electric neon glow, hyper-saturated gradient background deep purple #6B21A8 to hot orange #EA580C, bold white headline "BUILD SMARTER" Inter Black 96pt top-center with soft glow, glowing CTA button "Get Started" with pulse effect, dramatic cinematic lighting with lens flares, photorealistic 8K sharp, premium Apple-level advertising visual, dynamic diagonal composition, depth of field bokeh, ultra HD crisp details, agency-grade commercial photography</prompt>`
    yield* mockStream(mock)
    return
  }

  const sys = `You are a senior creative director at a world-class ad agency (think Wieden+Kennedy, TBWA, R/GA). You brief Flux AI image generator through detailed prompts inside <prompt> tags. You ALWAYS generate — no exceptions.

━━━ BRAND CONTEXT ━━━
${dna?.brandName ? `Brand: ${dna.brandName}` : 'Brand: not set'}${dna?.industry ? ` | Industry: ${dna.industry}` : ''}${dna?.toneOfVoice ? ` | Tone: ${dna.toneOfVoice}` : ''}${dna?.usp ? ` | USP: ${dna.usp}` : ''}

━━━ RESPONSE FORMAT — MANDATORY ━━━
1. One punchy sentence (max 10 words)
2. Immediately: <prompt>DETAILED VISUAL PROMPT</prompt>
- ALWAYS use <prompt></prompt> tags
- NEVER say "I can't generate"
- NEVER use **Prompt:** label

━━━ WORLD-CLASS AD REFERENCES — STUDY THESE ━━━

APPLE ADS: Ultra-clean white/black bg, single product as hero floating in infinite space, razor-sharp photography, 2-word headline max in SF Pro Display Black, massive negative space, studio lighting with perfect shadows, NO clutter whatsoever

NIKE ADS: Athlete frozen in peak-performance moment, dark moody background, diagonal power composition, single word or phrase "JUST DO IT" style in bold white, cinematic 35mm film look, grit texture, authentic raw emotion, motion blur on extremities

SPOTIFY ADS: Duotone gradient washes over photography, neon green #1DB954 dominant, bold rounded sans-serif headlines, playful geometric shapes floating, energetic & youthful, feels like album artwork

LOUIS VUITTON/LUXURY: Near-black background, single dramatic light beam illuminates product, gold/champagne accents #D4AF37, extreme negative space = exclusivity, serif headline barely visible, whispers rather than shouts

REDBULL/ENERGY: Extreme sports aerial perspective, supersaturated sky blues and oranges, athlete tiny against massive landscape, liberating sense of freedom and scale, bold red can placement

COCA-COLA: Warm human moments, happiness in color, iconic red, friends/family emotional connection, product wet with condensation, summer light, joy crystallized

━━━ AD COPY FRAMEWORKS (pick best for context) ━━━
• AIDA: Attention (bold visual hook) → Interest (USP) → Desire (benefit) → Action (CTA)
• PAS: Problem implied visually → Agitate (make them feel it) → Solution = your product
• HOOK: Unexpected image that stops the scroll → product reveal
• POWER WORDS for headlines: Transform · Unleash · Discover · Bold · Pure · Now · Free · New · Proven · Secret

━━━ VISUAL QUALITY STANDARDS ━━━
✓ Ultra-vibrant OR ultra-minimal — never mediocre middle ground
✓ Cinematic lighting: rim light, god rays, lens flare, or dramatic shadows
✓ High contrast — text always legible
✓ Photorealistic 8K, ultra-sharp
✓ Dynamic composition: rule of thirds, diagonal tension, or bold symmetry
✓ Typography: max 4 words, Inter Black / Helvetica Neue Heavy, with glow or shadow

✗ NEVER: flat colors, stock photo feel, busy layouts, lorem ipsum, muted greys
✗ NEVER: more than 2 text elements
✗ NEVER: phone/device frames in the image

━━━ IF [VISUAL STYLE: X] IS SPECIFIED ━━━
Apply that style identity precisely — it overrides default aesthetic choices.

EXAMPLE OUTPUT:
Here's your scroll-stopping ad.
<prompt>Nike-level 8K ad, athlete silhouette mid-leap against blood-orange sunset sky, extreme low angle looking up, god rays bursting through clouds, bold headline "RISE DAILY" Helvetica Neue Black white letters top-left with subtle shadow, small CTA "Shop Now" pill bottom-right, hyper-saturated #FF4500 to #1A0A00 gradient sky, cinematic anamorphic 2.35:1 crop feel, motion blur on sneakers, raw authentic sports photography, jaw-dropping agency quality</prompt>`

  const builtMessages = messages

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'system', content: sys }, ...builtMessages],
      temperature: 0.7,
      stream: true,
      max_tokens: 500,
    }),
  })
  if (!res.ok) throw new Error(`DeepSeek ${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() // keep incomplete line in buffer
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') return
      try {
        const delta = JSON.parse(data).choices?.[0]?.delta?.content
        if (delta) yield delta
      } catch {}
    }
  }
}

/* Aspect ratio map for Kie AI */
const RATIO_MAP = {
  story:    '9:16',
  portrait: '3:4',
  square:   '1:1',
  landscape:'16:9',
  banner:   '16:9',
}

async function generateWithKie(prompt, format) {
  const key = import.meta.env.VITE_KIE_API_KEY
  if (!key || key === 'your_kie_ai_key_here') {
    await new Promise(r => setTimeout(r, 1400))
    return `https://picsum.photos/seed/${Date.now()}/${Math.min(format.w, 800)}/${Math.min(format.h, 800)}`
  }

  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` }

  /* 1 — Create task */
  const createRes = await fetch('/api/generate', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt,
      aspectRatio: RATIO_MAP[format.id] || '1:1',
      outputFormat: 'jpeg',
      model: 'flux-kontext-pro',
    }),
  })
  if (!createRes.ok) throw new Error(`Kie AI create failed: ${createRes.status}`)
  const createData = await createRes.json()
  console.log('[Kie AI] create response:', createData)

  const taskId = createData?.data?.taskId ?? createData?.data?.task_id ?? createData?.taskId
  if (!taskId) throw new Error(`Kie AI: no taskId in response — ${JSON.stringify(createData)}`)

  /* 2 — Poll flux-kontext specific endpoint */
  await new Promise(r => setTimeout(r, 4000))

  const MAX_POLLS = 40
  for (let i = 0; i < MAX_POLLS; i++) {
    const pollRes = await fetch(`/api/poll?taskId=${taskId}`, { headers })
    if (!pollRes.ok) { await new Promise(r => setTimeout(r, 4000)); continue }
    const pollData = await pollRes.json()
    const flag = pollData?.data?.successFlag
    console.log(`[Kie AI] poll ${i + 1}: successFlag=${flag}`, pollData)

    // 0 = still generating, null/undefined = not ready yet
    if (flag === undefined || flag === null || flag === 0) {
      await new Promise(r => setTimeout(r, 4000))
      continue
    }
    if (flag === 1) {
      const url = pollData?.data?.response?.resultImageUrl || pollData?.data?.response?.originImageUrl
      if (url) return url
      throw new Error('Kie AI: success but no image URL — ' + JSON.stringify(pollData?.data))
    }
    // 2 = create failed, 3 = generate failed
    throw new Error(`Kie AI failed (flag ${flag}): ${pollData?.data?.errorMessage || 'unknown error'}`)
  }
  throw new Error('Kie AI: timed out after 2+ minutes')
}

let fabricLib = null

export default function Studio() {
  const { ads, dna, dnaComplete, addAd } = useApp()

  const [format, setFormat]         = useState(FORMATS[0])
  const [chatWidth, setChatWidth]   = useState(null)
  const [hasContent, setHasContent] = useState(false)
  const [canvasOpen, setCanvasOpen] = useState(false)
  const [generatedAds, setGeneratedAds] = useState(() => {
    try {
      const saved = localStorage.getItem('studio_generated_ads')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  useEffect(() => {
    try { localStorage.setItem('studio_generated_ads', JSON.stringify(generatedAds)) } catch {}
  }, [generatedAds])

  const canvasContainerRef = useRef(null)
  const canvasAreaRef       = useRef(null)  // measures available space
  const canvasScrollRef     = useRef(null)  // for toolbar positioning
  const fabricRef           = useRef(null)
  const displayRef          = useRef({ w: 320, h: 568 })  // current canvas display size
  const [zoom, setZoom]     = useState(100)
  const [activeObj, setActiveObj] = useState(null)
  const [toolbarPos, setToolbarPos] = useState(null)

  const welcomeMessage = useMemo(() => {
    if (dna?.brandName && dnaComplete) {
      const tone = dna.toneOfVoice ? `, ${dna.toneOfVoice} tone` : ''
      const suggestions = [
        dna.usp         && `Create a Story ad highlighting: "${dna.usp.slice(0, 60)}"`,
        dna.targetAudience && `Design a Square ad for: ${dna.targetAudience.slice(0, 50)}`,
        dna.industry    && `Bold ${dna.industry} promotional ad with strong CTA`,
      ].filter(Boolean).slice(0, 2)

      return `Hi! I'm set up for **${dna.brandName}** (${dna.industry}${tone}).\n\nTry one of these:\n${suggestions.map(s => `• ${s}`).join('\n')}\n\nOr just describe what you want.`
    }
    return "Hi! Describe the mobile ad you want to create. Pick a reference image if you have one, and I'll craft a detailed prompt for AI generation."
  }, [dna, dnaComplete])

  // Load persisted chat from localStorage, or use welcome message
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('studio_messages')
      if (saved) return JSON.parse(saved)
    } catch {}
    return [{ role: 'assistant', content: '' }]
  })

  // Seed welcome message only when chat is brand-new (single empty assistant bubble)
  useEffect(() => {
    if (messages.length === 1 && messages[0].content === '') {
      setMessages([{ role: 'assistant', content: welcomeMessage }])
    }
  }, [welcomeMessage])

  // Persist messages to localStorage on every change
  useEffect(() => {
    try { localStorage.setItem('studio_messages', JSON.stringify(messages)) } catch {}
  }, [messages])

  const [input, setInput]             = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [genLoading, setGenLoading]   = useState(false)

  const [lastPrompt, setLastPrompt] = useState(() => {
    try { return localStorage.getItem('studio_last_prompt') || '' } catch { return '' }
  })
  useEffect(() => {
    try { localStorage.setItem('studio_last_prompt', lastPrompt) } catch {}
  }, [lastPrompt])

  const messagesEndRef = useRef(null)

  const [refImage, setRefImage]           = useState(null)
  const [showRefPicker, setShowRefPicker] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState(null)

  /* ── Drag resize ── */
  const dragging    = useRef(false)
  const dragStartX  = useRef(0)
  const dragStartW  = useRef(0)

  function onResizeMouseDown(e) {
    dragging.current   = true
    dragStartX.current = e.clientX
    dragStartW.current = chatWidth
    document.body.style.cursor    = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  useEffect(() => {
    function onMove(e) {
      if (!dragging.current) return
      const delta = e.clientX - dragStartX.current
      setChatWidth(Math.min(MAX_CHAT_W, Math.max(MIN_CHAT_W, dragStartW.current + delta)))
    }
    function onUp() {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.cursor    = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])

  /* ── Toolbar position — above selected object ── */
  const updateToolbarPos = useCallback(() => {
    const canvas = fabricRef.current
    const obj = canvas?.getActiveObject()
    if (!obj || !canvasContainerRef.current || !canvasScrollRef.current) {
      setToolbarPos(null); return
    }
    const bound = obj.getBoundingRect()
    const canvasRect = canvasContainerRef.current.getBoundingClientRect()
    const scrollRect = canvasScrollRef.current.getBoundingClientRect()
    setToolbarPos({
      left: (canvasRect.left - scrollRect.left) + bound.left + bound.width / 2,
      top: Math.max(8, (canvasRect.top - scrollRect.top) + bound.top - 50),
    })
  }, [])

  /* ── Init / reinit Fabric canvas ── */
  const initCanvas = useCallback(async (w, h) => {
    if (!fabricLib) {
      const mod = await import('fabric')
      fabricLib = mod.fabric || mod.default
    }
    if (!canvasContainerRef.current) return

    if (fabricRef.current) { fabricRef.current.dispose(); fabricRef.current = null }

    canvasContainerRef.current.innerHTML = ''
    const el = document.createElement('canvas')
    canvasContainerRef.current.appendChild(el)

    const canvas = new fabricLib.Canvas(el, {
      width: w, height: h,
      backgroundColor: null,
      preserveObjectStacking: true,
      selection: true,
    })
    // Transparent canvas background — no white box
    requestAnimationFrame(() => {
      if (canvas.lowerCanvasEl) canvas.lowerCanvasEl.style.background = 'transparent'
      if (canvas.upperCanvasEl) canvas.upperCanvasEl.style.background = 'transparent'
    })
    fabricRef.current = canvas
    canvas.on('selection:created', () => { setActiveObj(canvas.getActiveObject()); setTimeout(updateToolbarPos, 0) })
    canvas.on('selection:updated', () => { setActiveObj(canvas.getActiveObject()); setTimeout(updateToolbarPos, 0) })
    canvas.on('selection:cleared', () => { setActiveObj(null); setToolbarPos(null) })
    canvas.on('object:moving',  updateToolbarPos)
    canvas.on('object:scaling', updateToolbarPos)
    canvas.on('object:rotating', updateToolbarPos)
    canvas.on('object:modified', updateToolbarPos)
    setActiveObj(null)
    setToolbarPos(null)
    setHasContent(false)
  }, [updateToolbarPos])

  /* ── Measure canvas area and init on format / open change ── */
  useEffect(() => {
    if (!canvasOpen) return
    const area = canvasAreaRef.current
    if (!area) return

    const measure = () => {
      const { width, height } = area.getBoundingClientRect()
      const d = calcDisplay(format.aspect, width, height)
      displayRef.current = d
      initCanvas(d.w, d.h)
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(area)
    return () => ro.disconnect()
  }, [format, canvasOpen, initCanvas])

  function placeImage(url, addToHistory = true) {
    const canvas = fabricRef.current
    if (!canvas || !fabricLib) return
    fabricLib.Image.fromURL(url, img => {
      const { w, h } = displayRef.current
      // Cover scaling — fills entire canvas, no white bars
      const scale = Math.max(w / img.width, h / img.height)
      img.set({
        left: w / 2, top: h / 2,
        originX: 'center', originY: 'center',
        scaleX: scale, scaleY: scale,
        selectable: true,
        hasControls: true,
        hasBorders: true,
        lockUniScaling: false,
        cornerColor: '#f97316',
        cornerSize: 10,
        transparentCorners: false,
        borderColor: '#f97316',
        borderScaleFactor: 1.5,
      })
      canvas.clear()
      canvas.add(img)
      canvas.setActiveObject(img)
      canvas.renderAll()
      setHasContent(true)
      if (addToHistory) setGeneratedAds(prev => [{ url, format: format.label, id: Date.now() }, ...prev])

      addAd({
        title: `AI Ad — ${format.label}`,
        brand: dna?.brandName || 'AI Studio',
        platform: format.platform.split(' · ')[0],
        format: `${format.w}x${format.h}`,
        category: dna?.industry || 'AI Generated',
        thumbnail: url,
        tags: ['ai-generated', format.id],
      })
    }, { crossOrigin: 'anonymous' })
  }

  function handleZoom(delta) {
    const canvas = fabricRef.current; if (!canvas) return
    const next = Math.min(Math.max(zoom + delta, 25), 300)
    canvas.setZoom(next / 100); setZoom(next)
  }
  function resetZoom() {
    const canvas = fabricRef.current; if (!canvas) return
    canvas.setZoom(1); canvas.viewportTransform = [1,0,0,1,0,0]; canvas.renderAll(); setZoom(100)
  }
  function deleteSelected() {
    const canvas = fabricRef.current; if (!canvas) return
    const obj = canvas.getActiveObject()
    if (obj) { canvas.remove(obj); canvas.renderAll() }
  }
  function exportPNG() {
    const canvas = fabricRef.current; if (!canvas) return
    const multiplier = format.w / displayRef.current.w
    const url = canvas.toDataURL({ format: 'png', multiplier })
    Object.assign(document.createElement('a'), { href: url, download: `ad-${format.id}-${Date.now()}.png` }).click()
  }
  function exportJPG() {
    const canvas = fabricRef.current; if (!canvas) return
    const multiplier = format.w / displayRef.current.w
    const url = canvas.toDataURL({ format: 'jpeg', quality: 0.92, multiplier })
    Object.assign(document.createElement('a'), { href: url, download: `ad-${format.id}-${Date.now()}.jpg` }).click()
  }

  async function sendMessage(e) {
    e?.preventDefault()
    const text = input.trim(); if (!text || chatLoading) return

    // deepseek-chat is text-only — append reference image context as text
    const refNote = refImage
      ? `\n\n[Reference image attached: "${refImage.name}". Match its visual style, color palette, composition and mood closely in the generated ad.]`
      : ''
    const styleNote = selectedStyle
      ? `\n\n[VISUAL STYLE: ${selectedStyle.label} — ${selectedStyle.desc}]`
      : ''

    const userMessage = { role: 'user', content: text + refNote + styleNote }
    const next = [...messages, userMessage]
    // Show in UI — image attached to message bubble, cleared from input
    const sentImage = refImage ? { url: refImage.url, name: refImage.name } : null
    setMessages([...messages, { role: 'user', content: text, image: sentImage }, { role: 'assistant', content: '' }])
    setInput('')
    setRefImage(null)   // clear from input after sending
    setChatLoading(true)
    let full = ''
    let promptStarted = false

    try {
      for await (const chunk of streamDeepSeek(next, dna)) {
        full += chunk

        // Stop streaming to bubble once the prompt starts (any format)
        if (!promptStarted) {
          const cutoffs = [
            full.indexOf('<prompt>'),
            full.search(/\*\*Prompt:\*\*/i),
            full.search(/\n\nPrompt:/i),
          ].filter(i => i !== -1)

          if (cutoffs.length === 0) {
            // Still in commentary — stream normally
            setMessages(m => {
              const copy = [...m]
              copy[copy.length - 1] = { role: 'assistant', content: full }
              return copy
            })
          } else {
            // Prompt section started — freeze bubble at commentary
            promptStarted = true
            const cutoff = Math.min(...cutoffs)
            const visible = full.slice(0, cutoff).trim()
            setMessages(m => {
              const copy = [...m]
              copy[copy.length - 1] = { role: 'assistant', content: visible || 'On it!' }
              return copy
            })
          }
        }
      }

      // Primary: extract from <prompt> tags
      const match = full.match(/<prompt>([\s\S]*?)<\/prompt>/)
      if (match) {
        setLastPrompt(match[1].trim())
      } else {
        // Fallback: extract text after **Prompt:** label (AI sometimes ignores tags)
        const fallback = full.match(/\*\*Prompt:\*\*\s*([\s\S]+)/i)
          || full.match(/Prompt:\s*([\s\S]+)/i)
        if (fallback) setLastPrompt(fallback[1].trim())
      }
    } catch (err) {
      setMessages(m => {
        const copy = [...m]
        copy[copy.length - 1] = { role: 'assistant', content: `⚠ ${err.message}` }
        return copy
      })
    } finally { setChatLoading(false) }
  }

  async function generateImage(promptOverride) {
    const prompt = promptOverride || lastPrompt || input.trim(); if (!prompt) return
    setCanvasOpen(true)   // auto-reveal canvas panel
    setGenLoading(true)
    try {
      const url = await generateWithKie(prompt, format)
      placeImage(url)
    } catch (err) {
      alert(`Generation failed: ${err.message}`)
    } finally { setGenLoading(false) }
  }

  const onDropRef = useCallback(files => {
    const f = files[0]; if (!f) return
    setRefImage({ url: URL.createObjectURL(f), name: f.name })
    setShowRefPicker(false)
  }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop: onDropRef, accept: { 'image/*': [] }, maxFiles: 1 })

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  return (
    <div className={styles.page}>
      {/* ── Workspace ── */}
      <div className={styles.workspace}>

        {/* Chat panel — 50% default, draggable */}
        <div className={styles.chatPanel} style={canvasOpen && chatWidth ? { width: chatWidth } : {}}>

          {/* Top bar — always visible, outside scroll */}
          <div className={styles.chatTopBar}>
            <button
              className={styles.newChatBtn}
              onClick={() => {
                setMessages([{ role: 'assistant', content: welcomeMessage }])
                setLastPrompt('')
                setRefImage(null)
                localStorage.removeItem('studio_messages')
                localStorage.removeItem('studio_last_prompt')
              }}
            >
              + New chat
            </button>
            <button
              className={`${styles.previewToggleBtn} ${canvasOpen ? styles.previewToggleBtnOn : ''}`}
              onClick={() => setCanvasOpen(v => !v)}
            >
              {canvasOpen ? <PanelRightClose size={12} /> : <PanelRight size={12} />}
              {canvasOpen ? 'Hide preview' : 'Preview'}
            </button>
          </div>

          {/* Messages */}
          <div className={styles.chatMessages}>
            {messages.map((m, i) => (
              <div key={i} className={`${styles.chatMsg} ${m.role === 'user' ? styles.chatMsgUser : styles.chatMsgAI}`}>
                {m.role === 'assistant' && <div className={styles.chatAvatar}><Sparkles size={11} /></div>}
                <div className={styles.chatBubble}>
                  {m.image && (
                    <img src={m.image.url} alt={m.image.name} className={styles.msgRefImg} />
                  )}
                  {m.content
                    .replace(/<prompt>[\s\S]*?<\/prompt>/g, '')  // strip <prompt> blocks
                    .replace(/\*\*Prompt:\*\*[\s\S]*/i, '')       // strip **Prompt:** fallback
                    .replace(/^Prompt:\s*/im, '')                  // strip bare "Prompt:" label
                    .replace(/\*\*/g, '')                          // strip markdown bold
                    .trimEnd()
                    .split('\n')
                    .filter(line => line.trim())                   // remove blank lines
                    .map((line, j, arr) => (
                      <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
                    ))
                  }
                  {chatLoading && i === messages.length - 1 && (
                    <span className={styles.cursor} />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Prompt ready */}
          {lastPrompt && (
            <div className={styles.promptReady}>
              <div className={styles.promptReadyText}><Wand2 size={12} /><span>Prompt ready</span></div>
              <button className={styles.generateBtn} onClick={() => generateImage()} disabled={genLoading}>
                {genLoading
                  ? <><RefreshCw size={13} className={styles.spin} /> Generating…</>
                  : <><Sparkles size={13} /> Generate Ad</>}
              </button>
            </div>
          )}

          {/* Generated ads history */}
          {generatedAds.length > 0 && (
            <div className={styles.genHistory}>
              <p className={styles.genHistoryLabel}>Generated · click to view</p>
              <div className={styles.genHistoryRow}>
                {generatedAds.map(item => (
                  <div key={item.id} className={styles.genHistoryThumb}>
                    <img
                      src={item.url} alt="generated ad"
                      onClick={() => { setCanvasOpen(true); placeImage(item.url, false) }}
                      title={`${item.format} — click to load`}
                    />
                    <span className={styles.genHistoryFormat}>{item.format}</span>
                    <button
                      className={styles.genHistoryDel}
                      onClick={() => setGeneratedAds(prev => prev.filter(a => a.id !== item.id))}
                      title="Remove"
                    >
                      <X size={8} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.chatInputWrap}>
            <div className={styles.inputBox}>

              {/* Row 1 — Format pills */}
              <div className={styles.inputFormatRow}>
                {FORMATS.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    className={`${styles.inputFormatPill} ${format.id === f.id ? styles.inputFormatPillActive : ''}`}
                    onClick={() => { setFormat(f); setHasContent(false) }}
                    title={f.platform}
                  >
                    {f.mobile ? <Smartphone size={10} /> : <Monitor size={10} />}
                    {f.label}
                    <span className={styles.inputFormatRatio}>{f.ratio}</span>
                  </button>
                ))}
                <div className={styles.inputFormatDivider} />
                {/* Canvas toggle */}
                <button
                  type="button"
                  className={`${styles.inputCanvasBtn} ${canvasOpen ? styles.inputCanvasBtnOn : ''}`}
                  onClick={() => setCanvasOpen(v => !v)}
                  title={canvasOpen ? 'Hide canvas' : 'Show canvas'}
                >
                  {canvasOpen ? <PanelRightClose size={12} /> : <PanelRight size={12} />}
                  {canvasOpen ? 'Hide' : 'Canvas'}
                </button>
              </div>

              {/* Row 2 — Style presets */}
              <div className={styles.styleRow}>
                {AD_STYLES.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    className={`${styles.styleChip} ${selectedStyle?.id === s.id ? styles.styleChipActive : ''}`}
                    onClick={() => setSelectedStyle(v => v?.id === s.id ? null : s)}
                    title={s.desc}
                  >
                    <span>{s.icon}</span>{s.label}
                  </button>
                ))}
              </div>

              {/* Row 3 — Reference image (shown when selected) */}
              {refImage && (
                <div className={styles.inputRefRow}>
                  <img src={refImage.url} alt="reference" className={styles.inputRefThumb} />
                  <span className={styles.inputRefName}>{refImage.name}</span>
                  <button type="button" className={styles.inputRefRemove} onClick={() => setRefImage(null)}>
                    <X size={11} />
                  </button>
                </div>
              )}

              {/* Row 3 — Textarea + actions */}
              <form className={styles.inputRow} onSubmit={sendMessage}>
                <textarea
                  className={styles.chatTextarea}
                  placeholder={`Describe your ${format.label} ad…`}
                  value={input}
                  rows={1}
                  onChange={e => {
                    setInput(e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                  }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                />
                <div className={styles.inputActions}>
                  {/* Library picker */}
                  <div className={styles.inputAttachWrap}>
                    <button
                      type="button"
                      className={`${styles.inputAttachBtn} ${showRefPicker ? styles.inputAttachBtnOn : ''}`}
                      onClick={() => setShowRefPicker(v => !v)}
                      title="Add reference image"
                    >
                      <ImageIcon size={14} />
                    </button>
                    {showRefPicker && (
                      <div className={styles.libPicker}>
                        <div className={styles.libPickerActions}>
                          <div {...getRootProps()} className={`${styles.libUploadZone} ${isDragActive ? styles.libUploadActive : ''}`}>
                            <input {...getInputProps()} />
                            <Upload size={13} />
                            <span>Upload image</span>
                          </div>
                        </div>
                        {ads.length > 0 && (
                          <>
                            <p className={styles.libPickerLabel}>From library</p>
                            <div className={styles.libPickerGrid}>
                              {ads.map(ad => (
                                <button key={ad.id} className={styles.libPickerItem}
                                  onClick={() => { setRefImage({ url: ad.thumbnail, name: ad.title }); setShowRefPicker(false) }}>
                                  <img src={ad.thumbnail} alt={ad.title} />
                                  <span>{ad.title}</span>
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <button type="button" className={styles.quickGenBtn}
                    onClick={() => generateImage(input)} disabled={!input.trim() || genLoading}
                    title="Generate directly">
                    {genLoading ? <RefreshCw size={13} className={styles.spin} /> : <Wand2 size={13} />}
                  </button>
                  <button type="submit" className={styles.sendBtn}
                    disabled={!input.trim() || chatLoading} title="Chat with AI">
                    <Send size={13} />
                  </button>
                </div>
              </form>
            </div>

            <p className={styles.inputHint}>
              <kbd>Enter</kbd> to chat &nbsp;·&nbsp; <kbd>⌘↵</kbd> or wand to generate directly
            </p>
          </div>
        </div>

        {/* Resize handle — only when canvas is open */}
        {canvasOpen && <div className={styles.resizeHandle} onMouseDown={onResizeMouseDown} />}

        {/* Canvas area — hidden when closed */}
        <div
          ref={canvasAreaRef}
          className={styles.canvasArea}
          style={{ display: canvasOpen ? 'flex' : 'none' }}
        >
          <div ref={canvasScrollRef} className={styles.canvasScroll}>

            {/* Empty state */}
            {!hasContent && !genLoading && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}><Wand2 size={28} /></div>
                <p className={styles.emptyTitle}>Your canvas is ready</p>
                <p className={styles.emptyHint}>Describe your ad in the chat and click <strong>Generate Ad</strong></p>
              </div>
            )}

            {/* Skeleton shimmer while generating */}
            {genLoading && (
              <div className={styles.canvasOuter}>
                <div className={styles.canvasWrap} style={{ width: displayRef.current.w, height: displayRef.current.h }}>
                  <div className={styles.skeleton} />
                </div>
                <div className={styles.genLabel}>
                  <div className={styles.genDot} /><div className={styles.genDot} /><div className={styles.genDot} />
                  <span>Generating…</span>
                </div>
              </div>
            )}

            {/* Canvas — no frame, image floats on dotted bg */}
            <div
              ref={canvasContainerRef}
              style={{ opacity: genLoading ? 0 : 1, transition: 'opacity .3s', display: 'block', pointerEvents: 'auto', position: 'relative' }}
            />

            {/* Floating toolbar — above selected image */}
            {activeObj && hasContent && toolbarPos && (
              <div
                className={styles.floatToolbar}
                style={{ left: toolbarPos.left, top: toolbarPos.top }}
              >
                <span className={styles.floatHint}>Move · resize</span>
                <div className={styles.floatActions}>
                  <button className={styles.floatBtn} onClick={exportPNG}>
                    <Download size={12} /> PNG
                  </button>
                  <button className={styles.floatBtn} onClick={exportJPG}>
                    <Download size={12} /> JPG
                  </button>
                  <span className={styles.floatDivider} />
                  <button className={`${styles.floatBtn} ${styles.floatBtnDanger}`} onClick={deleteSelected}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )}

            {!genLoading && hasContent && (
              <div className={styles.canvasMeta} style={{ position: 'absolute', bottom: 52, left: '50%', transform: 'translateX(-50%)' }}>
                <span>{format.w} × {format.h} px</span>
                <span className={styles.dot} />
                <span>{format.ratio}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={styles.canvasFooter}>
            <div className={styles.zoomBar}>
              <button onClick={() => handleZoom(-10)}><ZoomOut size={13} /></button>
              <button className={styles.zoomPct} onClick={resetZoom}>{zoom}%</button>
              <button onClick={() => handleZoom(10)}><ZoomIn size={13} /></button>
              <span className={styles.zoomDivider} />
              <button onClick={resetZoom} title="Fit"><Maximize2 size={13} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
