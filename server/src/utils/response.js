const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

const sendPaginated = (res, data, pagination) => {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.limit)
    }
  });
};

const sendError = (res, message, statusCode = 500, errors = [], code = 'SERVER_ERROR') => {
  return res.status(statusCode).json({ success: false, message, errors, code });
};

module.exports = { sendSuccess, sendPaginated, sendError };
