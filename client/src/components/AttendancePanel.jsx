import { useMemo, useState } from "react";
import { downloadAttendanceCSV } from "../utils/csvExport";

const getDateInput = (value) => {
  if (!value) return "";

  const dmyMatch = String(value).match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const AttendancePanel = ({ employees, rows, onCreate, onUpdate, onDelete }) => {
  const [form, setForm] = useState({ name: "", date: "", hours: "", location: "" });
  const [editingRowNum, setEditingRowNum] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const filteredRows = rows.filter(row =>
    row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.date.includes(searchTerm)
  );

  const disabled = employees.length === 0;
  const rateByName = useMemo(
    () => new Map(employees.map((employee) => [employee.name, Number(employee.dailyRate || 0)])),
    [employees]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;

    const cleanLocation = form.location.trim().replace(/\s+/g, " ");
    const hours = Number(form.hours);
    if (!form.name.trim()) {
      setFormError("Please select an employee");
      return;
    }
    if (!form.date) {
      setFormError("Date is required");
      return;
    }
    if (!Number.isFinite(hours) || hours <= 0 || hours > 24) {
      setFormError("Hours must be between 0 and 24");
      return;
    }
    if (cleanLocation.length < 2 || cleanLocation.length > 80) {
      setFormError("Location must be between 2 and 80 characters");
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    try {
      const payload = {
        name: form.name,
        date: form.date,
        hours,
        location: cleanLocation,
      };

      if (editingRowNum) {
        await onUpdate(editingRowNum, payload);
        setEditingRowNum("");
      } else {
        await onCreate(payload);
      }

      setForm({ name: "", date: "", hours: "", location: "" });
    } catch (error) {
      setFormError(error?.response?.data?.message || "Failed to save attendance");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalHours = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.hours || 0), 0),
    [rows]
  );

  return (
    <section className="rounded-xl bg-white border border-gray-200 p-5 sm:p-7 lg:p-8 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📊</span>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Attendance Log</h2>
        </div>
        <button
          onClick={() => downloadAttendanceCSV(rows, employees)}
          disabled={rows.length === 0}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition"
        >
          📥 Export CSV
        </button>
      </div>
      <p className="mt-2 mb-6 sm:mb-7 text-xs sm:text-sm text-gray-600">Track entries with location and automatic payment calculation.</p>

      <form className="mb-6 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4" onSubmit={handleSubmit}>
        {formError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {formError}
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold text-gray-700">👤 Employee</label>
            <select
              className="rounded-lg border-2 border-gray-300 bg-gradient-to-b from-teal-50 to-white px-4 py-2.5 text-sm text-gray-900 font-medium shadow-md outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
              disabled={disabled}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            >
              <option value="">Select employee</option>
              {employees.map((emp) => (
                <option key={emp.name} value={emp.name}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold text-gray-700">📅 Date</label>
            <input
              className="rounded-lg border-2 border-gray-300 bg-gradient-to-b from-cyan-50 to-white px-4 py-2.5 text-sm text-gray-900 font-medium shadow-md outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
              required
              type="date"
              value={form.date}
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold text-gray-700">⏱️ Hours</label>
            <input
              className="rounded-lg border-2 border-gray-300 bg-gradient-to-b from-amber-50 to-white px-4 py-2.5 text-sm text-gray-900 font-medium shadow-md outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200 placeholder:text-gray-500"
              required
              type="number"
              min="0"
              step="0.5"
              placeholder="0.5 - 8"
              value={form.hours}
              onChange={(e) => setForm((prev) => ({ ...prev, hours: e.target.value }))}
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold text-gray-700">📍 Location</label>
            <input
              className="rounded-lg border-2 border-gray-300 bg-gradient-to-b from-rose-50 to-white px-4 py-2.5 text-sm text-gray-900 font-medium shadow-md outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200 placeholder:text-gray-500"
              required
              placeholder="e.g., Office"
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
            />
          </div>

          <div className="flex flex-col sm:col-span-2 lg:col-span-1">
            <label className="mb-2 text-xs font-bold text-gray-700">&nbsp;</label>
            <button
              type="submit"
              disabled={disabled || isSubmitting}
              className="rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md transition hover:shadow-lg h-full"
            >
              {isSubmitting ? "⏳ Processing..." : editingRowNum ? "✅ Update" : "➕ Add Entry"}
            </button>
          </div>
        </div>
      </form>

      <div className="mb-6 space-y-3 sm:space-y-0">
        <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200">
          <input
            type="text"
            placeholder="🔍 Search by name, location, or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border-2 border-blue-300 bg-white px-4 py-3 text-sm text-gray-900 font-medium shadow-md outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200 placeholder:text-gray-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:gap-4">
          <div className="rounded-lg border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-teal-100 px-4 py-3 shadow-sm">
            <p className="text-xs text-teal-700 font-bold mb-1">📊 Entries</p>
            <p className="text-xl sm:text-2xl font-bold text-teal-700">{rows.length}</p>
          </div>
          <div className="rounded-lg border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-cyan-100 px-4 py-3 shadow-sm">
            <p className="text-xs text-cyan-700 font-bold mb-1">⏱️ Hours</p>
            <p className="text-xl sm:text-2xl font-bold text-cyan-700">{totalHours}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 sm:hidden">
        {rows.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs sm:text-sm text-gray-500">No entries yet</p>
        ) : filteredRows.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs sm:text-sm text-gray-500">No entries match your search</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredRows.map((row) => {
              const dailyRate = rateByName.get(row.name) || 0;
              const amount = ((Number(row.hours || 0) / 8) * Number(dailyRate)).toFixed(2);

              return (
                <div key={row.rowNum} className="space-y-1.5 p-3 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition">
                  <p className="flex justify-between">
                    <span className="text-gray-600">Date</span>
                    <span className="font-semibold text-gray-900">{row.date}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-600">Name</span>
                    <span className="font-semibold text-gray-900">{row.name || "Unknown"}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-600">Hours</span>
                    <span className="font-semibold text-gray-900">{row.hours}h</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-600">Location</span>
                    <span className="font-semibold text-gray-900">{row.location}</span>
                  </p>
                  <div className="border-t border-gray-200 pt-1.5 mt-1.5">
                    <p className="flex justify-between mb-2">
                      <span className="text-gray-600">Amount</span>
                      <span className="font-bold text-teal-600">₹{amount}</span>
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      className="flex-1 rounded-lg bg-gray-600 hover:bg-gray-700 px-2 py-1.5 text-xs font-semibold text-white shadow-sm transition"
                      onClick={() => {
                        setEditingRowNum(row.rowNum);
                        setForm({
                          name: row.name || "",
                          date: getDateInput(row.date),
                          hours: String(row.hours),
                          location: row.location,
                        });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 px-2 py-1.5 text-xs font-semibold text-white shadow-sm transition"
                      onClick={() => onDelete(row.rowNum)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-gray-200 sm:block">
        <table className="min-w-[640px] w-full border-collapse text-xs sm:text-sm lg:text-base">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Hours</th>
              <th className="px-4 py-3 text-left">Location</th>
              <th className="px-4 py-3 text-left" title="Calculated as (Hours ÷ 8) × Daily Rate">Amount 📊</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  {searchTerm ? "No entries match your search" : "No entries logged yet"}
                </td>
              </tr>
            ) : filteredRows.map((row) => {
              const dailyRate = rateByName.get(row.name) || 0;
              const amount = ((Number(row.hours || 0) / 8) * Number(dailyRate)).toFixed(2);

              return (
                <tr key={row.rowNum} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">{row.date}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{row.name || "Unknown"}</td>
                  <td className="px-4 py-3">{row.hours}h</td>
                  <td className="px-4 py-3">{row.location}</td>
                  <td className="px-4 py-3 font-semibold text-teal-600">₹{amount}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="rounded-lg bg-teal-600 hover:bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition hover:shadow-lg"
                        onClick={() => {
                          setEditingRowNum(row.rowNum);
                          setForm({
                            name: row.name || "",
                            date: getDateInput(row.date),
                            hours: String(row.hours),
                            location: row.location,
                          });
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="rounded-lg bg-red-600 hover:bg-red-700 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition hover:shadow-lg"
                        onClick={() => onDelete(row.rowNum)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AttendancePanel;
