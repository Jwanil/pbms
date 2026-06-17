-- AlterTable
ALTER TABLE `Company` ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `country` VARCHAR(191) NULL DEFAULT 'India',
    ADD COLUMN `state` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Company_city_idx` ON `Company`(`city`);

-- CreateIndex
CREATE INDEX `Company_state_idx` ON `Company`(`state`);
