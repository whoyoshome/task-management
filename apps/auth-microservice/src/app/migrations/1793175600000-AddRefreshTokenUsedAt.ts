import { MigrationInterface, QueryRunner } from "typeorm";
import { schemaOf } from "@libs/database";

export class AddRefreshTokenUsedAt1793175600000 implements MigrationInterface {
    name = 'AddRefreshTokenUsedAt1793175600000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const schema = schemaOf(queryRunner);
        await queryRunner.query(`ALTER TABLE ${schema}."refresh_token" ADD "used_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const schema = schemaOf(queryRunner);
        await queryRunner.query(`ALTER TABLE ${schema}."refresh_token" DROP COLUMN "used_at"`);
    }

}
