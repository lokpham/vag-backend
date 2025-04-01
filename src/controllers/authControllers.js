import env from '../config/env.js'
import jwt from 'jsonwebtoken'
import bcrypt from "bcrypt";
import { User } from '../models/index.js'
import { tokenService } from '../services/tokenService.js';

const register = async (req, res) => {
  try {
    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(req.body.password, salt)

    // Create a new User
    const userNew = await new User({
    username: req.body.username,
    email: req.body.email,
    password: hashedPassword,
    fullName: req.body.fullName,
    roles: ['user']
    })
    // Save the new User
    const user = await userNew.save()
    res.status(201).json(user) // Trả về user nếu thành công

  } catch (err) { res.status(500).json(err) }
}

const login = async (req, res) => {
  try {
    // Check user/email
    const user = await User.findOne({ $or: [{ username: req.body.username }, { email: req.body.email }] })
    // console.log("User found:", user)
    if (!user) return res.status(404).json({ message: "User not found" })

    // Check password - so sánh pass
    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    )
    if (!validPassword) return res.status(401).json({ message: "Invalid password" })
    // Sign in  
    if ( user && validPassword ) {
      // Tạo access/refresh token 
      const accessToken = tokenService.generateAccessToken(user)
      const refreshToken = tokenService.generateRefreshToken(user)

      // Lưu refresh token vào cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        path: '/',
        secure: false, //process.env.NODE_ENV === 'production',
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 
      }) 

      // Không trả về password trong response
      const { password, ...userInfo } = user._doc
      return res.status(200).json({ ...userInfo, accessToken }) // Lưu refresh token vào cookie
    } 

  } catch (err) { res.status(500).json(err)}
}

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