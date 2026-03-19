import { useEffect } from 'react';
import { initInspector } from '@linhey/react-debug-inspector/browser';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      initInspector();
    }
  }, []);

  return <Component {...pageProps} />;
}
