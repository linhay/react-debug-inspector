import { useState } from 'react';
import './App.css';

const previewImage =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0ea5e9" />
          <stop offset="100%" stop-color="#ff8a3d" />
        </linearGradient>
      </defs>
      <rect width="640" height="360" rx="28" fill="url(#bg)" />
      <rect x="44" y="42" width="220" height="18" rx="9" fill="rgba(255,255,255,0.55)" />
      <rect x="44" y="82" width="332" height="52" rx="16" fill="rgba(255,255,255,0.9)" />
      <rect x="44" y="156" width="552" height="130" rx="24" fill="rgba(15,23,42,0.18)" />
      <circle cx="546" cy="102" r="42" fill="rgba(255,255,255,0.78)" />
      <path d="M530 102h32M546 86v32" stroke="#0f2940" stroke-width="8" stroke-linecap="round" />
      <text x="44" y="116" fill="#0f2940" font-size="28" font-family="Avenir Next, Arial, sans-serif" font-weight="700">
        Copy UI context directly
      </text>
      <text x="44" y="204" fill="#ffffff" font-size="24" font-family="Avenir Next, Arial, sans-serif">
        debug id + text + image metadata
      </text>
    </svg>
  `);

function App() {
  const [count, setCount] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedCard, setSelectedCard] = useState('none');
  const [pressedCard, setPressedCard] = useState('idle');
  const [pointerCard, setPointerCard] = useState('idle');

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="brand-mark">RDI</div>
          <a
            className="github-link"
            href="https://github.com/linhay/react-debug-inspector"
            target="_blank"
            rel="noreferrer"
          >
            返回 GitHub
          </a>
        </div>

        <div className="hero">
          <p className="hero-kicker">React Debug Inspector</p>
          <h1 className="hero-title">Inspect Faster, Fix Sooner</h1>
          <p className="hero-subtitle">
            Try clicking the 🎯 button in the corner to inspect elements and jump back to source context.
          </p>
          <div className="hero-meta">filename › component › tag:line</div>
        </div>
      </header>

      <main className="main">
        <div className="feature-grid">
          <section className="section section-highlight">
            <h2>Counter Example</h2>
            <Card title="Counter" count={count} onIncrement={() => setCount(count + 1)} />
            <Button onClick={() => setCount(0)}>Reset Counter</Button>
          </section>

          <section className="section section-highlight">
            <h2>Dialog Example</h2>
            <p className="section-intro">Open a modal and watch how the inspector avoids overlap.</p>
            <Button onClick={() => setShowDialog(true)}>Open Dialog</Button>
            {showDialog && (
              <Dialog onClose={() => setShowDialog(false)}>
                <h3>Dialog Title</h3>
                <p>This is a dialog. Notice how the 🎯 button moves to avoid overlapping!</p>
                <Button onClick={() => setShowDialog(false)}>Close</Button>
              </Dialog>
            )}
          </section>

          <section className="section section-wide">
            <h2>List Example</h2>
            <List
              items={[
                'Locate component source in seconds',
                'Copy debug id directly to clipboard',
                'Works with nested and dynamic elements',
              ]}
            />
          </section>

          <section className="section section-wide">
            <h2>Clickable Card Example</h2>
            <p className="section-intro">Selecting this card in inspect mode should not trigger its React onClick.</p>
            <article className="card clickable-card" onClick={() => setSelectedCard('details-opened')}>
              <h3>Open Details Card</h3>
              <p>Clicking this card normally updates app state to simulate navigation.</p>
            </article>
            <p className="section-intro">Card state: {selectedCard}</p>
          </section>

          <section className="section section-wide">
            <h2>Pressable Card Example</h2>
            <p className="section-intro">Selecting this card in inspect mode should not trigger early mouse handlers either.</p>
            <article className="card pressable-card" onMouseDown={() => setPressedCard('pressed')}>
              <h3>Mouse Down Card</h3>
              <p>Some apps start interactions on mouse down instead of click.</p>
            </article>
            <p className="section-intro">Press state: {pressedCard}</p>
          </section>

          <section className="section section-wide">
            <h2>Pointer Card Example</h2>
            <p className="section-intro">Selecting this card in inspect mode should not trigger pointer handlers on touch or pen flows.</p>
            <article className="card pointer-card" onPointerDown={() => setPointerCard('pressed')}>
              <h3>Pointer Down Card</h3>
              <p>Some apps start interactions from pointer events before click is dispatched.</p>
            </article>
            <p className="section-intro">Pointer state: {pointerCard}</p>
          </section>

          <section className="section section-wide copy-showcase">
            <div className="copy-showcase-copy">
              <p className="copy-showcase-kicker">Copy Showcase</p>
              <h2>Capture the exact text or image your teammate is asking about</h2>
              <p className="copy-showcase-text">
                This sentence is intentionally descriptive so you can verify the “复制文案” action copies meaningful
                business text instead of only debug metadata.
              </p>
              <p className="copy-showcase-note">
                Hover this card in inspection mode, then try “复制文案 / 复制图片 / 全部复制”.
              </p>
            </div>
            <div className="copy-showcase-media">
              <img
                src={previewImage}
                alt="Inspector preview card"
                title="Inspector preview"
                className="preview-image"
              />
            </div>
          </section>
        </div>
      </main>

      <footer className="footer">
        <p>
          Hover over any element in inspection mode to see its debug info:
          <code>filename › component › tag:line</code>
        </p>
      </footer>
    </div>
  );
}

function Card({ title, count, onIncrement }: { title: string; count: number; onIncrement: () => void }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <p className="count">Count: {count}</p>
      <button className="button" onClick={onIncrement}>Increment</button>
    </div>
  );
}

function Button({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button className="button button-secondary" onClick={onClick}>
      {children}
    </button>
  );
}

function Dialog({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" role="dialog" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list">
      {items.map((item, index) => (
        <li key={index} className="list-item">
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default App;
