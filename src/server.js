import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import env from './config/env.js'
import { CONNECT_DB } from './config/db.js';

import { videoRoutes } from './routers/videoRoutes.js';
import { authRoutes } from './routers/authRoutes.js';
import { userRoutes } from './routers/userRoutes.js';

dotenv.config();
CONNECT_DB(); 

const app = express();

app.use(cors());
app.use(cookieParser()); // Tạo cookies và useCookieParser
app.use(express.json()); // Nhân request dạng JSON

// Route test
// app.get('/test', (req, res) => {
//   res.json({ message: 'Server is running' });
// });

// Router Video
console.log('Attaching video routes...');
app.use('/api/video', videoRoutes);
app.use('/api/auth', authRoutes); 
app.use('/api/user', userRoutes)

// errorHandeling
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
});


app.listen(env.PORT, env.HOST, () => {
  console.log(`🚀 Server chạy tại http://${env.HOST}:${env.PORT}`);
});

