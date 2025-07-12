import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { dbConnect } from "./config/db_connection.js";
import { authRouter } from "./routes/authRoute.js";
import { storeRouter } from "./routes/storeRoute.js";
import { appointmentRouter } from "./routes/appointmentRoute.js";
import { adminRouter } from "./routes/adminRoute.js";
import contactRoutes from "./routes/contactRoutes.js";

dotenv.config();

const app = express();

dotenv.config();

//const allowedOrigin = process.env.VITE_FRONTEND_URL || 'http://localhost:5173' || process.env.VITE_FRONTEND_ADMIN_URL;

app.use(
  cors({
    origin: [process.env.VITE_FRONTEND_URL, process.env.VITE_FRONTEND_ADMIN_URL,'http://localhost:5173'],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-Socket-ID",
    ],
  })
);
// app.use(cors({
//   origin: allowedOrigin,
//   credentials: true,
// }));


app.use(express.json());
app.use(cookieParser());

dbConnect();

app.use("/api/auth", authRouter);
app.use("/api/store", storeRouter);
app.use("/api/appointment", appointmentRouter);
app.use("/api/admin", adminRouter);
app.use('/api/contact', contactRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
