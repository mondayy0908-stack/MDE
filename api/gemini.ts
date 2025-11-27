export const config = {
  runtime: 'edge',
};

// Type definitions to avoid dependencies
interface RequestBody {
  action: 'generate_customer' | 'get_tip';
  payload: any;
}

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing API Key configuration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { action, payload } = (await request.json()) as RequestBody;
    let systemInstruction = "";
    let prompt = "";
    let jsonSchema = null;

    if (action === 'generate_customer') {
      const { difficulty } = payload;
      
      let quantityRange = "1";
      let complexityInstruction = "只要求表型 (Phenotype)，不要要求特定基因型 (Genotype)。";
      
      if (difficulty >= 2) {
          quantityRange = "1-2";
          complexityInstruction = "主要要求表型，偶尔(20%)可以要求纯种 (Purebred/Genotype)。";
      }
      if (difficulty >= 3) {
          quantityRange = "1-3";
          complexityInstruction = "混合要求，可以要求特定的基因型 (如 AABB, aabb)。";
      }

      systemInstruction = `你是一个教育游戏《孟德尔的豌豆花园》的内容生成引擎。请输出纯 JSON。`;
      prompt = `
        创建一个有趣的顾客。
        当前店铺等级: ${difficulty}。
        1. 数量范围: ${quantityRange}。
        2. 复杂度: ${complexityInstruction}
        3. 请确保订单的多样性！不要只生成高茎圆粒。我们需要矮茎、皱粒的订单。
        
        请输出 JSON:
        {
          "name": "名字",
          "description": "简短背景故事",
          "requestType": "phenotype 或 genotype",
          "quantity": 数量(Int),
          "traitHeight": "High 或 Short",
          "traitShape": "Round 或 Wrinkled",
          "requirePurebred": boolean
        }
      `;
      
      // JSON Schema for Gemini
      jsonSchema = {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          description: { type: "STRING" },
          requestType: { type: "STRING" },
          quantity: { type: "INTEGER" },
          traitHeight: { type: "STRING" },
          traitShape: { type: "STRING" },
          requirePurebred: { type: "BOOLEAN" },
        }
      };

    } else if (action === 'get_tip') {
      const { context } = payload;
      systemInstruction = "你扮演孟德尔（遗传学之父）。给学生提供简短、幽默、有教育意义的中文提示。不要超过30个字。";
      prompt = `场景: ${context}`;
    } else {
      return new Response('Invalid Action', { status: 400 });
    }

    // Call Gemini API
    const geminiBody: any = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
          temperature: 0.7,
      }
    };

    if (systemInstruction) {
        geminiBody.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    if (jsonSchema) {
        geminiBody.generationConfig.responseMimeType = "application/json";
        geminiBody.generationConfig.responseSchema = jsonSchema;
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody)
    });

    if (!response.ok) {
        const errText = await response.text();
        return new Response(JSON.stringify({ error: 'Gemini API Error', details: errText }), { 
            status: response.status,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const data = await response.json();
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResult) {
         return new Response(JSON.stringify({ error: 'No content generated' }), { status: 500 });
    }

    let finalResponse;
    if (action === 'generate_customer') {
        const parsed = JSON.parse(textResult);
        // Map raw JSON to application Customer structure
        finalResponse = {
            name: parsed.name || "神秘顾客",
            description: parsed.description || "...",
            requirements: {
                quantity: parsed.quantity || 1,
                phenotype: {
                    height: (parsed.traitHeight === 'High' || parsed.traitHeight === 'Short') ? parsed.traitHeight : 'High',
                    shape: (parsed.traitShape === 'Round' || parsed.traitShape === 'Wrinkled') ? parsed.traitShape : 'Round',
                },
                genotype: parsed.requirePurebred ? 
                    (parsed.traitHeight === 'High' ? 'AA' : 'aa') + (parsed.traitShape === 'Round' ? 'BB' : 'bb') 
                    : undefined
            }
        };
    } else {
        finalResponse = { text: textResult };
    }

    return new Response(JSON.stringify(finalResponse), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}