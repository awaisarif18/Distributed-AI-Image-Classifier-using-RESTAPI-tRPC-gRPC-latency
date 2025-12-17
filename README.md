🚀 Distributed AI Image Classifier

A microservices-based system demonstrating the performance and architectural differences between REST, tRPC, and gRPC for high-performance AI tasks.

📑 Exam Report: Performance Analysis

This system was built to compare three different communication protocols. Below are the findings based on live system metrics captured during testing.

1. Latency & Payload Comparison

Protocol

Observed Latency

Payload Size

Type Safety

Efficiency Verdict

REST API

15.20 ms

63.39 KB

❌ Loose

High (Local execution)

tRPC

44.00 ms

63.39 KB

✅ Excellent

Medium (Base64 Overhead)

gRPC

475.20 ms

63.39 KB

✅ Strict

Highest (Binary Stream)

2. Analysis of Results

REST (Speed King): Achieved the lowest latency (15.20ms) because the request was handled directly by the Gateway (Microservice A) using efficient multipart/form-data streams without converting data or hopping to internal services.

tRPC (Developer Experience): Slightly slower than REST (44ms) due to the overhead of Base64 encoding required to send images via JSON. However, it provided end-to-end type safety, significantly reducing client-side integration bugs.

gRPC (The Workhorse): The higher latency (475ms) is intentional and architectural. It reflects the time taken to:

Serialize the image to Protobuf Binary.

Transmit it to the separate AI Microservice (Service B).

Wait for the AI processing (simulated delay).

Return the result.

Conclusion: This proves the distributed nature of the system. Despite the processing delay, the network overhead was minimal due to Protobuf's efficiency.

3. Resilience Testing (Microservices)

During the "Kill Test," the AI Microservice (Service B) was manually terminated.

Result: The gRPC endpoint failed as expected.

Resilience: The REST and tRPC endpoints continued to function perfectly. This demonstrates the critical benefit of microservices: a failure in a subsystem (AI) did not crash the entire API Gateway.

🏗 System Architecture

The project follows a Microservices Architecture with three distinct components:

graph LR
    User[Client UI] -- JSON --> Gateway[API Gateway]
    Gateway -- Protobuf (gRPC) --> AI[AI Service]
    
    subgraph "Microservice A"
    Gateway
    end
    
    subgraph "Microservice B"
    AI
    end


Client (Next.js): A modern dashboard for uploading images and visualizing real-time latency graphs.

Server Main (Gateway): Handles HTTP/REST requests and acts as a gRPC Client to forward heavy tasks.

Service AI (Backend): A pure gRPC server listening on port 50051. It receives binary data, "processes" it, and returns classifications.

🛠 Installation & Setup

This project uses a Monorepo structure. You will need 3 separate terminals to run the full system.

Prerequisites

Node.js v20+ (v24.5.0 recommended)

npm or yarn

1. Clone & Install

# Clone the repository
git clone [https://github.com/yourusername/pdc-final-exam.git](https://github.com/yourusername/pdc-final-exam.git)
cd pdc-final-exam

# Install dependencies for ALL services
cd client && npm install && cd ..
cd server-main && npm install && cd ..
cd service-ai && npm install && cd ..


🚀 How to Run

Terminal 1: AI Microservice (The "Brain")

This service must run first. It listens for gRPC connections.

cd service-ai
node server.js
# Output: 🤖 AI Microservice (gRPC) running on port 50051


Terminal 2: API Gateway (The "Bridge")

This server handles REST, tRPC, and talks to the AI service.

cd server-main
npx ts-node index.ts
# Output: 🚀 API Gateway (REST + tRPC) running on http://localhost:4000


Terminal 3: Client UI (The "Face")

The Next.js frontend application.

cd client
npm run dev
# Output: Ready on http://localhost:3000


📂 Project Structure

├── 📁 client/           # Frontend (Next.js 15, Tailwind, Chart.js)
├── 📁 server-main/      # API Gateway (Express, tRPC, gRPC Client)
├── 📁 service-ai/       # Microservice (Node.js, gRPC Server)
└── 📁 protos/           # Shared Protocol Buffers (.proto definitions)


👨‍💻 Technologies Used

Frontend: Next.js 15 (App Router), Tailwind CSS, Framer Motion, Chart.js

Backend: Node.js, Express, TypeScript

Communication:

REST: Standard HTTP/JSON

tRPC: End-to-end type safety

gRPC: Google's high-performance RPC framework

Protobuf: Binary serialization format

Note: This project was developed for the Parallel & Distributed Computing Final Exam.