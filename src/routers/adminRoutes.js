import express from "express";
import { 
  adminCountrollers
 } from "../controllers/adminControllers.js";

const router = express.Router();

router.get("/dashboard-stats", adminCountrollers.getDashboardStats);

export const adminRoutes = router;