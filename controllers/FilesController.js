import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';

class FilesController {
  // Other methods omitted for brevity...

  static async getFile(req, res) {
    const { id } = req.params;
    const { size } = req.query; // New query parameter

    // Validate token
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const file = await dbClient.db.collection('files').findOne({
        _id: ObjectId(id),
      });

      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Check if the file is public or user is the owner
      if (!file.isPublic && file.userId.toString() !== userId) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Check if the type is folder
      if (file.type === 'folder') {
        return res.status(400).json({ error: "A folder doesn't have content" });
      }

      let filePath = file.localPath;

      // Handle thumbnail size parameter
      if (size) {
        const fileExtension = path.extname(filePath);
        const thumbnailPath = `${filePath}_${size}${fileExtension}`;
        filePath = fs.existsSync(thumbnailPath) ? thumbnailPath : filePath;
      }

      // Check if the file exists locally
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Get MIME type
      const mimeType = mime.lookup(filePath);

      // Stream file content
      const fileStream = fs.createReadStream(filePath);
      fileStream.on('open', () => {
        res.set('Content-Type', mimeType);
        fileStream.pipe(res);
      });

      fileStream.on('error', (err) => {
        console.error('Error streaming file:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      });
    } catch (error) {
      console.error('Error getting file data:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default FilesController;
