// Tài khoản xác thực người dùng
import { Schema, model} from 'mongoose';

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 20,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    minlength: 10,
    maxlength: 200,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  fullName: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  roles: [{
    type: String,
    enum: ['admin', 'user'],
    default: ['user']
  }]
}, {
  timestamps: true // Create and update 
});

export default model('User', UserSchema);
