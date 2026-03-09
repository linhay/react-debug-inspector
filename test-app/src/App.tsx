import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <header>
        <h1>React Debug Inspector Test</h1>
      </header>
      <main>
        <Card title="Counter" count={count} onIncrement={() => setCount(count + 1)} />
        <Button onClick={() => setCount(0)}>Reset</Button>
      </main>
    </div>
  );
}

function Card({ title, count, onIncrement }: { title: string; count: number; onIncrement: () => void }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <p>Count: {count}</p>
      <button onClick={onIncrement}>Increment</button>
    </div>
  );
}

function Button({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button className="reset-button" onClick={onClick}>
      {children}
    </button>
  );
}

export default App;
