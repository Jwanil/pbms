-- AlterTable
ALTER TABLE `Product` ADD COLUMN `status_flag` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `Product_status_flag_idx` ON `Product`(`status_flag`);
