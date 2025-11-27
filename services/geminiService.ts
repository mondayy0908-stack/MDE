import { GoogleGenAI, Type } from "@google/genai";
import { Customer, Phenotype } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// --- Fallback Data & Generators ---

const FALLBACK_NAMES = [
  "张大爷", "李科学", "植物学家小美", "豌豆射手", "僵尸博士", 
  "生物课代表", "隔壁老王", "农场主约翰", "孟德尔的粉丝", "遗传学助教"
];

const FALLBACK_DESCRIPTIONS = [
  "我需要做个实验，帮帮我。",
  "今天的汤缺了点配料，要特别的那种。",
  "帮我看看这个性状怎么遗传。",
  "我正在研究分离定律，需要素材。",
  "给我来点新鲜的种子！",
  "我要种满整个后院，用来观察变异。",
  "这可是为了科学！",
  "听说你这里有最好的豌豆？"
];

const FALLBACK_TIPS = [
  "记住：显性性状会掩盖隐性性状！",
  "杂合子(Aa)自交会产生 3:1 的性状分离比哦。",
  "想要得到隐性性状(aa)，亲本必须都含有隐性基因。",
  "测交（Test Cross）是用隐性纯合子(aabb)与未知个体杂交，能通过后代判断亲本基因型。",
  "F2 代中出现隐性性状的概率通常是 1/4。",
  "自由组合定律告诉我们，不同性状的遗传是互不干扰的。",
  "如果后代出现了性状分离，说明亲本中一定有杂合子。",
  "多积攒金币解锁更多土地，效率翻倍！",
  "一次杂交产生4个后代，正好对应遗传图解中的配子组合。",
  "纯合子(Purebred)的后代性状稳定，不会发生性状分离。"
];

const generateFallbackCustomer = (difficulty: number): Partial<Customer> => {
    // Random Phenotype
    const height: 'High' | 'Short' = Math.random() > 0.5 ? 'High' : 'Short';
    const shape: 'Round' | 'Wrinkled' = Math.random() > 0.5 ? 'Round' : 'Wrinkled';
    
    // Determine complexity based on difficulty (Level)
    
    // Level 1: Always Quantity 1, No Genotype req.
    // Level 2: Quantity 1-2, Very rare Genotype req.
    // Level 3+: Quantity 1-3, Frequent Genotype req.
    
    let maxQty = 1;
    let genotypeChance = 0;
    
    if (difficulty >= 2) {
        maxQty = 2;
        genotypeChance = 0.2;
    }
    if (difficulty >= 3) {
        maxQty = 3;
        genotypeChance = 0.4;
    }

    const quantity = Math.floor(Math.random() * maxQty) + 1;
    const isGenotypeRequest = Math.random() < genotypeChance;
    
    let genotypeReq: string | undefined = undefined;
    let description = FALLBACK_DESCRIPTIONS[Math.floor(Math.random() * FALLBACK_DESCRIPTIONS.length)];
    
    if (isGenotypeRequest) {
        // Request specific purebreds
        const h = height === 'High' ? 'AA' : 'aa';
        const s = shape === 'Round' ? 'BB' : 'bb';
        genotypeReq = h + s;
        description = "我需要纯种的豌豆进行严谨的实验！（基因型：" + genotypeReq + "）";
    } else {
        // Simple description variations
        if (difficulty === 1) {
            description = `只要是${height === 'High' ? '高茎' : '矮茎'}${shape === 'Round' ? '圆粒' : '皱粒'}的就好。`;
        }
    }

    return {
      name: FALLBACK_NAMES[Math.floor(Math.random() * FALLBACK_NAMES.length)],
      description: description,
      requirements: {
        quantity: quantity,
        phenotype: { height, shape },
        genotype: genotypeReq
      }
    };
};

// --- API Functions ---

// Helper to generate a random customer using Gemini
export const generateCustomer = async (difficulty: number): Promise<Partial<Customer>> => {
  const model = 'gemini-2.5-flash';

  // Customize prompt based on level
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

  const prompt = `
    为一款名为《孟德尔的豌豆花园》的教育游戏创建一个有趣的顾客。
    当前店铺等级: ${difficulty}。
    
    要求:
    1. 数量范围: ${quantityRange}。
    2. 复杂度: ${complexityInstruction}
    3. 请确保订单的多样性！不要只生成高茎圆粒。我们需要矮茎、皱粒的订单。
    
    请输出 JSON 格式:
    - name: 角色名字 (例如: "王大伯", "植物学家小美", "僵尸博士").
    - description: 一句简短有趣的中文背景故事。
    - requestType: "phenotype" (表型/外观) 或 "genotype" (基因型/纯种).
    - quantity: 数量 (整数).
    - traitHeight: "High" (高茎) 或 "Short" (矮茎). (请随机选择，务必保证约50%概率是矮茎)
    - traitShape: "Round" (圆粒) 或 "Wrinkled" (皱粒). (请随机选择，务必保证约50%概率是皱粒)
    - requirePurebred: boolean (如果 requestType 是 genotype，则为 true).
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            requestType: { type: Type.STRING },
            quantity: { type: Type.INTEGER },
            traitHeight: { type: Type.STRING },
            traitShape: { type: Type.STRING },
            requirePurebred: { type: Type.BOOLEAN },
          }
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    
    return {
      name: data.name || "神秘顾客",
      description: data.description || "我需要一些豌豆做实验。",
      requirements: {
        quantity: data.quantity || 1,
        phenotype: {
          height: (data.traitHeight as 'High' | 'Short') || 'High',
          shape: (data.traitShape as 'Round' | 'Wrinkled') || 'Round',
        },
        genotype: data.requirePurebred ? 
          (data.traitHeight === 'High' ? 'AA' : 'aa') + (data.traitShape === 'Round' ? 'BB' : 'bb') 
          : undefined
      }
    };

  } catch (error) {
    // Suppress heavy logging for rate limits to keep console clean, but warn dev.
    console.warn("Gemini API Unavailable (likely Rate Limit), using fallback generator.");
    
    // Use robust procedural generation
    return generateFallbackCustomer(difficulty);
  }
};

export const getTutorTip = async (context: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `你扮演孟德尔（遗传学之父）。请用中文给正在玩遗传学游戏的学生提供一句简短、鼓励性的提示或科学解释。
      场景: ${context}. 
      风格: 亲切、稍微带点幽默、富有教育意义。不要超过30个字。`,
    });
    return response.text || FALLBACK_TIPS[0];
  } catch (e) {
    // Return a random tip from the local library
    return FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
  }
};