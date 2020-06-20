import { MigrationInterface, QueryRunner } from 'typeorm';

export default class ChangeTransactionTableName1592485199165
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameTable('transaction', 'transactions');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameTable('transactions', 'transaction');
  }
}
