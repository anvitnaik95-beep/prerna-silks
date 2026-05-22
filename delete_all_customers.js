const mongoose = require('mongoose');
const User = require('./server/models/User');
const { testConnection } = require('./server/config/db');

testConnection().then(async () => {
  try {
    const result = await User.deleteMany({ role: 'customer' });
    console.log(`Deleted ${result.deletedCount} customers.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});
