import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueToSegment1763791579231 implements MigrationInterface {
  name = 'AddUniqueToSegment1763791579231';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_03b5db3c9db7b78e4a0f291bcc" ON "segment" ("dub_job_id", "segment_index") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_03b5db3c9db7b78e4a0f291bcc"`,
    );
  }
}
