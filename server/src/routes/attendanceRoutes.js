import { Router } from "express";
import {
  createAttendances,
  deleteAttendance,
  getAttendances,
  updateAttendance,
} from "../controllers/attendanceController.js";

const router = Router();

router.get("/", getAttendances);
router.post("/bulk", createAttendances);
router.put("/:rowNum", updateAttendance);
router.delete("/:rowNum", deleteAttendance);

export default router;
