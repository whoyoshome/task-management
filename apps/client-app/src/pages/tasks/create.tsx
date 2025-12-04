import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreateTask,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from '../../types/task.types';
import { createTask } from '../../services/taskService';
import { getAllUsers } from '../../services/userService';
import { getAllProjects } from '../../services/projectService';
import type { components } from '@shared/api-types';

type UserResponse = components['schemas']['UserResponseDto'];
type ProjectResponse = components['schemas']['ProjectResponseDto'];

export default function CreateTaskPage() {
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<CreateTask>({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: undefined,
    created_by: '',
    assigned_to: '',
    project_id: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const userList = await getAllUsers();
        const projectList = await getAllProjects();
        setUsers(userList);
        setProjects(projectList);
      } catch (e) {
        console.error('Error fetching users or projects:', e);
      }
    };
    loadData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      formData.created_by = user.id;

      await createTask(formData);
      navigate('/tasks');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to create task';
      setError(message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 shadow rounded-md">
      <h2 className="text-xl font-bold mb-4">➕ Create New Task</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              {TASK_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium">Priority</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              {TASK_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Due Date</label>
          <input
            type="date"
            name="due_date"
            value={formData.due_date?.toString().substring(0, 10) || ''}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Assigned To</label>
          <input
            type="text"
            name="assigned_to"
            value={formData.assigned_to}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Project ID</label>
          <input
            type="text"
            name="project_id"
            value={formData.project_id}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            Create Task
          </button>
        </div>
      </form>
    </div>
  );
}
