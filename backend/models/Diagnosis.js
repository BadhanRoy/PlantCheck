import mongoose from "mongoose";

const diagnosisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    plantName: { type: String, required: true, trim: true },
    diagnosis: { type: String, required: true, trim: true },
    status: { type: String, required: true, trim: true },
    confidence: { type: Number, default: 0, min: 0, max: 100 },
    issues: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
    treatment: { type: mongoose.Schema.Types.Mixed, default: null },
    explainability: { type: mongoose.Schema.Types.Mixed, default: null },
    image: {
      fileId: { type: mongoose.Schema.Types.ObjectId, default: null },
      contentType: { type: String, default: null },
      filename: { type: String, default: null },
    },
  },
  { timestamps: true }
);

diagnosisSchema.index({ userId: 1, createdAt: -1 });

export const Diagnosis = mongoose.model("Diagnosis", diagnosisSchema);
export default Diagnosis;
