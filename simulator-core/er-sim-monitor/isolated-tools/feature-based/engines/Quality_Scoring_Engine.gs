/**
 * Quality Scoring Engine - Evaluation Logic
 *
 * Pure quality evaluation logic with NO UI dependencies.
 * Applies weighted rubric scoring to simulation scenarios.
 *
 * Generated: 2025-11-04T18:37:10.315Z
 */

function evaluateSimulationQuality(rowValues, mergedKeys) {
  const v = (key) => {
    const idx = mergedKeys.indexOf(key);
    if (idx < 0) return '';
    return String(rowValues[idx] || '').trim();
  };
  const has = (re) => mergedKeys.some((k, i) => re.test(k) && String(rowValues[i]||'').trim() && String(rowValues[i]).trim()!=='N/A');

  // 1) Filled ratio
  const filled = rowValues.filter(x => String(x||'').trim() && String(x).trim()!=='N/A').length;
  const filledRatio = filled / Math.max(1, rowValues.length);

  // 2) Critical presence
  const coreIdentityOk   = has(/Case_Organization:Case_ID/i) && has(/Case_Organization:Spark_Title/i) && has(/Case_Organization:Reveal_Title/i);
  const patientBasicsOk  = has(/Patient_(Age|Sex)|Case_Organization:Spark_Title|Setting/i);
  const vitalsOk         = has(/Monitor_Vital_Signs:Initial_Vitals/i);
  const branchingOk      = has(/Progression_States|Decision_Nodes_JSON/i);
  const educationOk      = has(/CME_and_Educational_Content:(Learning_Objective|Quiz_Q1)/i);
  const ordersDataOk     = has(/Labs|Imaging|ECG|Ultrasound|CT|X[- ]?Ray/i);
  const environmentOk    = has(/Scene|Time_of_Day|Ambient|Audio|Image_Prompt/i);
  const metaOk           = has(/Developer_and_QA_Metadata:AI_Reflection_and_Suggestions/i);

  // 3) Image_Sync penalty if all empty
  let imgSyncPenalty = 0;
  if (QUALITY.PENALIZE_ALL_IMAGE_SYNC_EMPTY) {
    const imgKeys = mergedKeys.filter(k=>/^Image_Sync:/i.test(k));
    const anyFilled = imgKeys.some(k=>{
      const val = rowValues[mergedKeys.indexOf(k)];
      return String(val||'').trim() && String(val).trim()!=='N/A';
    });
    if (!anyFilled && imgKeys.length) imgSyncPenalty = 0.05; // subtract 5%
  }

  // 4) Weighted score
  const w = QUALITY.WEIGHTS;
  const sumW = Object.values(w).reduce((a,b)=>a+b,0);
  let score =
    (coreIdentityOk   ? w.coreIdentity   : 0) +
    (patientBasicsOk  ? w.patientBasics  : 0) +
    (vitalsOk         ? w.vitals         : 0) +
    (branchingOk      ? w.branching      : 0) +
    (educationOk      ? w.education      : 0) +
    (ordersDataOk     ? w.ordersData     : 0) +
    (environmentOk    ? w.environmentAV  : 0) +
    (metaOk           ? w.metaCompleteness:0);

  // Blend in filled ratio (up to +10% bonus scaled by completeness)
  const blendBonus = Math.round(10 * filledRatio);
  score = ((score / sumW) * 100);
  score = Math.min(100, Math.max(0, score + blendBonus - (imgSyncPenalty*100)));

  // 5) Suggestions
  const missingMsgs = [];
  QUALITY.SUGGESTIONS.forEach(sugg => {
    const satisfied = mergedKeys.some((k,i)=>sugg.re.test(k) && String(rowValues[i]||'').trim() && String(rowValues[i]).trim()!=='N/A');
    if (!satisfied) missingMsgs.push(sugg.msg);
  });

  // Vitals sanity (compact JSON)
  const ivKey = mergedKeys.find(k=>/Monitor_Vital_Signs:Initial_Vitals/i.test(k));
  if (ivKey) {
    const raw = v(ivKey);
    if (raw && raw !== 'N/A') {
      try {
        const obj = JSON.parse(raw);
        if (!('HR' in obj) || !('BP' in obj)) {
          missingMsgs.push('Initial Vitals should include HR and BP at minimum.');
        }
      } catch(_) {
        missingMsgs.push('Initial Vitals must be compact JSON (one line).');
      }
    } else {
      missingMsgs.push('Provide Initial Vitals in compact JSON.');
    }
  }

  // Keep suggestions tight
  const suggestionsText = missingMsgs.length ? [...new Set(missingMsgs)].slice(0, 10).join('; ') : 'Excellent completeness.';
  return { score: Math.round(score), suggestionsText };
}
