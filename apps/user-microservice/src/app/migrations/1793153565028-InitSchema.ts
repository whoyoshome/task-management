import { MigrationInterface, QueryRunner } from "typeorm";
import { schemaOf } from "@libs/database";

export class InitSchema1793153565028 implements MigrationInterface {
    name = 'InitSchema1793153565028'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const schema = schemaOf(queryRunner);
        await queryRunner.query(`CREATE TABLE ${schema}."user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "full_name" character varying NOT NULL, "role" character varying(50) NOT NULL DEFAULT 'user', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const schema = schemaOf(queryRunner);
        await queryRunner.query(`DROP TABLE ${schema}."user"`);
    }

}
