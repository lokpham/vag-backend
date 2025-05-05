import express from 'express';
import { userControllers } from '../controllers/userControllers.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const Routes = express.Router();

// GET ALL USERS
Routes.get('/me', authMiddleware.verifyToken , userControllers.getCurrentUser);
Routes.put('/update-profile',authMiddleware.verifyToken, userControllers.updateUser);
Routes.delete('/delete-account',authMiddleware.verifyToken, userControllers.deleteUser);
Routes.get('/:id', authMiddleware.verifyToken , userControllers.getUserById);
Routes.get('/', authMiddleware.verifyToken , userControllers.getAllUsers);
Routes.post('/', userControllers.createUser);

export const userRoutes = Routes