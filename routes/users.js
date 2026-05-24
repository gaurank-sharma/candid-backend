// // routes/users.js
// const express = require('express');
// const router = express.Router();
// const User = require('../models/User');
// const auth = require('../middleware/auth');
// const admin = require('../middleware/admin');

// // @route   GET /api/users
// // @desc    Get all users
// // @access  Private/Admin
// router.get('/', [auth, admin], async (req, res) => {
//   try {
//     // Find all users but exclude their passwords from the result
//     const users = await User.find().select('-password');
//     res.json(users);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server Error');
//   }
// });

// module.exports = router;
// routes/users.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const superadmin = require('../middleware/superadmin'); // Import new middleware

// @route   GET /api/users
// @desc    Get all users (for admins and super admins)
// @access  Private/Admin
router.get('/', [auth, admin], async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- Super Admin Routes ---

// @route   POST /api/users
// @desc    Create a new user/admin
// @access  Private/SuperAdmin
router.post('/', [auth, superadmin], async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ msg: 'Please provide all fields: name, email, password, role.' });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists with this email.' });
    }

    user = new User({ name, email, password, role });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const newUser = user.toObject();
    delete newUser.password;

    res.status(201).json(newUser);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/users/:id
// @desc    Update a user's details (email, password, role, name)
// @access  Private/SuperAdmin
router.put('/:id', [auth, superadmin], async (req, res) => {
  const { email, password, role, name } = req.body;
  const updateFields = {};

  try {
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    if (name) updateFields.name = name;

    // Check email uniqueness
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser.id !== req.params.id) {
        return res.status(400).json({ msg: 'Email already in use by another user.' });
      }
      updateFields.email = email;
    }

    // Prevent superadmin downgrade
    if (role) {
      if (user.role === 'superadmin' && role !== 'superadmin') {
        return res.status(400).json({ msg: 'You cannot downgrade a superadmin.' });
      }
      updateFields.role = role;
    }

    // Handle password update
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password, salt);
    }

    user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete a user
// @access  Private/SuperAdmin
router.delete('/:id', [auth, superadmin], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    // Prevent a superadmin from deleting themselves
    if (user.id === req.user.id) {
      return res.status(400).json({ msg: 'You cannot delete your own account.' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'User successfully deleted.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
