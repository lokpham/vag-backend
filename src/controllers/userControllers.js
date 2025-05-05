import { User } from "../models/index.js";
import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
import mongoose from 'mongoose';

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

const getCurrentUser = async (req, res) => {
  try {
    // Kiểm tra token đã được xác thực và req.user tồn tại
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng trong token"
      });
    }

    const userId = req.user.id;

    // Kiểm tra userId có phải là ObjectId hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: `ID người dùng không hợp lệ: ${userId}. Phải là một ObjectId hợp lệ.`
      });
    }

    // Tìm user bằng email hoặc _id (tối ưu hóa truy vấn)
    const user = await User.findById(userId)
      .select("username email fullName roles isActive createdAt updatedAt")
      .lean(); // Sử dụng lean() để tối ưu hiệu suất (trả về plain JS object thay vì Mongoose document)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy người dùng với ID: ${userId}`
      });
    }

    // Trả về thông tin user
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin người dùng",
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
    const userId = req.user.id;
    const {username, fullName, email, currentPassword, newPassword} = req.body;

    const user = await User.findById(userId);

    if(!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    if(username !== user.username ) {
      const usernameExists = await User.findOne({ username, _id: { $ne: userId } });
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken',
          field: 'username'
        });
      }
    }

    if(email !== user.email ) {
      const emailExists = await User.findOne({ email, _id: { $ne: userId } });
        if (emailExists) {
          return res.status(400).json({
            success: false,
            message: 'Email is already associated with another account',
            field: 'email'
        });
      }
    }

    user.username = username || user.username;
    user.email = email || user.email;
    user.fullName = fullName || user.fullName;

    if (currentPassword && newPassword) {
      // Verify current password
      const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
      
      if (!isPasswordMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
          field: 'currentPassword'
        });
      }
      
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();
    const updateUser = await User.findById(userId).select('-password')

    return res.status(200).json({
      success: true,
      data: updateUser,
      message: "Profile updated successfully"
    })

  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating profile"
    })
  } 
}
// Delete user by ID
const deleteUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByIdAndDelete(userId);

    if(!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }

    res.status(200).json({
      success: true,
      message: "Account successfully deleted"
    })

  } catch (error) {
    console.error('Error deleting user account:', error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating profile"
    })
  }
}

export const userControllers = {
  getAllUsers,
  createUser, 
  updateUser,
  deleteUser,
  getUserById,
  getCurrentUser,
}