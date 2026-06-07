import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import {
  Sparkles, Send, Upload, Download, RefreshCw,
  Trash2, ImageIcon, Monitor, Smartphone, X,
  ZoomIn, ZoomOut, Maximize2, Wand2,
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { useApp } from '../context/AppContext'
import styles from './Studio.module.css'

const FORMATS = [
  { id: 'story',     label: 'Story',     ratio: '9:16',   w: 1080, h: 1920, display: { w: 240, h: 426 }, platform: 'Instagram · TikTok · Snapchat', mobile: true  },
  { id: 'portrait',  label: 'Portrait',  ratio: '4:5',    w: 1080, h: 1350, display: { w: 292, h: 365 }, platform: 'Instagram · Facebook',          mobile: true  },
  { id: 'square',    label: 'Square',    ratio: '1:1',    w: 1080, h: 1080, display: { w: 360, h: 360 }, platform: 'Instagram · Facebook · Twitter', mobile: true  },
  { id: 'landscape', label: 'Landscape', ratio: '16:9',   w: 1920, h: 1080, display: { w: 500, h: 281 }, platform: 'YouTube · Twitter · LinkedIn',   mobile: false },
  { id: 'banner',    label: 'Banner',    ratio: '1.91:1', w: 1200, h: 628,  display: { w: 500, h: 262 }, platform: 'Facebook · Google Display',      mobile: false },
]

const MIN_CHAT_W = 280
const MAX_CHAT_W = 600

/* ── Mock stream for dev (no API key) ── */
async function* mockStream(text, delay = 18) {
  for (const char of text) {
    yield char
    await new Promise(r => setTimeout(r, delay))
  }
}

/* ── Convert image URL / blob URL → base64 data URI ── */
async function toBase64(url) {
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/* ── DeepSeek streaming ── */
async function* streamDeepSeek(messages, dna, imageBase64 = null) {
  const key = import.meta.env.VITE_DEEPSEEK_API_KEY
  const last = messages.at(-1)?.content || 'creative ad'

  if (!key || key === 'your_deepseek_key_here') {
    const mock = `On it. Here's your generation prompt:\n\n<prompt>Professional mobile ad, ${last}, bold typography, vibrant colors, clean layout, photorealistic, dramatic lighting, 9:16 vertical format</prompt>`
    yield* mockStream(mock)
    return
  }

  const sys = `You are a senior ad creative director. Be brief — max 2 sentences of commentary.
${dna?.brandName ? `Brand: ${dna.brandName}.` : ''}${dna?.industry ? ` Industry: ${dna.industry}.` : ''}${dna?.toneOfVoice ? ` Tone: ${dna.toneOfVoice}.` : ''}${dna?.usp ? ` USP: ${dna.usp}.` : ''}
${imageBase64 ? 'A reference image has been provided — match its style, colors and composition.' : ''}
After your 2-sentence commentary, output ONLY <prompt>…</prompt> with NO heading, label, or extra text before or after it.`

  // Build the last user message — include image if present
  const builtMessages = messages.map((m, i) => {
    if (imageBase64 && m.role === 'user' && i === messages.length - 1) {
      return {
        role: 'user',
        content: [
          { type: 'text', text: m.content },
          { type: 'image_url', image_url: { url: imageBase64 } },
        ],
      }
    }
    return m
  })

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'system', content: sys }, ...builtMessages],
      temperature: 0.7,
      stream: true,
      max_tokens: 300,
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

  const [format, setFormat]       = useState(FORMATS[0])
  const [chatWidth, setChatWidth] = useState(null) // null = 50% (CSS default)
  const [hasContent, setHasContent] = useState(false)
  const [lastGenUrl, setLastGenUrl] = useState(null)

  const canvasContainerRef = useRef(null)   // React-managed div
  const fabricRef = useRef(null)            // Fabric canvas instance
  const [zoom, setZoom]           = useState(100)
  const [activeObj, setActiveObj] = useState(null)

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

  const [messages, setMessages] = useState(() => [
    { role: 'assistant', content: '' }, // filled by effect below
  ])

  useEffect(() => {
    setMessages([{ role: 'assistant', content: welcomeMessage }])
  }, [welcomeMessage])
  const [input, setInput]           = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [genLoading, setGenLoading]   = useState(false)
  const [lastPrompt, setLastPrompt]   = useState('')
  const messagesEndRef = useRef(null)

  const [refImage, setRefImage]             = useState(null)
  const [showRefPicker, setShowRefPicker]   = useState(false)

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

  /* ── Init canvas on format change ── */
  useEffect(() => {
    let mounted = true
    async function init() {
      if (!fabricLib) {
        const mod = await import('fabric')
        fabricLib = mod.fabric || mod.default
      }
      if (!mounted || !canvasContainerRef.current) return

      // Dispose previous Fabric instance
      if (fabricRef.current) {
        fabricRef.current.dispose()
        fabricRef.current = null
      }

      // Clear container and create a fresh canvas element — React never owns this node
      canvasContainerRef.current.innerHTML = ''
      const canvasEl = document.createElement('canvas')
      canvasContainerRef.current.appendChild(canvasEl)

      const { w, h } = format.display
      const canvas = new fabricLib.Canvas(canvasEl, {
        width: w, height: h, backgroundColor: '#ffffff', preserveObjectStacking: true,
      })
      fabricRef.current = canvas
      canvas.on('selection:created', () => setActiveObj(canvas.getActiveObject()))
      canvas.on('selection:updated', () => setActiveObj(canvas.getActiveObject()))
      canvas.on('selection:cleared', () => setActiveObj(null))
      setActiveObj(null)
    }
    init()
    return () => { mounted = false }
  }, [format])

  function placeImage(url) {
    const canvas = fabricRef.current
    if (!canvas || !fabricLib) return
    fabricLib.Image.fromURL(url, img => {
      const { w, h } = format.display
      const scale = Math.min(w / img.width, h / img.height, 1)
      img.set({
        left: w / 2, top: h / 2,
        originX: 'center', originY: 'center',
        scaleX: scale, scaleY: scale,
        selectable: true, hasControls: true, hasBorders: true,
        cornerColor: '#f97316', cornerSize: 10, transparentCorners: false,
        borderColor: '#f97316',
      })
      canvas.clear()
      canvas.setBackgroundColor('#ffffff', () => {})
      canvas.add(img)
      canvas.setActiveObject(img)
      canvas.renderAll()
      setHasContent(true)
      setLastGenUrl(url)

      // Save to Ads Library
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
    const url = canvas.toDataURL({ format: 'png', multiplier: format.w / format.display.w })
    Object.assign(document.createElement('a'), { href: url, download: `ad-${format.id}-${Date.now()}.png` }).click()
  }
  function exportJPG() {
    const canvas = fabricRef.current; if (!canvas) return
    const url = canvas.toDataURL({ format: 'jpeg', quality: 0.92, multiplier: format.w / format.display.w })
    Object.assign(document.createElement('a'), { href: url, download: `ad-${format.id}-${Date.now()}.jpg` }).click()
  }

  async function sendMessage(e) {
    e?.preventDefault()
    const text = input.trim(); if (!text || chatLoading) return

    // Convert reference image to base64 so DeepSeek can read it
    let imageBase64 = null
    if (refImage?.url) {
      try { imageBase64 = await toBase64(refImage.url) } catch {}
    }

    const next = [...messages, { role: 'user', content: text }]
    setMessages([...next, { role: 'assistant', content: '' }])
    setInput('')
    setChatLoading(true)
    let full = ''
    let promptStarted = false

    try {
      for await (const chunk of streamDeepSeek(next, dna, imageBase64)) {
        full += chunk

        // Once <prompt> tag starts, stop updating the visible bubble
        if (!promptStarted) {
          const cutoff = full.indexOf('<prompt>')
          if (cutoff === -1) {
            // Still in commentary — stream it normally
            setMessages(m => {
              const copy = [...m]
              copy[copy.length - 1] = { role: 'assistant', content: full }
              return copy
            })
          } else {
            // <prompt> has started — freeze bubble at the commentary part
            promptStarted = true
            const visible = full.slice(0, cutoff).trim()
            setMessages(m => {
              const copy = [...m]
              copy[copy.length - 1] = { role: 'assistant', content: visible }
              return copy
            })
          }
        }
      }

      const match = full.match(/<prompt>([\s\S]*?)<\/prompt>/)
      if (match) setLastPrompt(match[1].trim())
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

      {/* ── Format bar ── */}
      <div className={styles.formatBar}>
        <div className={styles.formatBarLeft}>
          <span className={styles.formatBarLabel}>Format</span>
          <div className={styles.formatTabs}>
            {FORMATS.map(f => (
              <button
                key={f.id}
                className={`${styles.formatTab} ${format.id === f.id ? styles.formatTabActive : ''}`}
                onClick={() => { setFormat(f); setHasContent(false) }}
              >
                {f.mobile ? <Smartphone size={11} /> : <Monitor size={11} />}
                {f.label}
                <span className={styles.formatRatio}>{f.ratio}</span>
              </button>
            ))}
          </div>
        </div>
        <div className={styles.formatBarRight}>
          <span className={styles.formatPlatform}>{format.platform}</span>
          {hasContent && (
            <>
              <button className="btn btn-outline btn-sm" onClick={exportJPG}><Download size={13} /> JPG</button>
              <button className="btn btn-primary btn-sm" onClick={exportPNG}><Download size={13} /> PNG</button>
            </>
          )}
        </div>
      </div>

      {/* ── Workspace ── */}
      <div className={styles.workspace}>

        {/* Chat panel — 50% default, draggable */}
        <div className={styles.chatPanel} style={chatWidth ? { width: chatWidth } : {}}>

          {/* Reference image */}
          <div className={styles.refSection}>
            <div className={styles.refHeader}>
              <span className={styles.panelLabel}>Reference Image</span>
              {refImage && <button className={styles.clearRef} onClick={() => setRefImage(null)}><X size={12} /> Remove</button>}
            </div>

            {refImage ? (
              <div className={styles.refPreview}>
                <img src={refImage.url} alt="reference" />
                <span className={styles.refName}>{refImage.name}</span>
              </div>
            ) : (
              <div className={styles.refPicker}>
                <button className={styles.refPickerBtn} onClick={() => setShowRefPicker(v => !v)}>
                  <ImageIcon size={13} /> Pick from library
                </button>
                <span className={styles.refOr}>or</span>
                <div {...getRootProps()} className={`${styles.refDrop} ${isDragActive ? styles.refDropActive : ''}`}>
                  <input {...getInputProps()} />
                  <Upload size={13} /> <span>Drop</span>
                </div>
              </div>
            )}

            {showRefPicker && (
              <div className={styles.libPicker}>
                <div className={styles.libPickerGrid}>
                  {ads.map(ad => (
                    <button key={ad.id} className={styles.libPickerItem}
                      onClick={() => { setRefImage({ url: ad.thumbnail, name: ad.title }); setShowRefPicker(false) }}>
                      <img src={ad.thumbnail} alt={ad.title} />
                      <span>{ad.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className={styles.chatMessages}>
            {messages.map((m, i) => (
              <div key={i} className={`${styles.chatMsg} ${m.role === 'user' ? styles.chatMsgUser : styles.chatMsgAI}`}>
                {m.role === 'assistant' && <div className={styles.chatAvatar}><Sparkles size={11} /></div>}
                <div className={styles.chatBubble}>
                  {m.content
                    .replace(/<prompt>[\s\S]*?<\/prompt>/g, '')
                    .trimEnd()
                    .split('\n')
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

          {/* Input */}
          <form className={styles.chatInput} onSubmit={sendMessage}>
            <textarea
              className={styles.chatTextarea}
              placeholder={`Describe your ${format.label} ad…`}
              value={input}
              rows={3}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            />
            <div className={styles.chatActions}>
              <button type="button" className={styles.quickGenBtn}
                onClick={() => generateImage(input)} disabled={!input.trim() || genLoading}
                title="Generate directly">
                {genLoading ? <RefreshCw size={13} className={styles.spin} /> : <Wand2 size={13} />}
              </button>
              <button type="submit" className={styles.sendBtn} disabled={!input.trim() || chatLoading} title="Refine with AI">
                <Send size={13} />
              </button>
            </div>
          </form>
        </div>

        {/* Resize handle */}
        <div className={styles.resizeHandle} onMouseDown={onResizeMouseDown} />

        {/* Canvas area */}
        <div className={styles.canvasArea}>
          <div className={styles.canvasScroll}>

            {/* Empty state — no frame shown yet */}
            {!hasContent && !genLoading && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}><Wand2 size={28} /></div>
                <p className={styles.emptyTitle}>Your canvas is ready</p>
                <p className={styles.emptyHint}>Describe your ad in the chat and click <strong>Generate Ad</strong></p>
              </div>
            )}

            {/* Canvas frame — shown during loading (skeleton) AND when has content */}
            <div className={styles.canvasOuter} style={{ visibility: (!hasContent && !genLoading) ? 'hidden' : 'visible' }}>

              <div className={styles.canvasWrap}>
                {/* Skeleton shimmer — sibling to the container, never touches Fabric's DOM */}
                {genLoading && <div className={styles.skeleton} />}
                {/* React only manages this div; Fabric owns everything inside it */}
                <div
                  ref={canvasContainerRef}
                  style={{ opacity: genLoading ? 0 : 1, transition: 'opacity .3s', lineHeight: 0 }}
                />
              </div>

              {/* Generating label under frame */}
              {genLoading && (
                <div className={styles.genLabel}>
                  <div className={styles.genDot} /><div className={styles.genDot} /><div className={styles.genDot} />
                  <span>Generating…</span>
                </div>
              )}

              {!genLoading && hasContent && (
                <div className={styles.canvasMeta}>
                  <span>{format.w} × {format.h} px</span>
                  <span className={styles.dot} />
                  <span>{format.ratio}</span>
                </div>
              )}
            </div>
          </div>

          {/* Floating selection toolbar */}
          {activeObj && hasContent && (
            <div className={styles.selectionBar}>
              <span className={styles.selectionHint}>
                Drag to move · handles to resize
              </span>
              <div className={styles.selectionActions}>
                <button className={styles.selActionBtn} onClick={exportPNG}>
                  <Download size={12} /> PNG
                </button>
                <button className={styles.selActionBtn} onClick={exportJPG}>
                  <Download size={12} /> JPG
                </button>
                <button className={`${styles.selActionBtn} ${styles.selActionDanger}`} onClick={deleteSelected}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          )}

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
