import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Practice from './pages/Practice.jsx';
import Saved from './pages/Saved.jsx';
import BookmarksPage from './pages/BookmarksPage.jsx';
import ProgressPage from './pages/ProgressPage.jsx';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/practice/:setId" element={<Practice />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/bookmarks" element={<BookmarksPage />} />
        <Route path="/progress" element={<ProgressPage />} />
      </Routes>
    </Layout>
  );
}
