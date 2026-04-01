import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
});

export const fetchEmployees = async () => {
  const { data } = await api.get("/employees");
  return data;
};

export const createEmployee = async (payload) => {
  const { data } = await api.post("/employees", payload);
  return data;
};

export const removeEmployee = async (name) => {
  const encodedName = encodeURIComponent(name);
  const { data } = await api.delete(`/employees/by-name/${encodedName}`);
  return data;
};

export const updateEmployee = async (oldName, payload) => {
  const encodedName = encodeURIComponent(oldName);
  const { data } = await api.put(`/employees/by-name/${encodedName}`, payload);
  return data;
};

export const fetchAttendance = async () => {
  const { data } = await api.get("/attendance");

  return data;
};


export const createAttendance = async (entry) => {
  const { data } = await api.post("/attendance/bulk", { attendanceList: [entry] });
  return data;
};

export const updateAttendance = async (rowNum, entry) => {
  const { data } = await api.put(`/attendance/${rowNum}`, entry);
  return data;
};

export const removeAttendance = async (rowNum) => {
  const { data } = await api.delete(`/attendance/${rowNum}`);
  return data;
};
