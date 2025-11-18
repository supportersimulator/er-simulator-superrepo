import React, { useState } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Audio } from "expo-av";

interface Props {
  onExit: () => void;
}

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const VoiceSimScreen: React.FC<Props> = ({ onExit }) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [responseJson, setResponseJson] = useState<string>("");

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (!status || status.status !== "granted") {
        alert("Microphone permission is required.");
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await rec.startAsync();
      setRecording(rec);
      setIsRecording(true);
    } catch (e) {
      console.error("Failed to start recording", e);
      setIsRecording(false);
    }
  };

  const stopRecordingAndSend = async () => {
    if (!recording) return;
    setIsRecording(false);
    setIsLoading(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (!uri) {
        throw new Error("No recording URI");
      }

      const formData = new FormData();
      formData.append("audio", {
        uri,
        name: "audio.m4a",
        type: "audio/m4a",
      } as any);

      const resp = await fetch(`${API_BASE_URL}/api/voice/full`, {
        method: "POST",
        headers: {
          // In dev, backend uses a stub auth class; later, send real Supabase JWT.
          Authorization: "Bearer dev-token",
        },
        body: formData,
      });

      const json = await resp.json();
      setResponseJson(JSON.stringify(json, null, 2));

      // TODO: Decode json.audio_base64 and play it using expo-av.
    } catch (e) {
      console.error("Failed to stop/send recording", e);
      setResponseJson(String(e));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Simulation</Text>
        <Button title="Exit" onPress={onExit} />
      </View>

      <View style={styles.controls}>
        <Button
          title={isRecording ? "Release to Send" : "Hold to Record"}
          onPressIn={startRecording}
          onPressOut={stopRecordingAndSend}
          disabled={isLoading}
        />
      </View>

      {isLoading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#fff" />
          <Text style={styles.loadingText}>Processing voice pipeline…</Text>
        </View>
      )}

      <ScrollView style={styles.responseBox}>
        <Text style={styles.responseText}>
          {responseJson || "Responses will appear here after you record."}
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    color: "#fff",
    fontSize: 20,
  },
  controls: {
    marginBottom: 16,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  loadingText: {
    color: "#fff",
    marginLeft: 8,
  },
  responseBox: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 8,
    padding: 8,
  },
  responseText: {
    color: "#0f0",
    fontFamily: "Menlo",
    fontSize: 12,
  },
});
