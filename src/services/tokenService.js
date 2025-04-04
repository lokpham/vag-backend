import env from "../config/env.js";
import jwt from 'jsonwebtoken';

// Tạo access token và refresh token cho người dùng
const generateAccessToken = (user) => {
  return jwt.sign({
    id: user._id,
    role: user.roles,
  },
    env.JWT_ACCESS_SECRET,
    {expiresIn: '180m'}
  )
}

const generateRefreshToken = (user) => {
  return jwt.sign({
    id: user._id,
    role: user.roles,
  },
    env.JWT_REFRESH_SECRET,
    {expiresIn: '7d'}
  ) 
}

export const tokenService = {
  generateAccessToken,
  generateRefreshToken,
}