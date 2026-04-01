import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    attendanceId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      default: () => `ATT-${new mongoose.Types.ObjectId().toString()}`,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    date: {
      type: Date,
      required: true,
    },
    hours: {
      type: Number,
      required: true,
      min: 0,
      max: 24,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ name: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model("Attendance", attendanceSchema);
