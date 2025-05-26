import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    eventName: { type: String, required: true, unique: true },
  },
  { timestamps: true, versionKey: false }
);

const imagesSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    fileId: { type: String },
  },
  { versionKey: false }
);

export const EventModel = mongoose.model("Event", eventSchema);
export const ImageURL = mongoose.model("Image", imagesSchema);
