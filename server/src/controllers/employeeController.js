import { Employee } from "../models/Employee.js";
import { createEmployeesExcelLocally } from "../utils/excelExport.js";

import XLSX from "xlsx";

const normalizeSpaces = (value) => String(value || "").trim().replace(/\s+/g, " ");

const normalizeName = (value) => normalizeSpaces(value);

const validateEmployeePayload = (payload) => {
  const name = normalizeName(payload?.name);
  const dailyRate = Number(payload?.dailyRate);

  if (!name) {
    return { error: "name is required" };
  }

  if (name.length < 2 || name.length > 60) {
    return { error: "name must be between 2 and 60 characters" };
  }

  if (!/^[a-zA-Z\s.'-]+$/.test(name)) {
    return { error: "name can contain only letters, spaces, dots, apostrophes, and hyphens" };
  }

  if (!Number.isFinite(dailyRate)) {
    return { error: "dailyRate must be a valid number" };
  }

  if (dailyRate < 0 || dailyRate > 100000) {
    return { error: "dailyRate must be between 0 and 100000" };
  }

  return {
    data: {
      name,
      nameKey: name.toLowerCase(),
      dailyRate,
    },
  };
};

export const createEmployee = async (req, res) => {
  try {
    const validated = validateEmployeePayload(req.body);
    if (validated.error) {
      return res.status(400).json({ message: validated.error });
    }

    const employee = await Employee.create(validated.data);

    return res.status(201).json(employee);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Employee with this name already exists" });
    }
    return res.status(500).json({ message: "Failed to create employee", error: error.message });
  }
};

export const getEmployees = async (_req, res) => {
  try {
    const employees = await Employee.find().sort({ name: 1 });
    return res.json(employees);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch employees", error: error.message });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const name = normalizeName(decodeURIComponent(req.params.name || ""));

    if (!name) {
      return res.status(400).json({ message: "Employee name is required" });
    }

    const deleted = await Employee.findOneAndDelete({ nameKey: name.toLowerCase() });

    if (!deleted) {
      return res.status(404).json({ message: "Employee not found" });
    }

    return res.json({ message: "Employee deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete employee", error: error.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const oldName = normalizeName(decodeURIComponent(req.params.name || ""));

    if (!oldName) {
      return res.status(400).json({ message: "Employee name is required" });
    }

    const validated = validateEmployeePayload(req.body);
    if (validated.error) {
      return res.status(400).json({ message: validated.error });
    }

    // If name changed, check if new name already exists
    if (oldName.toLowerCase() !== validated.data.nameKey) {
      const existingEmployee = await Employee.findOne({ nameKey: validated.data.nameKey });
      if (existingEmployee) {
        return res.status(409).json({ message: "Employee with this name already exists" });
      }
    }

    const updated = await Employee.findOneAndUpdate(
      { nameKey: oldName.toLowerCase() },
      validated.data,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Employee not found" });
    }

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update employee", error: error.message });
  }
};

export const exportEmployeesToExcel = async (_req, res) => {
  try {
    const employees = await Employee.find().sort({ name: 1 });

    if (employees.length === 0) {
      return res.status(400).json({ message: "No employees to export" });
    }

    // Prepare data for Excel
    const data = employees.map((emp) => ({
      "Employee ID": emp.employeeId,
      "Name": emp.name,
      "Daily Rate": emp.dailyRate,
      "Created": new Date(emp.createdAt).toLocaleDateString(),
      "Updated": new Date(emp.updatedAt).toLocaleDateString(),
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");

    // Set column widths
    const columnWidths = [
      { wch: 20 }, // Employee ID
      { wch: 25 }, // Name
      { wch: 15 }, // Daily Rate
      { wch: 15 }, // Created
      { wch: 15 }, // Updated
    ];
    worksheet["!cols"] = columnWidths;

    // Generate file
    const fileName = `employees_${new Date().toISOString().split("T")[0]}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    return res.send(buffer);
  } catch (error) {
    return res.status(500).json({ message: "Failed to export employees", error: error.message });
  }
};

export const exportEmployeesToExcelLocal = async (_req, res) => {
  try {
    const employees = await Employee.find().sort({ name: 1 });

    if (employees.length === 0) {
      return res.status(400).json({ success: false, message: "No employees to export" });
    }

    const result = createEmployeesExcelLocally(employees);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to export employees", error: error.message });
  }
};
