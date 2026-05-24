import type { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import { issuesService } from './issues.service.js';

const createIssue = catchAsync(async (req: Request, res: Response) => {
  const reporter_id = (req as any).user.id;
  const result = await issuesService.createIssue(req.body, reporter_id);
  
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Issue created successfully',
    data: result
  });
});

const getAllIssues = catchAsync(async (req: Request, res: Response) => {
  const result = await issuesService.getAllIssues(req.query);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    data: result
  });
});

const getSingleIssue = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await issuesService.getSingleIssue(id);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    data: result
  });
});

const updateIssue = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = (req as any).user;
  const result = await issuesService.updateIssue(id, req.body, user);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Issue updated successfully',
    data: result
  });
});

const deleteIssue = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await issuesService.deleteIssue(id);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Issue deleted successfully'
  });
});

export const issuesController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};
