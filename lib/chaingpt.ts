/**
 * ChainGPT Smart Contract Generator API helper.
 * Use server-side only (API key must not be exposed to client).
 */
export async function generateContract(prompt: string): Promise<string> {
  const apiKey = process.env.CHAINGPT_API_KEY;
  if (!apiKey) {
    throw new Error("CHAINGPT_API_KEY is not set");
  }

  const response = await fetch("https://api.chaingpt.org/chat/stream", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "smart_contract_generator",
      question: prompt,
      chatHistory: "off",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`ChainGPT API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data?.data?.bot ?? data?.bot ?? "";
}
