import 'reflect-metadata';
import dataSource from '../database/data-source';
import { Repository } from 'typeorm';
import { Project } from '../tasks/entities/projects.entity';
import { Board } from '../tasks/entities/boards.entity';
import { BoardColumn } from '../tasks/entities/board-columns.entity';
import { ProjectMembers } from '../tasks/entities/project-members.entity';
import { TaskStatus, ProjectRole } from '@shared/contracts';

async function run() {
  await dataSource.initialize();
  const projectRepo: Repository<Project> = dataSource.getRepository(Project);
  const boardRepo: Repository<Board> = dataSource.getRepository(Board);
  const colRepo: Repository<BoardColumn> =
    dataSource.getRepository(BoardColumn);
  const memberRepo: Repository<ProjectMembers> =
    dataSource.getRepository(ProjectMembers);
  const adminUserId = process.env.SEED_ADMIN_USER_ID ?? '';
  const memberUserId = process.env.SEED_MEMBER_USER_ID ?? '';

  let project = await projectRepo.findOne({ where: { name: 'Demo Project' } });
  if (!project) {
    project = projectRepo.create({
      name: 'Demo Project',
      description: 'Proyecto de ejemplo para empezar',
      created_by: adminUserId || '00000000-0000-0000-0000-000000000000',
    });
    await projectRepo.save(project);
    console.log('Seeded project:', project.id);
  } else {
    console.log('Project exists:', project.id);
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

  if (adminUserId) {
    const exists = await memberRepo.findOne({
      where: { project_id: project.id, user_id: adminUserId },
    });
    if (!exists) {
      await memberRepo.save(
        memberRepo.create({
          project_id: project.id,
          user_id: adminUserId,
          role: ProjectRole.ADMIN,
        })
      );
      console.log('Added admin member to project');
    }
  }
  if (memberUserId) {
    const exists = await memberRepo.findOne({
      where: { project_id: project.id, user_id: memberUserId },
    });
    if (!exists) {
      await memberRepo.save(
        memberRepo.create({
          project_id: project.id,
          user_id: memberUserId,
          role: ProjectRole.MEMBER,
        })
      );
      console.log('Added member user to project');
    }
  }

  await dataSource.destroy();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
