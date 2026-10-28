import 'reflect-metadata';
import dataSource from '../database/data-source';
import { Repository } from 'typeorm';
import { Project } from '../tasks/entities/projects.entity';
import { Board } from '../tasks/entities/boards.entity';
import { BoardColumn } from '../tasks/entities/board-columns.entity';
import { ProjectMembers } from '../tasks/entities/project-members.entity';
import { Task } from '../tasks/entities/tasks.entity';
import { TaskStatus, TaskPriority, ProjectRole } from '@shared/contracts';

const PROJECT_DESCRIPTION = 'A sample project to explore the board';
// Description used by earlier versions of this seed.
const OLD_PROJECT_DESCRIPTION = 'Proyecto de ejemplo para empezar';

type Who = 'admin' | 'member' | 'demo';

const SAMPLE_TASKS: {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: Who;
  dueInDays?: number;
}[] = [
  { title: 'Set up the project repository', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, assignee: 'admin' },
  { title: 'Design the login screen', status: TaskStatus.COMPLETED, priority: TaskPriority.MEDIUM, assignee: 'member' },
  { title: 'Implement JWT authentication', description: 'Access token plus a rotating refresh token in an httpOnly cookie.', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, assignee: 'demo', dueInDays: 2 },
  { title: 'Build the kanban board', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, assignee: 'member', dueInDays: 5 },
  { title: 'Write e2e tests for tasks', status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM, assignee: 'demo', dueInDays: 7 },
  { title: 'Add labels to tasks', status: TaskStatus.PENDING, priority: TaskPriority.LOW, assignee: 'admin' },
  { title: 'Prepare the release notes', status: TaskStatus.PENDING, priority: TaskPriority.LOW, assignee: 'demo', dueInDays: 14 },
];

async function run() {
  await dataSource.initialize();
  const projectRepo: Repository<Project> = dataSource.getRepository(Project);
  const boardRepo: Repository<Board> = dataSource.getRepository(Board);
  const colRepo: Repository<BoardColumn> =
    dataSource.getRepository(BoardColumn);
  const memberRepo: Repository<ProjectMembers> =
    dataSource.getRepository(ProjectMembers);
  const taskRepo: Repository<Task> = dataSource.getRepository(Task);
  const userIds: Record<Who, string> = {
    admin: process.env.SEED_ADMIN_USER_ID ?? '',
    member: process.env.SEED_MEMBER_USER_ID ?? '',
    demo: process.env.SEED_DEMO_USER_ID ?? '',
  };

  let project = await projectRepo.findOne({ where: { name: 'Demo Project' } });
  if (!project) {
    project = projectRepo.create({
      name: 'Demo Project',
      key: 'DEMO',
      description: PROJECT_DESCRIPTION,
      created_by: userIds.admin || '00000000-0000-0000-0000-000000000000',
    });
    await projectRepo.save(project);
    console.log('Seeded project:', project.id);
  } else {
    console.log('Project exists:', project.id);
    if (project.description === OLD_PROJECT_DESCRIPTION) {
      project.description = PROJECT_DESCRIPTION;
      await projectRepo.save(project);
    }
  }

  let board = await boardRepo.findOne({
    where: { project_id: project.id, is_default: true },
  });
  if (!board) {
    board = boardRepo.create({
      project_id: project.id,
      name: 'Default Board',
      is_default: true,
    });
    await boardRepo.save(board);
    console.log('Seeded default board:', board.id);

    const statuses: TaskStatus[] = [
      TaskStatus.PENDING,
      TaskStatus.IN_PROGRESS,
      TaskStatus.COMPLETED,
    ];
    let order = 0;
    for (const status of statuses) {
      await colRepo.save(
        colRepo.create({ board_id: board.id, status, order_index: order++ })
      );
    }
    console.log('Seeded default columns');
  } else {
    console.log('Default board exists:', board.id);
  }

  const roles: Record<Who, ProjectRole> = {
    admin: ProjectRole.ADMIN,
    member: ProjectRole.MEMBER,
    demo: ProjectRole.MEMBER,
  };
  for (const who of Object.keys(roles) as Who[]) {
    const userId = userIds[who];
    if (!userId) continue;
    const exists = await memberRepo.findOne({
      where: { project_id: project.id, user_id: userId },
    });
    if (!exists) {
      await memberRepo.save(
        memberRepo.create({ project_id: project.id, user_id: userId, role: roles[who] })
      );
      console.log(`Added ${who} to the project`);
    }
  }

  // Sample tasks only for an empty project, so reseeding never duplicates
  // them or touches tasks people created.
  const hasTasks = await taskRepo.exists({ where: { project_id: project.id } });
  if (!hasTasks && Object.values(userIds).every(Boolean)) {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    await taskRepo.save(
      SAMPLE_TASKS.map((sample, index) =>
        taskRepo.create({
          title: sample.title,
          description: sample.description ?? null,
          status: sample.status,
          priority: sample.priority,
          number: index + 1,
          project_id: project.id,
          created_by: userIds.admin,
          assigned_to: userIds[sample.assignee],
          due_date: sample.dueInDays ? new Date(now + sample.dueInDays * day) : null,
          // Spread creation times so numbers follow creation order.
          created_at: new Date(now - (SAMPLE_TASKS.length - index) * 60_000),
        })
      )
    );
    console.log(`Seeded ${SAMPLE_TASKS.length} sample tasks`);
  }

  await dataSource.destroy();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
