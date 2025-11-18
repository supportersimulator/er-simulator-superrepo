import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";

interface Props {
  onAuthenticated: () => void;
}

// TODO: Replace with real Supabase Auth (magic link / password / OAuth).
export const AuthScreen: React.FC<Props> = ({ onAuthenticated }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ER Sim – Sign In</Text>
      <Text style={styles.subtitle}>Supabase Auth will be wired here.</Text>
      <Button title="Continue as Dev User" onPress={onAuthenticated} />
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
