import 'reflect-metadata';
import dataSource from '../database/data-source';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@shared/contracts';

async function run() {
  await dataSource.initialize();
  const repo = dataSource.getRepository(User);

  const seeds = [
    {
      email: 'admin@example.com',
      full_name: 'Admin User',
      role: UserRole.ADMIN,
      password: 'Password123!'
    },
    {
      email: 'member@example.com',
      full_name: 'Member User',
      role: UserRole.USER,
      password: 'Password123!'
    },
  ];

  for (const s of seeds) {
    let u = await repo.findOne({ where: { email: s.email } });
    if (!u) {
      const hash = await bcrypt.hash(s.password, 10);
      u = repo.create({ email: s.email, full_name: s.full_name, role: s.role, password: hash, is_active: true });
      await repo.save(u);
      console.log(`Seeded user: ${s.email}`);
    } else {
      console.log(`User exists: ${s.email}`);
    }
  }

  await dataSource.destroy();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
