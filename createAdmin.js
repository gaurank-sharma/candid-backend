// seedUsers.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User'); // Adjust the path to your User model if needed

// Load environment variables from .env file
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for seeding...');
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const seedUsers = async () => {
  await connectDB();

  try {
    // --- 1. Clear existing users ---
    await User.deleteMany({});
    console.log('Previous users cleared.');

    // --- 2. Define user data ---
    const usersToCreate = [
      {
        name: 'Super Admin',
        email: 'superadmin@example.com',
        password: 'superadmin123', // Replace with a strong password
        role: 'superadmin',
      },
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin456', // Replace with a strong password
        role: 'admin',
      },
    ];

    // --- 3. Hash passwords and create users ---
    const createdUsers = await Promise.all(
      usersToCreate.map(async (userData) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        
        const user = new User({
          name: userData.name,
          email: userData.email,
          role: userData.role,
          password: hashedPassword, // Save the hashed password
        });

        return user.save();
      })
    );

    console.log('✅ Users seeded successfully!');
    console.log(createdUsers.map(u => ({ name: u.name, email: u.email, role: u.role })));

  } catch (error) {
    console.error(`Error during seeding: ${error.message}`);
  } finally {
    // --- 4. Disconnect from the database ---
    mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};

// Run the seeder function
seedUsers();
