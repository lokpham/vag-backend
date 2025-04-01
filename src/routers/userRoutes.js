import express from 'express';
import { userControllers } from '../controllers/userControllers.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const Routes = express.Router();

// GET ALL USERS
Routes.get('/', authMiddleware.verifyToken , userControllers.getAllUsers);

// DELETE USER BY ID
Routes.delete('/:id', userControllers.deleteUser);
export const userRoutes = Routes