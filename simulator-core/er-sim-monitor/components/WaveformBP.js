import Waveform from './Waveform';

/**
 * Blood Pressure Waveform Generator
 * INCREASED amplitudes for maximum visibility
 */
export default function WaveformBP(props) {
  const { hr = 75, systolic = 120, diastolic = 80, ...otherProps } = props;

  const numCycles = 5;
  const pulseAmplitude = systolic - diastolic;

  const generator = (x, containerWidth) => {
    const cycleLength = containerWidth / numCycles;
    const t = x % cycleLength;
    const progress = t / cycleLength;

    const scale = pulseAmplitude / 40;
    const AMP = 1.6; // Bigger amplitude

    if (progress < 0.15) {
      const rise = progress / 0.15;
      return (45 * Math.pow(rise, 1.2)) * scale * AMP;
    }
    if (progress < 0.25) {
      const peak = (progress - 0.15) / 0.1;
      return (45 - peak * 7) * scale * AMP;
    }
    if (progress < 0.35) {
      const notch = (progress - 0.25) / 0.1;
      const notchDepth = 5 * scale;
      return (38 - notchDepth + Math.sin(notch * Math.PI) * notchDepth) * scale * AMP;
    }
    if (progress < 0.9) {
      const decay = (progress - 0.35) / 0.55;
      return (38 * Math.exp(-decay * 2.5)) * scale * AMP;
    }

    return 0;
  };

  return (
    <Waveform
      {...otherProps}
      type="bp"
      color="#ff3333"
      amplitude={1.0}
      hr={hr}
      numCycles={numCycles}
      generator={generator}
    />
  );
}
