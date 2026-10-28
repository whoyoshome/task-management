import 'reflect-metadata';
import dataSource from '../database/data-source';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@shared/contracts';

// Local defaults. A public deployment sets SEED_ADMIN_PASSWORD (and the
// others if needed) so the admin account is not the one in the README.
const DEFAULT_PASSWORD = 'Password123!';
const passwordFrom = (name: string) => process.env[name] || DEFAULT_PASSWORD;

async function run() {
  await dataSource.initialize();
  const repo = dataSource.getRepository(User);

  const seeds = [
    {
      email: 'admin@example.com',
      full_name: 'Admin User',
      role: UserRole.ADMIN,
      password: passwordFrom('SEED_ADMIN_PASSWORD'),
    },
    {
      email: 'member@example.com',
      full_name: 'Member User',
      role: UserRole.USER,
      password: passwordFrom('SEED_MEMBER_PASSWORD'),
    },
    {
      // The account visitors of the demo use: a project member, not an admin.
      email: 'demo@example.com',
      full_name: 'Demo User',
      role: UserRole.USER,
      password: passwordFrom('SEED_DEMO_PASSWORD'),
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
