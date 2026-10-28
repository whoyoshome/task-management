import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTaskHistoryActor1793157563276 implements MigrationInterface {
    name = 'AddTaskHistoryActor1793157563276'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks"."task_history" ADD "actor_id" uuid`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks"."task_history" DROP COLUMN "actor_id"`);
    }

}
