import { getTasks, createTask, refreshToken, authFetch } from '../src/api';

describe('API client & Auth Integration', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('attaches Bearer token from localStorage to authenticated requests', async () => {
    localStorage.setItem('tasktrack_token', 'mock-access-token');

    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [{ id: 'task-1', title: 'Test Task' }],
    });

    const tasks = await getTasks();

    expect(tasks).toEqual([{ id: 'task-1', title: 'Test Task' }]);
    expect(global.fetch).toHaveBeenCalledWith(
      '/tasks',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-access-token',
        }),
      })
    );
  });

  it('sends correct POST body and credentials when creating a task', async () => {
    localStorage.setItem('tasktrack_token', 'mock-access-token');

    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: 'task-123', title: 'New Bugfix', priority: 'HIGH' }),
    });

    const payload = {
      title: 'New Bugfix',
      priority: 'HIGH',
      status: 'pending',
    };

    const result = await createTask(payload);

    expect(result.id).toBe('task-123');
    expect(global.fetch).toHaveBeenCalledWith(
      '/tasks',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      })
    );
    const sentBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(sentBody).toEqual(payload);
  });

  it('refreshes token and stores new access token in localStorage', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: 'new-refreshed-token',
        token_type: 'bearer',
      }),
    });

    const data = await refreshToken();

    expect(data.access_token).toBe('new-refreshed-token');
    expect(localStorage.getItem('tasktrack_token')).toBe('new-refreshed-token');
    expect(global.fetch).toHaveBeenCalledWith(
      '/auth/refresh',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      })
    );
  });

  it('retries request automatically when receiving 401 Unauthorized', async () => {
    localStorage.setItem('tasktrack_token', 'expired-token');

    // 1st call: returns 401
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ detail: 'Token expired' }),
    });

    // 2nd call: /auth/refresh returns new token
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ access_token: 'fresh-valid-token' }),
    });

    // 3rd call: retry original request returns 200
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    const response = await authFetch('/tasks');

    expect(response.status).toBe(200);
    expect(localStorage.getItem('tasktrack_token')).toBe('fresh-valid-token');
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });
});
