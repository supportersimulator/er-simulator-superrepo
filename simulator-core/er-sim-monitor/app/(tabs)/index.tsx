import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View, ImageBackground } from 'react-native';
import MonitorContainer from '../../components/MonitorContainer';

export default function IndexScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Beautiful Hospital Room Background */}
      <ImageBackground
        source={require('../../assets/images/hospital-room-bg.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* MonitorContainer handles minimized icon and expanded monitor */}
        <MonitorContainer />
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e', // Fallback color if image doesn't load
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});