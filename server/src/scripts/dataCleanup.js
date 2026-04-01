import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { Employee } from "../models/Employee.js";
import { Attendance } from "../models/Attendance.js";

dotenv.config();

const applyChanges = process.argv.includes("--apply");

const normalizeSpaces = (value) => String(value || "").trim().replace(/\s+/g, " ");
const normalizeName = (value) => normalizeSpaces(value);
const normalizeLocation = (value) => normalizeSpaces(value);
const normalizeDay = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const main = async () => {
  await connectDB();

  const employees = await Employee.find().sort({ createdAt: 1, _id: 1 });
  const keeperByNameKey = new Map();
  const employeeBulkOps = [];
  const duplicateEmployees = [];

  for (const emp of employees) {
    const cleanName = normalizeName(emp.name);
    const nameKey = cleanName.toLowerCase();

    if (!keeperByNameKey.has(nameKey)) {
      keeperByNameKey.set(nameKey, {
        _id: emp._id,
        name: cleanName,
      });

      const set = {};
      if (emp.name !== cleanName) set.name = cleanName;
      if (emp.nameKey !== nameKey) set.nameKey = nameKey;
      if (!emp.employeeId) set.employeeId = `EMP-${emp._id.toString()}`;

      if (Object.keys(set).length > 0) {
        employeeBulkOps.push({
          updateOne: {
            filter: { _id: emp._id },
            update: { $set: set },
          },
        });
      }
      continue;
    }

    duplicateEmployees.push({
      duplicateId: emp._id,
      duplicateName: emp.name,
      keeper: keeperByNameKey.get(nameKey),
    });
  }

  const attendanceOps = [];
  for (const dup of duplicateEmployees) {
    if (dup.duplicateName !== dup.keeper.name) {
      attendanceOps.push(
        Attendance.updateMany(
          { name: dup.duplicateName },
          { $set: { name: dup.keeper.name } }
        )
      );
    }
  }

  const attendances = await Attendance.find().sort({ createdAt: 1, _id: 1 });
  const attendanceBulkOps = [];
  const keeperByAttendanceKey = new Map();
  const duplicateAttendanceIds = [];

  for (const row of attendances) {
    const cleanName = normalizeName(row.name);
    const cleanLocation = normalizeLocation(row.location);
    const dayKey = normalizeDay(row.date);
    const dedupeKey = `${cleanName.toLowerCase()}|${dayKey}`;

    const set = {};
    if (!row.attendanceId) set.attendanceId = `ATT-${row._id.toString()}`;
    if (row.name !== cleanName) set.name = cleanName;
    if (row.location !== cleanLocation) set.location = cleanLocation;

    if (!keeperByAttendanceKey.has(dedupeKey)) {
      keeperByAttendanceKey.set(dedupeKey, row._id.toString());
      if (Object.keys(set).length > 0) {
        attendanceBulkOps.push({
          updateOne: {
            filter: { _id: row._id },
            update: { $set: set },
          },
        });
      }
      continue;
    }

    duplicateAttendanceIds.push(row._id);
  }

  console.log("Mode:", applyChanges ? "APPLY" : "DRY-RUN");
  console.log("Employees scanned:", employees.length);
  console.log("Attendance scanned:", attendances.length);
  console.log("Employee updates:", employeeBulkOps.length);
  console.log("Employee duplicates:", duplicateEmployees.length);
  console.log("Attendance remap ops:", attendanceOps.length);
  console.log("Attendance updates:", attendanceBulkOps.length);
  console.log("Attendance duplicates:", duplicateAttendanceIds.length);

  if (!applyChanges) {
    console.log("Dry-run complete. Re-run with --apply to persist changes.");
    return;
  }

  if (employeeBulkOps.length > 0) {
    await Employee.bulkWrite(employeeBulkOps);
  }

  if (attendanceOps.length > 0) {
    await Promise.all(attendanceOps);
  }

  if (duplicateEmployees.length > 0) {
    await Employee.deleteMany({
      _id: { $in: duplicateEmployees.map((item) => item.duplicateId) },
    });
  }

  if (attendanceBulkOps.length > 0) {
    await Attendance.bulkWrite(attendanceBulkOps);
  }

  if (duplicateAttendanceIds.length > 0) {
    await Attendance.deleteMany({ _id: { $in: duplicateAttendanceIds } });
  }

  console.log("Cleanup applied successfully.");
};

main()
  .catch((error) => {
    console.error("Cleanup failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
