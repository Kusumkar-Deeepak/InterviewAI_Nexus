import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes/interviewRoutes.js';
import planRoutes from './routes/planRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/interviews', routes);
app.use('/api/user/plan', planRoutes);

// Error handling
app.use(errorHandler);

export default app;