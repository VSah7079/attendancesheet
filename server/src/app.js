import express from "express";
import cors from "cors";
import morgan from "morgan";
import employeeRoutes from "./routes/employeeRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";

const app = express();

app.disable("x-powered-by");
app.use(cors());
app.use(express.json({ limit: "100kb" }));
app.use(morgan("dev"));

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

app.get("/", (_req, res) => {
  res.status(200).json({
    ok: true,
    message: "Attendance API is running",
    endpoints: ["/api/health", "/api/employees", "/api/attendance"],
  });
});

app.get("/api", (_req, res) => {
  res.status(200).json({
    ok: true,
    message: "Use /api/health, /api/employees, or /api/attendance",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

export default app;
