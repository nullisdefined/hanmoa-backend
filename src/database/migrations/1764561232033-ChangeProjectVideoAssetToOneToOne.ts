import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeProjectVideoAssetToOneToOne1764561232033 implements MigrationInterface {
    name = 'ChangeProjectVideoAssetToOneToOne1764561232033'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "video_assets" DROP CONSTRAINT "FK_2d54af4d2cbfaccc45f9e1cbb17"`);
        await queryRunner.query(`ALTER TABLE "video_assets" ADD CONSTRAINT "UQ_2d54af4d2cbfaccc45f9e1cbb17" UNIQUE ("project_id")`);
        await queryRunner.query(`ALTER TABLE "video_assets" ADD CONSTRAINT "FK_2d54af4d2cbfaccc45f9e1cbb17" FOREIGN KEY ("project_id") REFERENCES "project"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "video_assets" DROP CONSTRAINT "FK_2d54af4d2cbfaccc45f9e1cbb17"`);
        await queryRunner.query(`ALTER TABLE "video_assets" DROP CONSTRAINT "UQ_2d54af4d2cbfaccc45f9e1cbb17"`);
        await queryRunner.query(`ALTER TABLE "video_assets" ADD CONSTRAINT "FK_2d54af4d2cbfaccc45f9e1cbb17" FOREIGN KEY ("project_id") REFERENCES "project"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
