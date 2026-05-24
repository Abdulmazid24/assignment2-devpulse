import { Router } from 'express';
import { issuesController } from './issues.controller.js';
import { auth } from '../../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', issuesController.getAllIssues);
router.get('/:id', issuesController.getSingleIssue);

// Protected routes
router.post('/', auth('contributor', 'maintainer'), issuesController.createIssue);
router.patch('/:id', auth('contributor', 'maintainer'), issuesController.updateIssue);
router.delete('/:id', auth('maintainer'), issuesController.deleteIssue);

export const issuesRoute = router;
