'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import TopBar from '@/components/TopBar';
import { useRouter } from 'next/navigation';

const PROXY = process.env.NEXT_PUBLIC_PROXY_URL || 'https://legwork-brisket-anyplace.ngrok-free.dev';

type ScreenMode = 'idle' | 'sharing' | 'paused';
type CaptureInterval = 10 | 30 | 60;

interface Capture { url: string; timestamp: string; thumb?: string; }

export default function ScreenPage() {
  const router = useRouter();
  const [mode, setMode] = useState<ScreenMode>('idle');
  const [interval, setIntervalVal] = useState<CaptureInterval>(30);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [status, setStatus] = useState('');
  const [previewSrc, setPreviewSrc] = useState('');
  const [captureCount, setCaptureCount] = useState(0);
  const [context, setContext] = useState('');

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopSharing = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setMode('idle');
    setPreviewSrc('');
    setStatus('Screen sharing stopped.');
  }, []);

  const captureFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    // Show preview
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    setPreviewSrc(dataUrl);

    // Send to proxy
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const form = new FormData();
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      form.append('file', blob, `screen-${ts}.jpg`);
      if (context) form.append('context', context);

      try {
        const res = await fetch(`${PROXY}/screen`, {
          method: 'POST',
          body: form,
          headers: { 'ngrok-skip-browser-warning': 'true' },
        });
        const data = await res.json();
        const fileUrl = data.files?.[0]?.url;
        if (fileUrl) {
          setCaptures(prev => [{ url: fileUrl, timestamp: new Date().toLocaleTimeString(), thumb: dataUrl }, ...prev.slice(0, 19)]);
          setCaptureCount(c => c + 1);
          setStatus(`Last capture: ${new Date().toLocaleTimeString()}`);
        }
      } catch (e) {
        setStatus('Capture failed — proxy unreachable');
      }
    }, 'image/jpeg', 0.7);
  }, [context]);

  const startSharing = useCallback(async () => {
    try {
      setStatus('Requesting screen access...');
      const stream = await (navigator.mediaDevices as MediaDevices & {
        getDisplayMedia: (opts?: object) => Promise<MediaStream>
      }).getDisplayMedia({
        video: { frameRate: 1 },
        audio: false,
      });

      streamRef.current = stream;
      stream.getVideoTracks()[0].onended = stopSharing;

      // Attach to hidden video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setMode('sharing');
      setStatus('Sharing — capturing every ' + interval + 's');

      // Immediate first capture
      setTimeout(captureFrame, 1000);

      // Set up interval
      timerRef.current = setInterval(captureFrame, interval * 1000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('Permission denied') || msg.includes('NotAllowed')) {
        setStatus('Permission denied — allow screen capture in your browser.');
      } else {
        setStatus('Could not start screen share: ' + msg);
      }
      setMode('idle');
    }
  }, [interval, captureFrame, stopSharing]);

  const pauseResume = () => {
    if (mode === 'sharing') {
      if (timerRef.current) clearInterval(timerRef.current);
      setMode('paused');
      setStatus('Paused — not capturing');
    } else if (mode === 'paused') {
      timerRef.current = setInterval(captureFrame, interval * 1000);
      setMode('sharing');
      setStatus('Resumed — capturing every ' + interval + 's');
    }
  };

  const sendNow = () => captureFrame();

  const openInChat = (thumb: string) => {
    localStorage.setItem('chat-screen-context', thumb);
    router.push('/chat');
  };

  useEffect(() => () => stopSharing(), [stopSharing]);

  const s = {
    surface: 'var(--surface)', border: '1px solid var(--border)',
    text: 'var(--text)', muted: 'var(--text-muted)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar title="Screen Share" />

      {/* Hidden video + canvas */}
      <video ref={videoRef} style={{ display: 'none' }} muted playsInline />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

        {/* Status bar */}
        <div style={{ background: s.surface, border: s.border, borderRadius: 10, padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: mode === 'sharing' ? '#10b981' : mode === 'paused' ? '#f59e0b' : '#888', flexShrink: 0, boxShadow: mode === 'sharing' ? '0 0 8px #10b981' : 'none' }} />
          <span style={{ fontSize: 13, color: s.text, flex: 1 }}>
            {mode === 'sharing' ? `🟢 Sharing — ${captureCount} captures sent to Albert` : mode === 'paused' ? '⏸ Paused' : '⚫ Not sharing'}
          </span>
          {status && <span style={{ fontSize: 12, color: s.muted }}>{status}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: previewSrc ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 16 }}>

          {/* Controls */}
          <div style={{ background: s.surface, border: s.border, borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: s.text }}>
              👁 Share your screen with Albert
            </h3>
            <p style={{ fontSize: 13, color: s.muted, margin: '0 0 20px', lineHeight: 1.6 }}>
              Albert will receive periodic screenshots and can reference what you&apos;re working on in chat. Nothing is shared externally.
            </p>

            {/* Interval selector */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: s.muted, display: 'block', marginBottom: 8 }}>Capture interval</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {([10, 30, 60] as CaptureInterval[]).map(i => (
                  <button key={i} onClick={() => setIntervalVal(i)} disabled={mode === 'sharing'} style={{
                    flex: 1, background: interval === i ? 'rgba(99,102,241,0.15)' : 'transparent',
                    border: `1px solid ${interval === i ? '#6366f1' : 'var(--border)'}`,
                    borderRadius: 8, padding: '8px 0', color: interval === i ? '#a5b4fc' : s.muted,
                    fontSize: 13, cursor: mode === 'sharing' ? 'default' : 'pointer',
                  }}>{i === 10 ? '10s' : i === 30 ? '30s' : '60s'}</button>
                ))}
              </div>
            </div>

            {/* Context note */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: s.muted, display: 'block', marginBottom: 8 }}>What are you working on? (optional)</label>
              <input value={context} onChange={e => setContext(e.target.value)}
                placeholder="e.g. Reviewing cardiac arrest QA data in ESO"
                style={{ width: '100%', background: 'var(--surface-2)', border: s.border, borderRadius: 8, padding: '9px 12px', color: s.text, fontSize: 13, boxSizing: 'border-box' }} />
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              {mode === 'idle' ? (
                <button onClick={startSharing} style={{
                  flex: 1, background: '#6366f1', border: 'none', borderRadius: 8,
                  padding: '11px 0', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                }}>
                  🖥 Start Sharing
                </button>
              ) : (
                <>
                  <button onClick={pauseResume} style={{
                    flex: 1, background: mode === 'paused' ? '#10b98122' : '#f59e0b22',
                    border: `1px solid ${mode === 'paused' ? '#10b981' : '#f59e0b'}44`,
                    borderRadius: 8, padding: '10px 0',
                    color: mode === 'paused' ? '#10b981' : '#f59e0b',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}>
                    {mode === 'paused' ? '▶ Resume' : '⏸ Pause'}
                  </button>
                  <button onClick={sendNow} style={{
                    background: '#6366f122', border: '1px solid #6366f144',
                    borderRadius: 8, padding: '10px 14px', color: '#a5b4fc', fontSize: 13, cursor: 'pointer',
                  }}>📸 Now</button>
                  <button onClick={stopSharing} style={{
                    background: '#ef444422', border: '1px solid #ef444444',
                    borderRadius: 8, padding: '10px 14px', color: '#fca5a5', fontSize: 13, cursor: 'pointer',
                  }}>✕ Stop</button>
                </>
              )}
            </div>
          </div>

          {/* Live preview */}
          {previewSrc && (
            <div style={{ background: s.surface, border: s.border, borderRadius: 12, padding: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: s.text }}>Last Capture</h3>
              <img src={previewSrc} alt="Screen capture" style={{ width: '100%', borderRadius: 8, border: s.border }} />
              <button onClick={() => openInChat(previewSrc)} style={{
                width: '100%', marginTop: 10, background: '#6366f115', border: '1px solid #6366f144',
                borderRadius: 8, padding: '8px 0', color: '#a5b4fc', fontSize: 13, cursor: 'pointer',
              }}>
                💬 Discuss this in chat
              </button>
            </div>
          )}
        </div>

        {/* Capture history */}
        {captures.length > 0 && (
          <div style={{ background: s.surface, border: s.border, borderRadius: 12, padding: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 600, color: s.text }}>
              📷 Capture History ({captures.length})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
              {captures.map((c, i) => (
                <div key={i} style={{ position: 'relative', cursor: 'pointer' }} onClick={() => c.thumb && openInChat(c.thumb)}>
                  {c.thumb && <img src={c.thumb} alt={`Capture ${i}`} style={{ width: '100%', borderRadius: 6, border: s.border }} />}
                  <div style={{ fontSize: 10, color: s.muted, textAlign: 'center', marginTop: 4 }}>{c.timestamp}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
