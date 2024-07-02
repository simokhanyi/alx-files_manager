import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import Queue from 'bull'; // Import Bull for queue management

const userQueue = new Queue('userQueue'); // Create Bull queue named 'userQueue'

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    try {
      // Check if DB is connected
      if (!dbClient.isAlive()) {
        return res.status(500).json({ error: 'Database not connected' });
      }

      const usersCollection = dbClient.db.collection('users');

      // Check if user with the same email already exists
      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create the new user document
      const newUser = {
        email,
        password: hashedPassword,
      };

      // Insert the new user into the database
      const result = await usersCollection.insertOne(newUser);

      // Add job to Bull queue to send welcome email
      await userQueue.add('sendWelcomeEmail', { userId: result.insertedId });

      // Return the newly created user with only email and id
      return res.status(201).json({
        id: result.insertedId,
        email: newUser.email,
      });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    try {
      const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });      

      if (!user) {
        return res.status(401).send({ error: 'Unauthorized' });
      }

      return res.status(200).send({ id: user._id, email: user.email });
    } catch (error) {
      console.error('Error retrieving user:', error);
      return res.status(500).send({ error: 'Internal Server Error' });
    }
  }
}

// Process the 'sendWelcomeEmail' job from userQueue
userQueue.process('sendWelcomeEmail', async (job) => {
  const { userId } = job.data;

  if (!userId) {
    throw new Error('Missing userId');
  }

  // Retrieve user details from database
  const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });

  if (!user) {
    throw new Error('User not found');
  }

  // Simulate sending welcome email (in real life, use a service like Mailgun)
  console.log(`Welcome ${user.email}!`);
});

export default UsersController;
