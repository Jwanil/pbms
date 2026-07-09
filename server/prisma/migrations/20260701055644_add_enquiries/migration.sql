-- CreateTable
CREATE TABLE `Enquiry` (
    `enquiry_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `module_type` ENUM('PRODUCT', 'COMPANY', 'MAPPING', 'PERMISSION', 'ROLE', 'MASTERS') NOT NULL,
    `reference_id` INTEGER NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED') NOT NULL DEFAULT 'OPEN',
    `response` TEXT NULL,
    `responded_at` DATETIME(3) NULL,
    `requested_permissions` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Enquiry_user_id_idx`(`user_id`),
    PRIMARY KEY (`enquiry_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Enquiry` ADD CONSTRAINT `Enquiry_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
