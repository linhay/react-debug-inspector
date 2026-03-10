import { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  const [showDialog, setShowDialog] = useState(false);

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
