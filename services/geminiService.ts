import { Customer } from '../types';

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

// --- Backend Proxy Logic ---

export const generateCustomer = async (difficulty: number): Promise<Partial<Customer>> => {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'generate_customer',
        payload: { difficulty }
      })
    });

    if (!response.ok) throw new Error('Backend API Error');

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn("API Error, using fallback generator.", error);
    return generateFallbackCustomer(difficulty);
  }
};

export const getTutorTip = async (context: string): Promise<string> => {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'get_tip',
        payload: { context }
      })
    });

    if (!response.ok) throw new Error('Backend API Error');

    const data = await response.json();
    return data.text || FALLBACK_TIPS[0];
  } catch (e) {
    return FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
  }
};
