import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1750680081741 implements MigrationInterface {
  name = 'CreateUsersTable1750680081741';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"         uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "public_key" character varying(56) NOT NULL,
        "username"   character varying(255),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_users_public_key" ON "users" ("public_key")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_users_public_key"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
