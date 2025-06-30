import * as functions from "firebase-functions";
// Use the 'require' syntax for maximum compatibility in Cloud Functions v1
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fetch = require("node-fetch");

// Securely get the API key from environment configuration
const geminiApiKey = functions.config().gemini.key;

export const callGemini = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const prompt = data.prompt;
  const apiUrl =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`;

  const payload = {
    contents: [{parts: [{text: prompt}]}],
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Gemini API Error:", errorBody);
      throw new functions.https.HttpsError(
          "internal", `API Error: ${response.status}`
      );
    }
    return await response.json();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new functions.https.HttpsError("internal", "Failed to call Gemini API.");
  }
});