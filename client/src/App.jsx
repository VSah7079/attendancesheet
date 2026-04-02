import { useEffect, useState } from "react";
import AttendancePanel from "./components/AttendancePanel";
import EmployeePanel from "./components/EmployeePanel";
import {
  createAttendance,
  createEmployee,
  fetchAttendance,
  fetchEmployees,
  removeAttendance,
  removeEmployee,
  updateAttendance,
  updateEmployee,
} from "./services/api";

const App = () => {
  const [employees, setEmployees] = useState([]);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const formatLoadError = (label, err) => {
    const status = err?.response?.status;
    const serverMessage = err?.response?.data?.message;

    if (status === 401) {
      return `${label} API unauthorized (401). Check Vercel Deployment Protection/Auth on backend.`;
    }

    if (status === 500) {
      return `${label} API failed (500). ${serverMessage || "Check backend logs and MongoDB URI."}`;
    }

    if (err?.request && !err?.response) {
      return `${label} API unreachable. Verify VITE_API_BASE_URL and backend deployment.`;
    }

    return serverMessage || `${label} data load failed`;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      setError("");
      const [employeeResult, attendanceResult] = await Promise.allSettled([
        fetchEmployees(),
        fetchAttendance(),
      ]);

      const errors = [];

      if (employeeResult.status === "fulfilled") {
        setEmployees(employeeResult.value);
      } else {
        errors.push(formatLoadError("Employees", employeeResult.reason));
      }

      if (attendanceResult.status === "fulfilled") {
        setAttendanceRows(attendanceResult.value);
      } else {
        errors.push(formatLoadError("Attendance", attendanceResult.reason));
      }

      if (errors.length > 0) {
        setError(errors.join(" | "));
      }
    } catch (err) {
      setError(formatLoadError("Dashboard", err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateEmployee = async (payload) => {
    await createEmployee(payload);
    await loadData();
  };

  const handleDeleteEmployee = async (name) => {
    await removeEmployee(name);
    await loadData();
  };

  const handleUpdateEmployee = async (oldName, payload) => {
    await updateEmployee(oldName, payload);
    await loadData();
  };

  const handleCreateAttendance = async (payload) => {
    await createAttendance(payload);
    await loadData();
  };

  const handleUpdateAttendance = async (rowNum, payload) => {
    await updateAttendance(rowNum, payload);
    await loadData();
  };

  const handleDeleteAttendance = async (rowNum) => {
    await removeAttendance(rowNum);
    await loadData();
  };

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-8 text-gray-900 sm:px-6 sm:py-10 lg:px-8">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">📋</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 lg:text-4xl">
            Attendance Manager
          </h1>
        </div>
        <p className="mt-3 max-w-3xl text-sm sm:text-base leading-relaxed text-gray-600 lg:text-base">
          Streamlined team management and attendance tracking in one dashboard.
        </p>
      </header>

      {loading && (
        <p className="my-6 sm:my-8 rounded-lg border border-blue-200 bg-blue-50 px-4 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-medium text-blue-700 flex items-center gap-3">
          <span className="animate-spin">⌛</span>
          Loading data...
        </p>
      )}
      {error && (
        <p className="my-6 sm:my-8 rounded-lg border border-red-200 bg-red-50 px-4 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-medium text-red-700 flex items-center gap-3">
          <span>❌</span>
          {error}
        </p>
      )}

      {!loading && (
        <main className="mt-8 sm:mt-10 flex flex-col gap-8 xl:gap-12">
          <EmployeePanel employees={employees} onAdd={handleCreateEmployee} onUpdate={handleUpdateEmployee} onDelete={handleDeleteEmployee} />
          <AttendancePanel
            employees={employees}
            rows={attendanceRows}
            onCreate={handleCreateAttendance}
            onUpdate={handleUpdateAttendance}
            onDelete={handleDeleteAttendance}
          />
        </main>
      )}
    </div>
  );
};

export default App;
