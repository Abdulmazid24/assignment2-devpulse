import type { ErrorRequestHandler } from 'express';

export const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors = err.message || 'Something went wrong';

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.message === 'Unauthorized') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.message === 'Forbidden') {
    statusCode = 403;
    message = 'Forbidden';
  } else if (err.message.includes('not found')) {
    statusCode = 404;
    message = 'Not Found';
  } else if (err.message.includes('already exists') || err.message.includes('duplicate')) {
    statusCode = 409;
    message = 'Conflict';
  } else if (err.message.includes('Validation')) {
    statusCode = 400;
    message = 'Bad Request';
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
