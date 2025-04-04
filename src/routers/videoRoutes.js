import express from 'express';
import multer from 'multer';
import { generateVideo, getAudio,getImage,getVideo } from '../controllers/videoController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';


const router = express.Router();

router.route('/generate-video')
  .post(authMiddleware.verifyToken, generateVideo)
router.get('/video/:videoId', getVideo);
router.get('/image/:imageId', getImage);
router.get('/audio/:audioId', getAudio);
export const videoRoutes = router 

