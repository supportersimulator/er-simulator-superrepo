import { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, useWindowDimensions, View } from 'react-native';
import Monitor from './components/Monitor';

const makeMockVitals = (prev = {}) => {
  const flip = prev._flip ? 0 : 1;
  return {
    _flip: !flip,
    vs_hr: flip ? 110 : 72,
    vs_rr: flip ? 24 : 14,
    vs_spo2: flip ? 93 : 98,
    vs_sbp: flip ? 92 : 118,
    vs_dbp: flip ? 58 : 76,
    vs_etco2: flip ? 3.6 : 4.8,
  };
};

export default function App() {
  const { width, height } = useWindowDimensions();
  const [vitals, setVitals] = useState(makeMockVitals());

  useEffect(() => {
    const id = setInterval(() => setVitals(v => makeMockVitals(v)), 8000);
    return () => clearInterval(id);
  }, []);

  const isLandscape = width > height;

  return (
    <SafeAreaView style={[styles.screen, { paddingTop: StatusBar.currentHeight || 0 }]}>
      <View style={[styles.wrap, isLandscape && styles.wrapLandscape]}>
        <Monitor data={vitals} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b1116' },
  wrap: { flex: 1, width: '100%', alignSelf: 'stretch' },
  wrapLandscape: { flexDirection: 'row' },
});