import { createBrowserRouter } from 'react-router-dom';
import { PrivateRoute } from './PrivateRoute';
import DashboardLayout from '../components/layout/DashboardLayout';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Home from '../pages/Home';
import ProjectsPage from '../pages/Projects';
import TasksPage from '../pages/tasks';
import MyTasksPage from '../pages/MyTasks';
import ProjectBoardPage from '../pages/ProjectBoard';

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <PrivateRoute />,
      children: [
        {
          path: '/',
          element: <DashboardLayout />,
          children: [
            { index: true, element: <Home /> },
            { path: 'projects', element: <ProjectsPage /> },
            { path: 'tasks', element: <TasksPage /> },
            { path: 'my-tasks', element: <MyTasksPage /> },
            { path: 'projects/:id/board', element: <ProjectBoardPage /> },
          ],
        },
      ],
    },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  } as any
);
