
import Failure from "../models/Failure.js";

// CREATE: a customer reports an ATM failure
// Route: POST /failures   (public)
export const createFailure = async (req, res) => {
  try {
    const { atmId, customerName, customerPhone, issueType } = req.body;

    // Validate required fields: all four must be present
    if (!atmId || !customerName || !customerPhone || !issueType) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Stop duplicates: if this ATM already has an open report, refuse a new one
    const failureExist = await Failure.findOne({ atmId });
    if (failureExist && failureExist.status !== "Resolved") {
      return res.status(400).json({ 
        message: "Active failure for this ATM already exists. Please resolve the existing one first." 
      });
    }

    // Create new failure record (always starts as "Pending")
    const failure = new Failure({
      atmId,
      customerName,
      customerPhone,
      issueType,
      timestamp: new Date(),
      status: "Pending",
      reportedBy: req.admin?.id || "anonymous", // Track who reported if logged in
    });

    // Save it to MongoDB
    const savedFailure = await failure.save();
    
    // 201 = "Created"
    res.status(201).json({
      message: "Failure reported successfully",
      failure: savedFailure
    });

  } catch (error) {
    console.error("Error creating failure:", error);
    res.status(500).json({ error: "Internal Server Error. Failed to report failure." });
  }
};

// READ: get every failure 
// Route: GET /failures   (public)
export const getFailures = async (req, res) => {
  try {
    // Newest first (timestamp: -1 means "descending")
    const failures = await Failure.find().sort({ timestamp: -1 });
    
    // Nothing reported yet: send an empty list (not an error)
    if (failures.length === 0) {
      return res.status(200).json({
        message: "No failures found",
        failures: []
      });
    }
    
    res.status(200).json({
      total: failures.length,
      failures: failures
    });
  } catch (error) {
    console.error("Error fetching failures:", error);
    res.status(500).json({ error: "Internal Server Error. Failed to fetch failures." });
  }
};

// UPDATE: change a failure's status (e.g. mark it Resolved)
// Route: PUT /failures/:id   (needs login + canResolveFailures)
export const updateFailure = async (req, res) => {
  try {
    const { id } = req.params;                    // the failure's id from the URL
    const { status, resolutionNotes } = req.body; // the new values from the app

    // Validate ID format: a MongoDB id is exactly 24 hex characters
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid failure ID format" });
    }

    // Check if failure exists
    const failureExist = await Failure.findById(id);
    if (!failureExist) {
      return res.status(404).json({ message: "Failure not found." });
    }

    // The values to save. If the app sends nothing, it defaults to "Resolved".
    const updateData = {
      status: status || "Resolved",
      resolutionNotes: resolutionNotes || "Fixed by technician",
      resolvedBy: req.admin?.id || "system", // Track who resolved it
      resolvedAt: new Date(),
    };

    // { new: true } makes MongoDB return the updated record, not the old one
    const updatedFailure = await Failure.findByIdAndUpdate(id, updateData, { new: true });

    res.status(200).json({
      message: "Failure updated successfully",
      failure: updatedFailure
    });
  } catch (error) {
    console.error("Error updating failure:", error);
    res.status(500).json({ error: "Internal Server Error. Failed to update failure." });
  }
};

// DELETE: remove a failure record 
// Route: DELETE /failures/:id   (needs login + canDeleteFailures)
export const deleteFailure = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid failure ID format" });
    }

    // Check if failure exists
    const failureExist = await Failure.findById(id);
    if (!failureExist) {
      return res.status(404).json({ message: "Failure not found." });
    }

    // Keep a record in the console of who deleted what
    console.log(`[DELETION] User: ${req.admin?.username} | Failure ID: ${id} | Timestamp: ${new Date()}`);

    // Delete the failure
    await Failure.findByIdAndDelete(id);

    res.status(200).json({ 
      message: "Failure deleted successfully",
      deletedId: id,
      deletedBy: req.admin?.username || "system"
    });
  } catch (error) {
    console.error("Error deleting failure:", error);
    res.status(500).json({ error: "Internal Server Error. Failed to delete failure." });
  }
};

// STATS: counts for reports (not connected to a route yet)
export const getFailureStats = async (req, res) => {
  try {
    // Count how many failures are in each status
    const totalFailures = await Failure.countDocuments();
    const pendingFailures = await Failure.countDocuments({ status: "Pending" });
    const resolvedFailures = await Failure.countDocuments({ status: "Resolved" });
    const inProgressFailures = await Failure.countDocuments({ status: "In Progress" });

    // Count failures grouped by issue type (e.g. Card stuck: 4)
    const failuresByType = await Failure.aggregate([
      { $group: { _id: "$issueType", count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      stats: {
        total: totalFailures,
        pending: pendingFailures,
        inProgress: inProgressFailures,
        resolved: resolvedFailures,
        byType: failuresByType,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Internal Server Error. Failed to fetch statistics." });
  }
};

// EXPORT: download all failures as a CSV file (not connected to a route yet) 
export const exportFailures = async (req, res) => {
  try {
    const failures = await Failure.find().sort({ timestamp: -1 });

    if (failures.length === 0) {
      return res.status(404).json({ message: "No failures to export" });
    }

    // First line of the CSV = the column titles
    let csv = "ATM ID,Customer Name,Phone,Issue Type,Status,Reported Date,Resolved Date,Notes\n";
    
    // One line per failure
    failures.forEach((failure) => {
      csv += `"${failure.atmId}","${failure.customerName}","${failure.customerPhone}","${failure.issueType}","${failure.status}","${failure.timestamp}","${failure.resolvedAt || 'N/A'}","${failure.resolutionNotes || ''}"\n`;
    });

    // Tell the browser this is a file to download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=failures.csv");
    res.status(200).send(csv);
  } catch (error) {
    console.error("Error exporting failures:", error);
    res.status(500).json({ error: "Internal Server Error. Failed to export failures." });
  }
};
