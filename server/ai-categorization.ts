import { invokeLLM } from "./_core/llm";
import * as db from "./db";

/**
 * AI-powered expense categorization using LLM
 * Analyzes transaction description and merchant to suggest the best category
 */
export async function categorizeExpenseWithAI(
  userId: number,
  description: string,
  merchant?: string,
  categories?: Array<{ id: number; name: string }>
): Promise<{ categoryId: number; confidence: string }> {
  try {
    // Check if we have learned patterns for this description/merchant
    const learned = await db.getCategoryLearningByDescriptionAndMerchant(
      userId,
      description,
      merchant
    );

    if (learned && learned.length > 0) {
      // Use the highest confidence learned pattern
      const topMatch = learned[0];
      return {
        categoryId: topMatch.categoryId,
        confidence: topMatch.confidence.toString(),
      };
    }

    // If no learned pattern, use LLM to categorize
    const categoryList = categories
      ?.map((c) => `${c.id}: ${c.name}`)
      .join(", ") || "1: Food, 2: Transportation, 3: Entertainment, 4: Utilities, 5: Healthcare, 6: Shopping, 7: Other";

    const prompt = `You are a financial categorization expert. Given a transaction description and merchant, categorize it into the most appropriate category.

Transaction Description: "${description}"
Merchant: "${merchant || "Not specified"}"

Available Categories:
${categoryList}

Respond with ONLY a JSON object in this format:
{
  "categoryId": <number>,
  "confidence": <number between 0 and 1>,
  "reasoning": "<brief explanation>"
}

Be precise and confident in your categorization.`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a financial transaction categorization expert. Respond only with valid JSON.",
        },
        {
          role: "user",
          content: prompt as any,
        },
      ] as any,
    });

    // Parse the response
    const content = (response.choices[0]?.message?.content || "{}") as string;
    const result = JSON.parse(content);

    // Record this categorization for future learning
    if (result.categoryId) {
      await db.recordCategoryLearning({
        userId,
        description,
        merchant: merchant || null,
        categoryId: result.categoryId,
        confidence: result.confidence || 0.7,
        correctionCount: 0,
      });
    }

    return {
      categoryId: result.categoryId || 1,
      confidence: Math.min(Math.max(result.confidence || 0.7, 0), 1).toString(),
    };
  } catch (error) {
    console.error("[AI Categorization] Error:", error);
    // Fallback to a default category on error
    return {
      categoryId: 1,
      confidence: "0.3",
    };
  }
}

/**
 * Improve categorization accuracy based on user corrections
 */
export async function recordCategoryCorrection(
  userId: number,
  description: string,
  merchant: string | undefined,
  correctCategoryId: number
): Promise<void> {
  try {
    // Find existing learning record
    const learned = await db.getCategoryLearningByDescriptionAndMerchant(
      userId,
      description,
      merchant
    );

    if (learned && learned.length > 0) {
      // Update existing record with correction count
      const record = learned.find((l: any) => l.categoryId === correctCategoryId);
      if (record) {
        // Increase confidence for correct category
        const newConfidence = Math.min(
          parseFloat(record.confidence.toString()) + 0.1,
          0.95
        );
        // Note: Would need an update method in db.ts
      }
    } else {
      // Record new learning with higher confidence
      await db.recordCategoryLearning({
        userId,
        description,
        merchant: merchant || undefined,
        categoryId: correctCategoryId,
        confidence: "0.85",
        correctionCount: 1,
      });
    }
  } catch (error) {
    console.error("[Category Correction] Error:", error);
  }
}

/**
 * Extract expense details from receipt text using LLM
 */
export async function extractReceiptDetails(
  receiptText: string
): Promise<{
  amount?: number;
  merchant?: string;
  date?: string;
  items?: Array<{ name: string; price: number }>;
  confidence: string;
}> {
  try {
    const prompt = `You are a receipt parsing expert. Extract key information from this receipt text.

Receipt Text:
${receiptText}

Extract and return ONLY a JSON object with this structure:
{
  "amount": <total amount as number>,
  "merchant": "<store/business name>",
  "date": "<date in YYYY-MM-DD format, or null if not found>",
  "items": [
    {"name": "<item name>", "price": <price as number>}
  ],
  "confidence": <number between 0 and 1 indicating extraction quality>
}

Be accurate and extract only information that is clearly visible in the receipt.`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a receipt parsing expert. Respond only with valid JSON.",
        },
        {
          role: "user",
          content: prompt as any,
        },
      ] as any,
    });

    const content = (response.choices[0]?.message?.content || "{}") as string;
    const result = JSON.parse(content);

    return {
      amount: result.amount,
      merchant: result.merchant,
      date: result.date,
      items: result.items || [],
      confidence: Math.min(Math.max(result.confidence || 0.5, 0), 1).toString(),
    };
  } catch (error) {
    console.error("[Receipt Extraction] Error:", error);
    return {
      confidence: "0",
    };
  }
}
