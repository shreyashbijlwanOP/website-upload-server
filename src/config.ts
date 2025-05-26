import dotenv from "dotenv";
dotenv.config();
const config = {
  port: process.env.PORT || 3000,
  dbUrl: process.env.DB_URL || "mongodb://localhost:27017/",
  dbUrlProd: process.env.DB_URL_PROD,
  dbNameProd: process.env.DB_NAME_PROD,
  getDbUrl(): string {
    return process.env.NODE_ENV === "production" && this.dbUrlProd
      ? this.dbUrlProd
      : this.dbUrl;
  },
  getDbName(): string {
    return process.env.NODE_ENV === "production" && this.dbNameProd
      ? this.dbNameProd
      : "school-uploads";
  },
  imagekitPublicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
  imagekitPrivateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  imagekitUrlEndpoint:
    process.env.IMAGEKIT_URL_ENDPOINT ||
    "https://ik.imagekit.io/your_imagekit_id",
  imagekitId: process.env.IMAGE_KIT_ID || "your_imagekit_id",
  jwtSecret: process.env.JWT_SECRET || "change_this_secret",
  loginUser: process.env.loginUser,
  loginPassword: process.env.loginPassword,
  corsOrigin:
    process.env.NODE_ENV === "production" ? process.env.corsOrigin : "*",
};

export default config;
