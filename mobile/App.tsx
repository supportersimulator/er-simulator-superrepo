import React, { useState } from "react";
import { SafeAreaView, View, Text, Button, StyleSheet } from "react-native";
import { AuthScreen } from "./src/screens/AuthScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { VoiceSimScreen } from "./src/screens/VoiceSimScreen";

export type RootScreen = "auth" | "home" | "voice";

export default function App() {
  const [screen, setScreen] = useState<RootScreen>("auth");

  const renderScreen = () => {
    switch (screen) {
      case "auth":
        return <AuthScreen onAuthenticated={() => setScreen("home")} />;
      case "home":
        return <HomeScreen onStartSim={() => setScreen("voice")} />;
      case "voice":
        return <VoiceSimScreen onExit={() => setScreen("home")} />;
      default:
        return (
          <View style={styles.center}>
            <Text>Unknown screen</Text>
          </View>
        );
    }
  };

  return <SafeAreaView style={styles.container}>{renderScreen()}</SafeAreaView>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
