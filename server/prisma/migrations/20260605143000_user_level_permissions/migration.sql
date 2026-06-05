-- DropForeignKey
ALTER TABLE `Permission` DROP FOREIGN KEY `Permission_role_id_fkey`;

-- DropIndex
DROP INDEX `Permission_role_id_module_name_key` ON `Permission`;

-- AlterTable: drop role_id, add user_id
ALTER TABLE `Permission` DROP COLUMN `role_id`,
    ADD COLUMN `user_id` INT NOT NULL;

-- CreateIndex: unique constraint on user_id + module_name
CREATE UNIQUE INDEX `Permission_user_id_module_name_key` ON `Permission`(`user_id`, `module_name`);

-- AddForeignKey
ALTER TABLE `Permission` ADD CONSTRAINT `Permission_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
