import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import { globalErrorHandler } from './middleware/globalErrorHandler.js';
import { notFound } from './middleware/notFound.js';
import { authRoute } from './modules/auth/auth.route.js';
import { issuesRoute } from './modules/issues/issues.route.js';

const app: Application = express();

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to DevPulse API',
    data: null
  });
});

app.use('/api/auth', authRoute);
app.use('/api/issues', issuesRoute);

// Not Found Handler
app.use(notFound);

// Global Error Handler
app.use(globalErrorHandler);

export default app;
