import { Link, useLocation } from 'react-router-dom';
import { Mic2, BookOpen, Bookmark, TrendingUp, PlusCircle } from 'lucide-react';

const nav = [
  { to: '/', label: 'New Prep', icon: PlusCircle },
  { to: '/saved', label: 'Saved', icon: BookOpen },
  { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
];

export default function Layout({ children }) {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-blue-700">
            <Mic2 size={20} />
            Interview Prep Studio
          </Link>
          <nav className="flex gap-1">
            {nav.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  pathname === to
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
