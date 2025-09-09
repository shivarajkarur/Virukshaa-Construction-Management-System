import mongoose, { ConnectOptions } from "mongoose";

interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // Prevent type error on global object in strict mode
  // eslint-disable-next-line no-var
  var mongoose: CachedConnection | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("❌ MONGODB_URI is not defined in environment variables.");
}

let cached: CachedConnection = global.mongoose ?? { conn: null, promise: null };

export default async function connectToDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    console.log("✅ Using cached DB connection");
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: ConnectOptions = {
      bufferCommands: false,
      dbName: "construction-management",
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log("✅ DB connected successfully");
        return mongooseInstance;
      })
      .catch((err) => {
        console.error("❌ MongoDB connection error:", err);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;

    const connectionState = mongoose.connection.readyState;
    const states: Record<number, string> = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    console.log(`📶 MongoDB status: ${states[connectionState]}`);

    mongoose.connection.on("connected", () => {
      console.log(`🧠 Connected to DB: ${mongoose.connection.db?.databaseName}`);
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ DB Error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ DB Disconnected");
    });

    return cached.conn;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
}

// Assign to global for dev hot-reload safety
if (typeof global !== "undefined") {
  global.mongoose = cached;
}
