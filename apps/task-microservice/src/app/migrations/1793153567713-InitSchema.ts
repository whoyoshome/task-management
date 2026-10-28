import { MigrationInterface, QueryRunner } from "typeorm";
import { schemaOf } from "@libs/database";

export class InitSchema1793153567713 implements MigrationInterface {
    name = 'InitSchema1793153567713'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const schema = schemaOf(queryRunner);
        await queryRunner.query(`CREATE TABLE ${schema}."board_columns" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "board_id" uuid NOT NULL, "status" character varying(50) NOT NULL, "order_index" integer NOT NULL DEFAULT '0', "wip_limit" integer, CONSTRAINT "UQ_c7fdd007df37a181313f1ac48ba" UNIQUE ("board_id", "status"), CONSTRAINT "PK_e3da51ad65560ca495d3a621d32" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE ${schema}."boards" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "is_default" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_606923b0b068ef262dfdcd18f44" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE ${schema}."sprints" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "goal" text, "status" character varying(20) NOT NULL DEFAULT 'planned', "start_date" date, "end_date" date, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6800aa2e0f508561812c4b9afb4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE ${schema}."project" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "key" character varying(20) NOT NULL, "description" text NOT NULL, "created_by" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_2db22c052f9ffdd51a6c113b37b" UNIQUE ("key"), CONSTRAINT "PK_4d68b1358bb5b766d3e78f32f57" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE ${schema}."project_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "user_id" uuid NOT NULL, "role" character varying(50) NOT NULL DEFAULT 'member', "joined_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b3f491d3a3f986106d281d8eb4b" UNIQUE ("project_id", "user_id"), CONSTRAINT "PK_0b2f46f804be4aea9234c78bcc9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE ${schema}."task_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "task_id" uuid NOT NULL, "type" character varying(50) NOT NULL DEFAULT 'system', "message" text NOT NULL, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_716670443aea4a2f4a599bb7c53" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e733285140c013322a9ae1be64" ON ${schema}."task_history" ("task_id") `);
        await queryRunner.query(`CREATE TABLE ${schema}."task_comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "task_id" uuid NOT NULL, "user_id" uuid NOT NULL, "content" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_83b99b0b03db29d4cafcb579b77" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE ${schema}."task_dependencies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "task_id" uuid NOT NULL, "dependency_on_task_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "depends_on_task_id" uuid, CONSTRAINT "PK_e31de0e173af595a21c4ec8e48b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE ${schema}."label" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "color" character varying(7), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5692ac5348861d3776eb5843672" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE ${schema}."task" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255) NOT NULL, "description" text NOT NULL, "status" character varying(50) NOT NULL DEFAULT 'pending', "priority" character varying(50) NOT NULL DEFAULT 'low', "due_date" date, "created_by" uuid NOT NULL, "assigned_to" uuid NOT NULL, "project_id" uuid NOT NULL, "sprint_id" uuid, "sprint_order_index" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fb213f79ee45060ba925ecd576e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE ${schema}."task_label" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "task_id" uuid NOT NULL, "label_id" uuid NOT NULL, CONSTRAINT "UQ_afe86dcee6806fe2f04600b217d" UNIQUE ("task_id", "label_id"), CONSTRAINT "PK_fb2322fb12d4db26386caeff6ee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE ${schema}."board_columns" ADD CONSTRAINT "FK_55e6772f5b84a2fb358db473313" FOREIGN KEY ("board_id") REFERENCES ${schema}."boards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE ${schema}."boards" ADD CONSTRAINT "FK_1542ae826c0dfeaf4c79e07fc57" FOREIGN KEY ("project_id") REFERENCES ${schema}."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE ${schema}."sprints" ADD CONSTRAINT "FK_82145010051f3f2fc94671c0b35" FOREIGN KEY ("project_id") REFERENCES ${schema}."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE ${schema}."project_members" ADD CONSTRAINT "FK_b5729113570c20c7e214cf3f58d" FOREIGN KEY ("project_id") REFERENCES ${schema}."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE ${schema}."task_comments" ADD CONSTRAINT "FK_ba9e465cfc707006e60aae59946" FOREIGN KEY ("task_id") REFERENCES ${schema}."task"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE ${schema}."task_dependencies" ADD CONSTRAINT "FK_1ae6688b1bd90fffe857f4cb707" FOREIGN KEY ("task_id") REFERENCES ${schema}."task"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE ${schema}."task_dependencies" ADD CONSTRAINT "FK_26dedda08faccdb95aff99e112e" FOREIGN KEY ("depends_on_task_id") REFERENCES ${schema}."task"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE ${schema}."label" ADD CONSTRAINT "FK_e6d7077d5141ae5855c7c24f44c" FOREIGN KEY ("project_id") REFERENCES ${schema}."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE ${schema}."task" ADD CONSTRAINT "FK_1f53e7ffe94530f9e0221224d29" FOREIGN KEY ("project_id") REFERENCES ${schema}."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE ${schema}."task" ADD CONSTRAINT "FK_422c15d3980fd646448d61f61d8" FOREIGN KEY ("sprint_id") REFERENCES ${schema}."sprints"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE ${schema}."task_label" ADD CONSTRAINT "FK_2a60e53a868607c836a13abf517" FOREIGN KEY ("task_id") REFERENCES ${schema}."task"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE ${schema}."task_label" ADD CONSTRAINT "FK_fab21288d67125afc1c0aafb470" FOREIGN KEY ("label_id") REFERENCES ${schema}."label"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const schema = schemaOf(queryRunner);
        await queryRunner.query(`ALTER TABLE ${schema}."task_label" DROP CONSTRAINT "FK_fab21288d67125afc1c0aafb470"`);
        await queryRunner.query(`ALTER TABLE ${schema}."task_label" DROP CONSTRAINT "FK_2a60e53a868607c836a13abf517"`);
        await queryRunner.query(`ALTER TABLE ${schema}."task" DROP CONSTRAINT "FK_422c15d3980fd646448d61f61d8"`);
        await queryRunner.query(`ALTER TABLE ${schema}."task" DROP CONSTRAINT "FK_1f53e7ffe94530f9e0221224d29"`);
        await queryRunner.query(`ALTER TABLE ${schema}."label" DROP CONSTRAINT "FK_e6d7077d5141ae5855c7c24f44c"`);
        await queryRunner.query(`ALTER TABLE ${schema}."task_dependencies" DROP CONSTRAINT "FK_26dedda08faccdb95aff99e112e"`);
        await queryRunner.query(`ALTER TABLE ${schema}."task_dependencies" DROP CONSTRAINT "FK_1ae6688b1bd90fffe857f4cb707"`);
        await queryRunner.query(`ALTER TABLE ${schema}."task_comments" DROP CONSTRAINT "FK_ba9e465cfc707006e60aae59946"`);
        await queryRunner.query(`ALTER TABLE ${schema}."project_members" DROP CONSTRAINT "FK_b5729113570c20c7e214cf3f58d"`);
        await queryRunner.query(`ALTER TABLE ${schema}."sprints" DROP CONSTRAINT "FK_82145010051f3f2fc94671c0b35"`);
        await queryRunner.query(`ALTER TABLE ${schema}."boards" DROP CONSTRAINT "FK_1542ae826c0dfeaf4c79e07fc57"`);
        await queryRunner.query(`ALTER TABLE ${schema}."board_columns" DROP CONSTRAINT "FK_55e6772f5b84a2fb358db473313"`);
        await queryRunner.query(`DROP TABLE ${schema}."task_label"`);
        await queryRunner.query(`DROP TABLE ${schema}."task"`);
        await queryRunner.query(`DROP TABLE ${schema}."label"`);
        await queryRunner.query(`DROP TABLE ${schema}."task_dependencies"`);
        await queryRunner.query(`DROP TABLE ${schema}."task_comments"`);
        await queryRunner.query(`DROP INDEX ${schema}."IDX_e733285140c013322a9ae1be64"`);
        await queryRunner.query(`DROP TABLE ${schema}."task_history"`);
        await queryRunner.query(`DROP TABLE ${schema}."project_members"`);
        await queryRunner.query(`DROP TABLE ${schema}."project"`);
        await queryRunner.query(`DROP TABLE ${schema}."sprints"`);
        await queryRunner.query(`DROP TABLE ${schema}."boards"`);
        await queryRunner.query(`DROP TABLE ${schema}."board_columns"`);
    }

}
