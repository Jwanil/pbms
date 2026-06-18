/*
  Warnings:

  - You are about to drop the column `molecular_formula` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `molecular_weight` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `process_type` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `purity` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Product` DROP COLUMN `molecular_formula`,
    DROP COLUMN `molecular_weight`,
    DROP COLUMN `process_type`,
    DROP COLUMN `purity`;
