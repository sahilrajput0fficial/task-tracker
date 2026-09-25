import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import ConfirmModal from './ConfirmModal';
import { getTasks, createTask, updateTask, deleteTask, getUsers } from '../api';

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

function fmtDate(ds) {
  if (!ds) return null;
  const d = new Date(ds);
  const now = new Date(); now.setHours(0,0,0,0);
  const tom = new Date(now); tom.setDate(now.getDate()+1);
  if (d < now) return { text: 'Overdue', red: true };
  if (d.toDateString() === now.toDateString()) return { text: 'Today', red: true };
  if (d.toDateString() === tom.toDateString()) return { text: 'Tomorrow', red: false };
  return { text: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), red: false };
}

export default function AdminTasks({ currentUser, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [sort, setSort] = useState('created');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Task Modal (Create / Edit by Admin)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MED');
  const [status, setStatus] = useState('pending');
  const [tag, setTag] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [tasksData, usersData] = await Promise.all([
        getTasks(),
        getUsers(),
      ]);
      setTasks(tasksData);
      setUsers(usersData);
    } catch (err) {
      setError(err.message || 'Failed to load tasks data');
    } finally {
      setLoading(false);
    }
  };

  const usersMap = {};
  users.forEach(u => { usersMap[u.id] = u; });

  const openCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setPriority('MED');
    setStatus('pending');
    setTag('');
    setDueDate('');
    setAssignedUserId(currentUser?.id || (users[0]?.id || ''));
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setTitle(task.title || '');
    setDescription(task.description || '');
    setPriority(task.priority || 'MED');
    setStatus(task.status || 'pending');
    setTag(task.tag || '');
    setDueDate(task.due_date || '');
    setAssignedUserId(task.user_id || currentUser?.id || '');
    setError('');
    setModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status,
        tag: tag.trim() || null,
        due_date: dueDate || null,
        user_id: assignedUserId || undefined,
      };

      if (editingTask) {
        await updateTask(editingTask.id, payload);
        setSuccess(`Task "${title}" updated`);
      } else {
        await createTask(payload);
        setSuccess(`Task "${title}" created`);
      }

      setModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to save task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (task) => {
    const next = task.status === 'completed' ? 'pending' : 'completed';
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t));
    try {
      await updateTask(task.id, { status: next });
    } catch (err) {
      console.error(err);
      loadData();
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    try {
      await updateTask(task.id, { status: newStatus });
    } catch (err) {
      setError(err.message || 'Failed to update task status');
      loadData();
    }
  };

  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deletingTask, setDeletingTask] = useState(false);

  const handleDelete = (task) => {
    setTaskToDelete(task);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;

    try {
      setDeletingTask(true);
      setError('');
      await deleteTask(taskToDelete.id);
      setSuccess(`Task "${taskToDelete.title}" deleted`);
      setTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
      setTaskToDelete(null);
    } catch (err) {
      setError(err.message || 'Failed to delete task');
    } finally {
      setDeletingTask(false);
    }
  };

  // Filter & sort
  const visibleTasks = tasks
    .filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (userFilter !== 'all' && t.user_id !== userFilter) return false;
      const q = search.toLowerCase();
      const owner = usersMap[t.user_id]?.username?.toLowerCase() || '';
      return (
        !q ||
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.tag && t.tag.toLowerCase().includes(q)) ||
        owner.includes(q)
      );
    })
    .sort((a, b) => {
      if (sort === 'priority') {
        const order = { HIGH: 0, MED: 1, LOW: 2 };
        return (order[a.priority] ?? 1) - (order[b.priority] ?? 1);
      }
      if (sort === 'due') {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      }
      return b.id - a.id;
    });

  return (
    <div className="min-h-screen bg-white">
      <Navbar currentUser={currentUser} active="admin-tasks" onLogout={onLogout} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">All Tasks Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Admin view of all tasks across all users in the system. ({tasks.length} total)
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors shadow-sm self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Create Task
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-700">✕</button>
          </div>
        )}
        {success && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700 flex items-center justify-between">
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-800">✕</button>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-6">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7 7 0 104.65 4.65a7 7 0 0012 12z"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search title, tag, or owner username..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending">To do</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* User filter */}
          <div>
            <select
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 bg-white"
            >
              <option value="all">All Users</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.username} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Sort selector */}
          <div>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 bg-white"
            >
              <option value="created">Newest first</option>
              <option value="due">Due date</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-20 text-center text-sm text-gray-400">Loading all tasks...</div>
          ) : visibleTasks.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">No tasks found matching criteria.</div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden divide-y divide-gray-100 bg-white">
                {visibleTasks.map(task => {
                  const done = task.status === 'completed';
                  const due = fmtDate(task.due_date);
                  const pri = PRIORITIES.find(p => p.value === task.priority) || PRIORITIES[1];
                  const owner = usersMap[task.user_id];

                  return (
                    <div key={task.id} className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggle(task)}
                          title={done ? 'Mark as to do' : 'Mark as done'}
                          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5 ${
                            done ? 'bg-gray-900 border-gray-900' : 'border-gray-300 hover:border-gray-500'
                          }`}
                        >
                          {done && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5"/>
                            </svg>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-medium tracking-tight block break-words ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            {task.title}
                          </span>
                          {task.description && (
                            <p className="text-xs text-gray-500 break-words mt-0.5 line-clamp-2">{task.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Owner Badge */}
                          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200/80 px-2 py-0.5 rounded text-xs text-gray-700">
                            <span className="w-4 h-4 rounded-full bg-gray-200 text-[9px] font-bold flex items-center justify-center text-gray-700">
                              {owner ? owner.username.slice(0, 1).toUpperCase() : '?'}
                            </span>
                            <span>{owner ? owner.username : 'Unknown'}</span>
                          </div>

                          {/* Priority */}
                          <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                            <span style={{ background: pri.dot }} className="w-2 h-2 rounded-full" />
                            <span>{pri.label}</span>
                          </div>

                          {/* Due Date */}
                          {due && (
                            <span className={`text-xs px-2 py-0.5 rounded ${due.red ? 'bg-red-50 text-red-600 font-medium' : 'bg-gray-50 text-gray-500'}`}>
                              {due.text}
                            </span>
                          )}

                          {/* Tag */}
                          {task.tag && (
                            <span className="text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              {task.tag}
                            </span>
                          )}
                        </div>

                        {/* Status & Actions */}
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end pt-1 sm:pt-0">
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task, e.target.value)}
                            title="Update status directly"
                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border cursor-pointer outline-none transition-all ${
                              task.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : task.status === 'in_progress'
                                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                            }`}
                          >
                            <option value="pending">To do</option>
                            <option value="in_progress">In progress</option>
                            <option value="completed">Done</option>
                          </select>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(task)}
                              className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                              title="Edit task"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-.707.464l-3.121 1.04 1.04-3.121A2 2 0 019 13z"/>
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(task)}
                              className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete task"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50/75 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="py-3 px-4 w-10"></th>
                      <th className="py-3 px-4">Task</th>
                      <th className="py-3 px-4">Assigned To</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visibleTasks.map(task => {
                      const done = task.status === 'completed';
                      const due = fmtDate(task.due_date);
                      const pri = PRIORITIES.find(p => p.value === task.priority) || PRIORITIES[1];
                      const owner = usersMap[task.user_id];

                      return (
                        <tr key={task.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggle(task)}
                              title={done ? 'Mark as to do' : 'Mark as done'}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                done ? 'bg-gray-900 border-gray-900' : 'border-gray-300 hover:border-gray-500'
                              }`}
                            >
                              {done && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5"/>
                                </svg>
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-900">
                            <div className="flex flex-col">
                              <span className={`break-words ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                {task.title}
                              </span>
                              {task.description && (
                                <span className="text-xs text-gray-400 font-normal truncate max-w-xs">
                                  {task.description}
                                </span>
                              )}
                              {task.tag && (
                                <span className="mt-1 inline-block text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded w-max">
                                  {task.tag}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-gray-100 border border-gray-200 text-[10px] font-semibold flex items-center justify-center text-gray-600">
                                {owner ? owner.username.slice(0, 2).toUpperCase() : '?'}
                              </span>
                              <span className="text-xs text-gray-700 font-medium">
                                {owner ? owner.username : 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span style={{ background: pri.dot }} className="w-2 h-2 rounded-full" />
                              <span className="text-xs text-gray-600">{pri.label}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={task.status}
                              onChange={(e) => handleStatusChange(task, e.target.value)}
                              title="Update status directly"
                              className={`text-xs font-semibold px-2 py-1 rounded-lg border cursor-pointer outline-none transition-all ${
                                task.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : task.status === 'in_progress'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                              }`}
                            >
                              <option value="pending">To do</option>
                              <option value="in_progress">In progress</option>
                              <option value="completed">Done</option>
                            </select>
                          </td>
                          <td className="py-3 px-4 text-xs">
                            {due ? (
                              <span className={due.red ? 'text-red-500 font-medium' : 'text-gray-500'}>
                                {due.text}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openEditModal(task)}
                                className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                                title="Edit task"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-.707.464l-3.121 1.04 1.04-3.121A2 2 0 019 13z"/>
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(task)}
                                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                title="Delete task"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>

      {/* ─── Create / Edit Task Modal for Admin ─────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">
                {editingTask ? 'Edit Task (Admin)' : 'Create Task (Admin)'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Task title"
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Optional details..."
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 placeholder:text-gray-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Assign To User <span className="text-red-500">*</span>
                </label>
                <select
                  value={assignedUserId}
                  onChange={e => setAssignedUserId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 bg-white text-gray-700"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.username} ({u.email}) - {u.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 bg-white text-gray-700"
                  >
                    {PRIORITIES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 bg-white text-gray-700"
                  >
                    {STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Tag
                  </label>
                  <input
                    type="text"
                    value={tag}
                    onChange={e => setTag(e.target.value)}
                    placeholder="e.g. Backend"
                    className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 bg-white text-gray-700"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={Boolean(taskToDelete)}
        title="Delete Task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete Task"
        loading={deletingTask}
        onCancel={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
