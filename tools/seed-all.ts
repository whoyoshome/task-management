import { execSync } from 'child_process';
import { Client } from 'pg';
import { readDatabaseEnv } from '@libs/database';

const MAX_RETRIES = 30;
const RETRY_DELAY_MS = 2000;

const userDb = readDatabaseEnv('USER');

function dbConfig() {
  return {
    host: userDb.host,
    port: userDb.port,
    user: userDb.username,
    password: userDb.password,
    database: userDb.database,
  };
}

async function waitForPostgres(): Promise<void> {
  const config = dbConfig();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const client = new Client(config);
    try {
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      console.log('PostgreSQL is ready');
      return;
    } catch (error) {
      await client.end().catch(() => undefined);
      console.log(`Waiting for PostgreSQL (${attempt}/${MAX_RETRIES})...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  throw new Error('PostgreSQL did not become ready in time');
}

async function getUserIds(): Promise<{ adminId: string; memberId: string }> {
  const config = dbConfig();
  const client = new Client(config);

  await client.connect();
  const result = await client.query<{ id: string; email: string }>(
    `SELECT id, email FROM "${userDb.schema}"."user" WHERE email = ANY($1)`,
    [['admin@example.com', 'member@example.com']]
  );
  await client.end();

  const admin = result.rows.find((row) => row.email === 'admin@example.com');
  const member = result.rows.find((row) => row.email === 'member@example.com');

  if (!admin?.id || !member?.id) {
    throw new Error('Demo users were not found after seeding');
  }

  return { adminId: admin.id, memberId: member.id };
}

async function main(): Promise<void> {
  await waitForPostgres();

  console.log('Running user microservice seed...');
  execSync(
    'npx ts-node --project tsconfig.seed.json apps/user-microservice/src/app/seeds/seed.ts',
    { stdio: 'inherit', env: process.env }
  );

  const { adminId, memberId } = await getUserIds();
  process.env.SEED_ADMIN_USER_ID = adminId;
  process.env.SEED_MEMBER_USER_ID = memberId;

  console.log('Running task microservice seed...');
  execSync(
    'npx ts-node --project tsconfig.seed.json apps/task-microservice/src/app/seeds/seed.ts',
    { stdio: 'inherit', env: process.env }
  );

  console.log('All seeds completed successfully');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
