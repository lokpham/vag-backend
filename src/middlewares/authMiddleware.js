import jwt from 'jsonwebtoken'
import env from '../config/env.js'

const verifyToken = async (req, res, next) => {
  const token = req.headers.token // Đổi token thành authenti
  if (token) {
    // Bearer "eftojvoeinoeinvowinvo"
    const accessToken = token.split(" ")[1]
    try {
      const decoded = jwt.verify(accessToken, env.JWT_ACCESS_SECRET)
      req.user = decoded
      console.log('Token verified')
      next()
    } catch (err) { return res.status(403).json({ message: "Token không hợp lệ" }) }
  } else {
    return res.status(401).json({ message: "Bạn cần đăng nhập" })
  }
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
}