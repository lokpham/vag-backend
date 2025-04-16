import env from '../config/env.js'
import jwt from 'jsonwebtoken'
import bcrypt from "bcrypt";
import { User } from '../models/index.js'
import { tokenService } from '../services/tokenService.js';

const register = async (req, res) => {
  try {
    // Kiểm tra các trường bắt buộc
    const { username, email, password, fullName } = req.body;
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Kiểm tra xem email 
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Kiểm tra xem username
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new User
    const userNew = new User({
      username,
      email,
      password: hashedPassword,
      fullName,
      roles: ['user'],
    });

    // Save the new User
    const user = await userNew.save();
    res.status(201).json(user);
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error", error: err.message || err.toString() });
  }
}


const login = async (req, res) => {
  try {
    // Check email
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check password 
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(401).json({ message: "Invalid password" });

    // Sign in
    const accessToken = tokenService.generateAccessToken(user);
    const refreshToken = tokenService.generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      path: '/',
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const { password, ...userInfo } = user._doc;
    return res.status(200).json({ ...userInfo, accessToken });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi đăng nhập",
      error: error.message || error.toString(),
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    // Lấy refresh token từ cookie
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) return res.status(403).json({ message: "You're not authenticated" });

    // Verify refresh token
    jwt.verify(refreshToken, env.JWT_REFRESH_SECRET, (err, user) => {
      if(err) return res.status(403).json({ message: "Refresh token is not valid" });
      
      const newAccessToken = tokenService.generateAccessToken(user)
      const newRefreshToken = tokenService.generateRefreshToken(user)
      
      // Lưu lại refresh token vào cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        path: '/',
        secure: false, // process.env.NODE_ENV === 'production',
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })  
      // Trả về access token mới
      res.status(200).json({ accessToken: newAccessToken });
  })
  } catch (err) { res.status(500).json(err); }
}

const logout = async (req, res) => {
  try {
    // Xóa refresh token khỏi cookie
    res.clearCookie('refreshToken');
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json(err);
  }
};

export const authControllers = {
  register,
  login,
  logout,
  refreshToken
  // forgotPassword,
  // resetPassword
}