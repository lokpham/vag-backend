import { User } from "../models/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    const formattedUsers = users.map(user => ({
      _id: user._id,
      // username: user.username,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
    
    // Sort users by createdAt in descending order
    formattedUsers.sort((a,b) => {
      return a.roles.includes('admin') ? -1 : b.roles.includes('admin') ? 1 : new Date(b.createdAt) - new Date(a.createdAt);
    })
    res.status(200).json(formattedUsers);
  } catch (error) { res.status(500).json(error); }
}

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json("User not found");
    res.status(200).json(user);
  } catch (error) { res.status(500).json(error); }
}

const getMe = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng trong token'
      });
    }
    
    const userId = req.user.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "ID người dùng không hợp lệ",
      });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy thông tin người dùng' 
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error("Error in getMe:", error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin người dùng',
      error: error.message || error.toString()
    });
  }
};
const createUser = async (req, res) => {
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

const updateUser = async (req, res) => {
  try {
    const newUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(newUser);
  } catch (error) {
    res.status(400).json(error);
  } 
}
// Delete user by ID
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);  
    res.status(200).json("Delete success");
  } catch (error) { res.status(500).json(error); }
}

export const userControllers = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserById,
  getMe,
}