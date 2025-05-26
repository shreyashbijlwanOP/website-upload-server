import mongoose from "mongoose";
import config from "./config";

export function connectToDB() {
  const dbUrl = config.getDbUrl();
  const dbName = config.getDbName();
  mongoose
    .connect(dbUrl, {
      dbName,
    })
    .then((conn) => {
      console.log(
        `Connected to MongoDB: ${conn.connection.name} [${process.env.NODE_ENV}]`
      );
      conn.connection.on("connected", () => {
        console.log(
          `Connected to MongoDB: ${conn.connection.name} [${process.env.NODE_ENV}]`
        );
      });
    })
    .catch((err) => {
      console.error("Error connecting to MongoDB:", err);
    });
}

export function parseQuery(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(parseQuery);
  } else if (typeof obj === "object" && obj !== null) {
    const casted: { [key: string]: any } = {};
    for (const key in obj) {
      casted[key] = parseQuery(obj[key]);
    }
    return casted;
  } else if (typeof obj === "string") {
    if (obj === "true") return true;
    if (obj === "false") return false;
    if (obj === "null") return null;
    if (obj === "undefined") return undefined;
    // if (!isNaN(Number(obj)) && obj.trim() !== '') return Number(obj);
    const date = new Date(obj);
    if (!isNaN(date.getTime())) return date;
  }
  return obj;
}
