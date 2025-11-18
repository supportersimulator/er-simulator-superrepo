import express from "express";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import http from "http";
import { WebSocketServer } from "ws";

dotenv.config();

const PORT = process.env.LIVE_SYNC_PORT || 3333;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json({ limit: "2mb" }));

// WebSocket connections
wss.on("connection", (ws) => {
  console.log("🔗 WebSocket client connected");
  ws.send(JSON.stringify({ type: "connected", message: "Live sync ready" }));
});

// Helper function to broadcast updates to all connected clients
function broadcast(data) {
  const payload = JSON.stringify({ type: "vitalsUpdate", data });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(payload);
  });
}

// Endpoint for Google Sheets webhook
app.post("/vitals-update", (req, res) => {
  try {
    const { timestamp, sheet, row, entry } = req.body;

    // Log incoming update
    console.log(`📡 Received update for row ${row} from Google Sheets at ${timestamp}`);

    const filePath = path.resolve("./data/vitals.json");
    let data = [];

    // Read existing vitals data
    if (fs.existsSync(filePath)) {
      try {
        data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      } catch (err) {
        console.error("⚠️  Error parsing vitals.json, starting fresh:", err.message);
        data = [];
      }
    }

    // Find matching case by Case_ID
    const caseId = entry["Case_Organization:Case_ID"];
    const matchIndex = data.findIndex(
      (r) => r["Case_Organization:Case_ID"] === caseId
    );

    // Update or append
    if (matchIndex !== -1) {
      // Merge updates into existing entry
      data[matchIndex] = { ...data[matchIndex], ...entry };
      console.log(`🔄 Updated case ${caseId} (index ${matchIndex})`);
    } else {
      data.push(entry);
      console.log(`➕ Added new case ${caseId}`);
    }

    // Write to file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`💾 Saved to ${filePath}`);

    // Broadcast to connected WebSocket clients
    broadcast({
      timestamp,
      sheet,
      row,
      caseId,
      entry
    });
    console.log(`📢 Broadcasted update to ${wss.clients.size} connected client(s)`);

    // Send success response
    res.json({
      ok: true,
      caseId,
      action: matchIndex !== -1 ? 'updated' : 'added',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("❌ Error processing vitals update:", err);
    res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

// Health check
app.get("/", (_, res) => res.send("✅ ER Simulator LiveSync Active"));

server.listen(PORT, () =>
  console.log(`📡 Live Sync Server listening on port ${PORT}`)
);
