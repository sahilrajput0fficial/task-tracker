import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import ConfirmModal from './ConfirmModal';
import { getUsers, createUser, updateUser, deleteUser } from '../api';

export default function AdminUsers({ currentUser, onLogout }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('user');
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormUsername('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('user');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormUsername(user.username);
    setFormEmail(user.email);
    setFormPassword('');
    setFormRole(user.role || 'user');
    setError('');
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormSubmitting(true);

    try {
      if (editingUser) {
        // Update user
        const payload = {
          username: formUsername.trim(),
          email: formEmail.trim(),
          role: formRole,
        };
        if (formPassword.trim()) {
          payload.password = formPassword.trim();
        }
        await updateUser(editingUser.id, payload);
        setSuccess(`User "${formUsername}" updated successfully`);
      } else {
        // Create user
        if (!formPassword.trim()) {
          throw new Error('Password is required when creating a new user');
        }
        await createUser({
          username: formUsername.trim(),
          email: formEmail.trim(),
          password: formPassword.trim(),
          role: formRole,
        });
        setSuccess(`User "${formUsername}" created successfully`);
      }

      setModalOpen(false);
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);

  const handleDelete = (user) => {
    if (user.id === currentUser?.id) {
      setError('You cannot delete your own admin account.');
      return;
    }
    setUserToDelete(user);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setDeletingUser(true);
      setError('');
      await deleteUser(userToDelete.id);
      setSuccess(`User "${userToDelete.username}" deleted successfully`);
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    } finally {
      setDeletingUser(false);
    }
  };

  // Filter users
  const visibleUsers = users.filter(user => {
    if (roleFilter !== 'all' && user.role !== roleFilter) return false;
    const q = search.toLowerCase();
    return !q || user.username.toLowerCase().includes(q) || user.email.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-white">
      <Navbar currentUser={currentUser} active="admin-users" onLogout={onLogout} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">User Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage user accounts, roles, and system access.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors shadow-sm self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Add User
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

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7 7 0 104.65 4.65a7 7 0 0012 12z"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by username or email..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 placeholder:text-gray-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 bg-white"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins</option>
              <option value="user">Regular Users</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-20 text-center text-sm text-gray-400">Loading users...</div>
          ) : visibleUsers.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">No users found.</div>
          ) : (
            <>
              {/* Mobile Users Card View */}
              <div className="block sm:hidden divide-y divide-gray-100 bg-white">
                {visibleUsers.map((user) => {
                  const isSelf = user.id === currentUser?.id;
                  const isAdmin = user.role === 'admin';
                  const joined = new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <div key={user.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                            {user.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-gray-900">{user.username}</span>
                              {isSelf && (
                                <span className="text-[10px] text-gray-400 font-normal">(You)</span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 break-all">{user.email}</span>
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isAdmin
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {isAdmin ? 'Admin' : 'User'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-400">
                        <span>Joined {joined}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Edit user"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-.707.464l-3.121 1.04 1.04-3.121A2 2 0 019 13z"/>
                            </svg>
                          </button>
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => handleDelete(user)}
                              className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete user"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50/75 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Joined</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visibleUsers.map((user) => {
                      const isSelf = user.id === currentUser?.id;
                      const isAdmin = user.role === 'admin';
                      const joined = new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      });

                      return (
                        <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-medium text-gray-900 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                              {user.username.slice(0, 2).toUpperCase()}
                            </div>
                            <span>{user.username}</span>
                            {isSelf && (
                              <span className="text-[10px] text-gray-400 font-normal">(You)</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-gray-600">{user.email}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                isAdmin
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {isAdmin ? 'Admin' : 'User'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-gray-500 text-xs">{joined}</td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openEditModal(user)}
                                className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                                title="Edit user"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-.707.464l-3.121 1.04 1.04-3.121A2 2 0 019 13z"/>
                                </svg>
                              </button>
                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(user)}
                                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                  title="Delete user"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                  </svg>
                                </button>
                              )}
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

      {/* ─── Create / Edit User Modal ────────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">
                {editingUser ? `Edit User: ${editingUser.username}` : 'Add New User'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formUsername}
                  onChange={e => setFormUsername(e.target.value)}
                  placeholder="e.g. john_doe"
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  placeholder="e.g. john@example.com"
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  {editingUser ? 'New Password (leave empty to keep current)' : 'Password'} {!editingUser && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formPassword}
                  onChange={e => setFormPassword(e.target.value)}
                  placeholder={editingUser ? '••••••••' : 'Min 6 characters'}
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Role
                </label>
                <select
                  value={formRole}
                  onChange={e => setFormRole(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 bg-white text-gray-700"
                >
                  <option value="user">User (Standard)</option>
                  <option value="admin">Admin (Full Access)</option>
                </select>
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
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(userToDelete)}
        title="Delete User"
        message={`Are you sure you want to delete user "${userToDelete?.username}"? This will also remove all their associated tasks.`}
        confirmText="Delete User"
        loading={deletingUser}
        onCancel={() => setUserToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
