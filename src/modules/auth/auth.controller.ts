import type { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import { authService } from './auth.service.js';

const signupUser = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.signupUser(req.body);
  
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'User registered successfully',
    data: result
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.loginUser(req.body);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Login successful',
    data: result
  });
});

export const authController = {
  signupUser,
  loginUser
};
