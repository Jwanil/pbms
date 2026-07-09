const { PrismaClient } = require('@prisma/client');


const prisma = new PrismaClient();


const getEnquiries = async ({ page = 1, limit = 10, search = "", status, module_type = "" }) => {

    const skip = (page - 1) * limit;


    const where = {
        AND: [
            search ? {
                OR: [
                    { enquiry_name: { contains: search } },
                    { user: { name: { contains: search } } },
                    { user: { email: { contains: search } } }
                ]
            } : {},
            status ? { status } : {},
            module_type ? { module_type } : {},
        ]
    }
    const [enquiries, total] = await prisma.$transaction([
        prisma.enquiry.findMany({
            where,
            skip,
            take: limit,
            orderBy: { created_at: "desc" },
            select: {
                enquiry_id: true,
                enquiry_name: true,
                user_id: true,
                module_type: true,
                reference_id: true,
                status: true,
                response: true,
                created_at: true,
                responded_at: true,
                user: { select: { name: true, email: true, role: { select: { role_name: true } } } }
            }
        }),
        prisma.enquiry.count({ where })
    ])
    return { enquiries, total };

}



const getEnquiryById = async (id) => {
    const enquiry = await prisma.enquiry.findUnique({
        where: { enquiry_id: id },
        select: {
            enquiry_id: true,
            enquiry_name: true,
            user_id: true,
            module_type: true,
            reference_id: true,
            description: true,
            status: true,
            requested_permissions: true,
            response: true,
            created_at: true,
            updated_at: true,
            responded_at: true,
            user: { select: { name: true, email: true, role: { select: { role_name: true } } } }
        }
    })
    if (!enquiry) throw { statusCode: 404, message: "Enquiry not found", code: "NOT_FOUND" }
    return enquiry;
}

const createEnquiry = async (userId, data) => {
    let finalRefId = data.reference_id;
    if (data.module_type === 'PERMISSION' || data.module_type === 'ROLE' || data.module_type === 'MASTERS') {
        finalRefId = null;
    }
    const newEnquiry = await prisma.enquiry.create({
        data: {
            enquiry_name: data.enquiry_name,
            user_id: userId,
            module_type: data.module_type,
            reference_id: finalRefId,
            description: data.description,
            requested_permissions: data.requested_permissions || null
        }
    });
    return newEnquiry;
};



const updateStatus = async (id, status) => {
    const enquiry = await prisma.enquiry.findUnique({
        where: { enquiry_id: id }
    });
    if (!enquiry) throw { statusCode: 404, message: "Enquiry not found", code: "NOT_FOUND" }
    return prisma.enquiry.update({
        where: { enquiry_id: id },
        data: {
            status: status,
            updated_at: new Date(),
            ...(status === 'RESOLVED' && { responded_at: new Date() })
        }
    })
}

const respondToEnquiries = async (id, responseText) => {
    const existing = await prisma.enquiry.findUnique({
        where: { enquiry_id: id }
    });
    if (!existing) throw { statusCode: 404, message: "Enquiry not found", code: "NOT_FOUND" }

    return prisma.enquiry.update({// 
        where: { enquiry_id: id },
        data: {
            responded_at: new Date(),
            response: responseText,
            status: "RESOLVED",
        }

    })

}

const getMyEnquiries = async (userId) => {
    const enquiries = await prisma.enquiry.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        select: {
            enquiry_id: true,
            enquiry_name: true,
            module_type: true,
            reference_id: true,
            status: true,
            response: true,
            created_at: true,
            responded_at: true
            // Notice: description is explicitly left out to optimize list fetching!
        }
    });
    return enquiries;
};

module.exports = {
    getEnquiries,
    getEnquiryById,
    createEnquiry,
    updateStatus,
    respondToEnquiries,
    getMyEnquiries
};
