
import mongoose from "mongoose";

const FailureSchema = new mongoose.Schema(
  {
    // Which ATM broke, e.g. "ATM-001"
    atmId: {
      type: String,
      required: [true, "ATM ID is required"],
      unique: true,   // no two records may share an ATM ID (see note in the README)
      trim: true,     // removes spaces at the start and end
    },

    // Who reported it
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },

    // How to reach them: exactly 10 digits
    customerPhone: {
      type: String,
      required: [true, "Customer phone is required"],
      trim: true,
      match: [/^\d{10}$/, "Please provide a valid 10-digit phone number"],
    },

    // What went wrong: must be one of these six choices
    issueType: {
      type: String,
      required: [true, "Issue type is required"],
      trim: true,
      enum: [
        "Cash not dispensed",
        "Card stuck",
        "Screen not working",
        "Keypad not responding",
        "Network issue",
        "Other",
      ],
    },

    // When it was reported (set automatically, can never be changed later)
    timestamp: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    // Where the fix stands. A new report always starts as "Pending".
    status: {
      type: String,
      default: "Pending",
      enum: ["Pending", "In Progress", "Resolved"],
    },

    // Notes written by the technician
    resolutionNotes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Create the "Failure" collection (table) from this blueprint and export it
export default mongoose.model("Failure", FailureSchema);
