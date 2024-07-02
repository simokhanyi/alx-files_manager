import Queue from 'bull';
import thumbnail from 'image-thumbnail';
import path from 'path';
import fs from 'fs/promises';
import { ObjectId } from 'mongodb';
import dbClient from './utils/db'; // Assuming dbClient handles MongoDB connection

const fileQueue = new Queue('fileQueue');

fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }

  if (!userId) {
    throw new Error('Missing userId');
  }

  // Fetch the file document from MongoDB based on fileId and userId
  const file = await dbClient.db.collection('files').findOne({
    _id: ObjectId(fileId),
    userId: ObjectId(userId),
  });

  if (!file) {
    throw new Error('File not found');
  }

  // Check if the file type is 'image'; process thumbnails only for images
  if (file.type !== 'image') {
    // Skip processing if the file type is not an image
    return;
  }

  // Generate thumbnails for specified sizes
  const originalFilePath = file.localPath;
  const fileExtension = path.extname(originalFilePath);
  const thumbnailSizes = [500, 250, 100];

  for (const size of thumbnailSizes) {
    const thumbnailPath = `${originalFilePath}_${size}${fileExtension}`;
    try {
      // Generate thumbnail with specified width
      const thumb = await thumbnail(originalFilePath, { width: size });

      // Write thumbnail to file system
      await fs.writeFile(thumbnailPath, thumb);
    } catch (error) {
      console.error(`Error generating thumbnail for ${file.name} (${size}px):`, error);
    }
  }
});
