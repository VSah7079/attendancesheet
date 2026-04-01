import { useState } from "react";
import { downloadEmployeesCSV } from "../utils/csvExport";

const EmployeePanel = ({ employees, onAdd, onUpdate, onDelete }) => {
  const [form, setForm] = useState({ name: "", dailyRate: "" });
  const [editingName, setEditingName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;

    const cleanName = form.name.trim().replace(/\s+/g, " ");
    const rate = Number(form.dailyRate);
    if (cleanName.length < 2 || cleanName.length > 60) {
      setFormError("Name must be between 2 and 60 characters");
      return;
    }
    if (!/^[a-zA-Z\s.'-]+$/.test(cleanName)) {
      setFormError("Name can contain only letters, spaces, dots, apostrophes, and hyphens");
      return;
    }
    if (!Number.isFinite(rate) || rate < 0 || rate > 100000) {
      setFormError("Daily rate must be between 0 and 100000");
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    try {
      if (editingName) {
        await onUpdate(editingName, { name: cleanName, dailyRate: rate });
        setEditingName("");
      } else {
        await onAdd({ name: cleanName, dailyRate: rate });
      }
      setForm({ name: "", dailyRate: "" });
    } catch (error) {
      setFormError(error?.response?.data?.message || "Failed to save employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (emp) => {
    setEditingName(emp.name);
    setForm({ name: emp.name, dailyRate: String(emp.dailyRate) });
  };

  return (
    <section className="rounded-xl bg-white border border-gray-200 p-4 sm:p-6 lg:p-7 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xl">👥</span>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Team Setup</h2>
        </div>
        <button
          onClick={() => downloadEmployeesCSV(employees)}
          disabled={employees.length === 0}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition"
        >
          📥 Export
        </button>
      </div>
      <p className="mt-1 mb-4 sm:mb-5 text-xs sm:text-sm text-gray-600">Add team members and set their daily rates.</p>

      <div className="mb-6 p-4 bg-linear-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
        <input
          type="text"
          placeholder="🔍 Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border-2 border-purple-300 bg-white px-4 py-3 text-sm text-gray-900 font-medium shadow-md outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200 placeholder:text-gray-500"
        />
      </div>

      <form className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4" onSubmit={handleSubmit}>
        {formError && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {formError}
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold text-gray-700">👤 Full Name</label>
            <input
              className="rounded-lg border-2 border-gray-300 bg-linear-to-b from-purple-50 to-white px-4 py-2.5 text-sm text-gray-900 font-medium shadow-md outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200 placeholder:text-gray-500"
              required
              placeholder="e.g., John Doe"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold text-gray-700">💰 Daily Rate (₹)</label>
            <input
              className="rounded-lg border-2 border-gray-300 bg-linear-to-b from-green-50 to-white px-4 py-2.5 text-sm text-gray-900 font-medium shadow-md outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200 placeholder:text-gray-500"
              required
              type="number"
              min="0"
              step="0.01"
              placeholder="500"
              value={form.dailyRate}
              onChange={(e) => setForm((prev) => ({ ...prev, dailyRate: e.target.value }))}
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold text-gray-700">&nbsp;</label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md transition hover:shadow-lg h-full"
            >
              {isSubmitting ? "⏳ Processing..." : editingName ? "✅ Update Member" : "➕ Add Member"}
            </button>
          </div>
        </div>
      </form>

      <div className="rounded-lg border border-gray-200 md:hidden">
        {employees.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs sm:text-sm text-gray-500">No team members yet</p>
        ) : filteredEmployees.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs sm:text-sm text-gray-500">No employees match your search</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredEmployees.map((emp, index) => (
              <div key={`${emp.name}-${index}`} className="space-y-2 p-3 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">{emp.name}</p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">₹{emp.dailyRate} / day</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="rounded-lg bg-teal-600 hover:bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition hover:shadow-lg"
                      onClick={() => handleEdit(emp)}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="rounded-lg bg-red-600 hover:bg-red-700 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition hover:shadow-lg"
                      onClick={() => onDelete(emp.name)}
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-gray-200 md:block">
        <table className="min-w-125 w-full border-collapse text-xs sm:text-sm lg:text-base">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Daily Rate</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                  {searchTerm ? "No employees match your search" : "No team members added yet"}
                </td>
              </tr>
            ) : filteredEmployees.map((emp, index) => (
              <tr key={`${emp.name}-${index}`} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-semibold text-gray-900">{emp.name}</td>
                <td className="px-4 py-3 text-gray-700">₹{emp.dailyRate}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      className="rounded-lg bg-teal-600 hover:bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition hover:shadow-lg"
                      onClick={() => handleEdit(emp)}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="rounded-lg bg-red-600 hover:bg-red-700 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition hover:shadow-lg"
                      onClick={() => onDelete(emp.name)}
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default EmployeePanel;
