import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import notesRoutes from "./routes/notesRoutes.js";
import connectDB from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";

const app = express();

app.use(express.json({ limit: "1mb" }));

if (process.env.NODE_ENV !== "production") {
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
    }),
  );
}

app.use("/api/notes", rateLimiter, notesRoutes);

const rootDirectory = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(rootDirectory, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(rootDirectory, "../frontend/dist/index.html"));
  });
}

const PORT = Number(process.env.PORT) || 3001;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
