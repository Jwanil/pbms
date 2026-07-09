

const enquiryService = require('../services/enquiryService');
const { sendSuccess, sendPaginated, sendError } = require('../utils/response');
const { writeAuditLog } = require('../utils/auditLog');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();
const respondSchema = z.object({
    response: z.string().min(5, 'Response must be at least 5 characters').trim()
});
const module_types = z.enum(["PRODUCT", "COMPANY", "CONTACT", "MAPPING", "PERMISSION", "ROLE", "MASTERS"]);
const enquirySchema = z
    .object({
        module_type: module_types,
        enquiry_name: z.string().min(3, 'Enquiry name is required').max(255).trim(),
        description: z.string().min(10, 'Description is required').max(500).trim(),
        //   requested_permission

        // The target field that must become null under the condition
        reference_id: z.number().int().positive().nullable().optional(),
        requested_permissions: z.array(z.object({
            module:     z.string(),
            can_view:   z.boolean().optional(),
            can_create: z.boolean().optional(),
            can_edit:   z.boolean().optional(),
            can_delete: z.boolean().optional(),
        })).optional().nullable(),

    })
    .superRefine((data, ctx) => {
        // 2. Specify the 3 enum values that trigger the null requirement
        const nullRefId = ["PERMISSION", "ROLE", "MASTERS"];

        // 3. Check if the current value matches any of the 3 target enums
        const isTriggered = nullRefId.includes(data.module_type);
        if (isTriggered) {
            if (data.reference_id !== null) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Reference ID must be null for the module: ${data.module_type}`,
                    path: ["reference_id"],
                });
            }
        }
        // Rule 2: For PRODUCT, COMPANY, MAPPING -> reference_id CANNOT be null or empty
        else {

            if (data.reference_id === null || data.reference_id === undefined || data.reference_id === '') {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Reference ID is required for the module: ${data.module_type}`,
                    path: ["reference_id"],
                });
            }
        }
        if (data.module_type === "PERMISSION") {
            if (!data.requested_permissions) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Please select at least one permission to request`,
                    path: ["requested_permissions"],
                });
            }
        }

    });

const getMyEnquiriesController = async (req, res, next) => {
    try {
        // We get the user ID securely from the token, NOT from the frontend!
        const userId = req.user.user_id;

        // Call the service function you wrote in Phase 2
        const result = await enquiryService.getMyEnquiries(userId);

        return sendSuccess(res, result, 'My enquiries fetched successfully');
    } catch (err) {
        next(err);
    }
}

const getEnquiriesController = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search = '', module_type, status } = req.query;
        const result = await enquiryService.getEnquiries({
            page: parseInt(page), limit: parseInt(limit), search, module_type, status
        });
        return sendPaginated(res, result.enquiries, { page: parseInt(page), limit: parseInt(limit), total: result.total });
    } catch (err) { next(err); }
}

const getEnquiryByIdController = async (req, res, next) => {
    try {
        const enquiry = await enquiryService.getEnquiryById(parseInt(req.params.id));
        return sendSuccess(res, enquiry, 'Enquiry fetched');
    } catch (err) {
        if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
        next(err);
    }
}

const updateStatusController = async (req, res, next) => {
    try {
        const statusUpdate = await enquiryService.updateStatus(parseInt(req.params.id), req.body.status);
        return sendSuccess(res, statusUpdate, 'Status updated successfully');
    } catch (err) {
        next(err);
    }
}

const createEnquiryController = async (req, res, next) => {
    try {
        // Clean the data BEFORE validating it with Zod
        const cleanData = { ...req.body };
        // Normalize: form sends '' or omits the field entirely when no reference is needed
        if (cleanData.reference_id === '' || cleanData.reference_id === undefined) {
            cleanData.reference_id = null;
        }

        const parsed = enquirySchema.safeParse(cleanData);
        if (!parsed.success) {
            return sendError(res, 'Validation failed', 400, parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })), 'VALIDATION_ERROR');
        }

        cleanData.created_by = req.user.user_id;
        const enquiry = await enquiryService.createEnquiry(req.user.user_id, cleanData);
        // await writeAuditLog(prisma, req.user.user_id, 'enquiries', 'CREATE', enquiry.enquiry_id, null, { enquiry_name: enquiry.enquiry_name }, req);
        return sendSuccess(res, enquiry, 'Enquiry created successfully', 201);
    } catch (err) {
        if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
        next(err);
    }
};

const respondToEnquiryController = async (req, res, next) => {

    try {

        const parsed = respondSchema.safeParse(req.body);
        if (!parsed.success) {
            return sendError(res, 'Validation failed', 400, parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })), 'VALIDATION_ERROR');
        }
        const id = parseInt(req.params.id);
        const enquiry = await enquiryService.respondToEnquiries(id, parsed.data.response);
        return sendSuccess(res, enquiry, 'Enquiry responded successfully', 200);
    } catch (err) {
        if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
        next(err);
    }
}

module.exports = {
    getEnquiriesController,
    getMyEnquiriesController,
    getEnquiryByIdController,
    createEnquiryController,
    respondToEnquiryController,
    updateStatusController
};
