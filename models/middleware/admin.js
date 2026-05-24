// const admin = (req, res, next) => {
//   if (req.user && req.user.role === "admin") {
//     next();
//   } else {
//     res.status(403).json({ msg: "Forbidden: Access is denied." });
//   }
// };

// module.exports = admin;


// middleware/admin.js
const User = require('../models/User');

module.exports = async function (req, res, next) {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Allow access if the user is either 'superadmin' or 'admin'
    if (user.role !== 'superadmin' && user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin rights required.' });
    }
    

    next();
  } catch (err) {
    console.error('Something wrong with admin middleware');
    res.status(500).send('Server Error');
  }
};