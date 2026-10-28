import { MigrationInterface, QueryRunner } from "typeorm";
import { schemaOf } from "@libs/database";

export class AddTaskHistoryActor1793157563276 implements MigrationInterface {
    name = 'AddTaskHistoryActor1793157563276'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const schema = schemaOf(queryRunner);
        await queryRunner.query(`ALTER TABLE ${schema}."task_history" ADD "actor_id" uuid`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const schema = schemaOf(queryRunner);
        await queryRunner.query(`ALTER TABLE ${schema}."task_history" DROP COLUMN "actor_id"`);
    }

}
