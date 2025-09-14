import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes/interviewRoutes.js";
import interviewRecordRoutes from "./routes/interviewRecordRoutes.js";
import planRoutes from "./routes/planRoutes.js";
import questionBankRoutes from "./routes/questionBankRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Routes
app.use("/api/interviews", routes);
app.use("/api/user/plan", planRoutes);
app.use("/api/interview-records", interviewRecordRoutes);
app.use("/api/question-banks", questionBankRoutes);
app.use("/api/test", testRoutes);

// Error handling
app.use(errorHandler);

export default app;
