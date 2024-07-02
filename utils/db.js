import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;

    this.client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    this.db = null; // Initialize db as null

    this.connect(); // Call connection method in constructor
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('MongoDB connected successfully');
      this.db = this.client.db(process.env.DB_DATABASE || 'files_manager');
    } catch (err) {
      console.error('MongoDB connection error:', err);
      throw err;
    }
  }

  isAlive() {
    return this.client && this.client.isConnected();
  }

  async nbUsers() {
    try {
      return await this.db.collection('users').countDocuments();
    } catch (err) {
      console.error('Error counting users:', err);
      throw err;
    }
  }

  async nbFiles() {
    try {
      return await this.db.collection('files').countDocuments();
    } catch (err) {
      console.error('Error counting files:', err);
      throw err;
    }
  }
}

const dbClient = new DBClient();
export default dbClient;
