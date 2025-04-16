import jwt from 'jsonwebtoken'
import env from '../config/env.js'

const requestLogger = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Body:', req.body);
  next();
};

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, env.JWT_ACCESS_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid access token' });
      }
      req.user = {
        id: user.id, //
        roles: user.role,
      }; // Gắn thông tin user vào req
      next();
    });
}
// Kiểm tra quyền admin
const isAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.roles.includes('admin')) {
      next()
    } else {
      return res.status(403).json({ message: "Bạn không có quyền admin" })
    }
  })
}

export const authMiddleware = {
  verifyToken,
  isAdmin,
  requestLogger,
}