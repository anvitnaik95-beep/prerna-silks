// Database Cleanup Script - Keep only specified accounts
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

async function cleanupDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected to MongoDB');

    // Find and keep only the admin and specific customer account
    const adminEmail = 'admin@prernasilks.com';
    const customerEmail = 'anvitnaik95@gmail.com';

    // Get all users that are NOT admin@prernasilks.com or anvitnaik95@gmail.com
    const usersToDelete = await User.find({
      email: { $nin: [adminEmail, customerEmail] }
    });

    console.log(`Found ${usersToDelete.length} accounts to remove.`);
    
    if (usersToDelete.length > 0) {
      for (const u of usersToDelete) {
        console.log(`  Removing: ${u.email} (${u.role})`);
      }
      await User.deleteMany({
        email: { $nin: [adminEmail, customerEmail] }
      });
      console.log('Extra accounts removed successfully.');
    }

    // Ensure admin account exists
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      admin = new User({
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        phone: '7019461619'
      });
      await admin.save();
      console.log('Admin account created: admin@prernasilks.com / admin123');
    } else {
      admin.role = 'admin';
      admin.phone = '7019461619';
      await admin.save();
      console.log('Admin account verified: admin@prernasilks.com');
    }

    // Ensure customer account exists
    let customer = await User.findOne({ email: customerEmail });
    if (!customer) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('customer123', salt);
      customer = new User({
        name: 'Anvit Naik',
        email: customerEmail,
        password: hashedPassword,
        role: 'customer',
        phone: ''
      });
      await customer.save();
      console.log('Customer account created: anvitnaik95@gmail.com / customer123');
    } else {
      console.log(`Customer account verified: ${customerEmail}`);
    }

    // List remaining accounts
    const remaining = await User.find({}).select('name email role phone');
    console.log('\nRemaining accounts:');
    remaining.forEach(u => {
      console.log(`  - ${u.email} (${u.role}) ${u.phone ? `Phone: ${u.phone}` : ''}`);
    });

    console.log('\nDatabase cleanup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Cleanup error:', error.message);
    process.exit(1);
  }
}

cleanupDatabase();
