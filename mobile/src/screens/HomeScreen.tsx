import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";

interface Props {
  onStartSim: () => void;
}

export const HomeScreen: React.FC<Props> = ({ onStartSim }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ER Simulator</Text>
      <Text style={styles.subtitle}>Voice-to-voice AI simulation prototype</Text>
      <Button title="Start Voice Simulation" onPress={onStartSim} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    marginBottom: 12,
  },
  subtitle: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
  },
});
