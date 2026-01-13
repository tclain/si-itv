import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createContext } from "./context";
import { authRoutes } from "./auth/routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Middleware to attach session context to requests
app.use(async (req, res, next) => {
  const ctx = await createContext({ req, res });
  // Attach session to request for use in routes and middleware
  req.session = ctx.session;
  next();
});

// API routes
app.use("/api/auth", authRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
