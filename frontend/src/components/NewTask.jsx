import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { createTask, getTask, updateTask } from '../api';

const PRIORITIES = [
  { value: 'HIGH', label: 'High', dot: '#ef4444' },
  { value: 'MED', label: 'Medium', dot: '#f59e0b' },
  { value: 'LOW', label: 'Low', dot: '#6b7280' },
];

const STATUSES = [
  { value: 'pending', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Done' },
];

export default function NewTask({ onLogout }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MED');
  const [status, setStatus] = useState('pending');
  const [tag, setTag] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [fetching, setFetching] = useState(isEditing);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing) return;

    const fetchTaskDetails = async () => {
      try {
        setFetching(true);
        const data = await getTask(id);
        setTitle(data.title || '');
        setDescription(data.description || '');
        setPriority(data.priority || 'MED');
        setStatus(data.status || 'pending');
        setTag(data.tag || '');
        setDueDate(data.due_date || '');
      } catch (err) {
        setError(err.message || 'Failed to load task details');
      } finally {
        setFetching(false);
      }
    };

    fetchTaskDetails();
  }, [id, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a task title');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status,
        tag: tag.trim() || null,
        due_date: dueDate || null,
      };

      if (isEditing) {
        await updateTask(id, payload);
      } else {
        await createTask(payload);
      }

      navigate('/');
    } catch (err) {
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} task`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Navbar ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* logo & back */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/" className="flex items-center gap-1.5 sm:gap-2 text-gray-900 hover:opacity-80 transition-opacity">
              <svg className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
              </svg>
              <span className="text-sm font-semibold text-gray-900 tracking-tight">TaskTrack</span>
            </Link>

            <span className="text-gray-300">/</span>

            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Tasks
            </Link>
          </div>

          {/* right: sign out */}
          <div className="flex items-center gap-3">
            <button
              onClick={onLogout}
              title="Sign out"
              className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─────────────────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            {isEditing ? 'Edit task' : 'Create new task'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isEditing
              ? 'Update task details, priority, status, or deadlines.'
              : 'Add a new task with details, priority, and due dates.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-700">✕</button>
          </div>
        )}

        {fetching ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-sm text-gray-400">
            <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            <span>Loading task details...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Task Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all placeholder:text-gray-400"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add optional notes, details, or context..."
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all placeholder:text-gray-400 resize-none"
              />
            </div>

            {/* Priority & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Priority
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value)}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                        priority === p.value
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span
                        style={{ background: priority === p.value ? '#ffffff' : p.dot }}
                        className="w-1.5 h-1.5 rounded-full"
                      />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 bg-white text-gray-700"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tag & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Tag / Category
                </label>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="e.g. Backend, Design, Personal"
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 bg-white text-gray-700"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>{isEditing ? 'Saving...' : 'Creating...'}</span>
                  </>
                ) : (
                  isEditing ? 'Save Changes' : 'Create Task'
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
