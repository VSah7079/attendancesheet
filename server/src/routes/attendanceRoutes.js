import { Router } from "express";
import {
  createAttendances,
  deleteAttendance,
  getAttendances,
  updateAttendance,
  exportAttendanceToExcel,
  exportAttendanceToExcelLocal,
} from "../controllers/attendanceController.js";

const router = Router();

router.get("/", getAttendances);
router.get("/export/excel", exportAttendanceToExcel);
router.get("/export/excel-local", exportAttendanceToExcelLocal);
router.post("/bulk", createAttendances);
router.put("/:rowNum", updateAttendance);
router.delete("/:rowNum", deleteAttendance);

export default router;
