# 🚀 Distributed AI Image Classifier

![Status](https://img.shields.io/badge/Status-Operational-success?style=for-the-badge)
![Node](https://img.shields.io/badge/Node-v24.5.0-green?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge)
![gRPC](https://img.shields.io/badge/Protocol-gRPC%20%2F%20Protobuf-blue?style=for-the-badge)

> A microservices-based system demonstrating the performance and architectural differences between **REST**, **tRPC**, and **gRPC** for high-performance AI tasks.

---

## 📑 Exam Report: Performance Analysis

This system was built to compare three different communication protocols. Below are the findings based on live system metrics captured during testing.

### 1. Latency & Payload Comparison

| Protocol | Observed Latency | Payload Size | Type Safety | Efficiency Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **REST API** | **15.20 ms** | 63.39 KB | ❌ Loose | High (Local execution) |
| **tRPC** | **44.00 ms** | 63.39 KB | ✅ **Excellent** | Medium (Base64 Overhead) |
| **gRPC** | **475.20 ms** | 63.39 KB | ✅ **Strict** | **Highest** (Binary Stream) |

### 2. Analysis of Results
* **REST (Speed King):** Achieved the lowest latency (15.20ms) because the request was handled directly by the Gateway (Microservice A) using efficient `multipart/form-data` streams without converting data or hopping to internal services.
* **tRPC (Developer Experience):** Slightly slower than REST (44ms) due to the overhead of **Base64 encoding** required to send images via JSON. However, it provided end-to-end type safety, significantly reducing client-side integration bugs.
* **gRPC (The Workhorse):** The higher latency (475ms) is **intentional and architectural**. It reflects the time taken to:
    1. Serialize the image to **Protobuf Binary**.
    2. Transmit it to the separate **AI Microservice (Service B)**.
    3. Wait for the AI processing (simulated delay).
    4. Return the result.
    
    *Conclusion:* This proves the distributed nature of the system. Despite the processing delay, the network overhead was minimal due to Protobuf's efficiency.

### 3. Resilience Testing (Microservices)
During the "Kill Test," the **AI Microservice (Service B)** was manually terminated.
* **Result:** The gRPC endpoint failed as expected.
* **Resilience:** The **REST and tRPC endpoints continued to function** perfectly. This demonstrates the critical benefit of microservices: a failure in a subsystem (AI) did not crash the entire API Gateway.

---

## 🏗 System Architecture

The project follows a **Microservices Architecture** with three distinct components:

```mermaid
graph LR
    User[Client UI] -- JSON --> Gateway[API Gateway]
    Gateway -- Protobuf (gRPC) --> AI[AI Service]
    
    subgraph "Microservice A"
    Gateway
    end
    
    subgraph "Microservice B"
    AI
    end

    