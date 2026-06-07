import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ZoomIn, ZoomOut, RotateCcw, Download, Copy,
  Move, Crop, Trash2, Layers, ChevronLeft,
  Maximize2, Upload, FlipHorizontal, FlipVertical,
  Bold, Italic, AlignLeft, AlignCenter, AlignRight,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import styles from './CloneCanvas.module.css'

/* ── fabric is loaded dynamically to avoid SSR issues ── */
let fabricLib = null

export default function CloneCanvas() {
  const { activeCanvasAd, dna } = useApp()
  const navigate = useNavigate()
  const canvasEl = useRef(null)
  const fabricRef = useRef(null)
  const [zoom, setZoom] = useState(100)
  const [activeObj, setActiveObj] = useState(null)
  const [ready, setReady] = useState(false)
  const [layers, setLayers] = useState([])
  const [showLayers, setShowLayers] = useState(true)
  const fileRef = useRef(null)

  /* ── Init Fabric ── */
  useEffect(() => {
    let mounted = true

    async function init() {
      if (!fabricLib) {
        const mod = await import('fabric')
        fabricLib = mod.fabric || mod.default
      }
      if (!mounted || !canvasEl.current) return

      const canvas = new fabricLib.Canvas(canvasEl.current, {
        width: 800,
        height: 500,
        backgroundColor: '#ffffff',
        preserveObjectStacking: true,
      })

      fabricRef.current = canvas

      // Load ad image if present
      if (activeCanvasAd?.thumbnail) {
        fabricLib.Image.fromURL(
          activeCanvasAd.thumbnail,
          img => {
            if (!mounted) return
            const scale = Math.min(800 / img.width, 500 / img.height, 1)
            img.set({ left: 400, top: 250, originX: 'center', originY: 'center', scaleX: scale, scaleY: scale })
            canvas.add(img)
            canvas.setActiveObject(img)
            canvas.renderAll()
            syncLayers(canvas)
          },
          { crossOrigin: 'anonymous' }
        )
      } else {
        // Default empty canvas with placeholder text
        const txt = new fabricLib.Text('Drop or upload your ad image', {
          left: 400, top: 250,
          originX: 'center', originY: 'center',
          fontSize: 20, fill: '#a3a3a3',
          fontFamily: 'Inter',
          selectable: false,
        })
        canvas.add(txt)
        canvas.renderAll()
      }

      canvas.on('selection:created',  () => { setActiveObj(canvas.getActiveObject()); syncLayers(canvas) })
      canvas.on('selection:updated',  () => { setActiveObj(canvas.getActiveObject()); syncLayers(canvas) })
      canvas.on('selection:cleared',  () => { setActiveObj(null) })
      canvas.on('object:modified',    () => syncLayers(canvas))
      canvas.on('object:added',       () => syncLayers(canvas))
      canvas.on('object:removed',     () => syncLayers(canvas))

      setReady(true)
      syncLayers(canvas)
    }

    init()

    return () => {
      mounted = false
      if (fabricRef.current) {
        fabricRef.current.dispose()
        fabricRef.current = null
      }
    }
  }, [])

  function syncLayers(canvas) {
    const objs = canvas.getObjects().map((o, i) => ({
      id: i,
      type: o.type,
      label: o.type === 'text' || o.type === 'i-text' ? o.text?.slice(0, 20) : `${o.type} ${i + 1}`,
    }))
    setLayers([...objs].reverse())
  }

  /* ── Zoom ── */
  function handleZoom(delta) {
    const canvas = fabricRef.current
    if (!canvas) return
    const newZoom = Math.min(Math.max(zoom + delta, 20), 300)
    canvas.setZoom(newZoom / 100)
    setZoom(newZoom)
  }

  /* ── Reset ── */
  function resetZoom() {
    const canvas = fabricRef.current
    if (!canvas) return
    canvas.setZoom(1)
    canvas.viewportTransform = [1,0,0,1,0,0]
    canvas.renderAll()
    setZoom(100)
  }

  /* ── Add Text ── */
  function addText() {
    const canvas = fabricRef.current
    if (!canvas || !fabricLib) return
    const txt = new fabricLib.IText('Edit this text', {
      left: 200, top: 200,
      fontSize: 24, fill: dna?.primaryColor || '#F97316',
      fontFamily: dna?.fontHeading || 'Inter',
      fontWeight: 'bold',
    })
    canvas.add(txt)
    canvas.setActiveObject(txt)
    canvas.renderAll()
  }

  /* ── Upload Image ── */
  function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file || !fabricLib) return
    const reader = new FileReader()
    reader.onload = ev => {
      fabricLib.Image.fromURL(ev.target.result, img => {
        const canvas = fabricRef.current
        if (!canvas) return
        const scale = Math.min(600 / img.width, 400 / img.height, 1)
        img.set({ left: 400, top: 250, originX: 'center', originY: 'center', scaleX: scale, scaleY: scale })
        canvas.add(img)
        canvas.setActiveObject(img)
        canvas.renderAll()
      })
    }
    reader.readAsDataURL(file)
  }

  /* ── Delete selected ── */
  function deleteSelected() {
    const canvas = fabricRef.current
    if (!canvas) return
    const obj = canvas.getActiveObject()
    if (obj) { canvas.remove(obj); canvas.renderAll() }
  }

  /* ── Flip ── */
  function flipX() {
    const obj = fabricRef.current?.getActiveObject()
    if (obj) { obj.set({ flipX: !obj.flipX }); fabricRef.current.renderAll() }
  }
  function flipY() {
    const obj = fabricRef.current?.getActiveObject()
    if (obj) { obj.set({ flipY: !obj.flipY }); fabricRef.current.renderAll() }
  }

  /* ── Bring/Send ── */
  function bringForward() {
    const canvas = fabricRef.current
    const obj = canvas?.getActiveObject()
    if (canvas && obj) { canvas.bringForward(obj); canvas.renderAll() }
  }
  function sendBackward() {
    const canvas = fabricRef.current
    const obj = canvas?.getActiveObject()
    if (canvas && obj) { canvas.sendBackwards(obj); canvas.renderAll() }
  }

  /* ── Export ── */
  function exportPNG() {
    const canvas = fabricRef.current
    if (!canvas) return
    const url = canvas.toDataURL({ format: 'png', multiplier: 2 })
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeCanvasAd?.title || 'ad-clone'}.png`
    a.click()
  }

  /* ── Text formatting ── */
  function setFontWeight(w) {
    const obj = fabricRef.current?.getActiveObject()
    if (obj && (obj.type === 'i-text' || obj.type === 'text')) {
      obj.set({ fontWeight: obj.fontWeight === w ? 'normal' : w })
      fabricRef.current.renderAll()
    }
  }
  function setTextAlign(a) {
    const obj = fabricRef.current?.getActiveObject()
    if (obj) { obj.set({ textAlign: a }); fabricRef.current.renderAll() }
  }

  const isText = activeObj?.type === 'text' || activeObj?.type === 'i-text'

  return (
    <div className={styles.page}>

      {/* Top bar */}
      <div className={styles.topBar}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/library')}>
          <ChevronLeft size={16} /> Library
        </button>
        <div className={styles.topBarTitle}>
          {activeCanvasAd ? (
            <><span className={styles.topBarLabel}>Cloning:</span> {activeCanvasAd.title}</>
          ) : 'New Canvas'}
        </div>
        <div className={styles.topBarActions}>
          <button className="btn btn-outline btn-sm" onClick={exportPNG}>
            <Download size={14} /> Export PNG
          </button>
          <button className="btn btn-primary btn-sm">
            <Copy size={14} /> Save Clone
          </button>
        </div>
      </div>

      <div className={styles.workspace}>

        {/* Left toolbar */}
        <div className={styles.leftBar}>
          <p className={styles.toolbarLabel}>Add</p>
          <ToolBtn icon={<Bold size={16} />}   label="Add Text"   onClick={addText} />
          <ToolBtn icon={<Upload size={16} />} label="Upload Img" onClick={() => fileRef.current?.click()} />
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />

          <div className={styles.toolDivider} />
          <p className={styles.toolbarLabel}>Canvas</p>
          <ToolBtn icon={<ZoomIn size={16} />}    label="Zoom In"   onClick={() => handleZoom(10)} />
          <ToolBtn icon={<ZoomOut size={16} />}   label="Zoom Out"  onClick={() => handleZoom(-10)} />
          <ToolBtn icon={<Maximize2 size={16} />} label="Reset"     onClick={resetZoom} />

          <div className={styles.toolDivider} />
          <p className={styles.toolbarLabel}>Object</p>
          <ToolBtn icon={<FlipHorizontal size={16} />} label="Flip X"    onClick={flipX}        disabled={!activeObj} />
          <ToolBtn icon={<FlipVertical size={16} />}   label="Flip Y"    onClick={flipY}        disabled={!activeObj} />
          <ToolBtn icon={<Layers size={16} />}         label="Forward"   onClick={bringForward} disabled={!activeObj} />
          <ToolBtn icon={<Layers size={16} style={{ transform: 'scaleY(-1)' }} />} label="Backward" onClick={sendBackward} disabled={!activeObj} />
          <ToolBtn icon={<Trash2 size={16} />}         label="Delete"    onClick={deleteSelected} disabled={!activeObj}
            style={{ color: 'var(--red)' }} />

          {isText && (
            <>
              <div className={styles.toolDivider} />
              <p className={styles.toolbarLabel}>Text</p>
              <ToolBtn icon={<Bold size={16} />}        label="Bold"   onClick={() => setFontWeight('bold')} />
              <ToolBtn icon={<AlignLeft size={16} />}   label="Left"   onClick={() => setTextAlign('left')} />
              <ToolBtn icon={<AlignCenter size={16} />} label="Center" onClick={() => setTextAlign('center')} />
              <ToolBtn icon={<AlignRight size={16} />}  label="Right"  onClick={() => setTextAlign('right')} />
            </>
          )}
        </div>

        {/* Canvas area */}
        <div className={styles.canvasArea}>
          <div className={styles.canvasWrap}>
            <canvas ref={canvasEl} />
            {!ready && (
              <div className={styles.canvasLoading}>
                <div className={styles.spinner} />
                <p>Loading canvas…</p>
              </div>
            )}
          </div>

          {/* Zoom indicator */}
          <div className={styles.zoomBar}>
            <button onClick={() => handleZoom(-10)}><ZoomOut size={13} /></button>
            <span>{zoom}%</span>
            <button onClick={() => handleZoom(10)}><ZoomIn size={13} /></button>
            <button onClick={resetZoom} style={{ marginLeft: 4 }}><RotateCcw size={13} /></button>
          </div>
        </div>

        {/* Right panel */}
        <div className={styles.rightPanel}>

          {/* Layers */}
          <div className={styles.panelSection}>
            <button className={styles.panelToggle} onClick={() => setShowLayers(v => !v)}>
              <Layers size={14} /> Layers
              <span className={styles.layerCount}>{layers.length}</span>
            </button>
            {showLayers && (
              <div className={styles.layerList}>
                {layers.length === 0 && <p className={styles.emptyLayers}>No objects yet</p>}
                {layers.map((l, i) => (
                  <div key={i} className={styles.layerItem}>
                    <span className={styles.layerIcon}>{l.type === 'image' ? '🖼' : 'T'}</span>
                    <span className={styles.layerLabel}>{l.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Properties */}
          {activeObj && (
            <div className={styles.panelSection}>
              <p className={styles.panelTitle}>Properties</p>
              <div className={styles.propRow}>
                <span className={styles.propKey}>Type</span>
                <span className={styles.propVal}>{activeObj.type}</span>
              </div>
              <div className={styles.propRow}>
                <span className={styles.propKey}>W</span>
                <span className={styles.propVal}>{Math.round(activeObj.getScaledWidth())}px</span>
              </div>
              <div className={styles.propRow}>
                <span className={styles.propKey}>H</span>
                <span className={styles.propVal}>{Math.round(activeObj.getScaledHeight())}px</span>
              </div>
              <div className={styles.propRow}>
                <span className={styles.propKey}>X</span>
                <span className={styles.propVal}>{Math.round(activeObj.left)}px</span>
              </div>
              <div className={styles.propRow}>
                <span className={styles.propKey}>Y</span>
                <span className={styles.propVal}>{Math.round(activeObj.top)}px</span>
              </div>
              {isText && (
                <>
                  <div className={styles.propRow}>
                    <span className={styles.propKey}>Size</span>
                    <input
                      type="number" className={`input ${styles.propInput}`}
                      value={activeObj.fontSize || 16}
                      onChange={e => {
                        activeObj.set({ fontSize: +e.target.value })
                        fabricRef.current.renderAll()
                      }}
                    />
                  </div>
                  <div className={styles.propRow}>
                    <span className={styles.propKey}>Color</span>
                    <input
                      type="color" className={styles.colorPick}
                      value={activeObj.fill || '#000000'}
                      onChange={e => {
                        activeObj.set({ fill: e.target.value })
                        fabricRef.current.renderAll()
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Brand DNA hint */}
          {dna?.brandName && (
            <div className={styles.dnaHint}>
              <div className={styles.dnaHintDot} style={{ background: dna.primaryColor }} />
              <div>
                <p className={styles.dnaHintTitle}>{dna.brandName}</p>
                <p className={styles.dnaHintSub}>Brand colors active</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Toolbar button ── */
function ToolBtn({ icon, label, onClick, disabled, style }) {
  return (
    <button
      className={styles.toolBtn}
      onClick={onClick}
      disabled={disabled}
      title={label}
      style={style}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
