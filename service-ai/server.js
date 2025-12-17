// final-exam-prep/service-ai/server.js
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

// 1. Load the shared Proto file
const PROTO_PATH = path.join(__dirname, "../protos/image.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const imageProto = grpc.loadPackageDefinition(packageDefinition).image;

// 2. The "Fake" AI Logic
function classifyImage(call, callback) {
  // 'call.request' contains the data sent from Server A
  console.log(`[AI Service] Received image: ${call.request.filename}`);

  const labels = ["Cat", "Dog", "Tumor", "Digit 5", "Airplane"];

  // Simulate processing time (wait 100ms - 500ms)
  const delay = Math.floor(Math.random() * 400) + 100;

  setTimeout(() => {
    const randomLabel = labels[Math.floor(Math.random() * labels.length)];
    const randomConfidence = Math.random() * (0.99 - 0.7) + 0.7;

    // Send the result back
    callback(null, {
      label: randomLabel,
      confidence: randomConfidence,
    });
  }, delay);
}

// 3. Start the Server
function main() {
  const server = new grpc.Server();

  // Bind our function to the definition in the proto file
  server.addService(imageProto.ImageClassifier.service, {
    UploadImage: classifyImage,
  });

  server.bindAsync(
    "0.0.0.0:50051",
    grpc.ServerCredentials.createInsecure(),
    () => {
      console.log("🤖 AI Microservice (gRPC) running on port 50051");
    }
  );
}

main();
