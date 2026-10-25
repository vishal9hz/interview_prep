import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Bookmark, ExternalLink } from 'lucide-react';
import { getBookmarks } from '../api.js';

const TYPE_COLORS = {
  Technical: 'bg-blue-100 text-blue-700',
  Behavioral: 'bg-purple-100 text-purple-700',
  Situational: 'bg-orange-100 text-orange-700',
  HR: 'bg-green-100 text-green-700',
  'Role-specific': 'bg-teal-100 text-teal-700',
};

export default function BookmarksPage() {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBookmarks()
      .then(setBookmarks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={28} className="animate-spin text-blue-600" />
    </div>
  );

  if (bookmarks.length === 0) return (
    <div className="text-center py-20 space-y-2">
      <Bookmark size={40} className="mx-auto text-gray-300" />
      <p className="text-gray-500 text-lg">No bookmarked questions yet.</p>
      <p className="text-gray-400 text-sm">Bookmark questions during practice to review them here.</p>
    </div>
  );

  // Group by set
  const grouped = bookmarks.reduce((acc, q) => {
    const key = q.set_id;
    if (!acc[key]) acc[key] = { title: q.set_title, questions: [] };
    acc[key].questions.push(q);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          Bookmarked Questions
          <span className="ml-2 text-sm font-normal text-gray-500">({bookmarks.length})</span>
        </h1>
      </div>

      {Object.entries(grouped).map(([setId, group]) => (
        <div key={setId} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
              {group.title}
            </h2>
            <button
              onClick={() => navigate(`/practice/${setId}`)}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <ExternalLink size={12} /> Practice
            </button>
          </div>
          <div className="space-y-3">
            {group.questions.map(q => (
              <div key={q.id} className="card space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-400">Q{q.position}</span>
                  {q.type && (
                    <span className={`badge ${TYPE_COLORS[q.type] || 'bg-gray-100 text-gray-700'}`}>
                      {q.type}
                    </span>
                  )}
                  {q.score != null && (
                    <span className={`badge ${q.score >= 8 ? 'bg-green-100 text-green-700' : q.score >= 6 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {q.score}/10
                    </span>
                  )}
                </div>
                <p className="text-gray-900 font-medium leading-relaxed">{q.text}</p>
                {q.answer_text && (
                  <div className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border-l-2 border-gray-200">
                    <p className="text-xs text-gray-400 mb-1">Your answer</p>
                    <p className="line-clamp-3">{q.answer_text}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
