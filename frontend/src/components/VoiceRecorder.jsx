import { useState, useRef, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';
import { createSpeechRecognizer } from '../speech.js';

export default function VoiceRecorder({ onTranscript, onStats, disabled }) {
  const [recording, setRecording] = useState(false);
  const [supported] = useState(() => !!(window.SpeechRecognition || window.webkitSpeechRecognition));
  const recRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => () => recRef.current?.stop(), []);

  const start = () => {
    const rec = createSpeechRecognizer({
      onTranscript: (full) => onTranscript?.(full),
    });
    if (!rec) return;
    recRef.current = rec;
    rec.onerror((e) => { console.error('Speech error', e); setRecording(false); });
    rec.onend(() => {
      // auto-restart for continuous recording
    });
    rec.start();
    startTimeRef.current = Date.now();
    setRecording(true);
  };

  const stop = () => {
    recRef.current?.stop();
    setRecording(false);
    if (startTimeRef.current && onStats) {
      const secs = Math.round((Date.now() - startTimeRef.current) / 1000);
      onStats(secs);
    }
  };

  if (!supported) return (
    <p className="text-sm text-gray-500">Voice not supported in this browser. Use Chrome or Edge.</p>
  );

  return (
    <div className="flex items-center gap-3">
      {!recording ? (
        <button onClick={start} disabled={disabled} className="btn-secondary text-sm">
          <Mic size={15} className="text-red-500" /> Start Recording
        </button>
      ) : (
        <button onClick={stop} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">
          <Square size={15} /> Stop Recording
        </button>
      )}
      {recording && (
        <span className="flex items-center gap-1.5 text-sm text-red-600">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          Recording…
        </span>
      )}
    </div>
  );
}
