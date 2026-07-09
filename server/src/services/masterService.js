const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ── CATEGORIES ────────────────────────────────────────────

const getCategories = async () => {
  return prisma.category.findMany({ orderBy: { category_name: 'asc' } });
};

const createCategory = async (category_name) => {
  const existing = await prisma.category.findUnique({ where: { category_name } });
  if (existing) throw { 
    statusCode: 400, 
    message: 'Validation failed', 
    code: 'VALIDATION_ERROR',
    errors: [{ field: 'category_name', message: 'A category with this name already exists' }]
  };
  return prisma.category.create({ data: { category_name } });
};

const updateCategory = async (id, category_name) => {
  const existing = await prisma.category.findFirst({
    where: { category_name, category_id: { not: id } }
  });
  if (existing) throw { 
    statusCode: 400, 
    message: 'Validation failed', 
    code: 'VALIDATION_ERROR',
    errors: [{ field: 'category_name', message: 'A category with this name already exists' }]
  };
  return prisma.category.update({ where: { category_id: id }, data: { category_name } });
};

const deleteCategory = async (id) => {
  const inUse = await prisma.product.findFirst({ where: { category_id: id } });
  if (inUse) throw { statusCode: 409, message: 'Cannot delete — this category is assigned to one or more products', code: 'IN_USE' };
  return prisma.category.delete({ where: { category_id: id } });
};

// ── GRADES ────────────────────────────────────────────────

const getGrades = async () => {
  return prisma.grade.findMany({ orderBy: { grade_name: 'asc' } });
};

const createGrade = async (grade_name) => {
  const existing = await prisma.grade.findUnique({ where: { grade_name } });
  if (existing) throw { 
    statusCode: 400, 
    message: 'Validation failed', 
    code: 'VALIDATION_ERROR',
    errors: [{ field: 'grade_name', message: 'A grade with this name already exists' }]
  };
  return prisma.grade.create({ data: { grade_name } });
};

const updateGrade = async (id, grade_name) => {
  const existing = await prisma.grade.findFirst({
    where: { grade_name, grade_id: { not: id } }
  });
  if (existing) throw { 
    statusCode: 400, 
    message: 'Validation failed', 
    code: 'VALIDATION_ERROR',
    errors: [{ field: 'grade_name', message: 'A grade with this name already exists' }]
  };
  return prisma.grade.update({ where: { grade_id: id }, data: { grade_name } });
};

const deleteGrade = async (id) => {
  const inUse = await prisma.product.findFirst({ where: { grade_id: id } });
  if (inUse) throw { statusCode: 409, message: 'Cannot delete — this grade is assigned to one or more products', code: 'IN_USE' };
  return prisma.grade.delete({ where: { grade_id: id } });
};

// ── PACKAGING ─────────────────────────────────────────────

const getPackaging = async () => {
  return prisma.packaging.findMany({ orderBy: { packaging_name: 'asc' } });
};

const createPackaging = async ({ packaging_name, size_unit, size_value }) => {
  const existing = await prisma.packaging.findUnique({ where: { packaging_name } });
  if (existing) throw { 
    statusCode: 400, 
    message: 'Validation failed', 
    code: 'VALIDATION_ERROR',
    errors: [{ field: 'packaging_name', message: 'A packaging type with this name already exists' }]
  };
  return prisma.packaging.create({ data: { packaging_name, size_unit, size_value } });
};

const updatePackaging = async (id, { packaging_name, size_unit, size_value }) => {
  const existing = await prisma.packaging.findFirst({
    where: { packaging_name, packaging_id: { not: id } }
  });
  if (existing) throw { 
    statusCode: 400, 
    message: 'Validation failed', 
    code: 'VALIDATION_ERROR',
    errors: [{ field: 'packaging_name', message: 'A packaging type with this name already exists' }]
  };
  return prisma.packaging.update({
    where: { packaging_id: id },
    data: { packaging_name, size_unit, size_value }
  });
};

const deletePackaging = async (id) => {
  const inUse = await prisma.product.findFirst({ where: { packaging_id: id } });
  if (inUse) throw { statusCode: 409, message: 'Cannot delete — this packaging type is assigned to one or more products', code: 'IN_USE' };
  return prisma.packaging.delete({ where: { packaging_id: id } });
};

// ── DEPARTMENTS ───────────────────────────────────────────

const getDepartments = async () => {
  return prisma.department.findMany({ orderBy: { department_name: 'asc' } });
};

const createDepartment = async (department_name) => {
  const existing = await prisma.department.findUnique({ where: { department_name } });
  if (existing) throw { 
    statusCode: 400, 
    message: 'Validation failed', 
    code: 'VALIDATION_ERROR',
    errors: [{ field: 'department_name', message: 'A department with this name already exists' }]
  };
  return prisma.department.create({ data: { department_name } });
};

const updateDepartment = async (id, department_name) => {
  const existing = await prisma.department.findFirst({
    where: { department_name, department_id: { not: id } }
  });
  if (existing) throw { 
    statusCode: 400, 
    message: 'Validation failed', 
    code: 'VALIDATION_ERROR',
    errors: [{ field: 'department_name', message: 'A department with this name already exists' }]
  };
  return prisma.department.update({ where: { department_id: id }, data: { department_name } });
};

const deleteDepartment = async (id) => {
  const inUse = await prisma.user.findFirst({ where: { department_id: id } });
  if (inUse) throw { statusCode: 409, message: 'Cannot delete — this department is assigned to one or more users', code: 'IN_USE' };
  return prisma.department.delete({ where: { department_id: id } });
};

module.exports = {
  getCategories, createCategory, updateCategory, deleteCategory,
  getGrades, createGrade, updateGrade, deleteGrade,
  getPackaging, createPackaging, updatePackaging, deletePackaging,
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
};
