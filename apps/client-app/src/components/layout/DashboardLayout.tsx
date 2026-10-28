import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CreateTaskModal from '../modals/CreateTaskModal';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Task Manager</h1>
            <p className="text-xs text-gray-500">
              Welcome, {user?.full_name || 'User'} (
              {user?.role === 'admin' ? 'Administrator' : 'User'})
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800"
            >
              + New task
            </button>
            <button
              onClick={() => logout()}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex gap-1">
            <Link
              to="/"
              className={`px-4 py-3 text-sm font-medium flex items-center gap-2 ${
                location.pathname === '/'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              Home
            </Link>
            <Link
              to="/projects"
              className={`px-4 py-3 text-sm font-medium flex items-center gap-2 ${
                location.pathname.startsWith('/projects')
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              Projects
            </Link>
            <Link
              to="/my-tasks"
              className={`px-4 py-3 text-sm font-medium flex items-center gap-2 ${
                location.pathname.startsWith('/my-tasks')
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              My Tasks
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>

      {/* Quick create from anywhere: the user picks the project. */}
      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
