const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

// CHANGED: Look for protos inside the current directory
const PROTO_PATH = path.join(__dirname, "./protos/image.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const imageProto = grpc.loadPackageDefinition(packageDefinition).image;

// --- Classification Logic (Same as before) ---
function classifyImage(call, callback) {
  console.log(`📨 Request received for file: ${call.request.filename}`);

  // Simulate AI processing time (e.g., 500ms)
  setTimeout(() => {
    const labels = ["Cat", "Dog", "Car", "Building", "Tree"];
    const randomLabel = labels[Math.floor(Math.random() * labels.length)];
    // Generate random confidence between 0.75 and 0.99
    const confidence = (Math.random() * (0.99 - 0.75) + 0.75).toFixed(2);

    console.log(`✅ Processed result: ${randomLabel} (${confidence})`);

    callback(null, {
      label: randomLabel,
      confidence: parseFloat(confidence),
    });
  }, 500);
}

// --- Main Server Setup ---
function main() {
  const server = new grpc.Server();
  server.addService(imageProto.ImageClassifier.service, {
    UploadImage: classifyImage,
  });

  // DOCKER/RENDER CONFIGURATION:
  // 1. Render will provide a PORT environment variable. Use it.
  const PORT = process.env.PORT || "50051";

  // 2. In Docker, we MUST bind to 0.0.0.0 (all interfaces), not localhost.
  const BIND_ADDRESS = `0.0.0.0:${PORT}`;

  console.log(`⏳ Attempting to bind gRPC server to ${BIND_ADDRESS}...`);

  server.bindAsync(
    BIND_ADDRESS,
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) {
        console.error("❌ FATAL ERROR: Failed to bind to port:", error);
        process.exit(1); // Exit so Docker knows it failed
      }

      // Note: newer grpc-js starts automatically, but start() is safe to call.
      try {
        server.start();
      } catch (e) {}

      console.log(`___________________________________________________`);
      console.log(`🚀 DOckerized AI Microservice listening on port ${port}`);
      console.log(`___________________________________________________`);
    }
  );
}

main();
