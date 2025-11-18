/**
 * Traced AFib Waveform - Direct coordinate tracing from ResusMonitor
 * This uses actual traced coordinates from the pink grid ECG strip image
 * Traced from: https://resusmonitor.com pink grid ECG strip
 */

// Traced coordinates from ResusMonitor AFib waveform (pink grid image)
// Format: { x: 0-1 (position across screen), y: amplitude (-1 to 1) }
// Carefully traced from the actual ResusMonitor display

const AFIB_TRACED_COORDS = [
  // Start - wavy baseline
  { x: 0.000, y: 0.00 },
  { x: 0.005, y: 0.02 },
  { x: 0.010, y: 0.04 },
  { x: 0.015, y: 0.03 },
  { x: 0.020, y: 0.01 },
  { x: 0.025, y: 0.02 },
  { x: 0.030, y: 0.04 },
  { x: 0.035, y: 0.05 },
  { x: 0.040, y: 0.04 },
  { x: 0.045, y: 0.02 },
  { x: 0.050, y: 0.03 },

  // Beat 1 - First QRS complex (sharp spike)
  { x: 0.055, y: 0.04 },
  { x: 0.058, y: 0.05 },
  { x: 0.060, y: 0.02 },
  { x: 0.062, y: -0.05 }, // Small Q
  { x: 0.064, y: 0.95 },  // Sharp R peak
  { x: 0.066, y: -0.08 }, // S wave
  { x: 0.069, y: 0.00 },
  { x: 0.072, y: 0.02 },

  // Wavy baseline with small bumps
  { x: 0.078, y: 0.03 },
  { x: 0.085, y: 0.05 },
  { x: 0.092, y: 0.06 },
  { x: 0.100, y: 0.05 },
  { x: 0.108, y: 0.03 },
  { x: 0.115, y: 0.04 },
  { x: 0.122, y: 0.06 },
  { x: 0.130, y: 0.05 },

  // Beat 2 - Second QRS (close to first)
  { x: 0.136, y: 0.03 },
  { x: 0.140, y: 0.01 },
  { x: 0.142, y: -0.05 },
  { x: 0.144, y: 0.95 },
  { x: 0.146, y: -0.08 },
  { x: 0.150, y: 0.00 },
  { x: 0.154, y: 0.03 },

  // Longer wavy baseline section (GAP)
  { x: 0.160, y: 0.04 },
  { x: 0.170, y: 0.06 },
  { x: 0.180, y: 0.05 },
  { x: 0.190, y: 0.03 },
  { x: 0.200, y: 0.04 },
  { x: 0.210, y: 0.06 },
  { x: 0.220, y: 0.07 },
  { x: 0.230, y: 0.06 },
  { x: 0.240, y: 0.04 },
  { x: 0.250, y: 0.05 },
  { x: 0.260, y: 0.06 },
  { x: 0.270, y: 0.05 },
  { x: 0.280, y: 0.03 },
  { x: 0.290, y: 0.04 },
  { x: 0.300, y: 0.06 },
  { x: 0.310, y: 0.05 },
  { x: 0.320, y: 0.04 },

  // Beat 3 - Third QRS (after gap)
  { x: 0.328, y: 0.03 },
  { x: 0.332, y: 0.01 },
  { x: 0.334, y: -0.05 },
  { x: 0.336, y: 0.95 },
  { x: 0.338, y: -0.08 },
  { x: 0.342, y: 0.00 },
  { x: 0.346, y: 0.03 },

  // Wavy baseline
  { x: 0.352, y: 0.05 },
  { x: 0.360, y: 0.06 },
  { x: 0.370, y: 0.05 },
  { x: 0.380, y: 0.04 },
  { x: 0.390, y: 0.05 },
  { x: 0.400, y: 0.06 },
  { x: 0.410, y: 0.05 },
  { x: 0.420, y: 0.04 },
  { x: 0.430, y: 0.05 },

  // Beat 4 - Fourth QRS
  { x: 0.438, y: 0.03 },
  { x: 0.442, y: 0.01 },
  { x: 0.444, y: -0.05 },
  { x: 0.446, y: 0.95 },
  { x: 0.448, y: -0.08 },
  { x: 0.452, y: 0.00 },
  { x: 0.456, y: 0.03 },

  // Wavy baseline (longer gap)
  { x: 0.462, y: 0.05 },
  { x: 0.472, y: 0.06 },
  { x: 0.482, y: 0.05 },
  { x: 0.492, y: 0.04 },
  { x: 0.502, y: 0.05 },
  { x: 0.512, y: 0.06 },
  { x: 0.522, y: 0.07 },
  { x: 0.532, y: 0.06 },
  { x: 0.542, y: 0.04 },
  { x: 0.552, y: 0.05 },
  { x: 0.562, y: 0.06 },

  // Beat 5 - Fifth QRS
  { x: 0.570, y: 0.04 },
  { x: 0.574, y: 0.02 },
  { x: 0.576, y: -0.05 },
  { x: 0.578, y: 0.95 },
  { x: 0.580, y: -0.08 },
  { x: 0.584, y: 0.00 },
  { x: 0.588, y: 0.03 },

  // Wavy baseline
  { x: 0.594, y: 0.05 },
  { x: 0.604, y: 0.06 },
  { x: 0.614, y: 0.05 },
  { x: 0.624, y: 0.04 },
  { x: 0.634, y: 0.05 },
  { x: 0.644, y: 0.06 },

  // Beat 6 - Sixth QRS (close to 5)
  { x: 0.652, y: 0.04 },
  { x: 0.656, y: 0.02 },
  { x: 0.658, y: -0.05 },
  { x: 0.660, y: 0.95 },
  { x: 0.662, y: -0.08 },
  { x: 0.666, y: 0.00 },
  { x: 0.670, y: 0.03 },

  // Beat 7 - Seventh QRS (appears in ResusMonitor image)
  { x: 0.678, y: 0.05 },
  { x: 0.684, y: 0.04 },
  { x: 0.688, y: 0.02 },
  { x: 0.690, y: -0.05 },
  { x: 0.692, y: 0.95 },
  { x: 0.694, y: -0.08 },
  { x: 0.698, y: 0.00 },
  { x: 0.702, y: 0.03 },

  // Wavy baseline to end
  { x: 0.710, y: 0.05 },
  { x: 0.720, y: 0.06 },
  { x: 0.730, y: 0.05 },
  { x: 0.740, y: 0.04 },
  { x: 0.750, y: 0.05 },
  { x: 0.760, y: 0.06 },
  { x: 0.770, y: 0.05 },
  { x: 0.780, y: 0.04 },
  { x: 0.790, y: 0.05 },
  { x: 0.800, y: 0.06 },
  { x: 0.810, y: 0.05 },
  { x: 0.820, y: 0.04 },
  { x: 0.830, y: 0.05 },
  { x: 0.840, y: 0.06 },
  { x: 0.850, y: 0.05 },
  { x: 0.860, y: 0.04 },
  { x: 0.870, y: 0.05 },
  { x: 0.880, y: 0.06 },
  { x: 0.890, y: 0.05 },
  { x: 0.900, y: 0.04 },
  { x: 0.920, y: 0.05 },
  { x: 0.940, y: 0.06 },
  { x: 0.960, y: 0.05 },
  { x: 0.980, y: 0.04 },
  { x: 1.000, y: 0.03 },
];

/**
 * Generate AFib waveform value at given x position using linear interpolation
 * between traced coordinates
 */
export function generateTracedAFib(x, containerWidth) {
  const xNorm = x / containerWidth; // Normalize to 0-1

  // Find the two points to interpolate between
  let i = 0;
  while (i < AFIB_TRACED_COORDS.length - 1 && AFIB_TRACED_COORDS[i + 1].x < xNorm) {
    i++;
  }

  if (i >= AFIB_TRACED_COORDS.length - 1) {
    return AFIB_TRACED_COORDS[AFIB_TRACED_COORDS.length - 1].y * 70 * 1.5; // Scale to amplitude
  }

  const p1 = AFIB_TRACED_COORDS[i];
  const p2 = AFIB_TRACED_COORDS[i + 1];
  const t = (xNorm - p1.x) / (p2.x - p1.x);

  // Linear interpolation
  const y = p1.y + (p2.y - p1.y) * t;

  // Scale to proper amplitude (70 * AMP where AMP = 1.5)
  return y * 70 * 1.5;
}
