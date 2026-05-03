import XLSX from "xlsx";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync, mkdirSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create exports directory if it doesn't exist
const exportsDir = join(__dirname, "../../exports");
if (!existsSync(exportsDir)) {
  mkdirSync(exportsDir, { recursive: true });
}

/**
 * Create and save Excel file locally
 * @param {Array} data - Array of objects to export
 * @param {String} fileName - Name of the file (without .xlsx)
 * @param {String} sheetName - Name of the worksheet
 * @returns {Object} { filePath: string, success: boolean, message: string }
 */
export const createExcelLocally = (data, fileName, sheetName = "Data") => {
  try {
    if (!data || data.length === 0) {
      return {
        success: false,
        message: "No data provided",
        filePath: null,
      };
    }

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const fullFileName = `${fileName}_${timestamp}.xlsx`;
    const filePath = join(exportsDir, fullFileName);

    // Write to file
    XLSX.writeFile(workbook, filePath);

    return {
      success: true,
      message: "Excel file created successfully",
      filePath: filePath,
      fileName: fullFileName,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to create Excel file",
      error: error.message,
      filePath: null,
    };
  }
};

/**
 * Create Attendance Excel file locally
 * @param {Array} attendanceRecords - Attendance records
 * @param {Array} employees - Employee data for rates
 * @returns {Object} { filePath, success, message }
 */
export const createAttendanceExcelLocally = (attendanceRecords, employees) => {
  const rateByName = new Map(employees.map((emp) => [emp.name, emp.dailyRate]));

  const formatDateDMY = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const data = attendanceRecords
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((record) => {
      const dailyRate = rateByName.get(record.name) || 0;
      const amount = ((Number(record.hours || 0) / 8) * Number(dailyRate)).toFixed(2);

      return {
        "Date": formatDateDMY(record.date),
        "Employee Name": record.name,
        "Hours": Number(record.hours),
        "Location": record.location,
        "Daily Rate": dailyRate,
        "Amount": amount,
      };
    });

  return createExcelLocally(data, "attendance", "Attendance");
};

/**
 * Create Employees Excel file locally
 * @param {Array} employees - Employee data
 * @returns {Object} { filePath, success, message }
 */
export const createEmployeesExcelLocally = (employees) => {
  const data = employees.map((emp) => ({
    "Employee ID": emp.employeeId,
    "Name": emp.name,
    "Daily Rate": emp.dailyRate,
    "Created": new Date(emp.createdAt).toLocaleDateString(),
    "Updated": new Date(emp.updatedAt).toLocaleDateString(),
  }));

  return createExcelLocally(data, "employees", "Employees");
};
