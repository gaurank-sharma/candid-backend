// middleware/roles.js
module.exports = function(requiredRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    // requiredRoles can be single string or array
    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({ msg: "Access denied: Insufficient role" });
    }

    next();
  };
};
