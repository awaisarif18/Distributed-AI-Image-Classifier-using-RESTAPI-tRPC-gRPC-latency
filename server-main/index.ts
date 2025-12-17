// server-main/index.ts
import express from "express";
import cors from "cors";
import multer from "multer";
import { initTRPC } from "@trpc/server";
import * as trpcExpress from "@trpc/server/adapters/express";
import { z } from "zod";
import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

// --- SETUP ---
const app = express();
const upload = multer({ storage: multer.memoryStorage() }); // Store files in RAM

app.use(cors());
app.use(express.json({ limit: "50mb" })); // Allow large base64 strings for tRPC

// --- 1. REST API ENDPOINT ---
// Task: Receive file, mock process it locally, return JSON
app.post("/api/rest/upload", upload.single("image"), (req, res) => {
  const start = performance.now();

  // REST usually processes locally or calls another API via HTTP.
  // We will simulate local processing here.
  const labels = ["Cat", "Dog", "Car", "Building"];
  const result = {
    label: labels[Math.floor(Math.random() * labels.length)],
    confidence: 0.85,
  };

  const end = performance.now();
  res.json({ ...result, timeTaken: (end - start).toFixed(2) });
});

// --- 2. tRPC ROUTER ---
// Task: Receive Base64 string, process locally, return JSON
const t = initTRPC.create();
const router = t.router;
const publicProcedure = t.procedure;

const appRouter = router({
  uploadImage: publicProcedure
    .input(z.object({ imageBase64: z.string() }))
    .mutation(({ input }) => {
      const start = performance.now();

      // Mock processing for tRPC
      const result = { label: "tRPC_Result", confidence: 0.92 };

      const end = performance.now();
      return { ...result, timeTaken: (end - start).toFixed(2) };
    }),
});

// Enable tRPC on express
app.use("/trpc", trpcExpress.createExpressMiddleware({ router: appRouter }));

// --- 3. gRPC CLIENT (The Bridge to Microservice B) ---
// Load the shared proto file
const PROTO_PATH = path.join(__dirname, "../protos/image.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const imageProto = (grpc.loadPackageDefinition(packageDefinition) as any).image;

// --- SMART CONNECTION LOGIC (UPDATED FOR CLOUD) ---
// 1. Get URL from Env or default to local
const rawServiceUrl = process.env.AI_SERVICE_URL || "localhost:50051";

// 2. Determine if we are secure (Cloud) or insecure (Local)
// Render URLs usually contain 'onrender.com' or start with 'https'
const isSecure =
  rawServiceUrl.includes("onrender.com") || rawServiceUrl.includes("https");

// 3. Create Credentials
const credentials = isSecure
  ? grpc.credentials.createSsl() // Use SSL for Cloud (Render)
  : grpc.credentials.createInsecure(); // Use Insecure for Localhost

// 4. Clean the URL (gRPC does not like 'https://' prefix in the connection string)
const target = rawServiceUrl.replace("https://", "").replace("http://", "");

console.log(`🔌 Connecting to AI Service at: ${target} [Secure: ${isSecure}]`);

// Connect to Microservice B
const grpcClient = new imageProto.ImageClassifier(target, credentials);

app.post("/api/grpc-gateway/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).send("No file");

  const start = performance.now();

  // Call the gRPC Service
  // We pass the buffer directly!
  grpcClient.UploadImage(
    {
      imageData: req.file.buffer,
      filename: req.file.originalname,
    },
    (err: any, response: any) => {
      const end = performance.now();

      if (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
      }

      // Send the gRPC response back to the frontend
      res.json({
        ...response,
        method: "gRPC Microservice",
        timeTaken: (end - start).toFixed(2),
      });
    }
  );
});

// --- START SERVER ---
const PORT = process.env.PORT || 4000; // Use Cloud PORT or local 4000
app.listen(PORT, () =>
  console.log(
    `🚀 API Gateway (REST + tRPC) running on http://localhost:${PORT}`
  )
);

// Export type for the client to use
export type AppRouter = typeof appRouter;
