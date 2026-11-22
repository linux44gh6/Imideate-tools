'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { ArrowDownToLine, ArrowRight, Check, ChevronDown, Clock3, Copy, FileImage, FileText, Moon, QrCode, Search, ShieldCheck, Sparkles, Sun, WandSparkles, X } from 'lucide-react'

type ToolId = 'image' | 'qr' | 'text' | 'age'
const tools: { id: ToolId; title: string; description: string; icon: typeof FileImage; category: string }[] = [
  { id: 'image', title: 'Image compressor', description: 'Shrink image files without the wait.', icon: FileImage, category: 'Image tools' },
  { id: 'qr', title: 'QR code generator', description: 'Create a custom QR code in seconds.', icon: QrCode, category: 'Image tools' },
  { id: 'text', title: 'Word & character counter', description: 'Get a clearer picture of your writing.', icon: FileText, category: 'Text tools' },
  { id: 'age', title: 'Age & date calculator', description: 'Find the exact time between two dates.', icon: Clock3, category: 'Calculators' },
]
const faq = [
  ['Are these tools really free?', 'Yes. QuickToolsHub tools are free to use, with no account required.'],
  ['Are my files uploaded to a server?', 'No. Image compression and QR generation happen in your browser. Your files and text stay on your device.'],
  ['Which image formats can I compress?', 'The image compressor accepts JPG, PNG, and WebP files. The output is a downloadable WebP image.'],
  ['How is reading time estimated?', 'Reading time is estimated at 200 words per minute, a commonly used average reading pace.'],
]

function AdSlot({ size }: { size: string }) {
  return <div className="ad-slot" aria-label="Advertisement placement"><span>ADVERTISEMENT</span><div>{size}</div></div>
}

function ImageCompressor() {
  const [file, setFile] = useState<File | null>(null)
  const [quality, setQuality] = useState(72)
  const [output, setOutput] = useState<string>('')
  const [outputSize, setOutputSize] = useState(0)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!file) return
    let active = true
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const context = canvas.getContext('2d')
      if (!context) { setError('Your browser could not process this image.'); return }
      context.drawImage(image, 0, 0)
      canvas.toBlob((blob) => {
        if (blob && active) { setOutput(URL.createObjectURL(blob)); setOutputSize(blob.size); setError('') }
      }, 'image/webp', quality / 100)
      URL.revokeObjectURL(url)
    }
    image.onerror = () => { setError('That image could not be opened.'); URL.revokeObjectURL(url) }
    image.src = url
    return () => { active = false; URL.revokeObjectURL(url) }
  }, [file, quality])
  const onFile = (selected?: File) => {
    if (!selected) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) { setError('Choose a JPG, PNG, or WebP image.'); return }
    setFile(selected); setError('')
  }
  return <div className="tool-columns">
    <div className="tool-main">
      <label className="field-label" htmlFor="quality">Compression quality <strong>{quality}%</strong></label>
      <input id="quality" className="range" type="range" min="10" max="95" value={quality} onChange={(e) => setQuality(Number(e.target.value))} />
      <button className="upload-box" onClick={() => inputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]) }}>
        <span className="upload-icon"><FileImage size={22} /></span><strong>{file ? file.name : 'Drop your image here'}</strong><span>{file ? 'Choose another image' : 'or click to browse · JPG, PNG, WebP'}</span>
      </button>
      <input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onFile(e.target.files?.[0])} />
      {error && <p className="error-text" role="alert">{error}</p>}
      {file && output && <div className="image-result"><div className="image-preview"><img src={URL.createObjectURL(file)} alt="Original upload preview" /><img src={output} alt="Compressed image preview" /></div><div className="size-row"><span>Original <b>{formatBytes(file.size)}</b></span><ArrowRight size={15} /><span>Compressed <b>{formatBytes(outputSize)}</b></span></div><a className="button-primary full-button" href={output} download={`${file.name.replace(/\.[^.]+$/, '')}-compressed.webp`}><ArrowDownToLine size={17} /> Download compressed image</a></div>}
      {!file && <p className="privacy-note"><ShieldCheck size={15} /> Your image never leaves your device</p>}
    </div>
    <aside className="ad-side"><AdSlot size="300 × 250" /></aside>
  </div>
}

function formatBytes(bytes: number) { return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB` }

function QrGenerator() {
  const [text, setText] = useState('https://quicktoolshub.com')
  const [color, setColor] = useState('#3157d5')
  const [dataUrl, setDataUrl] = useState('')
  useEffect(() => { let alive = true; if (text.trim()) QRCode.toDataURL(text, { width: 240, margin: 2, color: { dark: color, light: '#ffffff' } }).then((url) => { if (alive) setDataUrl(url) }).catch(() => setDataUrl('')); return () => { alive = false } }, [text, color])
  return <div className="qr-layout"><div className="tool-main"><label className="field-label" htmlFor="qr-text">Your text or URL</label><textarea id="qr-text" className="text-input qr-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type or paste a link..." /><div className="color-control"><label htmlFor="qr-color">Foreground color</label><input id="qr-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} /><span>{color.toUpperCase()}</span></div><p className="privacy-note"><ShieldCheck size={15} /> Generated privately in your browser</p></div><div className="qr-preview">{dataUrl ? <img src={dataUrl} alt="Generated QR code" /> : <div className="qr-empty">Enter some text to create your QR code</div>}{dataUrl && <a className="button-primary full-button" href={dataUrl} download="quicktoolshub-qr.png"><ArrowDownToLine size={17} /> Download PNG</a>}</div></div>
}

function WordCounter() {
  const [text, setText] = useState('')
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const sentences = text.trim() ? text.split(/[.!?]+/).filter((part) => part.trim()).length : 0
  const copy = async () => { try { await navigator.clipboard.writeText(text) } catch { /* Clipboard can be unavailable on insecure origins. */ } }
  return <div className="tool-main text-tool"><label className="field-label" htmlFor="word-text">Your text</label><textarea id="word-text" className="text-input word-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Start typing or paste your text here..." /><div className="text-actions"><button className="button-quiet" onClick={() => setText(text.toUpperCase())}>UPPERCASE</button><button className="button-quiet" onClick={() => setText(text.toLowerCase())}>lowercase</button><button className="button-quiet" onClick={copy}><Copy size={15} /> Copy text</button><button className="button-quiet clear-button" onClick={() => setText('')}>Clear</button></div><div className="stats-grid"><div><b>{words}</b><span>Words</span></div><div><b>{text.length}</b><span>Characters</span></div><div><b>{sentences}</b><span>Sentences</span></div><div><b>{Math.ceil(words / 200)} min</b><span>Reading time</span></div></div></div>
}

function AgeCalculator() {
  const today = new Date().toISOString().slice(0, 10)
  const [birth, setBirth] = useState('1995-06-15')
  const [target, setTarget] = useState(today)
  const result = useMemo(() => {
    if (!birth || !target || new Date(birth) > new Date(target)) return null
    const start = new Date(`${birth}T00:00:00`), end = new Date(`${target}T00:00:00`)
    let years = end.getFullYear() - start.getFullYear(), months = end.getMonth() - start.getMonth(), days = end.getDate() - start.getDate()
    if (days < 0) { months--; days += new Date(end.getFullYear(), end.getMonth(), 0).getDate() }
    if (months < 0) { years--; months += 12 }
    return { years, months, days }
  }, [birth, target])
  return <div className="tool-main"><div className="date-fields"><div><label className="field-label" htmlFor="birth">Date of birth</label><input id="birth" className="text-input" type="date" value={birth} max={target} onChange={(e) => setBirth(e.target.value)} /></div><div><label className="field-label" htmlFor="target">Calculate age on</label><input id="target" className="text-input" type="date" value={target} min={birth} onChange={(e) => setTarget(e.target.value)} /></div></div>{result ? <div className="age-result"><span>That&apos;s exactly</span><div className="age-numbers"><div><b>{result.years}</b><span>years</span></div><div><b>{result.months}</b><span>months</span></div><div><b>{result.days}</b><span>days</span></div></div></div> : <p className="error-text" role="alert">Choose a target date on or after the date of birth.</p>}<p className="privacy-note"><ShieldCheck size={15} /> Dates are calculated on your device</p></div>
}

function ActiveTool({ id }: { id: ToolId }) { return id === 'image' ? <ImageCompressor /> : id === 'qr' ? <QrGenerator /> : id === 'text' ? <WordCounter /> : <AgeCalculator /> }

export function UtilityHub() {
  const [active, setActive] = useState<ToolId>('image')
  const [query, setQuery] = useState('')
  const [dark, setDark] = useState(false)
  const [policy, setPolicy] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const visibleTools = tools.filter((tool) => `${tool.title} ${tool.category} ${tool.description}`.toLowerCase().includes(query.toLowerCase()))
  const selectedTool = tools.find((tool) => tool.id === active)!
  return <div className={`site-shell${dark ? ' dark-mode' : ''}`}>
    <header className="site-header"><a className="brand" href="#top" aria-label="QuickToolsHub home"><span className="brand-mark"><WandSparkles size={19} /></span><span>QuickTools<span className="brand-accent">Hub</span></span></a><nav className="desktop-nav" aria-label="Tool categories"><a href="#tools" onClick={() => setQuery('Image tools')}>Image tools</a><a href="#tools" onClick={() => setQuery('Text tools')}>Text tools</a><a href="#tools" onClick={() => setQuery('Calculators')}>Calculators</a></nav><div className="header-actions"><button className="theme-toggle" onClick={() => setDark(!dark)} aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button><a className="header-cta" href="#tools">Explore tools <ArrowRight size={15} /></a></div></header>
    <main id="top"><section className="hero"><div className="hero-badge"><Sparkles size={14} /> YOUR EVERYDAY TOOLKIT</div><h1>Free online tools to make<br className="desktop-break" /> your daily tasks <span>faster.</span></h1><p>Compress images, generate QR codes, count words, and calculate instantly—100% free in your browser.</p><label className="search-box"><Search size={19} /><input aria-label="Search tools" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="What do you need to get done?" /><kbd>⌘ K</kbd></label><div className="hero-proof"><span><Check size={14} /> No sign-up</span><span><Check size={14} /> 100% free</span><span><Check size={14} /> Private by design</span></div></section>
    <div className="leaderboard-wrap">{/* ADSTERRA_BANNER_SLOT */}<AdSlot size="728 × 90" /></div>
    <section id="tools" className="tools-section"><div className="section-heading"><div><span className="eyebrow">THE TOOLBOX</span><h2>One hub. A little less busy.</h2><p>Simple tools for the little tasks that add up.</p></div><span className="tools-count">{visibleTools.length} tools <span className="live-dot" /></span></div><div className="tool-layout"><div className="tool-list" role="tablist" aria-label="Available tools">{visibleTools.map((tool) => { const Icon = tool.icon; return <button key={tool.id} role="tab" aria-selected={active === tool.id} className={`tool-option${active === tool.id ? ' selected' : ''}`} onClick={() => setActive(tool.id)}><span className="tool-icon"><Icon size={19} /></span><span className="tool-copy"><b>{tool.title}</b><small>{tool.description}</small></span><ArrowRight className="tool-arrow" size={16} /></button> })}{visibleTools.length === 0 && <p className="empty-search">No tools found. Try a different search.</p>}</div>{visibleTools.some((tool) => tool.id === active) ? <section className="workspace-card" role="tabpanel" aria-label={selectedTool.title}><div className="workspace-top"><div className="workspace-icon"><selectedTool.icon size={20} /></div><div><h3>{selectedTool.title}</h3><p>{selectedTool.description}</p></div><span className="secure-tag"><ShieldCheck size={13} /> Private</span></div><div className="workspace-content"><ActiveTool key={active} id={active} /></div></section> : <section className="workspace-card empty-workspace"><Sparkles size={24} /><h3>Pick a tool to get started</h3><p>Choose one of the tools on the left or update your search.</p></section>}</div></section>
    <div className="native-ad-wrap">{/* ADSTERRA_BANNER_SLOT */}<AdSlot size="Native banner" /></div>
    <section className="why-section"><div className="section-heading centered"><span className="eyebrow">MADE FOR YOUR EVERYDAY</span><h2>Useful tools. No extra fuss.</h2><p>Everything you need, without the things you don&apos;t.</p></div><div className="feature-grid"><article><span className="feature-icon"><ShieldCheck size={21} /></span><h3>Private by default</h3><p>Your files and text stay in your browser. We don&apos;t upload or store your content.</p></article><article><span className="feature-icon"><WandSparkles size={21} /></span><h3>Simple, not simplistic</h3><p>Thoughtful tools that do one thing well, with no learning curve or clutter.</p></article><article><span className="feature-icon"><Clock3 size={21} /></span><h3>Ready when you are</h3><p>No accounts, no downloads, no waiting around. Just open a tool and get going.</p></article></div></section>
    <section className="faq-section"><div className="faq-intro"><span className="eyebrow">GOOD TO KNOW</span><h2>Frequently asked questions</h2><p>A few helpful details before you get started.</p></div><div className="faq-list">{faq.map(([question, answer], index) => <div className="faq-item" key={question}><button aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? null : index)}>{question}<ChevronDown className={openFaq === index ? 'rotated' : ''} size={18} /></button>{openFaq === index && <p>{answer}</p>}</div>)}</div></section></main>
    <footer className="site-footer"><a className="brand footer-brand" href="#top"><span className="brand-mark"><WandSparkles size={17} /></span><span>QuickTools<span className="brand-accent">Hub</span></span></a><span className="copyright">© 2026 QuickToolsHub. Made for the little things.</span><div className="footer-links"><button onClick={() => setPolicy('Privacy Policy')}>Privacy</button><button onClick={() => setPolicy('Terms of Service')}>Terms</button><button onClick={() => setPolicy('Disclaimer')}>Disclaimer</button><button onClick={() => setPolicy('Contact')}>Contact</button></div></footer>
    {policy && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setPolicy('') }}><section className="policy-modal" role="dialog" aria-modal="true" aria-labelledby="policy-title"><button className="modal-close" onClick={() => setPolicy('')} aria-label="Close"><X size={19} /></button><span className="eyebrow">QUICKTOOLSHUB</span><h2 id="policy-title">{policy}</h2>{policy === 'Privacy Policy' ? <p>QuickToolsHub processes your selected files and text locally in your browser. We do not upload or retain the content you use with these tools. Basic website analytics or advertising partners may use cookies where enabled. Contact us to ask about privacy practices.</p> : policy === 'Terms of Service' ? <p>QuickToolsHub tools are provided free of charge and on an “as is” basis. You are responsible for keeping copies of important files and checking any output before relying on it. Use of this site must comply with applicable laws.</p> : policy === 'Disclaimer' ? <p>Calculations and generated files are provided for general informational use. Results may vary by browser and should not replace professional advice or verification for important decisions.</p> : <p>Questions or feedback? Email <a href="mailto:hello@quicktoolshub.com">hello@quicktoolshub.com</a>.</p>}<button className="button-primary modal-done" onClick={() => setPolicy('')}>Got it</button></section></div>}
  </div>
}
