-- CreateTable
CREATE TABLE `Country` (
    `country_id` INTEGER NOT NULL AUTO_INCREMENT,
    `country_name` VARCHAR(191) NOT NULL,
    `country_code` VARCHAR(3) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Country_country_name_key`(`country_name`),
    PRIMARY KEY (`country_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `State` (
    `state_id` INTEGER NOT NULL AUTO_INCREMENT,
    `state_name` VARCHAR(191) NOT NULL,
    `country_id` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `State_country_id_idx`(`country_id`),
    UNIQUE INDEX `State_state_name_country_id_key`(`state_name`, `country_id`),
    PRIMARY KEY (`state_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `City` (
    `city_id` INTEGER NOT NULL AUTO_INCREMENT,
    `city_name` VARCHAR(191) NOT NULL,
    `state_id` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `City_state_id_idx`(`state_id`),
    UNIQUE INDEX `City_city_name_state_id_key`(`city_name`, `state_id`),
    PRIMARY KEY (`city_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `State` ADD CONSTRAINT `State_country_id_fkey` FOREIGN KEY (`country_id`) REFERENCES `Country`(`country_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `City` ADD CONSTRAINT `City_state_id_fkey` FOREIGN KEY (`state_id`) REFERENCES `State`(`state_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
