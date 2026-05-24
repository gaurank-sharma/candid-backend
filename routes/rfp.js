const express = require("express");
const router = express.Router();
// Import the new RFP model
const RFP = require("../models/RFP"); 
const auth = require("../middleware/auth"); // only checks login

// POST → Save detailed service request submission (open for all)
// The route is now implicitly /api/rfp (as defined in your main app file)
router.post("/", async (req, res) => {
  try {
    const {
      sector,
      contactName,
      contactEmail,
      contactPhone,
      bestTimeToContact, // New Date field
      eprServices, // Array of strings
      appServices, // Array of strings
      description,
      consent, // Boolean
    } = req.body;

    // Updated validation based on the form images
    const requiredFields = {
      sector,
      contactName,
      contactEmail,
      bestTimeToContact,
      description,
      consent,
    };

    const missingFields = Object.keys(requiredFields).filter(
      (key) => !requiredFields[key]
    );

    if (missingFields.length > 0) {
      return res
        .status(400)
        .json({ msg: `Please fill all required fields: ${missingFields.join(", ")}` });
    }

    if (!consent) {
        return res.status(400).json({ msg: "You must consent to the privacy policy" });
    }
    
    // Check if at least one service is selected (as marked by '*' in the image)
    if (
      (!eprServices || eprServices.length === 0) &&
      (!appServices || appServices.length === 0)
    ) {
      return res
        .status(400)
        .json({ msg: "Please select at least one service from EPR or Application Management" });
    }

    // Create a new RFP document
    const newServiceRequest = new RFP({
      sector,
      contactName,
      contactEmail,
      contactPhone,
      bestTimeToContact,
      eprServices,
      appServices,
      description,
      consent,
    });

    await newServiceRequest.save();

    res.json({ msg: "RFP request received successfully!", newServiceRequest });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// GET → View all messages (any logged-in user can see)
// This route remains the same, but 'auth' middleware is still applied.
router.get("/", auth, async (req, res) => {
  try {
    const rfps = await RFP.find().sort({ createdAt: -1 }); // Find RFPs
    res.json(rfps);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
