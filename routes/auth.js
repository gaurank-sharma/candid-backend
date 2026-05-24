// // const express = require('express');
// // const router = express.Router();
// // const bcrypt = require('bcryptjs');
// // const jwt = require('jsonwebtoken');
// // const User = require('../models/User');


// // // Register (one-time) - you can remove after creating admin
// // router.post('/register', async (req, res) => {
// // const { name, email, password } = req.body;
// // try {
// // let user = await User.findOne({ email });
// // if (user) return res.status(400).json({ msg: 'User already exists' });
// // user = new User({ name, email, password });
// // const salt = await bcrypt.genSalt(10);
// // user.password = await bcrypt.hash(password, salt);
// // await user.save();
// // const payload = { user: { id: user.id } };
// // jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
// // if (err) throw err;
// // res.json({ token });
// // });
// // } catch (err) {
// // console.error(err.message);
// // res.status(500).send('Server error');
// // }
// // });


// // // Login
// // router.post('/login', async (req, res) => {
// // const { email, password } = req.body;
// // try {
// // const user = await User.findOne({ email });
// // if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
// // const isMatch = await bcrypt.compare(password, user.password);
// // if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
// // const payload = { user: { id: user.id } };
// // jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
// // if (err) throw err;
// // res.json({ token, user: { name: user.name, email: user.email } });
// // });
// // } catch (err) {
// // console.error(err.message);
// // res.status(500).send('Server error');
// // }
// // });


// // module.exports = router;


// // routes/auth.js
// const express = require('express');
// const router = express.Router();
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// // Register (one-time) - stores password as plain text (INSECURE)
// router.post('/register', async (req, res) => {
//   const { name, email, password, role } = req.body;
//   try {
//     let user = await User.findOne({ email });
//     if (user) return res.status(400).json({ msg: 'User already exists' });

//     user = new User({ name, email, password, role }); // password stored as plain text
//     await user.save();

// const payload = { user: { id: user.id, role: user.role } };

//     jwt.sign(
//       payload,
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' },
//       (err, token) => {
//         if (err) throw err;
//         res.json({ token });
//       }
//     );
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server error');
//   }
// });

// // Login (plain-text comparison)
// router.post('/login', async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

//     // Plain-text comparison (INSECURE)
//     if (password !== user.password) {
//       return res.status(400).json({ msg: 'Invalid credentials' });
//     }
    
// const payload = { user: { id: user.id, role: user.role } };

//     jwt.sign(
//       payload,
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' },
//       (err, token) => {
//         if (err) throw err;
//         // return token and public user info
//         res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
//       }
//     );
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server error');
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @route   POST api/auth/register
// @desc    Register a new user (can be restricted)
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({ name, email, password, role });

    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    await user.save();

    // Create JWT payload
    const payload = { user: { id: user.id, role: user.role } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // --- Debugging Logs ---
  console.log(`Login attempt for email: ${email}`);

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Login failed: No user found with that email.');
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // --- Debugging Logs ---
    console.log(`User found in DB. Comparing password for user: ${user.name}`);

    // Compare provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    
    // --- Debugging Logs ---
    console.log(`Password comparison result (isMatch): ${isMatch}`);

    if (!isMatch) {
      console.log('Login failed: Passwords do not match.');
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    
    console.log('Login successful. Generating token.');

    // Create JWT payload
    const payload = { user: { id: user.id, role: user.role } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        // Return token and public user info
        res.json({ 
          token, 
          user: { name: user.name, email: user.email, role: user.role } 
        });
      }
    );
  } catch (err) {
    console.error('Error during login:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;

