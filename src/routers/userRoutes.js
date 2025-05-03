import express from 'express';
import { userControllers } from '../controllers/userControllers.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const Routes = express.Router();

// GET ALL USERS
Routes.get('/me', authMiddleware.verifyToken , userControllers.getCurrentUser);
Routes.get('/:id', authMiddleware.verifyToken , userControllers.getUserById);
Routes.get('/', authMiddleware.verifyToken , userControllers.getAllUsers);
Routes.post('/', userControllers.createUser);
Routes.put('/:id', userControllers.updateUser);
Routes.delete('/:id', userControllers.deleteUser);

export const userRoutes = Routes