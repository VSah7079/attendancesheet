import { Router } from "express";
import { createEmployee, deleteEmployee, getEmployees, updateEmployee } from "../controllers/employeeController.js";

const router = Router();

router.get("/", getEmployees);
router.post("/", createEmployee);
router.put("/by-name/:name", updateEmployee);
router.delete("/by-name/:name", deleteEmployee);

export default router;
