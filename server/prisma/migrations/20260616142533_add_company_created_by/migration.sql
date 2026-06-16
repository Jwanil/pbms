-- AlterTable
ALTER TABLE `Company` ADD COLUMN `created_by` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Company` ADD CONSTRAINT `Company_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `User`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;
