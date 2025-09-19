export const asyncHandler = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      error.cause = error.cause || 500;
      next(error);
    }
  };
};
export const globalErrorHandling = (error, req, res, next) => {
  const statusCode = error.cause || 500;

  return res.status(statusCode).json({
    message: error.message || "Internal Server Error",
    ...( { stack: error.stack }),
  });
};

export const successResponse = ({ res, message = "Success", status = 200, data = {} }) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};
