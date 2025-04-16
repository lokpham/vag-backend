import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import env from './config/env.js'
import { CONNECT_DB } from './config/db.js';

import { videoRoutes } from './routers/videoRoutes.js';
import { authRoutes } from './routers/authRoutes.js';
import { userRoutes } from './routers/userRoutes.js';
import { adminRoutes } from './routers/adminRoutes.js';
import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware.js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs-extra';

dotenv.config();
CONNECT_DB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Tạo thư mục /uploads nếu chưa tồn tại
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created uploads directory:', uploadDir);
}

app.use(cors({ 
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'], 
  credentials: true 
}));
app.use(cookieParser());  
app.use(express.json());

// Phục vụ file tĩnh từ thư mục /uploads để người dùng có thể xem video tạm thời
app.use('/uploads', express.static(uploadDir));

// Router
console.log('Attaching routes...');
app.use('/api/video', videoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// Middleware xử lý lỗi
app.use(errorHandlingMiddleware);

// Xử lý route không tìm thấy
  app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
});

app.listen(env.PORT, env.HOST, () => {
  console.log(`🚀 Server chạy tại http://${env.HOST}:${env.PORT}`);
});
