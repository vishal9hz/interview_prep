import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2 } from 'lucide-react';
import { createSet, checkHealth } from '../api.js';
import WakeupBanner from '../components/WakeupBanner.jsx';

const FOCUS_OPTIONS = ['Technical', 'Behavioral', 'Situational', 'HR', 'Role-specific'];

export default function Home() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    jd: '', role: '', experience: '', salary: '', domain: '',
    count: 10, focus: ['Technical', 'Behavioral', 'Situational'],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverAwake, setServerAwake] = useState(true);

  useEffect(() => {
    checkHealth().then(r => setServerAwake(!!r));
  }, []);

  const toggleFocus = (f) => {
    setForm(prev => ({
      ...prev,
      focus: prev.focus.includes(f) ? prev.focus.filter(x => x !== f) : [...prev.focus, f],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.jd.length < 50) return setError('Job description is too short (min 50 chars)');
    if (form.focus.length === 0) return setError('Select at least one focus area');
    setError('');
    setLoading(true);
    try {
      const set = await createSet({ ...form, focus: form.focus.join(', ') });
      navigate(`/practice/${set.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {!serverAwake && <WakeupBanner />}

      <div className="text-center space-y-2 py-4">
        <h1 className="text-3xl font-bold text-gray-900">Interview Prep Studio</h1>
        <p className="text-gray-500">
          Paste a job description, get tailored questions, practice answering, get AI feedback.
        </p>
      </div>

      <form onSubmit={submit} className="card space-y-5">
        <div>
          <label className="label">
            Job Description <span className="text-red-500">*</span>
          </label>
          <textarea
            className="input min-h-[160px] resize-y"
            placeholder="Paste the full job description here…"
            value={form.jd}
            onChange={e => setForm(p => ({ ...p, jd: e.target.value }))}
            maxLength={8000}
            required
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{form.jd.length}/8000</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Role / Title</label>
            <input
              className="input"
              placeholder="e.g. Senior Frontend Engineer"
              value={form.role}
              onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Experience Level</label>
            <input
              className="input"
              placeholder="e.g. 3–5 years"
              value={form.experience}
              onChange={e => setForm(p => ({ ...p, experience: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Salary Expectation</label>
            <input
              className="input"
              placeholder="e.g. ₹18 LPA"
              value={form.salary}
              onChange={e => setForm(p => ({ ...p, salary: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Domain / Industry</label>
            <input
              className="input"
              placeholder="e.g. FinTech, SaaS"
              value={form.domain}
              onChange={e => setForm(p => ({ ...p, domain: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="label">
            Number of Questions:{' '}
            <span className="font-semibold text-blue-600">{form.count}</span>
          </label>
          <input
            type="range"
            min={1}
            max={20}
            value={form.count}
            onChange={e => setForm(p => ({ ...p, count: Number(e.target.value) }))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>1</span>
            <span>20</span>
          </div>
        </div>

        <div>
          <label className="label">Question Types</label>
          <div className="flex flex-wrap gap-2">
            {FOCUS_OPTIONS.map(f => (
              <button
                key={f}
                type="button"
                onClick={() => toggleFocus(f)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  form.focus.includes(f)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Generating questions…
            </>
          ) : (
            <>
              <Sparkles size={18} /> Generate Interview Questions
            </>
          )}
        </button>
      </form>
    </div>
  );
}
