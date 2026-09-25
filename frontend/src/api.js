const BASE_URL = import.meta.env.VITE_API_URL || '';

let refreshPromise = null;

function getAuthHeaders() {
  const token = localStorage.getItem('tasktrack_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseJsonSafe(response) {
  try {
    const data = await response.json();
    return data ?? {};
  } catch {
    return {};
  }
}

export async function refreshToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await parseJsonSafe(response);
      if (!response.ok) {
        throw new Error(data.detail || `Failed to refresh token (${response.status})`);
      }

      if (data.access_token) {
        localStorage.setItem('tasktrack_token', data.access_token);
      }

      return data;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function authFetch(url, options = {}) {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  let response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (response.status === 401 && !url.includes('/auth/refresh') && !url.includes('/auth/login')) {
    try {
      const refreshed = await refreshToken();
      if (refreshed?.access_token) {
        const retryHeaders = {
          ...headers,
          Authorization: `Bearer ${refreshed.access_token}`,
        };
        response = await fetch(url, {
          ...options,
          credentials: 'include',
          headers: retryHeaders,
        });
      }
    } catch {
      localStorage.removeItem('tasktrack_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  }

  return response;
}

export async function loginUser(usernameOrEmail, password) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username_or_email: usernameOrEmail,
      password: password,
    }),
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to sign in. Please verify your credentials.');
  }

  return data;
}

export async function logoutUser() {
  try {
    await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    localStorage.removeItem('tasktrack_token');
  }
}

export async function registerUser({ username, email, password }) {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: username,
      email: email,
      password: password,
      role: 'user',
    }),
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(data.detail || 'Registration failed. Please check your inputs.');
  }

  return data;
}

export async function getTasks(status = null, mine = false) {
  let url = `${BASE_URL}/tasks`;
  const params = new URLSearchParams();
  if (status && status !== 'all') {
    params.append('status', status);
  }
  if (mine) {
    params.append('mine', 'true');
  }
  const queryString = params.toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  const response = await authFetch(url, {
    method: 'GET',
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to fetch tasks');
  }

  return data;
}

export async function getTask(id) {
  const response = await authFetch(`${BASE_URL}/tasks/${id}`, {
    method: 'GET',
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to fetch task');
  }

  return data;
}

export async function createTask({ title, description, status = 'pending', priority = 'MED', tag, due_date }) {
  const payload = { title, status, priority };
  if (description) payload.description = description;
  if (tag) payload.tag = tag;
  if (due_date) payload.due_date = due_date;

  const response = await authFetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to create task');
  }

  return data;
}

export async function updateTask(id, updateData) {
  const response = await authFetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to update task');
  }

  return data;
}

export async function deleteTask(id) {
  const response = await authFetch(`${BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const data = await parseJsonSafe(response);
    throw new Error(data.detail || 'Failed to delete task');
  }

  return true;
}

export async function getCurrentUser() {
  const response = await authFetch(`${BASE_URL}/users/me`, {
    method: 'GET',
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to load user profile');
  }

  return data;
}

export async function getUsers() {
  const response = await authFetch(`${BASE_URL}/users`, {
    method: 'GET',
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to load users');
  }

  return data;
}

export async function createUser(userData) {
  const response = await authFetch(`${BASE_URL}/users`, {
    method: 'POST',
    body: JSON.stringify(userData),
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to create user');
  }

  return data;
}

export async function updateUser(id, userData) {
  const response = await authFetch(`${BASE_URL}/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to update user');
  }

  return data;
}

export async function deleteUser(id) {
  const response = await authFetch(`${BASE_URL}/users/${id}`, {
    method: 'DELETE',
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to delete user');
  }

  return data;
}
