import mongoose from "mongoose";

const cropJournalEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crop",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["watering", "observation", "treatment", "diagnosis"],
      default: "observation",
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    details: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

export const CropJournalEntry = mongoose.model("CropJournalEntry", cropJournalEntrySchema);
export default CropJournalEntry;
