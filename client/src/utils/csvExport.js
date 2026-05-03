// CSV Export utility functions

export const exportToCSV = (data, filename, headers) => {
  // Convert headers object to CSV header row
  const headerKeys = Object.keys(headers);
  const headerRow = headerKeys.map((key) => headers[key]).join(",");

  // Convert data rows to CSV rows
  const dataRows = data.map((item) =>
    headerKeys
      .map((key) => {
        const value = item[key];
        // Escape values that contain commas or quotes
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || "";
      })
      .join(",")
  );

  // Combine header and data rows
  const csv = [headerRow, ...dataRows].join("\n");

  // Create blob and download
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadAttendanceCSV = (rows, employees) => {
  // Create a map of daily rates
  const rateByName = new Map(employees.map((emp) => [emp.name, emp.dailyRate]));

  // Prepare data with calculated amounts
  const data = rows.map((row) => {
    const dailyRate = rateByName.get(row.name) || 0;
    const amount = ((Number(row.hours || 0) / 8) * Number(dailyRate)).toFixed(2);

    return {
      date: row.date,
      name: row.name || "Unknown",
      hours: row.hours,
      location: row.location,
      dailyRate: dailyRate,
      amount: `₹${amount}`,
    };
  });

  const headers = {
    date: "Date",
    name: "Employee Name",
    hours: "Hours Worked",
    location: "Location",
    dailyRate: "Daily Rate (₹)",
    amount: "Amount (₹)",
  };

  const today = new Date().toISOString().slice(0, 10);
  exportToCSV(data, `attendance_${today}.csv`, headers);
};

export const downloadEmployeesCSV = (employees) => {
  const data = employees.map((emp) => ({
    name: emp.name,
    dailyRate: emp.dailyRate,
  }));

  const headers = {
    name: "Employee Name",
    dailyRate: "Daily Rate (₹)",
  };

  const today = new Date().toISOString().slice(0, 10);
  exportToCSV(data, `employees_${today}.csv`, headers);
  };

  export const downloadEmployeesExcel = async () => {
    try {
      const response = await fetch("/api/employees/export/excel");
      if (!response.ok) {
        throw new Error("Failed to download employees Excel file");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `employees_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading employees Excel:", error);
      alert("Failed to download Excel file");
    }
  };

  export const downloadAttendanceExcel = async () => {
    try {
      const response = await fetch("/api/attendance/export/excel");
      if (!response.ok) {
        throw new Error("Failed to download attendance Excel file");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `attendance_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading attendance Excel:", error);
      alert("Failed to download Excel file");
    }
};
// Save Attendance to Local Folder (Local Development Only)
export const saveAttendanceExcelLocal = async () => {
  try {
    const response = await fetch("/api/attendance/export/excel-local");
    if (!response.ok) {
      throw new Error("Failed to save attendance Excel file locally");
    }
    const data = await response.json();
    if (data.success) {
      alert(`✅ Attendance Excel file saved to local folder!\n\nPath: ${data.filePath}`);
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error("Error saving attendance Excel:", error);
    alert("⚠️ Only works in Local Development.\n\nFor Vercel/Live: Use Excel Download instead.\n\nError: " + error.message);
  }
};

// Save Employees to Local Folder (Local Development Only)
export const saveEmployeesExcelLocal = async () => {
  try {
    const response = await fetch("/api/employees/export/excel-local");
    if (!response.ok) {
      throw new Error("Failed to save employees Excel file locally");
    }
    const data = await response.json();
    if (data.success) {
      alert(`✅ Employees Excel file saved to local folder!\n\nPath: ${data.filePath}`);
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error("Error saving employees Excel:", error);
    alert("⚠️ Only works in Local Development.\n\nFor Vercel/Live: Use Excel Download instead.\n\nError: " + error.message);
  }
};