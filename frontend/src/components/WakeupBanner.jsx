import { Loader2 } from 'lucide-react';

export default function WakeupBanner() {
  return (
    <div className="fixed bottom-4 right-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3 shadow-md text-sm">
      <Loader2 size={16} className="text-amber-600 animate-spin" />
      <div>
        <p className="font-medium text-amber-800">Waking up server…</p>
        <p className="text-amber-600">This may take ~30s on first load</p>
      </div>
    </div>
  );
}
