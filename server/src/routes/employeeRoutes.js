import { Router } from "express";
import { createEmployee, deleteEmployee, getEmployees, updateEmployee, exportEmployeesToExcel, exportEmployeesToExcelLocal } from "../controllers/employeeController.js";

const router = Router();

router.get("/", getEmployees);
router.get("/export/excel", exportEmployeesToExcel);
router.get("/export/excel-local", exportEmployeesToExcelLocal);
router.post("/", createEmployee);
router.put("/by-name/:name", updateEmployee);
router.delete("/by-name/:name", deleteEmployee);

export default router;
