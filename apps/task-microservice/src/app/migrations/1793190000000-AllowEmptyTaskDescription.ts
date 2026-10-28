import { MigrationInterface, QueryRunner } from "typeorm";
import { schemaOf } from "@libs/database";

export class AllowEmptyTaskDescription1793190000000 implements MigrationInterface {
    name = 'AllowEmptyTaskDescription1793190000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const schema = schemaOf(queryRunner);
        await queryRunner.query(`ALTER TABLE ${schema}."task" ALTER COLUMN "description" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const schema = schemaOf(queryRunner);
        await queryRunner.query(`UPDATE ${schema}."task" SET "description" = '' WHERE "description" IS NULL`);
        await queryRunner.query(`ALTER TABLE ${schema}."task" ALTER COLUMN "description" SET NOT NULL`);
    }

}
