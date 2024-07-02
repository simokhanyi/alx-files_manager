import express from 'express';
import AuthController from '../controllers/AuthController';
import UsersController from '../controllers/UsersController';
import FilesController from '../controllers/FilesController';
import Queue from 'bull';

const fileQueue = new Queue('fileQueue');

const router = express.Router();

router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);
router.post('/files', async (req, res, next) => {
  try {
    const result = await FilesController.postUpload(req, res);
    // If the file type is 'image', enqueue a job to generate thumbnails
    if (result.type === 'image') {
      await fileQueue.add({
        userId: result.userId,
        fileId: result.id,
      });
    }
    return result;
  } catch (error) {
    next(error);
  }
});
router.get('/files/:id', FilesController.getShow);
router.get('/files', FilesController.getIndex);
router.put('/files/:id/publish', FilesController.putPublish);
router.put('/files/:id/unpublish', FilesController.putUnpublish);
router.get('/files/:id/data', FilesController.getFile);

export default router;
