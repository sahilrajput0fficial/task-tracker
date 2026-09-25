import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import { getTasks, getCurrentUser } from '../api';

export default function Profile({ currentUser: initialUser, onLogout }) {
  const [user, setUser] = useState(initialUser);
  const [stats, setStats] = useState({ total: 0, done: 0, in_progress: 0, todo: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileAndStats = async () => {
      try {
        setLoading(true);
        const [userData, userTasks] = await Promise.all([
          getCurrentUser(),
          getTasks(null, true),
        ]);

        if (userData) setUser(userData);

        if (Array.isArray(userTasks)) {
          // Filter strictly to current user's tasks
          const myTasks = userData?.id ? userTasks.filter((t) => t.user_id === userData.id) : userTasks;
          const done = myTasks.filter((t) => t.status === 'completed').length;
          const inProgress = myTasks.filter((t) => t.status === 'in_progress').length;
          const todo = myTasks.filter((t) => t.status === 'pending').length;

          setStats({
            total: myTasks.length,
            done,
            in_progress: inProgress,
            todo,
          });
        }
      } catch (err) {
        console.error('Failed to load profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndStats();
  }, []);

  const displayUser = user || initialUser;
  const isAdmin = displayUser?.role === 'admin';

  const memberSince = displayUser?.created_at
    ? new Date(displayUser.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently';

  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-white">
      <Navbar currentUser={displayUser} active="profile" onLogout={onLogout} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs text-gray-500">
          <Link to="/" className="hover:text-gray-900 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">User Profile</span>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-6 sm:p-8 shadow-xs mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-900 text-white flex items-center justify-center text-2xl font-bold tracking-tight shadow-sm">
                {displayUser?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                    {displayUser?.username || 'User Profile'}
                  </h1>
                  {isAdmin ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                      Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
                      User
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{displayUser?.email}</p>
                <p className="text-xs text-gray-400 mt-1">Member since {memberSince}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                My Tasks
              </Link>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-red-50 text-red-600 border border-red-200/60 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Details & Task Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Account Details Box */}
          <div className="md:col-span-1 bg-white border border-gray-200/80 rounded-xl p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Account Information
            </h2>

            <div className="space-y-3 text-sm">
              <div>
                <span className="block text-xs text-gray-400">User ID</span>
                <span className="font-mono text-xs text-gray-700 font-semibold">{displayUser?.id ?? '—'}</span>
              </div>

              <div>
                <span className="block text-xs text-gray-400">Username</span>
                <span className="text-gray-900 font-medium">{displayUser?.username}</span>
              </div>

              <div>
                <span className="block text-xs text-gray-400">Email Address</span>
                <span className="text-gray-900 font-medium break-all">{displayUser?.email}</span>
              </div>

              <div>
                <span className="block text-xs text-gray-400">Account Role</span>
                <span className="text-gray-900 font-medium capitalize">
                  {isAdmin ? 'System Administrator' : 'Standard User'}
                </span>
              </div>

              <div>
                <span className="block text-xs text-gray-400">Status</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Account
                </span>
              </div>
            </div>
          </div>

          {/* Activity & Tasks Overview */}
          <div className="md:col-span-2 space-y-6">
            {/* Task Stats Grid */}
            <div className="bg-white border border-gray-200/80 rounded-xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Personal Task Statistics
                </h2>
                <Link to="/tasks/new" className="text-xs font-medium text-gray-900 hover:underline">
                  + New Task
                </Link>
              </div>

              {loading ? (
                <div className="py-8 flex justify-center">
                  <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-lg">
                      <span className="text-xs text-gray-500 block mb-1">Total Tasks</span>
                      <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
                    </div>

                    <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-lg">
                      <span className="text-xs text-emerald-700 block mb-1">Completed</span>
                      <span className="text-2xl font-bold text-emerald-700">{stats.done}</span>
                    </div>

                    <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-lg">
                      <span className="text-xs text-blue-700 block mb-1">In Progress</span>
                      <span className="text-2xl font-bold text-blue-700">{stats.in_progress}</span>
                    </div>

                    <div className="p-3.5 bg-amber-50/60 border border-amber-100 rounded-lg">
                      <span className="text-xs text-amber-700 block mb-1">To Do</span>
                      <span className="text-2xl font-bold text-amber-700">{stats.todo}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>Task Completion Rate</span>
                      <span className="font-semibold text-gray-900">{completionRate}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-900 rounded-full transition-all duration-500"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Admin Quick Links */}
            {isAdmin && (
              <div className="bg-white border border-gray-200/80 rounded-xl p-6 shadow-xs">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Administrator Navigation
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link
                    to="/admin/tasks"
                    className="p-4 rounded-lg border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <span className="block text-sm font-semibold text-gray-900">Manage All Tasks</span>
                      <span className="text-xs text-gray-500">View and assign tasks across all users</span>
                    </div>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>

                  <Link
                    to="/admin/users"
                    className="p-4 rounded-lg border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <span className="block text-sm font-semibold text-gray-900">Manage Users</span>
                      <span className="text-xs text-gray-500">Manage user accounts and roles</span>
                    </div>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
