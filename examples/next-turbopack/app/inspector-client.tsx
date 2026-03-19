'use client';

import { useEffect } from 'react';
import { initInspector } from '@linhey/react-debug-inspector/browser';

export default function InspectorClient() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      initInspector();
    }
  }, []);

  return null;
}
