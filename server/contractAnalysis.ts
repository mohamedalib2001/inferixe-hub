import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface ContractAnalysisResult {
  contractNumber: string | null;
  contractType: "commercial_lease" | "unit_lease" | "long_term_lease" | null;
  startDate: string | null;
  endDate: string | null;
  monthlyRent: number | null;
  annualRent: number | null;
  currency: string;
  lessor: {
    name: string | null;
    nameAr: string | null;
    idNumber: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
  };
  lessee: {
    name: string | null;
    nameAr: string | null;
    idNumber: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
  };
  property: {
    name: string | null;
    address: string | null;
    type: string | null;
    units: Array<{
      unitNumber: string | null;
      floor: number | null;
      area: number | null;
      rooms: number | null;
    }>;
  };
  paymentTerms: string | null;
  specialTerms: string | null;
  confidence: number;
  rawText: string;
}

const SYSTEM_PROMPT = `You are an expert contract analyst specializing in commercial lease agreements. 
Analyze the provided contract text and extract key information in a structured format.
Focus on Arabic and English contract documents.
Return your analysis as a valid JSON object with the following structure:

{
  "contractNumber": "contract/agreement number if found",
  "contractType": "commercial_lease" | "unit_lease" | "long_term_lease" (determine based on content),
  "startDate": "YYYY-MM-DD format or null",
  "endDate": "YYYY-MM-DD format or null", 
  "monthlyRent": number or null,
  "annualRent": number or null,
  "currency": "SAR" or "USD" or other currency code,
  "lessor": {
    "name": "lessor/landlord name in English",
    "nameAr": "lessor/landlord name in Arabic if available",
    "idNumber": "ID/CR number",
    "address": "address",
    "phone": "phone number",
    "email": "email address"
  },
  "lessee": {
    "name": "lessee/tenant name in English",
    "nameAr": "lessee/tenant name in Arabic if available",
    "idNumber": "ID/CR number",
    "address": "address",
    "phone": "phone number",
    "email": "email address"
  },
  "property": {
    "name": "property/building name",
    "address": "full property address",
    "type": "commercial" | "residential" | "mixed" | "industrial",
    "units": [
      {
        "unitNumber": "unit/office number",
        "floor": floor number or null,
        "area": area in sqm or null,
        "rooms": number of rooms or null
      }
    ]
  },
  "paymentTerms": "description of payment schedule",
  "specialTerms": "any special conditions or terms",
  "confidence": 0.0 to 1.0 (your confidence in the extraction accuracy)
}

Important:
- Extract dates in YYYY-MM-DD format
- Convert all monetary amounts to numbers without currency symbols
- If information is not found, use null
- Handle both Arabic and English text
- Look for common Arabic terms: عقد إيجار (lease contract), المؤجر (lessor), المستأجر (lessee), الإيجار الشهري (monthly rent)`;

export async function analyzeContractText(text: string): Promise<ContractAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Analyze the following contract text and extract the key information:\n\n${text}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const parsed = JSON.parse(content);
    return {
      ...parsed,
      rawText: text,
    };
  } catch (error) {
    console.error("Contract analysis error:", error);
    throw new Error("Failed to analyze contract");
  }
}

export async function analyzeContractImage(base64Image: string, mimeType: string = "image/png"): Promise<ContractAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this contract document image and extract all the key information. First read and transcribe all text, then extract the structured data."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const parsed = JSON.parse(content);
    return {
      ...parsed,
      rawText: parsed.rawText || "Extracted from image",
    };
  } catch (error) {
    console.error("Contract image analysis error:", error);
    throw new Error("Failed to analyze contract image");
  }
}
