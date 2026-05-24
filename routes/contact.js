const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");
const auth = require("../middleware/auth");   // only checks login

// POST → Save contact form submission (open for all)
router.post("/", async (req, res) => {
  try {
    const { name, email, telephone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ msg: "Please fill all required fields" });
    }

    const contact = new Contact({ name, email, telephone, message });
    await contact.save();

    res.json({ msg: "Message received successfully!", contact });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// GET → View all messages (any logged-in user can see)
router.get("/", auth, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
