import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { getSet, reattemptSet } from '../api.js';
import QuestionCard from '../components/QuestionCard.jsx';

export default function Practice() {
  const { setId } = useParams();
  const navigate = useNavigate();
  const [set, setSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reattempting, setReattempting] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getSet(setId);
      setSet(data);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [setId]);

  const doReattempt = async () => {
    setReattempting(true);
    try {
      const newSet = await reattemptSet(setId);
      navigate(`/practice/${newSet.id}`);
    } catch (e) {
      alert(e.message);
    } finally {
      setReattempting(false);
    }
  };

  const onFollowUp = (newQuestion) => {
    setSet(prev => ({
      ...prev,
      questions: [...prev.questions, { ...newQuestion, answer_text: '' }],
    }));
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={28} className="animate-spin text-blue-600" />
    </div>
  );
  if (!set) return null;

  const scored = set.questions.filter(q => q.score != null);
  const avgScore = scored.length > 0
    ? Math.round(scored.reduce((a, q) => a + q.score, 0) / scored.length)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <button onClick={() => navigate('/saved')} className="btn-secondary text-sm mb-3">
            <ArrowLeft size={15} /> Back to Saved
          </button>
          <h1 className="text-xl font-bold text-gray-900">{set.title}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
            <span>{set.questions.length} questions</span>
            {set.attempt > 1 && (
              <span className="badge bg-purple-100 text-purple-700">Attempt #{set.attempt}</span>
            )}
            {avgScore != null && (
              <span className="badge bg-green-100 text-green-700">Avg Score: {avgScore}/10</span>
            )}
            {set.role && <span>{set.role}</span>}
            {set.experience && <span>· {set.experience}</span>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="btn-secondary text-sm"
            title="Toggle JD preview"
          >
            {showInfo ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            JD
          </button>
          <button
            onClick={doReattempt}
            disabled={reattempting}
            className="btn-secondary text-sm"
            title="Start a fresh attempt with the same questions"
          >
            {reattempting ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
            Re-attempt
          </button>
        </div>
      </div>

      {showInfo && (
        <div className="card">
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Job Description</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed line-clamp-10">{set.jd}</p>
        </div>
      )}

      <div className="space-y-4">
        {set.questions.map(q => (
          <QuestionCard key={q.id} question={q} onFollowUp={onFollowUp} />
        ))}
      </div>
    </div>
  );
}
