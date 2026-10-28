import { AnimatePresence, motion } from 'framer-motion';
import { useProjects, useTasks } from '../../hooks';

export default function TasksPage() {
  const { projects } = useProjects();
  const projectId = projects[0]?.id;
  const { tasks } = useTasks(projectId);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">📝 Tasks</h2>
      {!projectId ? (
        <p className="text-gray-600">Select or create a project to view tasks.</p>
      ) : (
      <motion.ul className="space-y-2">
        <AnimatePresence>
          {tasks.map((task) => (
            <motion.li
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-lg shadow p-4 border border-gray-200"
            >
              <h3 className="text-lg font-semibold">{task.title}</h3>
              <p className="text-gray-600">{task.description}</p>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
      )}
    </div>
  );
}
