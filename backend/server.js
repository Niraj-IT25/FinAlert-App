import express from "express";           // the web server framework
import mongoose from "mongoose";         // talks to MongoDB
import bodyParser from "body-parser";    // reads data sent in requests
import dotenv from "dotenv";             // loads values from the .env file
import cors from "cors";                 // lets the mobile app / website call this API
import failureRoute from "./routes/failureRoutes.js";
import adminAuthRoute from "./routes/adminAuthRoutes.js";

const app = express();

// Load environment variables (MONGO_URL, PORT, JWT_SECRET ...) from the .env file.
dotenv.config();

// ===== MIDDLEWARE (runs on every request, before the routes) =====
app.use(cors());                                        // allow other apps to call this API
app.use(express.json());                                // understand JSON bodies
app.use(bodyParser.json());                             // (same job, kept from the original)
app.use(bodyParser.urlencoded({ extended: true }));     // understand form-style bodies


app.use("/admin/auth", adminAuthRoute);

// 2. FAILURE ROUTES (report, list, update, delete ATM failures)
// The permission checks are written inside failureRoutes.js
app.use("/", failureRoute);

// Visiting http://localhost:5000 in a browser shows this message
app.get("/", (req, res) => {
  res.send("✓ Bank Management System API Running...");
});

// Health check: a quick way to test that the server is alive
app.get("/health", (req, res) => {
  res.json({ message: "✓ API is healthy", status: "connected" });
});

// ===== START THE SERVER =====
// Use the values from .env, or these defaults if they are missing
const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/bankSystem";

// Connect to the database FIRST, then start accepting requests
mongoose
  .connect(MONGO_URL, {
  })
  .then(() => {
    console.log("\n✓ Database connected successfully.");
    console.log(`✓ Server is running : ${MONGO_URL}`);

    app.listen(PORT, () => {
      console.log(`✓ Server is running on port: ${PORT}`);
      console.log(`✓ API Base URL: http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    // If MongoDB can't be reached, stop the program with an error
    console.error("✗ Database connection error:", error.message);
    process.exit(1);
  });
