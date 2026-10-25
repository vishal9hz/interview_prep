import { useState, useRef, useCallback } from 'react';
import { Bookmark, BookmarkCheck, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import VoiceRecorder from './VoiceRecorder.jsx';
import FeedbackPanel from './FeedbackPanel.jsx';
import { saveAnswer, evaluateAnswer as apiEvaluate, getFollowUp, toggleBookmark } from '../api.js';
import { computeStats } from '../speech.js';

const TYPE_COLORS = {
  Technical: 'bg-blue-100 text-blue-700',
  Behavioral: 'bg-purple-100 text-purple-700',
  Situational: 'bg-orange-100 text-orange-700',
  HR: 'bg-green-100 text-green-700',
  'Role-specific': 'bg-teal-100 text-teal-700',
};

export default function QuestionCard({ question, onFollowUp }) {
  const [q, setQ] = useState(question);
  const [answerText, setAnswerText] = useState(q.answer_text || '');
  const [mode, setMode] = useState('typed');
  const [feedback, setFeedback] = useState(
    q.score != null
      ? {
          score: q.score,
          content: q.content_score,
          structure: q.structure_score,
          communication: q.communication_score,
          strengths: q.strengths,
          improve: q.improvements,
          delivery: q.delivery,
          model: q.model_answer,
        }
      : null
  );
  const [evaluating, setEvaluating] = useState(false);
  const [followingUp, setFollowingUp] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef(null);
  const statsRef = useRef(null);

  const autosave = useCallback(
    (text, currentMode, speechStats) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setSaving(true);
        try {
          const stats = speechStats || (currentMode === 'typed' ? null : statsRef.current);
          await saveAnswer(q.id, { text, mode: currentMode, ...stats });
        } finally {
          setSaving(false);
        }
      }, 500);
    },
    [q.id]
  );

  const onTyping = (e) => {
    setAnswerText(e.target.value);
    setMode('typed');
    autosave(e.target.value, 'typed');
  };

  const onVoiceTranscript = (text) => {
    setAnswerText(text);
    setMode('spoken');
    autosave(text, 'spoken');
  };

  const onVoiceStats = (secs) => {
    const st = computeStats(answerText, secs);
    statsRef.current = { duration_secs: secs, ...st };
    autosave(answerText, 'spoken', { duration_secs: secs, ...st });
  };

  const evaluate = async () => {
    setEvaluating(true);
    try {
      const ev = await apiEvaluate(q.id);
      setFeedback(ev);
    } catch (e) {
      alert(e.message);
    } finally {
      setEvaluating(false);
    }
  };

  const doFollowUp = async () => {
    setFollowingUp(true);
    try {
      const fu = await getFollowUp(q.id);
      onFollowUp?.(fu);
    } catch (e) {
      alert(e.message);
    } finally {
      setFollowingUp(false);
    }
  };

  const bookmark = async () => {
    try {
      const result = await toggleBookmark(q.id);
      setQ((prev) => ({ ...prev, bookmarked: result.bookmarked }));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-500">Q{q.position}</span>
            {q.type && (
              <span className={`badge ${TYPE_COLORS[q.type] || 'bg-gray-100 text-gray-700'}`}>
                {q.type}
              </span>
            )}
            {q.parent_question_id && (
              <span className="badge bg-yellow-100 text-yellow-700">Follow-up</span>
            )}
            {saving && <span className="text-xs text-gray-400">Saving…</span>}
          </div>
          <p className="text-gray-900 font-medium leading-relaxed">{q.text}</p>
        </div>
        <button
          onClick={bookmark}
          className={`p-1.5 rounded-lg transition-colors ${
            q.bookmarked ? 'text-amber-500 hover:text-amber-600' : 'text-gray-400 hover:text-gray-600'
          }`}
          title={q.bookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          {q.bookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
        </button>
      </div>

      {q.tip && (
        <div>
          <button
            onClick={() => setShowTip(!showTip)}
            className="text-xs text-blue-600 flex items-center gap-1 hover:text-blue-700"
          >
            {showTip ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showTip ? 'Hide tip' : 'Show tip'}
          </button>
          {showTip && (
            <p className="mt-2 text-sm text-blue-700 bg-blue-50 rounded-lg px-3 py-2">{q.tip}</p>
          )}
        </div>
      )}

      <textarea
        className="input min-h-[120px] resize-y"
        placeholder="Type your answer here, or use voice recording below…"
        value={answerText}
        onChange={onTyping}
      />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <VoiceRecorder onTranscript={onVoiceTranscript} onStats={onVoiceStats} />
        <div className="flex gap-2">
          <button
            onClick={doFollowUp}
            disabled={followingUp || !answerText.trim()}
            className="btn-secondary text-sm"
            title="Generate a follow-up question based on your answer"
          >
            {followingUp ? <Loader2 size={15} className="animate-spin" /> : null}
            Follow-up
          </button>
          <button
            onClick={evaluate}
            disabled={evaluating || !answerText.trim()}
            className="btn-primary text-sm"
          >
            {evaluating ? <Loader2 size={15} className="animate-spin" /> : null}
            {evaluating ? 'Evaluating…' : 'Evaluate'}
          </button>
        </div>
      </div>

      {feedback && <FeedbackPanel feedback={feedback} mode={mode} />}
    </div>
  );
}
