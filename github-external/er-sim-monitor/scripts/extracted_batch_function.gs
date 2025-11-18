function categorizeBatchWithAI(cases) {
  // Get OpenAI API key from Settings sheet
  const apiKey = getOpenAIAPIKey();

  if (!apiKey) {
    throw new Error('OpenAI API key not found in Settings!B2');
  }

  // Get accronym mapping for reference
  const accronymMapping = getAccronymMapping();

  // Filter out ACLS from valid symptoms (it's a treatment protocol, not a symptom)
  const validSymptoms = Object.keys(accronymMapping)
    .filter(symptom => symptom !== 'ACLS')
    .join(', ');

  // Get valid system categories
  const validSystems = [
    'Cardiovascular',
    'Pulmonary',
    'Gastrointestinal',
    'Neurologic',
    'Endocrine/Metabolic',
    'Renal/Genitourinary',
    'Hematologic/Oncologic',
    'Infectious Disease',
    'Toxicology',
    'Trauma',
    'Obstetrics/Gynecology',
    'Pediatrics',
    'HEENT',
    'Musculoskeletal',
    'Critical Care',
    'Dermatologic',
    'Psychiatric',
    'Environmental'
  ].join(', ');

  // Build prompt
  const prompt = buildCategorizationPrompt(cases, validSymptoms, validSystems);

  // Call OpenAI API
  const requestBody = {
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are an expert ER triage nurse categorizing medical simulation cases. Respond ONLY with valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 4000  // Increased from 3000 to prevent JSON truncation
  };

  const options = {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(requestBody),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', options);
  const responseCode = response.getResponseCode();

  if (responseCode !== 200) {
    throw new Error('OpenAI API error: ' + responseCode + ' - ' + response.getContentText());
  }

  const result = JSON.parse(response.getContentText());

  if (!result.choices || !result.choices[0] || !result.choices[0].message) {
    throw new Error('Invalid OpenAI response format');
  }

  const aiResponseText = result.choices[0].message.content;

  // Parse JSON response
  let suggestions;
  try {
    // Remove markdown code blocks if present
    const jsonText = aiResponseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    suggestions = JSON.parse(jsonText);
  } catch (parseError) {
    Logger.log('❌ Failed to parse AI response: ' + aiResponseText);
    throw new Error('Failed to parse AI response as JSON: ' + parseError.message);
  }

  // Merge AI suggestions with original case data
  const results = [];
  for (let i = 0; i < cases.length; i++) {
    const caseData = cases[i];
    const aiSuggestion = suggestions[i] || {};

    results.push({
      caseID: caseData.caseID,
      legacyCaseID: caseData.legacyCaseID,
      rowIndex: caseData.rowIndex,
      currentSymptom: caseData.currentSymptom,
      currentSystem: caseData.currentSystem,
      suggestedSymptom: aiSuggestion.suggestedSymptom || '',
      suggestedSymptomName: aiSuggestion.suggestedSymptomName || '',
      suggestedSystem: aiSuggestion.suggestedSystem || '',
      reasoning: aiSuggestion.reasoning || '',
      confidence: aiSuggestion.confidence || 'medium',
      status: determineStatus(caseData, aiSuggestion)
    });
  }

  return results;
}