import express from "express";
import dotenv from "dotenv";
import notesRoutes from "./routes/notesRoutes.js";
import connectDB from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";
import cors from "cors"

dotenv.config();
const app = express();

//middleware
app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173"
}))


//routes
app.use("/api/notes", rateLimiter, notesRoutes);

const PORT = process.env.PORT || 3000;

//connect to database and then listen or start app
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});