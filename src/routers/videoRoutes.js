import express from 'express';
import { generateVideo } from '../controllers/videoController.js';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

// router.post('/generate-video', upload.single('music'), (req, res, next) => {
//   console.log('Route /generate-video hit');
//   next();
// }, generateVideo);

router.route('/generate-video')
  .get((req, res) => {
    res.status(200).json({ message: 'API GET đã nhận được!' })
  })
  .post(upload.single('music'), (req, res, next) => {
    // console.log('Route /generate-video hit');
    next();
  }, generateVideo)
export const videoRoutes = router 

