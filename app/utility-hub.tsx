'use client'

import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import QRCode from 'qrcode'
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  FileImage,
  FileText,
  Moon,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  WandSparkles,
  X,
} from 'lucide-react'

/* -------------------------------------------------------------------------- */
/*  Data                                                                      */
/* -------------------------------------------------------------------------- */

type ToolId = 'image' | 'qr' | 'text' | 'age'

type Tool = {
  id: ToolId
  title: string
  description: string
  icon: ComponentType<{ size?: number }>
  category: string
}

const TOOLS: Tool[] = [
  { id: 'image', title: 'Image compressor', description: 'Shrink image files without the wait.', icon: FileImage, category: 'Image tools' },
  { id: 'qr', title: 'QR code generator', description: 'Create a custom QR code in seconds.', icon: QrCode, category: 'Image tools' },
  { id: 'text', title: 'Word & character counter', description: 'Get a clearer picture of your writing.', icon: FileText, category: 'Text tools' },
  { id: 'age', title: 'Age & date calculator', description: 'Find the exact time between two dates.', icon: Clock3, category: 'Calculators' },
]

const CATEGORIES = ['Image tools', 'Text tools', 'Calculators']

const FAQ = [
  { question: 'Are these tools really free?', answer: 'Yes. QuickToolsHub tools are free to use, with no account required.' },
  { question: 'Are my files uploaded to a server?', answer: 'No. Image compression and QR generation happen in your browser. Your files and text stay on your device.' },
  { question: 'Which image formats can I compress?', answer: 'The image compressor accepts JPG, PNG, and WebP files. The output is a downloadable WebP image.' },
  { question: 'How is reading time estimated?', answer: 'Reading time is estimated at 200 words per minute, a commonly used average reading pace.' },
]

const FEATURES = [
  { icon: ShieldCheck, title: 'Private by default', body: "Your files and text stay in your browser. We don't upload or store your content." },
  { icon: WandSparkles, title: 'Simple, not simplistic', body: 'Thoughtful tools that do one thing well, with no learning curve or clutter.' },
  { icon: Clock3, title: 'Ready when you are', body: 'No accounts, no downloads, no waiting around. Just open a tool and get going.' },
]

const POLICIES: Record<string, React.ReactNode> = {
  'Privacy Policy':
    'QuickToolsHub processes your selected files and text locally in your browser. We do not upload or retain the content you use with these tools. Basic website analytics or advertising partners may use cookies where enabled. Contact us to ask about privacy practices.',
  'Terms of Service':
    'QuickToolsHub tools are provided free of charge and on an “as is” basis. You are responsible for keeping copies of important files and checking any output before relying on it. Use of this site must comply with applicable laws.',
  Disclaimer:
    'Calculations and generated files are provided for general informational use. Results may vary by browser and should not replace professional advice or verification for important decisions.',
  Contact: (
    <>
      Questions or feedback? Email <a href="mailto:hello@quicktoolshub.com">hello@quicktoolshub.com</a>.
    </>
  ),
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const WORDS_PER_MINUTE = 200

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/** Today's date as YYYY-MM-DD in the user's local time zone (toISOString uses UTC). */
function localToday() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function calculateAge(birth: string, target: string) {
  if (!birth || !target || birth > target) return null

  const start = new Date(`${birth}T00:00:00`)
  const end = new Date(`${target}T00:00:00`)

  let years = end.getFullYear() - start.getFullYear()
  let months = end.getMonth() - start.getMonth()
  let days = end.getDate() - start.getDate()

  if (days < 0) {
    months--
    days += new Date(end.getFullYear(), end.getMonth(), 0).getDate()
  }
  if (months < 0) {
    years--
    months += 12
  }
  return { years, months, days }
}

/* -------------------------------------------------------------------------- */
/*  Shared UI                                                                 */
/* -------------------------------------------------------------------------- */

function AdSlot({ size }: { size: string }) {
  return (
    <div className="ad-slot" aria-label="Advertisement placement">
      <span>ADVERTISEMENT</span>
      <div>{size}</div>
    </div>
  )
}

function PrivacyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="privacy-note">
      <ShieldCheck size={15} /> {children}
    </p>
  )
}

function Brand({ iconSize, className = '' }: { iconSize: number; className?: string }) {
  return (
    <a className={`brand ${className}`.trim()} href="#top" aria-label="QuickToolsHub home">
      <span className="brand-mark">
        <WandSparkles size={iconSize} />
      </span>
      <span>
        QuickTools<span className="brand-accent">Hub</span>
      </span>
    </a>
  )
}

/* -------------------------------------------------------------------------- */
/*  Tools                                                                     */
/* -------------------------------------------------------------------------- */

function ImageCompressor() {
  const [file, setFile] = useState<File | null>(null)
  const [quality, setQuality] = useState(72)
  const [originalUrl, setOriginalUrl] = useState('')
  const [output, setOutput] = useState('')
  const [outputSize, setOutputSize] = useState(0)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Preview URL for the original file (created once per file, revoked on change).
  useEffect(() => {
    if (!file) {
      setOriginalUrl('')
      return
    }
    const url = URL.createObjectURL(file)
    setOriginalUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Re-compress whenever the file or quality changes.
  useEffect(() => {
    if (!file) return

    let active = true
    let compressedUrl = ''
    const sourceUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(sourceUrl)

      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight

      const context = canvas.getContext('2d')
      if (!context) {
        setError('Your browser could not process this image.')
        return
      }
      context.drawImage(image, 0, 0)

      canvas.toBlob(
        (blob) => {
          if (!blob || !active) return
          compressedUrl = URL.createObjectURL(blob)
          setOutput(compressedUrl)
          setOutputSize(blob.size)
          setError('')
        },
        'image/webp',
        quality / 100,
      )
    }

    image.onerror = () => {
      URL.revokeObjectURL(sourceUrl)
      setError('That image could not be opened.')
    }

    image.src = sourceUrl

    return () => {
      active = false
      URL.revokeObjectURL(sourceUrl)
      if (compressedUrl) URL.revokeObjectURL(compressedUrl)
    }
  }, [file, quality])

  const handleFile = (selected?: File) => {
    if (!selected) return
    if (!ACCEPTED_IMAGE_TYPES.includes(selected.type)) {
      setError('Choose a JPG, PNG, or WebP image.')
      return
    }
    setOutput('')
    setFile(selected)
    setError('')
  }

  const downloadName = file ? `${file.name.replace(/\.[^.]+$/, '')}-compressed.webp` : 'compressed.webp'

  return (
    <div className="tool-columns">
      <div className="tool-main">
        <label className="field-label" htmlFor="quality">
          Compression quality <strong>{quality}%</strong>
        </label>
        <input
          id="quality"
          className="range"
          type="range"
          min="10"
          max="95"
          value={quality}
          onChange={(e) => setQuality(Number(e.target.value))}
        />

        <button
          className="upload-box"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            handleFile(e.dataTransfer.files[0])
          }}
        >
          <span className="upload-icon">
            <FileImage size={22} />
          </span>
          <strong>{file ? file.name : 'Drop your image here'}</strong>
          <span>{file ? 'Choose another image' : 'or click to browse · JPG, PNG, WebP'}</span>
        </button>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}

        {file && output && (
          <div className="image-result">
            <div className="image-preview">
              <img src={originalUrl} alt="Original upload preview" />
              <img src={output} alt="Compressed image preview" />
            </div>
            <div className="size-row">
              <span>
                Original <b>{formatBytes(file.size)}</b>
              </span>
              <ArrowRight size={15} />
              <span>
                Compressed <b>{formatBytes(outputSize)}</b>
              </span>
            </div>
            <a className="button-primary full-button" href={output} download={downloadName}>
              <ArrowDownToLine size={17} /> Download compressed image
            </a>
          </div>
        )}

        {!file && <PrivacyNote>Your image never leaves your device</PrivacyNote>}
      </div>

      <aside className="ad-side">
        <AdSlot size="300 × 250" />
      </aside>
    </div>
  )
}

function QrGenerator() {
  const [text, setText] = useState('https://quicktoolshub.com')
  const [color, setColor] = useState('#3157d5')
  const [dataUrl, setDataUrl] = useState('')

  useEffect(() => {
    if (!text.trim()) {
      setDataUrl('')
      return
    }

    let alive = true
    QRCode.toDataURL(text, { width: 240, margin: 2, color: { dark: color, light: '#ffffff' } })
      .then((url) => alive && setDataUrl(url))
      .catch(() => alive && setDataUrl(''))

    return () => {
      alive = false
    }
  }, [text, color])

  return (
    <div className="qr-layout">
      <div className="tool-main">
        <label className="field-label" htmlFor="qr-text">
          Your text or URL
        </label>
        <textarea
          id="qr-text"
          className="text-input qr-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste a link..."
        />
        <div className="color-control">
          <label htmlFor="qr-color">Foreground color</label>
          <input id="qr-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          <span>{color.toUpperCase()}</span>
        </div>
        <PrivacyNote>Generated privately in your browser</PrivacyNote>
      </div>

      <div className="qr-preview">
        {dataUrl ? (
          <>
            <img src={dataUrl} alt="Generated QR code" />
            <a className="button-primary full-button" href={dataUrl} download="quicktoolshub-qr.png">
              <ArrowDownToLine size={17} /> Download PNG
            </a>
          </>
        ) : (
          <div className="qr-empty">Enter some text to create your QR code</div>
        )}
      </div>
    </div>
  )
}

function WordCounter() {
  const [text, setText] = useState('')

  const trimmed = text.trim()
  const words = trimmed ? trimmed.split(/\s+/).length : 0
  const sentences = trimmed ? text.split(/[.!?]+/).filter((part) => part.trim()).length : 0
  const readingMinutes = Math.ceil(words / WORDS_PER_MINUTE)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Clipboard can be unavailable on insecure origins.
    }
  }

  const stats = [
    { value: words, label: 'Words' },
    { value: text.length, label: 'Characters' },
    { value: sentences, label: 'Sentences' },
    { value: `${readingMinutes} min`, label: 'Reading time' },
  ]

  return (
    <div className="tool-main text-tool">
      <label className="field-label" htmlFor="word-text">
        Your text
      </label>
      <textarea
        id="word-text"
        className="text-input word-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Start typing or paste your text here..."
      />

      <div className="text-actions">
        <button className="button-quiet" onClick={() => setText(text.toUpperCase())}>
          UPPERCASE
        </button>
        <button className="button-quiet" onClick={() => setText(text.toLowerCase())}>
          lowercase
        </button>
        <button className="button-quiet" onClick={copy}>
          <Copy size={15} /> Copy text
        </button>
        <button className="button-quiet clear-button" onClick={() => setText('')}>
          Clear
        </button>
      </div>

      <div className="stats-grid">
        {stats.map(({ value, label }) => (
          <div key={label}>
            <b>{value}</b>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AgeCalculator() {
  const [birth, setBirth] = useState('1995-06-15')
  const [target, setTarget] = useState(localToday)
  const result = useMemo(() => calculateAge(birth, target), [birth, target])

  return (
    <div className="tool-main">
      <div className="date-fields">
        <div>
          <label className="field-label" htmlFor="birth">
            Date of birth
          </label>
          <input
            id="birth"
            className="text-input"
            type="date"
            value={birth}
            max={target}
            onChange={(e) => setBirth(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="target">
            Calculate age on
          </label>
          <input
            id="target"
            className="text-input"
            type="date"
            value={target}
            min={birth}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>
      </div>

      {result ? (
        <div className="age-result">
          <span>That&apos;s exactly</span>
          <div className="age-numbers">
            <div><b>{result.years}</b><span>years</span></div>
            <div><b>{result.months}</b><span>months</span></div>
            <div><b>{result.days}</b><span>days</span></div>
          </div>
        </div>
      ) : (
        <p className="error-text" role="alert">
          Choose a target date on or after the date of birth.
        </p>
      )}

      <PrivacyNote>Dates are calculated on your device</PrivacyNote>
    </div>
  )
}

const TOOL_COMPONENTS: Record<ToolId, ComponentType> = {
  image: ImageCompressor,
  qr: QrGenerator,
  text: WordCounter,
  age: AgeCalculator,
}

/* -------------------------------------------------------------------------- */
/*  Page sections                                                             */
/* -------------------------------------------------------------------------- */

function PolicyModal({ policy, onClose }: { policy: string; onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section className="policy-modal" role="dialog" aria-modal="true" aria-labelledby="policy-title">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={19} />
        </button>
        <span className="eyebrow">QUICKTOOLSHUB</span>
        <h2 id="policy-title">{policy}</h2>
        <p>{POLICIES[policy]}</p>
        <button className="button-primary modal-done" onClick={onClose}>
          Got it
        </button>
      </section>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                            */
/* -------------------------------------------------------------------------- */

export function UtilityHub() {
  const [active, setActive] = useState<ToolId>('image')
  const [query, setQuery] = useState('')
  const [dark, setDark] = useState(false)
  const [policy, setPolicy] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const normalizedQuery = query.toLowerCase()
  const visibleTools = TOOLS.filter((tool) =>
    `${tool.title} ${tool.category} ${tool.description}`.toLowerCase().includes(normalizedQuery),
  )

  const selectedTool = TOOLS.find((tool) => tool.id === active)!
  const SelectedIcon = selectedTool.icon
  const ActiveTool = TOOL_COMPONENTS[active]
  const isActiveVisible = visibleTools.some((tool) => tool.id === active)

  return (
    <div className={`site-shell${dark ? ' dark-mode' : ''}`}>
      {/* Header */}
      <header className="site-header">
        <Brand iconSize={19} />

        <nav className="desktop-nav" aria-label="Tool categories">
          {CATEGORIES.map((category) => (
            <a key={category} href="#tools" onClick={() => setQuery(category)}>
              {category}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <button
            className="theme-toggle"
            onClick={() => setDark(!dark)}
            aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <a className="header-cta" href="#tools">
            Explore tools <ArrowRight size={15} />
          </a>
        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="hero">
          <div className="hero-badge">
            <Sparkles size={14} /> YOUR EVERYDAY TOOLKIT
          </div>
          <h1>
            Free online tools to make
            <br className="desktop-break" /> your daily tasks <span>faster.</span>
          </h1>
          <p>Compress images, generate QR codes, count words, and calculate instantly—100% free in your browser.</p>

          <label className="search-box">
            <Search size={19} />
            <input
              aria-label="Search tools"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What do you need to get done?"
            />
            <kbd>⌘ K</kbd>
          </label>

          <div className="hero-proof">
            <span><Check size={14} /> No sign-up</span>
            <span><Check size={14} /> 100% free</span>
            <span><Check size={14} /> Private by design</span>
          </div>
        </section>

        <div className="leaderboard-wrap">
          {/* ADSTERRA_BANNER_SLOT */}
          <AdSlot size="728 × 90" />
        </div>

        {/* Tools */}
        <section id="tools" className="tools-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">THE TOOLBOX</span>
              <h2>One hub. A little less busy.</h2>
              <p>Simple tools for the little tasks that add up.</p>
            </div>
            <span className="tools-count">
              {visibleTools.length} tools <span className="live-dot" />
            </span>
          </div>

          <div className="tool-layout">
            <div className="tool-list" role="tablist" aria-label="Available tools">
              {visibleTools.map((tool) => {
                const Icon = tool.icon
                const selected = active === tool.id
                return (
                  <button
                    key={tool.id}
                    role="tab"
                    aria-selected={selected}
                    className={`tool-option${selected ? ' selected' : ''}`}
                    onClick={() => setActive(tool.id)}
                  >
                    <span className="tool-icon">
                      <Icon size={19} />
                    </span>
                    <span className="tool-copy">
                      <b>{tool.title}</b>
                      <small>{tool.description}</small>
                    </span>
                    <ArrowRight className="tool-arrow" size={16} />
                  </button>
                )
              })}
              {visibleTools.length === 0 && <p className="empty-search">No tools found. Try a different search.</p>}
            </div>

            {isActiveVisible ? (
              <section className="workspace-card" role="tabpanel" aria-label={selectedTool.title}>
                <div className="workspace-top">
                  <div className="workspace-icon">
                    <SelectedIcon size={20} />
                  </div>
                  <div>
                    <h3>{selectedTool.title}</h3>
                    <p>{selectedTool.description}</p>
                  </div>
                  <span className="secure-tag">
                    <ShieldCheck size={13} /> Private
                  </span>
                </div>
                <div className="workspace-content">
                  <ActiveTool key={active} />
                </div>
              </section>
            ) : (
              <section className="workspace-card empty-workspace">
                <Sparkles size={24} />
                <h3>Pick a tool to get started</h3>
                <p>Choose one of the tools on the left or update your search.</p>
              </section>
            )}
          </div>
        </section>

        <div className="native-ad-wrap">
          {/* ADSTERRA_BANNER_SLOT */}
          <AdSlot size="Native banner" />
        </div>

        {/* Features */}
        <section className="why-section">
          <div className="section-heading centered">
            <span className="eyebrow">MADE FOR YOUR EVERYDAY</span>
            <h2>Useful tools. No extra fuss.</h2>
            <p>Everything you need, without the things you don&apos;t.</p>
          </div>
          <div className="feature-grid">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <article key={title}>
                <span className="feature-icon">
                  <Icon size={21} />
                </span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="faq-section">
          <div className="faq-intro">
            <span className="eyebrow">GOOD TO KNOW</span>
            <h2>Frequently asked questions</h2>
            <p>A few helpful details before you get started.</p>
          </div>
          <div className="faq-list">
            {FAQ.map(({ question, answer }, index) => {
              const open = openFaq === index
              return (
                <div className="faq-item" key={question}>
                  <button aria-expanded={open} onClick={() => setOpenFaq(open ? null : index)}>
                    {question}
                    <ChevronDown className={open ? 'rotated' : ''} size={18} />
                  </button>
                  {open && <p>{answer}</p>}
                </div>
              )
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <Brand iconSize={17} className="footer-brand" />
        <span className="copyright">© 2026 QuickToolsHub. Made for the little things.</span>
        <div className="footer-links">
          <button onClick={() => setPolicy('Privacy Policy')}>Privacy</button>
          <button onClick={() => setPolicy('Terms of Service')}>Terms</button>
          <button onClick={() => setPolicy('Disclaimer')}>Disclaimer</button>
          <button onClick={() => setPolicy('Contact')}>Contact</button>
        </div>
      </footer>

      {policy && <PolicyModal policy={policy} onClose={() => setPolicy('')} />}
    </div>
  )
}