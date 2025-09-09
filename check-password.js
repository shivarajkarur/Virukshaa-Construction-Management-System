const mongoose = require('mongoose');
const AdminProfile = require('./models/AdminProfile');

async function checkAdminPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction-management');
    
    const admin = await AdminProfile.findOne();
    if (admin) {
      console.log('Admin found:');
      console.log('Password length:', admin.password.length);
      console.log('Password starts with:', admin.password.substring(0, 10));
      console.log('Looks like bcrypt hash:', admin.password.startsWith('$2'));
    } else {
      console.log('No admin profile found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAdminPassword();