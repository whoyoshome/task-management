import { MigrationInterface, QueryRunner } from "typeorm";
import { schemaOf } from "@libs/database";

export class InitSchema1793153570821 implements MigrationInterface {
    name = 'InitSchema1793153570821'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const schema = schemaOf(queryRunner);
        await queryRunner.query(`CREATE TABLE ${schema}."revoked_token" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" text NOT NULL, "revoked_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bf300a6daf55d675aba672ba1f7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_572b4c3824a800e4341ee43fce" ON ${schema}."revoked_token" ("token") `);
        await queryRunner.query(`CREATE TABLE ${schema}."refresh_token" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "token" character varying NOT NULL, "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c31d0a2f38e6e99110df62ab0af" UNIQUE ("token"), CONSTRAINT "PK_b575dd3c21fb0831013c909e7fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6bbe63d2fe75e7f0ba1710351d" ON ${schema}."refresh_token" ("user_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const schema = schemaOf(queryRunner);
        await queryRunner.query(`DROP INDEX ${schema}."IDX_6bbe63d2fe75e7f0ba1710351d"`);
        await queryRunner.query(`DROP TABLE ${schema}."refresh_token"`);
        await queryRunner.query(`DROP INDEX ${schema}."IDX_572b4c3824a800e4341ee43fce"`);
        await queryRunner.query(`DROP TABLE ${schema}."revoked_token"`);
    }

}
