// middleware/superadmin.js
const User = require('../models/User');

module.exports = async function (req, res, next) {
  try {
    // req.user is set by the 'auth' middleware
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.role !== 'superadmin') {
      return res.status(403).json({ msg: 'Access denied. Super admin role required.' });
    }

    next();
  } catch (err) {
    console.error('Something wrong with superadmin middleware');
    res.status(500).send('Server Error');
  }
};