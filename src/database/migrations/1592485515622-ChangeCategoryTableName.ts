import { MigrationInterface, QueryRunner } from 'typeorm';

export default class ChangeCategoryTableName1592485515622
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameTable('category', 'categories');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameTable('categories', 'category');
  }
}
