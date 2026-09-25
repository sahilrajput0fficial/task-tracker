import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../src/components/Navbar';

describe('Navbar Component', () => {
  it('renders regular user view without admin links', () => {
    const user = { username: 'johndoe', role: 'user' };
    const handleLogout = jest.fn();

    render(
      <BrowserRouter>
        <Navbar currentUser={user} active="my-tasks" onLogout={handleLogout} />
      </BrowserRouter>
    );

    // Assert user info displayed
    expect(screen.getByText('johndoe')).toBeInTheDocument();
    expect(screen.getByText('TaskTrack')).toBeInTheDocument();
    expect(screen.getByText('New task')).toBeInTheDocument();

    // Assert admin-specific links are absent
    expect(screen.queryByText('All Tasks')).not.toBeInTheDocument();
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  it('renders admin links and role badge for admin users', () => {
    const admin = { username: 'adminuser', role: 'admin' };
    const handleLogout = jest.fn();

    render(
      <BrowserRouter>
        <Navbar currentUser={admin} active="admin-tasks" onLogout={handleLogout} />
      </BrowserRouter>
    );

    // Assert admin badge and links are visible
    expect(screen.getByText('adminuser')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('All Tasks')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('calls onLogout when logout button is clicked', () => {
    const user = { username: 'johndoe', role: 'user' };
    const handleLogout = jest.fn();

    render(
      <BrowserRouter>
        <Navbar currentUser={user} active="my-tasks" onLogout={handleLogout} />
      </BrowserRouter>
    );

    const logoutBtn = screen.getByTitle('Sign out');
    fireEvent.click(logoutBtn);

    expect(handleLogout).toHaveBeenCalledTimes(1);
  });
});
