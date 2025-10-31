import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function Layout() {
  const location = useLocation();
  const showBottomNav = !location.pathname.includes('/group/');

  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      <header className="navbar bg-blue-600 text-white sticky top-0 z-50 shadow-lg">
        <div className="flex-1">
          <a className="btn btn-ghost normal-case text-xl font-bold text-white hover:bg-blue-500">
            🏃 RunTrack
          </a>
        </div>
      </header>

      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      {showBottomNav && <BottomNav />}
    </div>
  );
}
