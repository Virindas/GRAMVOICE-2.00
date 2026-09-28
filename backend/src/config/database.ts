import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Admin } from '../models/Admin';

// Disable infinite query buffering when disconnected to prevent 10s hanging errors
mongoose.set('bufferTimeoutMS', 3000);

export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gramvoice';

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected. Reconnecting in 3s...');
    setTimeout(() => {
      if (mongoose.connection.readyState === 0) {
        attemptConnection(uri).catch((err) =>
          console.error('[MongoDB] Reconnect error:', err.message)
        );
      }
    }, 3000);
  });

  await attemptConnection(uri);
}

async function attemptConnection(uri: string): Promise<void> {
  try {
    console.log(`[MongoDB] Attempting connection to database at ${uri}...`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      bufferCommands: false,
    });
    console.log('[MongoDB] Successfully connected to MongoDB.');
    await seedDefaultAdmin();
  } catch (error: any) {
    console.error('[MongoDB] Database connection failed:', error.message);
  }
}

async function seedDefaultAdmin(): Promise<void> {
  try {
    const count = await Admin.countDocuments();
    if (count === 0) {
      console.log('[MongoDB] No administrators found. Seeding default admin account...');
      const admin = new Admin({
        fullName: 'Panchayat Administrator',
        email: 'admin@panchayat.gov.in',
        phoneNumber: '9999999999',
        passwordHash: await bcrypt.hash('admin123', 10),
        officeOrDepartment: 'Panchayat Office',
        governmentKeyUsed: 'GV2026',
        securityQuestions: [
          { question: 'What is your birthplace?', answerHash: await bcrypt.hash('rampur', 10) },
          { question: 'What was the name of your first school?', answerHash: await bcrypt.hash('government school', 10) }
        ]
      });
      await admin.save();
      console.log('[MongoDB] Default admin created: admin@panchayat.gov.in / admin123');
    }
  } catch (err: any) {
    console.warn('[MongoDB] Admin seeding notice:', err.message);
  }
}
