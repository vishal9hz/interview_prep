import { useState, useEffect } from 'react';
import { Loader2, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getProgress } from '../api.js';

export default function ProgressPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProgress()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={28} className="animate-spin text-blue-600" />
    </div>
  );

  const hasData = data.some(d => d.evaluated_count > 0);

  if (!hasData) return (
    <div className="text-center py-20 space-y-2">
      <TrendingUp size={40} className="mx-auto text-gray-300" />
      <p className="text-gray-500 text-lg">No progress data yet.</p>
      <p className="text-gray-400 text-sm">Evaluate your answers to see progress trends here.</p>
    </div>
  );

  const chartData = data
    .filter(d => d.evaluated_count > 0)
    .map((d, i) => ({
      name: d.title.length > 20 ? d.title.slice(0, 20) + '…' : d.title,
      attempt: d.attempt,
      label: `#${i + 1}`,
      overall: Number(d.avg_score) || 0,
      content: Number(d.avg_content) || 0,
      structure: Number(d.avg_structure) || 0,
      communication: Number(d.avg_communication) || 0,
      wpm: Number(d.avg_wpm) || 0,
      fillers: Number(d.avg_fillers) || 0,
      date: new Date(d.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    }));

  const latest = chartData[chartData.length - 1];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Progress Tracker</h1>

      {/* Summary cards */}
      {latest && (
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { label: 'Overall', value: latest.overall, color: 'text-blue-600' },
            { label: 'Content', value: latest.content, color: 'text-purple-600' },
            { label: 'Structure', value: latest.structure, color: 'text-orange-600' },
            { label: 'Communication', value: latest.communication, color: 'text-green-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card text-center">
              <p className="text-xs text-gray-500 mb-1">{label} (latest)</p>
              <p className={`text-3xl font-bold ${color}`}>{value}<span className="text-base text-gray-400">/10</span></p>
            </div>
          ))}
        </div>
      )}

      {/* Score trend chart */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Score Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value, name) => [value + '/10', name]}
              labelFormatter={(label, payload) => payload?.[0]?.payload?.name || label}
            />
            <Legend />
            <Line type="monotone" dataKey="overall" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Overall" />
            <Line type="monotone" dataKey="content" stroke="#8b5cf6" strokeWidth={1.5} dot={{ r: 3 }} name="Content" />
            <Line type="monotone" dataKey="structure" stroke="#f97316" strokeWidth={1.5} dot={{ r: 3 }} name="Structure" />
            <Line type="monotone" dataKey="communication" stroke="#10b981" strokeWidth={1.5} dot={{ r: 3 }} name="Communication" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* WPM trend if available */}
      {chartData.some(d => d.wpm > 0) && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Speaking Pace (WPM)</h2>
          <p className="text-xs text-gray-500 mb-3">Ideal range: 120–160 wpm</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [`${v} wpm`]} />
              <Line type="monotone" dataKey="wpm" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="Avg WPM" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Raw data table */}
      <div className="card overflow-x-auto">
        <h2 className="font-semibold text-gray-800 mb-4">Session History</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
              <th className="pb-2 pr-4">Set</th>
              <th className="pb-2 pr-4">Date</th>
              <th className="pb-2 pr-4">Attempt</th>
              <th className="pb-2 pr-4">Evaluated</th>
              <th className="pb-2 pr-4">Overall</th>
              <th className="pb-2">WPM</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((d, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2 pr-4 font-medium text-gray-800">{d.name}</td>
                <td className="py-2 pr-4 text-gray-500">{d.date}</td>
                <td className="py-2 pr-4 text-gray-500">#{d.attempt}</td>
                <td className="py-2 pr-4 text-gray-500">{data[i]?.evaluated_count}</td>
                <td className="py-2 pr-4">
                  <span className={`font-semibold ${d.overall >= 8 ? 'text-green-600' : d.overall >= 6 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {d.overall}/10
                  </span>
                </td>
                <td className="py-2 text-gray-500">{d.wpm > 0 ? `${d.wpm} wpm` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
