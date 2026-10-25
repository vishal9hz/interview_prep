import { CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';

function ScoreBar({ label, value }) {
  const color = value >= 8 ? 'bg-green-500' : value >= 6 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold">{value}/10</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${value * 10}%` }} />
      </div>
    </div>
  );
}

export default function FeedbackPanel({ feedback, mode }) {
  const { score, content, structure, communication, strengths, improve, delivery, model } = feedback;
  const scoreColor = score >= 8 ? 'text-green-600' : score >= 6 ? 'text-yellow-600' : 'text-red-600';
  const scoreBg = score >= 8 ? 'bg-green-50' : score >= 6 ? 'bg-yellow-50' : 'bg-red-50';

  return (
    <div className={`rounded-xl border p-5 space-y-5 ${scoreBg}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">AI Feedback</h3>
        <div className={`text-3xl font-bold ${scoreColor}`}>{score}<span className="text-base text-gray-400">/10</span></div>
      </div>

      <div className="space-y-2">
        <ScoreBar label="Content & Accuracy" value={content} />
        <ScoreBar label="Structure & Clarity" value={structure} />
        <ScoreBar label="Communication" value={communication} />
      </div>

      {mode === 'spoken' && delivery && (
        <div className="text-sm text-gray-700 bg-white/70 rounded-lg px-3 py-2">
          <p className="font-medium text-gray-800 mb-1">Delivery</p>
          <p>{delivery}</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {strengths?.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-green-700 font-medium text-sm mb-2">
              <CheckCircle2 size={15} /> Strengths
            </div>
            <ul className="space-y-1">
              {(Array.isArray(strengths) ? strengths : []).map((s, i) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>{s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {improve?.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-orange-700 font-medium text-sm mb-2">
              <AlertCircle size={15} /> Improvements
            </div>
            <ul className="space-y-1">
              {(Array.isArray(improve) ? improve : []).map((s, i) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-orange-400 mt-0.5">→</span>{s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {model && (
        <div className="bg-white/80 rounded-lg p-4">
          <div className="flex items-center gap-1.5 text-blue-700 font-medium text-sm mb-2">
            <MessageSquare size={15} /> Model Answer
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{model}</p>
        </div>
      )}
    </div>
  );
}
