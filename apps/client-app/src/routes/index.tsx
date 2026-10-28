import { createBrowserRouter, Navigate, useParams } from 'react-router-dom';
import { PrivateRoute } from './PrivateRoute';
import DashboardLayout from '../components/layout/DashboardLayout';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Home from '../pages/Home';
import ProjectsPage from '../pages/Projects';
import MyTasksPage from '../pages/MyTasks';
import ProjectPage from '../pages/ProjectPage';
import { AppProviders } from '../providers/AppProviders';

/** Old board URL: the board is now the default view of the project page. */
function LegacyBoardRedirect() {
  const { id } = useParams();
  return <Navigate to={`/projects/${id}`} replace />;
}

export const router = createBrowserRouter(
  [
    {
      element: <AppProviders />,
      children: [
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
                { path: 'projects/:id', element: <ProjectPage /> },
                { path: 'projects/:id/board', element: <LegacyBoardRedirect /> },
                { path: 'my-tasks', element: <MyTasksPage /> },
              ],
            },
          ],
        },
        { path: '/login', element: <Login /> },
        { path: '/register', element: <Register /> },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  } as Parameters<typeof createBrowserRouter>[1]
);
