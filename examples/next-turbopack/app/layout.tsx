import type { ReactNode } from 'react';
import InspectorClient from './inspector-client';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <InspectorClient />
        {children}
      </body>
    </html>
  );
}
