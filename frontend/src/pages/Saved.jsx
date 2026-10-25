import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Trash2, PlayCircle, PlusCircle } from 'lucide-react';
import { getSets, deleteSet } from '../api.js';

function ScoreBadge({ score }) {
  if (score == null) return <span className="badge bg-gray-100 text-gray-500">Not scored</span>;
  const color = score >= 8 ? 'bg-green-100 text-green-700' : score >= 6 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
  return <span className={`badge ${color}`}>{score}/10</span>;
}

export default function Saved() {
  const navigate = useNavigate();
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getSets();
      setSets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this prep set? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await deleteSet(id);
      setSets(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={28} className="animate-spin text-blue-600" />
    </div>
  );

  if (sets.length === 0) return (
    <div className="text-center py-20 space-y-4">
      <p className="text-gray-500 text-lg">No prep sets yet.</p>
      <button onClick={() => navigate('/')} className="btn-primary">
        <PlusCircle size={16} /> Create your first set
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Saved Sets</h1>
        <button onClick={() => navigate('/')} className="btn-primary text-sm">
          <PlusCircle size={15} /> New Prep
        </button>
      </div>

      <div className="space-y-3">
        {sets.map(set => (
          <div
            key={set.id}
            onClick={() => navigate(`/practice/${set.id}`)}
            className="card cursor-pointer hover:shadow-md transition-shadow flex items-start justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="font-semibold text-gray-900 truncate">{set.title}</h2>
                {set.attempt > 1 && (
                  <span className="badge bg-purple-100 text-purple-700">Attempt #{set.attempt}</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                <span>{set.question_count} questions</span>
                {set.evaluated_count > 0 && (
                  <span>{set.evaluated_count} evaluated</span>
                )}
                <ScoreBadge score={set.avg_score} />
                {set.role && <span className="text-gray-400">· {set.role}</span>}
                {set.experience && <span className="text-gray-400">· {set.experience}</span>}
                <span className="text-gray-400">
                  {new Date(set.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => navigate(`/practice/${set.id}`)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Practice"
              >
                <PlayCircle size={18} />
              </button>
              <button
                onClick={(e) => handleDelete(set.id, e)}
                disabled={deleting === set.id}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                {deleting === set.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
