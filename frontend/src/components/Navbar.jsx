import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar({ currentUser, active, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-3.5 sm:px-6 h-14 flex items-center justify-between gap-2">
        {/* Left: Brand & Desktop Navigation */}
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 text-gray-900 hover:opacity-80 transition-opacity flex-shrink-0">
            <svg className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
            <span className="text-sm font-semibold text-gray-900 tracking-tight">TaskTrack</span>
          </Link>

          {isAdmin && (
            <nav className="hidden sm:flex items-center gap-1 flex-shrink-0">
              <Link
                to="/"
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  active === 'my-tasks'
                    ? 'bg-gray-100 text-gray-900 font-semibold'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                My Tasks
              </Link>
              <Link
                to="/admin/tasks"
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  active === 'admin-tasks'
                    ? 'bg-gray-100 text-gray-900 font-semibold'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                All Tasks
              </Link>
              <Link
                to="/admin/users"
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  active === 'admin-users'
                    ? 'bg-gray-100 text-gray-900 font-semibold'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Users
              </Link>
            </nav>
          )}
        </div>

        {/* Right: User Role Badge, Action, Sign out & Mobile Hamburger */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          {currentUser && (
            <Link
              to="/profile"
              title="View user profile"
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg transition-colors ${
                active === 'profile'
                  ? 'bg-gray-100 text-gray-900 font-semibold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-semibold uppercase">
                {currentUser.username?.[0] || 'U'}
              </div>
              <span className="text-xs font-medium hidden md:inline">{currentUser.username}</span>
              {isAdmin && (
                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Admin
                </span>
              )}
            </Link>
          )}

          <Link
            to="/tasks/new"
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-gray-900 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors shadow-xs"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            <span className="inline">New task</span>
          </Link>

          <button
            onClick={onLogout}
            title="Sign out"
            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors hidden sm:block"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>

          {/* Mobile hamburger menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label="Toggle navigation menu"
            className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 sm:hidden transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-2 shadow-lg">
          {currentUser && (
            <div className="pb-2.5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-900">{currentUser.username}</p>
                <p className="text-[11px] text-gray-400">{currentUser.email || 'Signed in'}</p>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                isAdmin ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60' : 'bg-gray-100 text-gray-700'
              }`}>
                {isAdmin ? 'Admin' : 'User'}
              </span>
            </div>
          )}

          <div className="space-y-1 pt-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                active === 'my-tasks' ? 'bg-gray-900 text-white font-semibold' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              My Tasks
            </Link>

            {isAdmin && (
              <>
                <Link
                  to="/admin/tasks"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    active === 'admin-tasks' ? 'bg-gray-900 text-white font-semibold' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All Tasks
                </Link>
                <Link
                  to="/admin/users"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    active === 'admin-users' ? 'bg-gray-900 text-white font-semibold' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Users
                </Link>
              </>
            )}

            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                active === 'profile' ? 'bg-gray-900 text-white font-semibold' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Profile
            </Link>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <Link
              to="/tasks/new"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-semibold text-gray-900 hover:underline"
            >
              + New Task
            </Link>
            <button
              type="button"
              onClick={() => { setMobileMenuOpen(false); onLogout(); }}
              className="text-xs font-medium text-red-600 hover:text-red-700 py-1 px-2.5 rounded hover:bg-red-50 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
