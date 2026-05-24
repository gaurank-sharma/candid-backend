const mongoose = require("mongoose");

// Renamed Schema to RFPSchema
const RFPSchema = new mongoose.Schema(
  {
    // Details of the Public/Private Sector
    sector: { type: String, required: true },
    contactName: { type: String, required: true },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String }, // Not marked as required in the image
    bestTimeToContact: { type: Date, required: true },

    // Scope of Services Requested
    eprServices: { type: [String], default: [] }, // Array for checkboxes
    appServices: { type: [String], default: [] }, // Array for checkboxes
    description: { type: String, required: true },

    // Customer Consent
    consent: { type: Boolean, required: true },
  },
  { timestamps: true } // Keeps createdAt and updatedAt
);

// Exporting the model as "RFP"
module.exports = mongoose.model("RFP", RFPSchema);
