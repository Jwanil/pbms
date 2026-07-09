/*
  Warnings:

  - You are about to drop the column `status` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Product` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Company_status_idx` ON `Company`;

-- DropIndex
DROP INDEX `Product_status_idx` ON `Product`;

-- AlterTable
ALTER TABLE `Company` DROP COLUMN `status`,
    ADD COLUMN `status_flag` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `Product` DROP COLUMN `status`;

-- CreateIndex
CREATE INDEX `Company_status_flag_idx` ON `Company`(`status_flag`);
