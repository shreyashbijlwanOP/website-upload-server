import dontenv from "dotenv";
import express from "express";
import config from "./config";
import { connectToDB, parseQuery } from "./utils";
import ImageKit = require("imagekit");
import { loginMiddleware } from "./loginMiddleware";
import morgan from "morgan";
import jwt from "jsonwebtoken";
import { EventModel, ImageURL } from "./model";
import qs from "qs";
import cors from "cors";

dontenv.config();

connectToDB();
const app = express();

app.use(
  cors({
    origin: config.corsOrigin || "*",
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint:
    process.env.IMAGEKIT_URL_ENDPOINT ||
    "https://ik.imagekit.io/your_imagekit_id",
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ message: "Username and password are required" });
    return;
  }
  if (username !== config.loginUser || password !== config.loginPassword) {
    res.status(400).json({ message: "Invalid username or password" });
    return;
  }
  const token = jwt.sign({ username }, config.jwtSecret, { expiresIn: "1d" });
  res.json({ token });
});

app.get("/api/auth/upload", loginMiddleware, (req, res) => {
  const { token, expire, signature } = imagekit.getAuthenticationParameters();
  res.send({
    token,
    expire,
    signature,
    publicKey: config.imagekitPublicKey,
  });
});

app.post("/api/create-event", loginMiddleware, async (req, res) => {
  const { title, eventName } = req.body;
  if (!title || !eventName) {
    res.status(400).json({ message: "All fields are required" });
    return;
  }

  const result = await EventModel.create({ title, eventName });
  if (!result) {
    res.status(500).json({ message: "Failed to create event" });
    return;
  }

  res.status(201).json({
    message: "Event created successfully",
    event: result.toObject(),
  });
  return;
});

app.put("/api/update-event/:id", loginMiddleware, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ message: "Event ID is required" });
    return;
  }
  req.body;
  const result = await EventModel.findByIdAndUpdate(id, req.body, {
    new: true,
  });
  if (!result) {
    res.status(404).json({ message: "Event not found" });
    return;
  }

  res.json({
    message: "Event updated successfully",
    event: result.toObject(),
  });
  return;
});

app.get("/api/events/:id", loginMiddleware, async (req, res) => {
  const result = await EventModel.findById(req.params.id).lean().exec();
  if (!result) {
    res.status(404).json({ message: "event not found" });
    return;
  }
  res.status(200).json({ data: result });
  return;
});

app.get("/api/:event/images", loginMiddleware, async (req, res) => {
  const { event } = req.params;
  if (!event) {
    res.status(400).json({ message: "Event ID is required" });
    return;
  }
  const images = await ImageURL.find({ event })
    .sort({ createdAt: -1 })
    .lean()
    .exec();
  res.json({ data: images });
  return;
});

// For Event and Images Public URLs

app.get("/api/images", async (req, res) => {
  const p = qs.parse(qs.stringify(req.query), {
    ignoreQueryPrefix: true,
    depth: Infinity, // Increase depth to handle nested structures
    allowDots: true, // Allow dot notation for nested objects
    arrayLimit: Infinity,
  });
  const query = parseQuery(p.filter || {});
  const images = await ImageURL.find(query)
    .sort({ createdAt: -1 })
    .lean()
    .exec();
  res.json(images);
  return;
});

app.get("/api/events", async (req, res) => {
  const p = qs.parse(qs.stringify(req.query), {
    ignoreQueryPrefix: true,
    depth: Infinity, // Increase depth to handle nested structures
    allowDots: true, // Allow dot notation for nested objects
    arrayLimit: Infinity,
  });
  const query = parseQuery(p.filter || {});
  const events = await EventModel.find(query).sort({ createdAt: -1 });
  res.json(events);
});

// Ends here

app.post("/api/images", loginMiddleware, async (req, res) => {
  const image = await ImageURL.create(req.body);
  res.status(201).json({
    message: "Image saved successfully",
    image: image.toObject(),
  });
  return;
});

app.get("/api/delete-image", loginMiddleware, async (req, res) => {
  console.log("Delete image request received:", req.query);
  const { imageId: id, fileId } = req.query;

  if (!id) {
    res.status(400).json({ message: "Image ID or file ID is required" });
    return;
  }
  if (!fileId) {
    res.status(400).json({ message: "File ID is required" });
    return;
  }
  try {
    await imagekit.deleteFile(fileId as string);
  } catch (error) {
    console.error("Error deleting file from ImageKit:", error);
    res.status(500).json({ message: "Failed to delete file from ImageKit" });
    return;
  }

  const result = await ImageURL.deleteOne({ _id: id });
  if (result.deletedCount === 0) {
    res.status(404).json({ message: "Image not found" });
    return;
  }
  res.json({ message: "Image deleted successfully" });
});

app.delete("api/events/:id/images", loginMiddleware, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ message: "Event ID is required" });
    return;
  }
  const result = await ImageURL.deleteMany({
    event: id,
    _id: { $in: req.body.imageIds },
  });
  if (result.deletedCount === 0) {
    res.status(404).json({ message: "Event not found" });
    return;
  }
  res.json({ message: "Event deleted successfully" });
});

app.delete("/api/delete-event/:id", loginMiddleware, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ message: "Event ID is required" });
    return;
  }
  const result = await EventModel.findByIdAndDelete(id);
  if (!result) {
    res.status(404).json({ message: "Event not found" });
    return;
  }
  res.json({ message: "Event deleted successfully" });
});

// Count API

app.get("/api/event/count", loginMiddleware, async (req, res) => {
  const count = await EventModel.countDocuments();
  res.json({ count });
});

app.get("/api/image/count", loginMiddleware, async (req, res) => {
  const count = await ImageURL.countDocuments();
  res.json({ count });
});

app.listen(config.port, () => {
  console.log(`Server is running at http://localhost:${config.port}`);
});
