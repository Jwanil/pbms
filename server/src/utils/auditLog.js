const writeAuditLog = async (prisma, userId, moduleName, actionType, recordId = null, oldValues = null, newValues = null, req = null) => {
  try {
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        module_name: moduleName,
        action_type: actionType,
        record_id: recordId,
        old_values: oldValues ? JSON.stringify(oldValues) : null,
        new_values: newValues ? JSON.stringify(newValues) : null,
        ip_address: req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || null) : null,
        user_agent: req ? (req.headers['user-agent'] || null) : null,
      }
    });
  } catch (err) {
    // Audit log failure must never crash the main request
    console.error('[AUDIT LOG ERROR]', err.message);
  }
};

module.exports = { writeAuditLog };
