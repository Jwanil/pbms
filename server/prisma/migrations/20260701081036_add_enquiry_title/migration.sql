/*
  Warnings:

  - Made the column `enquiry_name` on table `Enquiry` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Enquiry` MODIFY `enquiry_name` VARCHAR(191) NOT NULL;
