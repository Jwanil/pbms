-- CreateTable
CREATE TABLE `Category` (
    `category_id` INTEGER NOT NULL AUTO_INCREMENT,
    `category_name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Category_category_name_key`(`category_name`),
    PRIMARY KEY (`category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Grade` (
    `grade_id` INTEGER NOT NULL AUTO_INCREMENT,
    `grade_name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Grade_grade_name_key`(`grade_name`),
    PRIMARY KEY (`grade_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Packaging` (
    `packaging_id` INTEGER NOT NULL AUTO_INCREMENT,
    `packaging_name` VARCHAR(191) NOT NULL,
    `size_unit` VARCHAR(191) NOT NULL,
    `size_value` DECIMAL(10, 2) NOT NULL,

    UNIQUE INDEX `Packaging_packaging_name_key`(`packaging_name`),
    PRIMARY KEY (`packaging_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Department` (
    `department_id` INTEGER NOT NULL AUTO_INCREMENT,
    `department_name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Department_department_name_key`(`department_name`),
    PRIMARY KEY (`department_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `role_id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_name` ENUM('SUPER_ADMIN', 'ADMIN', 'STAFF') NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `Role_role_name_key`(`role_name`),
    PRIMARY KEY (`role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
    `permission_id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_id` INTEGER NOT NULL,
    `module_name` VARCHAR(191) NOT NULL,
    `can_view` BOOLEAN NOT NULL DEFAULT false,
    `can_create` BOOLEAN NOT NULL DEFAULT false,
    `can_edit` BOOLEAN NOT NULL DEFAULT false,
    `can_delete` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Permission_role_id_module_name_key`(`role_id`, `module_name`),
    PRIMARY KEY (`permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `mobile` VARCHAR(191) NULL,
    `username` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `role_id` INTEGER NOT NULL,
    `department_id` INTEGER NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_username_key`(`username`),
    INDEX `User_email_idx`(`email`),
    INDEX `User_username_idx`(`username`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `product_id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_name` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NOT NULL,
    `composition` VARCHAR(191) NULL,
    `category_id` INTEGER NULL,
    `grade_id` INTEGER NULL,
    `packaging_id` INTEGER NULL,
    `unit_of_measure` ENUM('KG', 'LITRE', 'TON') NULL,
    `shelf_life` VARCHAR(191) NULL,
    `molecular_formula` VARCHAR(191) NULL,
    `molecular_weight` DECIMAL(10, 4) NULL,
    `purity` DECIMAL(5, 2) NULL,
    `process_type` VARCHAR(191) NULL,
    `un_number` VARCHAR(191) NULL,
    `industry_application` TEXT NULL,
    `hsn_code` VARCHAR(191) NULL,
    `cas_number` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_by` INTEGER NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Product_sku_key`(`sku`),
    UNIQUE INDEX `Product_cas_number_key`(`cas_number`),
    INDEX `Product_product_name_idx`(`product_name`),
    INDEX `Product_category_id_idx`(`category_id`),
    INDEX `Product_grade_id_idx`(`grade_id`),
    INDEX `Product_status_idx`(`status`),
    FULLTEXT INDEX `Product_description_idx`(`description`),
    PRIMARY KEY (`product_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Company` (
    `company_id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_name` VARCHAR(191) NOT NULL,
    `company_type` ENUM('MANUFACTURER', 'SUPPLIER', 'BUYER', 'DISTRIBUTOR') NOT NULL,
    `address` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `remarks` TEXT NULL,
    `gst_number` VARCHAR(191) NULL,
    `pan_number` VARCHAR(191) NULL,
    `cin_number` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `industry_type` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Company_company_type_idx`(`company_type`),
    INDEX `Company_gst_number_idx`(`gst_number`),
    INDEX `Company_status_idx`(`status`),
    FULLTEXT INDEX `Company_company_name_idx`(`company_name`),
    PRIMARY KEY (`company_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Branch` (
    `branch_id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `branch_name` VARCHAR(191) NOT NULL,
    `gst_number` VARCHAR(191) NULL,
    `pan_number` VARCHAR(191) NULL,
    `address_line1` VARCHAR(191) NULL,
    `address_line2` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `pincode` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL DEFAULT 'India',
    `contact_number` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,

    INDEX `Branch_city_idx`(`city`),
    INDEX `Branch_state_idx`(`state`),
    PRIMARY KEY (`branch_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CompanyProductMapping` (
    `mapping_id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `role_type` ENUM('MANUFACTURER', 'SUPPLIER', 'DISTRIBUTOR') NOT NULL,
    `moq` DECIMAL(10, 2) NULL,
    `price_range_min` DECIMAL(10, 2) NULL,
    `price_range_max` DECIMAL(10, 2) NULL,
    `lead_time_days` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CompanyProductMapping_company_id_idx`(`company_id`),
    INDEX `CompanyProductMapping_product_id_idx`(`product_id`),
    UNIQUE INDEX `CompanyProductMapping_company_id_product_id_role_type_key`(`company_id`, `product_id`, `role_type`),
    PRIMARY KEY (`mapping_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Contact` (
    `contact_id` INTEGER NOT NULL AUTO_INCREMENT,
    `first_name` VARCHAR(191) NOT NULL,
    `last_name` VARCHAR(191) NULL,
    `mobile` VARCHAR(191) NOT NULL,
    `alternate_mobile` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `company_id` INTEGER NULL,
    `branch_id` INTEGER NULL,
    `contact_type` ENUM('BUYER', 'PURCHASE_MANAGER', 'SALES', 'ADMIN') NULL,
    `designation` VARCHAR(191) NULL,
    `preferred_language` ENUM('ENGLISH', 'HINDI', 'REGIONAL') NULL,
    `tags` TEXT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Contact_mobile_idx`(`mobile`),
    INDEX `Contact_email_idx`(`email`),
    INDEX `Contact_contact_type_idx`(`contact_type`),
    INDEX `Contact_preferred_language_idx`(`preferred_language`),
    INDEX `Contact_status_idx`(`status`),
    PRIMARY KEY (`contact_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContactProductInterest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contact_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ContactProductInterest_contact_id_idx`(`contact_id`),
    INDEX `ContactProductInterest_product_id_idx`(`product_id`),
    UNIQUE INDEX `ContactProductInterest_contact_id_product_id_key`(`contact_id`, `product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `log_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `module_name` VARCHAR(191) NOT NULL,
    `action_type` ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT') NOT NULL,
    `record_id` INTEGER NULL,
    `old_values` TEXT NULL,
    `new_values` TEXT NULL,
    `ip_address` VARCHAR(191) NULL,
    `user_agent` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_module_name_idx`(`module_name`),
    INDEX `AuditLog_action_type_idx`(`action_type`),
    INDEX `AuditLog_created_at_idx`(`created_at`),
    INDEX `AuditLog_user_id_idx`(`user_id`),
    PRIMARY KEY (`log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Permission` ADD CONSTRAINT `Permission_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `Role`(`role_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `Role`(`role_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `Department`(`department_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `Category`(`category_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_grade_id_fkey` FOREIGN KEY (`grade_id`) REFERENCES `Grade`(`grade_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_packaging_id_fkey` FOREIGN KEY (`packaging_id`) REFERENCES `Packaging`(`packaging_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `User`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `User`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Branch` ADD CONSTRAINT `Branch_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company`(`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompanyProductMapping` ADD CONSTRAINT `CompanyProductMapping_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company`(`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompanyProductMapping` ADD CONSTRAINT `CompanyProductMapping_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `Product`(`product_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contact` ADD CONSTRAINT `Contact_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company`(`company_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contact` ADD CONSTRAINT `Contact_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `Branch`(`branch_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContactProductInterest` ADD CONSTRAINT `ContactProductInterest_contact_id_fkey` FOREIGN KEY (`contact_id`) REFERENCES `Contact`(`contact_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContactProductInterest` ADD CONSTRAINT `ContactProductInterest_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `Product`(`product_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
