import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import NewTask from '../src/components/NewTask';
import * as api from '../src/api';

jest.mock('../src/api', () => ({
  createTask: jest.fn(),
  getTask: jest.fn(),
  updateTask: jest.fn(),
}));

describe('NewTask Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders task creation form fields correctly', () => {
    render(
      <MemoryRouter initialEntries={['/tasks/new']}>
        <Routes>
          <Route path="/tasks/new" element={<NewTask onLogout={jest.fn()} />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Create new task')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('What needs to be done?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add optional notes, details, or context...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
  });

  it('validates empty title and displays validation error message', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/tasks/new']}>
        <Routes>
          <Route path="/tasks/new" element={<NewTask onLogout={jest.fn()} />} />
        </Routes>
      </MemoryRouter>
    );

    const form = container.querySelector('form');
    fireEvent.submit(form);

    expect(await screen.findByText('Please provide a task title')).toBeInTheDocument();
    expect(api.createTask).not.toHaveBeenCalled();
  });

  it('submits valid task payload and calls createTask API', async () => {
    api.createTask.mockResolvedValueOnce({ id: '123', title: 'Buy groceries' });

    render(
      <MemoryRouter initialEntries={['/tasks/new']}>
        <Routes>
          <Route path="/tasks/new" element={<NewTask onLogout={jest.fn()} />} />
          <Route path="/" element={<div>Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    const titleInput = screen.getByPlaceholderText('What needs to be done?');
    fireEvent.change(titleInput, { target: { value: 'Buy groceries' } });

    const submitBtn = screen.getByRole('button', { name: /create task/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(api.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Buy groceries',
        priority: 'MED',
        status: 'pending',
      })
    );
  });
});
