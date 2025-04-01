import express from "express";
import { authControllers } from "../controllers/authControllers.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const Router = express.Router();

Router.post('/register', authControllers.register)
Router.post('/login', authControllers.login)
Router.post('/refresh', authControllers.refreshToken)
Router.post('/logout', authMiddleware.verifyToken ,authControllers.logout)

export const authRoutes = Router