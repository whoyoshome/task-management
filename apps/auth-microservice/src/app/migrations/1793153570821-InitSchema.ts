import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1793153570821 implements MigrationInterface {
    name = 'InitSchema1793153570821'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "auths"."revoked_token" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" text NOT NULL, "revoked_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bf300a6daf55d675aba672ba1f7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_572b4c3824a800e4341ee43fce" ON "auths"."revoked_token" ("token") `);
        await queryRunner.query(`CREATE TABLE "auths"."refresh_token" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "token" character varying NOT NULL, "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c31d0a2f38e6e99110df62ab0af" UNIQUE ("token"), CONSTRAINT "PK_b575dd3c21fb0831013c909e7fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6bbe63d2fe75e7f0ba1710351d" ON "auths"."refresh_token" ("user_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "auths"."IDX_6bbe63d2fe75e7f0ba1710351d"`);
        await queryRunner.query(`DROP TABLE "auths"."refresh_token"`);
        await queryRunner.query(`DROP INDEX "auths"."IDX_572b4c3824a800e4341ee43fce"`);
        await queryRunner.query(`DROP TABLE "auths"."revoked_token"`);
    }

}
