import Waveform from './Waveform';

/**
 * EtCO2 Waveform Generator
 * INCREASED amplitudes for maximum visibility
 */
export default function WaveformEtCO2(props) {
  const { rr = 16, etco2 = 35, ...otherProps } = props;

  const numCycles = 5;

  const generator = (x, containerWidth) => {
    const cycleLength = containerWidth / numCycles;
    const t = x % cycleLength;
    const progress = t / cycleLength;

    const amplitude = (etco2 / 40) * 28; // Bigger amplitude
    const AMP = 1.5;

    // Phase I: Baseline (0-0.15)
    if (progress < 0.15) return 0;

    // Phase II: Expiratory upstroke (0.15-0.25)
    if (progress < 0.25) {
      const rise = (progress - 0.15) / 0.1;
      return amplitude * AMP * (1 / (1 + Math.exp(-10 * (rise - 0.5))));
    }

    // Phase III: Plateau (0.25-0.65)
    if (progress < 0.65) {
      const plateau = (progress - 0.25) / 0.4;
      const slope = plateau * 0.1;
      return amplitude * AMP * (1 + slope);
    }

    // Phase 0: Inspiratory downstroke (0.65-0.75)
    if (progress < 0.75) {
      const fall = (progress - 0.65) / 0.1;
      return amplitude * AMP * (1 - fall);
    }

    return 0;
  };

  return (
    <Waveform
      {...otherProps}
      type="etco2"
      color="#ffff00"
      amplitude={1.0}
      rr={rr}
      numCycles={numCycles}
      generator={generator}
    />
  );
}
