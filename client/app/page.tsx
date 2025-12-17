"use client";

import { useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { trpc } from "../utils/trpc";
import {
  UploadCloud,
  Zap,
  Server,
  Activity,
  CheckCircle2,
  Clock,
  Database,
} from "lucide-react";
import { motion } from "framer-motion";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Home() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeMethod, setActiveMethod] = useState<string | null>(null);

  // 1. Initialize the tRPC Mutation Hook
  // This provides the .mutateAsync() function we use below
  const uploadMutation = trpc.uploadImage.useMutation();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  // Usage: axios.post(`${API_URL}/api/rest/upload`, ...)

  // Helper: Convert File to Base64 (required for sending files via JSON/tRPC)
  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleUpload = async (
    method: "REST" | "tRPC" | "gRPC",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];

    setLoading(true);
    setActiveMethod(method);
    const start = performance.now();
    let result;

    try {
      if (method === "REST") {
        // --- REST IMPLEMENTATION ---
        const formData = new FormData();
        formData.append("image", file);
        const res = await axios.post(`${API_URL}/api/rest/upload`, formData);
        result = res.data;
      } else if (method === "tRPC") {
        // --- REAL tRPC IMPLEMENTATION ---
        const base64 = await toBase64(file);

        // This is the "Type-Safe" call.
        // If you hover over 'response', VS Code knows exactly what it contains.
        const response = await uploadMutation.mutateAsync({
          imageBase64: base64,
        });

        result = response;
      } else if (method === "gRPC") {
        // --- gRPC GATEWAY IMPLEMENTATION ---
        const formData = new FormData();
        formData.append("image", file);
        const res = await axios.post(
          `${API_URL}/api/grpc-gateway/upload`,
          formData
        );
        result = res.data;
      }

      const end = performance.now();
      const payloadSize = (file.size / 1024).toFixed(2); // KB

      setLogs((prev) => [
        ...prev,
        {
          method,
          label: result.label,
          confidence: result.confidence,
          latency: (end - start).toFixed(2),
          size: payloadSize,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err) {
      console.error(err);
      alert("Error uploading. Is the server running?");
    } finally {
      setLoading(false);
      setActiveMethod(null);
    }
  };

  // Chart Data Configuration
  const chartData = {
    labels: logs.map((l) => l.timestamp),
    datasets: [
      {
        label: "Latency (ms)",
        data: logs.map((l) => parseFloat(l.latency)),
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans p-8 selection:bg-blue-500/30">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-800 pb-6"
        >
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Distributed AI Classifier
            </h1>
            <p className="text-neutral-400 mt-2 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              System Operational: Node v24.5.0
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <div className="px-4 py-1.5 bg-neutral-900 border border-neutral-800 rounded-full text-xs font-mono text-neutral-500">
              CLIENT: NEXT.JS
            </div>
            <div className="px-4 py-1.5 bg-neutral-900 border border-neutral-800 rounded-full text-xs font-mono text-neutral-500">
              SERVER: EXPRESS/gRPC
            </div>
          </div>
        </motion.header>

        {/* Main Grid */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Col: Upload Methods */}
          <section className="lg:col-span-4 space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <UploadCloud className="text-blue-400" size={20} />
              Select Protocol
            </h2>

            <MethodCard
              title="REST API"
              subtitle="Standard JSON over HTTP"
              color="blue"
              icon={<Database size={20} />}
              loading={loading && activeMethod === "REST"}
              onUpload={(e: any) => handleUpload("REST", e)}
            />

            <MethodCard
              title="tRPC Endpoint"
              subtitle="Type-safe RPC (JSON)"
              color="yellow"
              icon={<Zap size={20} />}
              loading={loading && activeMethod === "tRPC"}
              onUpload={(e: any) => handleUpload("tRPC", e)}
            />

            <MethodCard
              title="gRPC Microservice"
              subtitle="Binary Protobuf (Gateway -> AI)"
              color="green"
              icon={<Server size={20} />}
              loading={loading && activeMethod === "gRPC"}
              onUpload={(e: any) => handleUpload("gRPC", e)}
            />
          </section>

          {/* Right Col: Analytics & Logs */}
          <section className="lg:col-span-8 space-y-8">
            {/* Real-time Chart */}
            <div className="bg-neutral-900/40 backdrop-blur-md p-6 rounded-2xl border border-neutral-800 shadow-xl">
              <h3 className="text-sm font-medium text-neutral-400 mb-4 flex items-center gap-2">
                <Activity size={16} /> Live Latency Metrics
              </h3>
              <div className="h-64 w-full">
                {logs.length > 0 ? (
                  <Bar
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: { grid: { color: "#262626" } },
                        x: { grid: { display: false } },
                      },
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-neutral-600 text-sm">
                    Upload an image to see performance data
                  </div>
                )}
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-neutral-900/40 backdrop-blur-md p-6 rounded-2xl border border-neutral-800 shadow-xl">
              <h3 className="text-sm font-medium text-neutral-400 mb-4">
                Request Logs
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-neutral-500 uppercase border-b border-neutral-800">
                    <tr>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Latency</th>
                      <th className="px-4 py-3">Payload</th>
                      <th className="px-4 py-3">Prediction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {logs.map((log, i) => (
                      <tr
                        key={i}
                        className="hover:bg-neutral-800/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs">
                          <span
                            className={`px-2 py-1 rounded ${
                              log.method === "REST"
                                ? "bg-blue-500/10 text-blue-400"
                                : log.method === "tRPC"
                                ? "bg-yellow-500/10 text-yellow-400"
                                : "bg-green-500/10 text-green-400"
                            }`}
                          >
                            {log.method}
                          </span>
                        </td>
                        <td className="px-4 py-3 flex items-center gap-2">
                          <Clock size={12} className="text-neutral-500" />{" "}
                          {log.latency}ms
                        </td>
                        <td className="px-4 py-3 text-neutral-400">
                          {log.size} KB
                        </td>
                        <td className="px-4 py-3 text-white font-medium flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-green-500" />
                          {log.label}{" "}
                          <span className="text-neutral-500 text-xs">
                            ({log.confidence})
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

// Sub-component for the stylish cards
function MethodCard({ title, subtitle, color, icon, loading, onUpload }: any) {
  const colors: any = {
    blue: "hover:border-blue-500/50 group-hover:text-blue-400",
    yellow: "hover:border-yellow-500/50 group-hover:text-yellow-400",
    green: "hover:border-green-500/50 group-hover:text-green-400",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`relative group bg-neutral-900 border border-neutral-800 p-6 rounded-xl transition-all ${colors[color]} cursor-pointer overflow-hidden`}
    >
      <div className="flex items-start justify-between">
        <div className="flex gap-4">
          <div
            className={`p-3 rounded-lg bg-neutral-950 border border-neutral-800 ${
              colors[color].split(" ")[1]
            }`}
          >
            {loading ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              icon
            )}
          </div>
          <div>
            <h3 className="font-semibold text-neutral-200">{title}</h3>
            <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Invisible file input covering the card */}
      <input
        type="file"
        onChange={onUpload}
        disabled={loading}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
    </motion.div>
  );
}
