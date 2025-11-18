#!/usr/bin/env node

require('dotenv').config();

const prompt = `
Create titles and memory anchors for this medical simulation case.

**Case Data:**
Age: 8
Gender: Male
Chief Complaint: Coughing and wheezing
Clinical Vignette: An 8-year-old boy is brought to the emergency department by his mother, who reports he has been coughing and having difficulty breathing after playing outside. He has a history of asthma.
Educational Goal: Identify and manage an acute asthma attack in a pediatric patient.
Why It Matters: Asthma can be life-threatening in children; timely intervention is crucial for positive outcomes.

**Output JSON Format:**
{
  "Spark_Titles": [
    "Symptom (Age Sex): Spark phrase 1",
    "Symptom (Age Sex): Spark phrase 2",
    "Symptom (Age Sex): Spark phrase 3",
    "Symptom (Age Sex): Spark phrase 4",
    "Symptom (Age Sex): Spark phrase 5"
  ],
  "Reveal_Titles": [
    "Diagnosis (Age Sex): Learning point 1",
    "Diagnosis (Age Sex): Learning point 2",
    "Diagnosis (Age Sex): Learning point 3",
    "Diagnosis (Age Sex): Learning point 4",
    "Diagnosis (Age Sex): Learning point 5"
  ],
  "Memory_Anchors": [
    "Memorable detail 1",
    "Memorable detail 2",
    "Memorable detail 3",
    "Memorable detail 4",
    "Memorable detail 5",
    "Memorable detail 6",
    "Memorable detail 7",
    "Memorable detail 8",
    "Memorable detail 9",
    "Memorable detail 10"
  ],
  "Case_Summary": {
    "Patient_Summary": "8M presents with severe respiratory distress after playing outside. Examination reveals wheezing, increased respiratory effort. Immediate nebulizer treatment initiated.",
    "Core_Takeaway": "Rapid assessment and aggressive management are crucial to prevent respiratory failure in severe asthma exacerbations."
  }
}

Respond ONLY with valid JSON, no additional text.
`;

async function testPrompt() {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 4000,
      messages: [
        { role: 'system', content: 'You are a medical simulation expert. Output only valid JSON.' },
        { role: 'user', content: prompt }
      ]
    })
  });

  const data = await response.json();
  
  if (data.error) {
    console.error('❌ API Error:', data.error);
    return;
  }

  const content = data.choices[0].message.content;
  console.log('\n📝 Raw Response:\n');
  console.log(content.substring(0, 500));
  console.log('\n...\n');

  try {
    const parsed = JSON.parse(content);
    console.log('✅ Successfully parsed JSON');
    console.log('\n📊 Generated Content:');
    console.log(`   Spark Titles: ${parsed.Spark_Titles?.length || 0}`);
    console.log(`   Reveal Titles: ${parsed.Reveal_Titles?.length || 0}`);
    console.log(`   Memory Anchors: ${parsed.Memory_Anchors?.length || 0}`);
    console.log(`   Case Summary: ${parsed.Case_Summary ? 'Yes' : 'No'}`);
  } catch (err) {
    console.error('❌ Failed to parse response:', err.message);
  }
}

testPrompt().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
