const FILLERS = ['um', 'uh', 'like', 'you know', 'basically', 'literally', 'actually', 'so', 'right', 'okay'];

export function createSpeechRecognizer({ onTranscript, lang = 'en-IN' }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const rec = new SR();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = lang;

  let finalText = '';
  rec.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) finalText += e.results[i][0].transcript + ' ';
      else interim += e.results[i][0].transcript;
    }
    onTranscript(finalText + interim, finalText);
  };

  return {
    start: () => { finalText = ''; rec.start(); },
    stop: () => rec.stop(),
    onend: (fn) => { rec.onend = fn; },
    onerror: (fn) => { rec.onerror = fn; },
  };
}

export function computeStats(text, durationSecs) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const wpm = durationSecs > 0 ? Math.round((words / durationSecs) * 60) : 0;
  const lower = text.toLowerCase();
  const fillerList = FILLERS.filter(f => {
    const re = new RegExp(`\\b${f}\\b`, 'gi');
    return re.test(lower);
  });
  const fillers = fillerList.reduce((acc, f) => {
    const re = new RegExp(`\\b${f}\\b`, 'gi');
    return acc + (lower.match(re) || []).length;
  }, 0);
  return { words, wpm, fillers, filler_list: fillerList.join(', ') };
}
