import { Attendance } from "../models/Attendance.js";
import { Employee } from "../models/Employee.js";

const sortByDateDesc = (a, b) => {
  const dateA = new Date(a.date).getTime();
  const dateB = new Date(b.date).getTime();
  if (dateA !== dateB) return dateB - dateA;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
};

const formatDateDMY = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const parseDateInput = (value) => {
  if (!value) return null;
  if (typeof value !== "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const trimmed = value.trim();
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    const parsed = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const match = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    const parsed = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toSheetStyleRow = (doc, index) => ({
  rowNum: index + 2,
  date: formatDateDMY(doc.date),
  name: doc.name,
  hours: Number(doc.hours),
  location: doc.location,
});

const getSortedRows = async () => {
  const rows = await Attendance.find().lean();
  return rows.sort(sortByDateDesc);
};

const normalizeSpaces = (value) => String(value || "").trim().replace(/\s+/g, " ");

const normalizeName = (value) => normalizeSpaces(value);

const normalizeLocation = (value) => normalizeSpaces(value);

const getAttendanceKey = (name, date) => `${name.toLowerCase()}|${new Date(date).toISOString().slice(0, 10)}`;

const validateAttendanceItem = (item) => {
  const name = normalizeName(item?.name);
  const date = parseDateInput(item?.date);
  const hours = Number(item?.hours);
  const location = normalizeLocation(item?.location);

  if (!name || name.length < 2 || name.length > 60) {
    return { error: "name must be between 2 and 60 characters" };
  }

  if (!/^[a-zA-Z\s.'-]+$/.test(name)) {
    return { error: "name can contain only letters, spaces, dots, apostrophes, and hyphens" };
  }

  if (!date) {
    return { error: "valid date is required" };
  }

  if (!Number.isFinite(hours) || hours <= 0 || hours > 24) {
    return { error: "hours must be a number between 0 and 24" };
  }

  if (!location || location.length < 2 || location.length > 80) {
    return { error: "location must be between 2 and 80 characters" };
  }

  return {
    data: {
      name,
      date,
      hours,
      location,
    },
  };
};

export const createAttendances = async (req, res) => {
  try {
    const { attendanceList } = req.body;

    if (!Array.isArray(attendanceList) || attendanceList.length === 0) {
      return res.status(400).json({ message: "attendanceList must be a non-empty array" });
    }

    const docs = [];
    for (let i = 0; i < attendanceList.length; i += 1) {
      const validated = validateAttendanceItem(attendanceList[i]);
      if (validated.error) {
        return res.status(400).json({ message: `Item ${i + 1}: ${validated.error}` });
      }
      docs.push(validated.data);
    }

    const duplicateInPayload = new Set();
    for (const doc of docs) {
      const key = getAttendanceKey(doc.name, doc.date);
      if (duplicateInPayload.has(key)) {
        return res.status(409).json({ message: "Duplicate attendance in request for same employee and date" });
      }
      duplicateInPayload.add(key);
    }

    const employeeNames = [...new Set(docs.map((doc) => doc.name.toLowerCase()))];
    const matchedEmployees = await Employee.find({ nameKey: { $in: employeeNames } })
      .select("nameKey")
      .lean();
    const existingEmployeeKeys = new Set(matchedEmployees.map((emp) => emp.nameKey));
    const unknownEmployee = employeeNames.find((nameKey) => !existingEmployeeKeys.has(nameKey));
    if (unknownEmployee) {
      return res.status(400).json({ message: "Attendance contains unknown employee" });
    }

    const existingAttendance = await Attendance.find({
      $or: docs.map((doc) => ({ name: doc.name, date: doc.date })),
    })
      .select("_id")
      .lean();

    if (existingAttendance.length > 0) {
      return res.status(409).json({ message: "Attendance for this employee and date already exists" });
    }

    await Attendance.insertMany(docs);
    return res.status(201).json({ message: "Attendance records added!" });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Duplicate attendance detected for same employee and date" });
    }
    return res.status(500).json({ message: "Failed to add attendance", error: error.message });
  }
};

export const getAttendances = async (_req, res) => {
  try {
    const rows = await getSortedRows();
    const response = rows.map(toSheetStyleRow);

    return res.json(response);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch attendance", error: error.message });
  }
};

export const updateAttendance = async (req, res) => {
  try {
    const rowNum = Number(req.params.rowNum);
    if (!rowNum || rowNum < 2) {
      return res.status(400).json({ message: "Valid row number is required" });
    }

    const rows = await getSortedRows();
    const target = rows[rowNum - 2];

    if (!target) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    const validated = validateAttendanceItem(req.body);
    if (validated.error) {
      return res.status(400).json({ message: validated.error });
    }

    const updatePayload = validated.data;

    const employeeExists = await Employee.exists({ nameKey: updatePayload.name.toLowerCase() });
    if (!employeeExists) {
      return res.status(400).json({ message: "Unknown employee in attendance update" });
    }

    const duplicate = await Attendance.findOne({
      _id: { $ne: target._id },
      name: updatePayload.name,
      date: updatePayload.date,
    })
      .select("_id")
      .lean();

    if (duplicate) {
      return res.status(409).json({ message: "Attendance for this employee and date already exists" });
    }

    const updated = await Attendance.findByIdAndUpdate(target._id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    return res.json({ message: "Attendance updated successfully!" });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Duplicate attendance detected for same employee and date" });
    }
    return res.status(500).json({ message: "Failed to update attendance", error: error.message });
  }
};

export const deleteAttendance = async (req, res) => {
  try {
    const rowNum = Number(req.params.rowNum);
    if (!rowNum || rowNum < 2) {
      return res.status(400).json({ message: "Valid row number is required" });
    }

    const rows = await getSortedRows();
    const target = rows[rowNum - 2];

    if (!target) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    const deleted = await Attendance.findByIdAndDelete(target._id);

    if (!deleted) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    return res.json({ message: "Attendance deleted successfully!" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete attendance", error: error.message });
  }
};
