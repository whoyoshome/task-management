import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddKeyToProjectsTable1680000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tasks"."project" 
      ADD COLUMN IF NOT EXISTS "key" varchar(20) NULL
    `);

    await queryRunner.query(`
      UPDATE "tasks"."project" 
      SET "key" = UPPER(SUBSTRING(REPLACE("name", ' ', ''), 1, 20))
      WHERE "key" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "tasks"."project" 
      ALTER COLUMN "key" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "tasks"."project" 
      ADD CONSTRAINT "UQ_project_key" UNIQUE ("key")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tasks"."project" 
      DROP CONSTRAINT IF EXISTS "UQ_project_key"
    `);
    await queryRunner.query(`
      ALTER TABLE "tasks"."project" 
      DROP COLUMN IF EXISTS "key"
    `);
  }
}
