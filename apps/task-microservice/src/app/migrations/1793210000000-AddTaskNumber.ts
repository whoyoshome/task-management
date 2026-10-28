import { MigrationInterface, QueryRunner } from "typeorm";
import { schemaOf } from "@libs/database";

export class AddTaskNumber1793210000000 implements MigrationInterface {
    name = 'AddTaskNumber1793210000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const schema = schemaOf(queryRunner);
        await queryRunner.query(`ALTER TABLE ${schema}."task" ADD "number" integer`);
        // Number existing tasks per project in creation order.
        await queryRunner.query(`
            UPDATE ${schema}."task" t SET "number" = n.rn
            FROM (
                SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at, id) AS rn
                FROM ${schema}."task"
            ) n
            WHERE t.id = n.id`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_task_project_number" ON ${schema}."task" ("project_id", "number") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const schema = schemaOf(queryRunner);
        await queryRunner.query(`DROP INDEX ${schema}."UQ_task_project_number"`);
        await queryRunner.query(`ALTER TABLE ${schema}."task" DROP COLUMN "number"`);
    }

}
