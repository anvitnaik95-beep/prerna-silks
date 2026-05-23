require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const Order = require('./models/Order');
const { startBackgroundJobs } = require('./backgroundJobs');

async function check() {
  console.log('=== DATABASE DIAGNOSTIC ===');
  console.log('Connecting to:', process.env.MONGO_URI);
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected successfully!');

    // Let's find all active orders
    const orders = await Order.find({}).sort({ created_at: -1 }).limit(5);
    console.log(`\nFound ${orders.length} recent orders:`);
    
    for (const o of orders) {
      console.log(`- Order ID: ${o._id}`);
      console.log(`  Status: ${o.status}`);
      console.log(`  Created At: ${o.created_at}`);
      console.log(`  Tracking ID: ${o.tracking_id}`);
      console.log(`  Notified: Confirmed=${o.notified_confirmed}, Dispatched=${o.notified_dispatched}, Delivered=${o.notified_delivered}`);
      const ageMs = Date.now() - new Date(o.created_at).getTime();
      console.log(`  Age: ${(ageMs / 1000).toFixed(1)} seconds`);
      console.log('---');
    }

    console.log('\nRunning processOrderLifecycles diagnostics manually...');
    // Require directly to get access to processOrderLifecycles (which is internal)
    // We can simulate it by importing and calling the background jobs trigger
    const backgroundJobs = require('./backgroundJobs');
    // Let's call startBackgroundJobs which runs it once immediately
    backgroundJobs.startBackgroundJobs();

    // Wait 5 seconds to let async calls run
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('\nDiagnostic complete!');
    process.exit(0);
  } catch (err) {
    console.error('Fatal error during diagnostic:', err);
    process.exit(1);
  }
}

check();
