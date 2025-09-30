import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div style={{ fontFamily: 'Inter, system-ui, Arial, sans-serif' }}>
      <nav style={{ display:'flex', gap:12, padding:12, borderBottom:'1px solid #eee' }}>
        <a href="/">Home</a>
        <a href="/exercises">Exercises</a>
        <a href="/plans">Plans</a> {/* ← add this */}
        <a href="/logs">Logs</a>
        <a href="/reports">Reports</a>
      </nav>
      <main style={{ padding: 16 }}>
        <Component {...pageProps} />
      </main>
    </div>
  );
}

