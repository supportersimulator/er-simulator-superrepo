"use client";

import React, { useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? "http://localhost:8000";

export default function TestVoicePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [jsonResponse, setJsonResponse] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setIsLoading(true);
    setJsonResponse("");
    setAudioUrl(null);

    try {
      const formData = new FormData();
      formData.append("audio", file);

      const resp = await fetch(`${API_BASE_URL}/api/voice/full`, {
        method: "POST",
        headers: {
          // In dev, backend uses a stub auth class; later, send real Supabase JWT.
          Authorization: "Bearer dev-token",
        },
        body: formData,
      });

      const json = await resp.json();
      setJsonResponse(JSON.stringify(json, null, 2));

      if (json.audio_url) {
        setAudioUrl(json.audio_url);
      } else if (json.audio_base64) {
        // Try to create a data URL from base64; browser support may vary.
        setAudioUrl(`data:audio/mp3;base64,${json.audio_base64}`);
      }
    } catch (err) {
      console.error(err);
      setJsonResponse(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl mb-4">Test Voice Pipeline</h1>
      <p className="mb-4 text-sm text-gray-300">
        Upload an audio file to call the backend /api/voice/full endpoint.
      </p>

      <form onSubmit={onSubmit} className="mb-6 space-y-4">
        <input
          type="file"
          accept="audio/*"
          onChange={onFileChange}
          className="block text-sm"
        />
        <button
          type="submit"
          disabled={!file || isLoading}
          className="px-4 py-2 bg-emerald-600 disabled:bg-gray-600 rounded"
        >
          {isLoading ? "Sending…" : "Send to Voice Pipeline"}
        </button>
      </form>

      {jsonResponse && (
        <section className="mb-6">
          <h2 className="text-xl mb-2">JSON Response</h2>
          <pre className="bg-gray-900 p-4 rounded text-xs overflow-auto max-h-80">
            {jsonResponse}
          </pre>
        </section>
      )}

      {audioUrl && (
        <section>
          <h2 className="text-xl mb-2">Audio Playback</h2>
          <audio controls src={audioUrl} className="w-full" />
        </section>
      )}
    </main>
  );
}
