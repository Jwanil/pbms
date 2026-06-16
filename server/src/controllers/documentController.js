const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const { sendSuccess, sendError } = require('../utils/response');
const { writeAuditLog } = require('../utils/auditLog');
const { z } = require('zod');

const prisma = new PrismaClient();
const UPLOADS_DIR = path.join(__dirname, '../../../uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single('file');

const uploadDocumentController = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) return sendError(res, err.message, 400, [], 'UPLOAD_ERROR');
    if (!req.file) return sendError(res, 'No file uploaded', 400, [], 'VALIDATION_ERROR');

    try {
      const { entity_type, entity_id } = req.body;
      const parsed = z.object({
        entity_type: z.enum(['COMPANY', 'PRODUCT']),
        entity_id: z.string().transform(Number)
      }).safeParse({ entity_type, entity_id });

      if (!parsed.success) {
        fs.unlinkSync(req.file.path);
        return sendError(res, 'Invalid entity details', 400, [], 'VALIDATION_ERROR');
      }

      const doc = await prisma.document.create({
        data: {
          entity_type: parsed.data.entity_type,
          entity_id: parsed.data.entity_id,
          file_name: req.file.originalname,
          file_url: `/uploads/${req.file.filename}`,
          uploaded_by: req.user.user_id
        }
      });

      await writeAuditLog(prisma, req.user.user_id, 'documents', 'CREATE', doc.document_id, null, doc, req);
      return sendSuccess(res, doc, 'Document uploaded successfully', 201);
    } catch (e) {
      if (req.file) fs.unlinkSync(req.file.path);
      next(e);
    }
  });
};

const getDocumentsByEntityController = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const docs = await prisma.document.findMany({
      where: { entity_type: type.toUpperCase(), entity_id: parseInt(id) },
      select: {
        document_id: true,
        entity_type: true,
        entity_id: true,
        file_name: true,
        file_url: true,
        uploaded_by: true,
        uploaded_at: true,
        uploader: { select: { name: true } }
      },
      orderBy: { uploaded_at: 'desc' }
    });
    return sendSuccess(res, docs, 'Documents fetched successfully');
  } catch (err) { next(err); }
};

const deleteDocumentController = async (req, res, next) => {
  try {
    const docId = parseInt(req.params.id);
    const doc = await prisma.document.findUnique({ where: { document_id: docId } });
    
    if (!doc) return sendError(res, 'Document not found', 404, [], 'NOT_FOUND');

    await prisma.document.delete({ where: { document_id: docId } });
    
    const filePath = path.join(UPLOADS_DIR, path.basename(doc.file_url));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await writeAuditLog(prisma, req.user.user_id, 'documents', 'DELETE', docId, doc, null, req);
    return sendSuccess(res, null, 'Document deleted successfully');
  } catch (err) { next(err); }
};

module.exports = {
  uploadDocumentController,
  getDocumentsByEntityController,
  deleteDocumentController
};
