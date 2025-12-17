const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const PROTO_PATH = path.join(__dirname, "../protos/image.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const imageProto = grpc.loadPackageDefinition(packageDefinition).image;

// Mock Classification Logic
function classifyImage(call, callback) {
  console.log(
    `📨 Received request: ${call.request.filename} (${call.request.imageData.length} bytes)`
  );

  // Simulate AI processing delay (e.g., 500ms)
  setTimeout(() => {
    const labels = ["Cat", "Dog", "Car", "Building", "Tree"];
    const randomLabel = labels[Math.floor(Math.random() * labels.length)];
    const confidence = (Math.random() * (0.99 - 0.7) + 0.7).toFixed(2);

    console.log(`✅ Processed: ${randomLabel} (${confidence})`);

    callback(null, {
      label: randomLabel,
      confidence: parseFloat(confidence),
    });
  }, 500);
}

function main() {
  const server = new grpc.Server();
  server.addService(imageProto.ImageClassifier.service, {
    UploadImage: classifyImage,
  });

  // RENDER FIX: Use strict 0.0.0.0 and process.env.PORT
  const PORT = process.env.PORT || "50051";
  const BIND_ADDRESS = `0.0.0.0:${PORT}`;

  console.log(`⏳ Attempting to bind to ${BIND_ADDRESS}...`);

  server.bindAsync(
    BIND_ADDRESS,
    grpc.ServerCredentials.createInsecure(), // Render handles SSL termination externally
    (error, port) => {
      if (error) {
        console.error("❌ Failed to bind:", error);
        return;
      }

      // CRITICAL: Explicitly start the server (required in some setups)
      // Note: In newer grpc-js versions this is optional, but adding it is safer for Render
      try {
        // server.start(); // Uncomment if using older grpc-js, but current version auto-starts on bind
      } catch (e) {
        console.log("Server already started or start() not needed.");
      }

      console.log(`_____________________________________________`);
      console.log(`🤖 AI Microservice (gRPC) is LISTENING on port ${port}`);
      console.log(`_____________________________________________`);
    }
  );
}

main();
