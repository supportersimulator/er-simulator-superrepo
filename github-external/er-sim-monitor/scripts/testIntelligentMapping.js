import fs from "fs";

// Load current vitals
const vitals = JSON.parse(fs.readFileSync("./data/vitals.json", "utf8"));

console.log("\n🧠 Intelligent Waveform Mapping Analysis\n");

vitals.forEach((entry, idx) => {
  const caseTitle = entry["Case_Organization:Reveal_Title"] || entry["Case_Organization:Spark_Title"] || `Case ${idx + 1}`;
  const stateNames = (entry["image sync:Default_Patient_States"] || "").split(",");
  const dispositionPlan = entry["Situation_and_Environment_Details:Disposition_Plan"] || "";

  console.log(`\n📋 ${caseTitle}`);
  console.log(`   States: ${stateNames.join(" → ")}`);
  console.log(`   Plan: ${dispositionPlan}`);

  // Check each vital state
  ["Initial_Vitals", "State1_Vitals", "State2_Vitals", "State3_Vitals", "State4_Vitals"].forEach((field, i) => {
    const vitalsData = entry[`Monitor_Vital_Signs:${field}`];
    if (vitalsData) {
      const stateName = stateNames[i] || `State${i}`;
      console.log(`   ${stateName}: ${vitalsData.waveform || "missing"} (HR: ${vitalsData.HR}, BP: ${vitalsData.BP})`);
    }
  });
});
