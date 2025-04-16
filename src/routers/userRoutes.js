import express from 'express';
import { userControllers } from '../controllers/userControllers.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const Routes = express.Router();

// GET ALL USERS
Routes.get('/', authMiddleware.verifyToken , userControllers.getAllUsers);
Routes.get('/:id', authMiddleware.verifyToken , userControllers.getUserById);
// Routes.get('/me', authMiddleware.verifyToken , userControllers.getMe);
Routes.post('/', userControllers.createUser);
Routes.put('/:id', userControllers.updateUser);
Routes.delete('/:id', userControllers.deleteUser);

export const userRoutes = Routes