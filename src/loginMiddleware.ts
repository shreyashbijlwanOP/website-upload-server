import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "./config";
export function loginMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Example: check for a session or token in headers/cookies
  const token = req.headers["authorization"] || req.cookies?.token;
  try {
    var _decoded = jwt.verify(token, config.jwtSecret);
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: "Unauthorized: Invalid token" });
    return;
  }
  if (!token) {
    res.status(401).json({ message: "Unauthorized: Login required" });
    return;
  }
  // You can add token/session validation logic here
  next();
  return;
}
