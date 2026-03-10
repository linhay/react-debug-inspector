import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initInspector } from '../../src/runtime';

initInspector();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
