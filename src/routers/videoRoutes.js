import express from 'express';
import { 
  generateVideo,
  getAudio,
  getImage,
  getVideo,
  getAllUserVideo,
  downloadVideo,
  downloadImage,
  downloadAudio,
  deleteVideo,
  getAllVideos,
  } from '../controllers/videoController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/generate-video', authMiddleware.verifyToken, generateVideo);
router.get('/all', authMiddleware.verifyToken, getAllVideos);
router.get('/user-videos', authMiddleware.verifyToken, getAllUserVideo);
router.get('/:videoId', getVideo);
router.get('/image/:imageId', getImage);
router.get('/audio/:audioId', getAudio);

router.get('/download/:videoId', downloadVideo);
router.get('/download/image/:imageId', downloadImage);
router.get('/download/audio/:audioId', downloadAudio);

router.delete("/:videoId", authMiddleware.verifyToken, deleteVideo);

export const videoRoutes = router 

