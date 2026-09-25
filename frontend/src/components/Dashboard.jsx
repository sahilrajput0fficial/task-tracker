import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import ConfirmModal from './ConfirmModal';
import { getTasks, updateTask, deleteTask } from '../api';


const PRIORITY = {
  HIGH: { label: 'High',   dot: '#ef4444' },
  MED:  { label: 'Medium', dot: '#f59e0b' },
  LOW:  { label: 'Low',    dot: '#6b7280' },
};

function fmtDate(ds) {
  if (!ds) return null;
  const d   = new Date(ds);
  const now = new Date(); now.setHours(0,0,0,0);
  const tom = new Date(now); tom.setDate(now.getDate()+1);
  if (d < now)                               return { text: 'Overdue',  red: true  };
  if (d.toDateString() === now.toDateString()) return { text: 'Today',    red: true  };
  if (d.toDateString() === tom.toDateString()) return { text: 'Tomorrow', red: false };
  return { text: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), red: false };
}

function toKey(s) { return s === 'completed' ? 'done' : s === 'in_progress' ? 'in_progress' : 'todo'; }

// ── TaskRow ───────────────────────────────────────────────────────────────────

function TaskRow({ task, onToggle, onStatusChange, onRequestDelete }) {
  const done = task.status === 'completed';
  const due  = fmtDate(task.due_date);
  const pri  = PRIORITY[task.priority] || PRIORITY.MED;

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-xl border border-gray-100 hover:border-gray-200 bg-white hover:bg-gray-50/70 transition-all shadow-2xs mb-2">
      {/* Left: Checkbox + Priority dot + Title/Desc */}
      <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
        {/* Checkbox */}
        <button
          type="button"
          onClick={() => onToggle(task)}
          title={done ? 'Mark as to do' : 'Mark as completed'}
          className={`flex-shrink-0 w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-md border-2 flex items-center justify-center transition-all mt-0.5 sm:mt-0 ${
            done ? 'bg-gray-900 border-gray-900 shadow-2xs' : 'border-gray-300 hover:border-gray-600 bg-white'
          }`}
        >
          {done && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5"/>
            </svg>
          )}
        </button>

        {/* Priority dot */}
        <span
          title={`Priority: ${pri.label}`}
          style={{ background: pri.dot }}
          className="flex-shrink-0 w-2.5 h-2.5 rounded-full mt-1.5 sm:mt-0 ring-2 ring-white"
        />

        {/* Title & Description */}
        <div className="flex-1 min-w-0">
          <span className={`text-sm font-medium tracking-tight block break-words ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {task.title}
          </span>
          {task.description && (
            <p className="text-xs text-gray-500 line-clamp-2 sm:line-clamp-1 break-words mt-0.5">{task.description}</p>
          )}
        </div>
      </div>

      {/* Right: Inline Status Picker + Tags + Due Date + Larger Action Buttons */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100/80">
        <div className="flex items-center gap-2">
          {/* Direct Status Selector */}
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task, e.target.value)}
            title="Update task status directly"
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border cursor-pointer outline-none transition-all shadow-2xs ${
              task.status === 'completed'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : task.status === 'in_progress'
                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                : 'bg-amber-50/70 text-amber-800 border-amber-200/80 hover:bg-amber-100/70'
            }`}
          >
            <option value="pending">To do</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Done</option>
          </select>

          {/* Tag */}
          {task.tag && (
            <span className="hidden sm:inline-block text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
              {task.tag}
            </span>
          )}

          {/* Due date */}
          {due && (
            <span className={`text-xs font-medium ${due.red ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
              {due.text}
            </span>
          )}
        </div>

        {/* Action Buttons: Larger icons, always visible on mobile, hover on desktop */}
        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <Link
            to={`/tasks/${task.id}/edit`}
            className="p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
            title="Edit task"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-.707.464l-3.121 1.04 1.04-3.121A2 2 0 019 13z"/>
            </svg>
          </Link>
          <button
            type="button"
            onClick={() => onRequestDelete(task)}
            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            title="Delete task"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'all',         label: 'All' },
  { key: 'todo',        label: 'To do' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'done',        label: 'Done' },
];

const PRI_ORDER = { HIGH: 0, MED: 1, LOW: 2 };

export default function Dashboard({ currentUser, onLogout }) {
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [tab,     setTab]     = useState('all');
  const [sort,    setSort]    = useState('created');

  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    load();
  }, [currentUser?.id]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getTasks(null, true);
      const myTasks = currentUser?.id ? data.filter(t => t.user_id === currentUser.id) : data;
      setTasks(myTasks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggle = async (task) => {
    const next = task.status === 'completed' ? 'pending' : 'completed';
    setTasks(p => p.map(t => t.id === task.id ? { ...t, status: next } : t));
    try {
      await updateTask(task.id, { status: next });
    } catch (e) {
      console.error(e);
      load();
    }
  };

  const changeStatus = async (task, newStatus) => {
    setTasks(p => p.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    try {
      await updateTask(task.id, { status: newStatus });
    } catch (e) {
      console.error(e);
      load();
    }
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      setDeleting(true);
      await deleteTask(taskToDelete.id);
      setTasks(p => p.filter(t => t.id !== taskToDelete.id));
      setTaskToDelete(null);
    } catch (e) {
      console.error(e);
      load();
    } finally {
      setDeleting(false);
    }
  };

  // counts
  const counts = { all: tasks.length, todo: 0, in_progress: 0, done: 0 };
  tasks.forEach(t => {
    const k = toKey(t.status);
    if (counts[k] !== undefined) counts[k]++;
  });

  // filter + sort
  const visible = tasks
    .filter(t => {
      const k = toKey(t.status);
      if (tab !== 'all' && k !== tab) return false;
      const q = search.toLowerCase();
      return !q || t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)) || (t.tag && t.tag.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      if (sort === 'priority') return (PRI_ORDER[a.priority] ?? 1) - (PRI_ORDER[b.priority] ?? 1);
      if (sort === 'due') {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      }
      return b.id - a.id;
    });

  const done  = tasks.filter(t => t.status === 'completed').length;
  const total = tasks.length;

  return (
    <div className="min-h-screen bg-white">
      <Navbar currentUser={currentUser} active="my-tasks" onLogout={onLogout} />

      {/* ─── Content ─────────────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* summary row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">My tasks</h1>
            <p className="text-sm text-gray-400 mt-0.5">{done} of {total} completed</p>
          </div>
          {/* sort */}
          <select value={sort} onChange={e => setSort(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 outline-none focus:border-gray-400 bg-white self-start sm:self-auto">
            <option value="created">Newest first</option>
            <option value="due">Due date</option>
            <option value="priority">Priority</option>
          </select>
        </div>

        {/* search */}
        <div className="relative mb-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7 7 0 104.65 4.65a7 7 0 0012 12z"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 placeholder:text-gray-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          )}
        </div>

        {/* tabs */}
        <div className="flex items-center gap-1 mb-2 border-b border-gray-100 overflow-x-auto whitespace-nowrap pb-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-2 text-sm transition-colors border-b-2 -mb-px flex-shrink-0 ${tab === t.key ? 'border-gray-900 text-gray-900 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t.label}
              <span className={`ml-1.5 text-xs ${tab === t.key ? 'text-gray-500' : 'text-gray-400'}`}>{counts[t.key]}</span>
            </button>
          ))}
        </div>

        {/* task list */}
        <div className="mt-1">
          {loading ? (
            <div className="py-16 text-center text-sm text-gray-400">Loading...</div>
          ) : visible.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-gray-400">No tasks found.</p>
              {(search || tab !== 'all') && (
                <button onClick={() => { setSearch(''); setTab('all'); }} className="mt-2 text-sm text-gray-600 underline underline-offset-2">Clear filters</button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {visible.map(task => (
                <TaskRow key={task.id} task={task} onToggle={toggle} onStatusChange={changeStatus} onRequestDelete={setTaskToDelete}/>
              ))}
            </div>
          )}
        </div>
      </main>

      <ConfirmModal
        isOpen={Boolean(taskToDelete)}
        title="Delete Task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete Task"
        loading={deleting}
        onCancel={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
