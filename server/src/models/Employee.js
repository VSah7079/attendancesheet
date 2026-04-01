import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      default: () => `EMP-${new mongoose.Types.ObjectId().toString()}`,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    nameKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      immutable: true,
    },
    dailyRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100000,
    },
  },
  { timestamps: true }
);

export const Employee = mongoose.model("Employee", employeeSchema);
