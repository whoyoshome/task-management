import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CreateTaskModal from '../modals/CreateTaskModal';
import Icon from '../common/Icon';

const NAV = [
  { to: '/', label: 'Home', isActive: (path: string) => path === '/' },
  { to: '/projects', label: 'Projects', isActive: (path: string) => path.startsWith('/projects') },
  { to: '/my-tasks', label: 'My Tasks', isActive: (path: string) => path.startsWith('/my-tasks') },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-gray-900">Task Manager</h1>
            <p className="hidden sm:block truncate text-xs text-gray-500">
              Welcome, {user?.full_name || 'User'} (
              {user?.role === 'admin' ? 'Administrator' : 'User'})
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              aria-label="New task"
              className="inline-flex items-center gap-1 px-3 sm:px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800"
            >
              <Icon name="plus" className="h-4 w-4" />
              <span className="hidden sm:inline">New task</span>
            </button>
            <button
              onClick={() => logout()}
              className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto">
            {NAV.map((item) => {
              const active = item.isActive(location.pathname);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? 'page' : undefined}
                  className={`whitespace-nowrap px-4 py-3 text-sm font-medium flex items-center gap-2 ${
                    active
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
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
