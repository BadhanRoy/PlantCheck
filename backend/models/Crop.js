import mongoose from "mongoose";

const cropSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    cropName: {
      type: String,
      required: true,
      trim: true,
    },

    plantingDate: {
      type: Date,
      required: true,
    },

    growthStage: {
      type: String,
      default: "Seedling",
      trim: true,
    },

    soilType: {
      type: String,
      default: "Loamy",
      trim: true,
    },

    locationName: {
      type: String,
      default: "",
      trim: true,
    },

    latitude: {
      type: Number,
      default: null,
    },

    longitude: {
      type: Number,
      default: null,
    },

    lastWatered: {
      type: Date,
      default: null,
    },

    nextWatering: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

cropSchema.statics.findByUser = function (userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

cropSchema.statics.findById = function (cropId, userId) {
  const filter = { _id: cropId };

  if (userId) {
    filter.userId = userId;
  }

  return this.findOne(filter);
};

cropSchema.statics.update = function (cropId, userId, updates) {
  const filter = { _id: cropId };

  if (userId) {
    filter.userId = userId;
  }

  return this.findOneAndUpdate(filter, updates, { new: true });
};

cropSchema.statics.delete = function (cropId, userId) {
  const filter = { _id: cropId };

  if (userId) {
    filter.userId = userId;
  }

  return this.findOneAndDelete(filter);
};

cropSchema.statics.markWatered = function (cropId, userId, nextDate) {
  const filter = { _id: cropId };

  if (userId) {
    filter.userId = userId;
  }

  const lastWatered = new Date();
  const nextWatering = new Date(nextDate || lastWatered);

  return this.findOneAndUpdate(
    filter,
    {
      lastWatered,
      nextWatering,
    },
    { new: true }
  );
};

export const Crop = mongoose.model("Crop", cropSchema);
export default Crop;