import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface UserMealPlan {
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks?: string;
  totalCalories: string;
}

export interface CouplesMealPlan {
  male: UserMealPlan;
  female: UserMealPlan;
  tips: string;
}

export async function generateCouplesMealPlan(isFastingDay: boolean): Promise<CouplesMealPlan> {
  const dayType = isFastingDay ? "轻断食日 (Fasting Day)" : "正常饮食日 (Normal Day)";
  
  const prompt = `
    请为一对中国夫妻设计一份"${dayType}"的一日三餐食谱。
    
    参考标准：
    北京协和医院"5+2轻断食"方案。
    
    热量目标：
    - 轻断食日：男士约600千卡，女士约500千卡。
    - 正常日：男士约1500-1800千卡，女士约1200-1500千卡。
    
    核心要求：
    1. **菜品一致性**：男女双方吃的食物种类（菜名）必须完全一样，方便家庭烹饪。
    2. **分量差异**：通过调整分量（如主食克数、肉类克数、鸡蛋数量）来满足不同的热量需求。
    3. 食物具体，符合中式家常菜习惯。
    
    返回JSON格式：
    {
      "male": { "breakfast": "...", "lunch": "...", "dinner": "...", "totalCalories": "..." },
      "female": { "breakfast": "...", "lunch": "...", "dinner": "...", "totalCalories": "..." },
      "tips": "..."
    }
    
    在描述中请明确标注分量，例如："杂粮粥(男1碗/女半碗) + 水煮蛋(男2个/女1个)"。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            male: {
              type: Type.OBJECT,
              properties: {
                breakfast: { type: Type.STRING },
                lunch: { type: Type.STRING },
                dinner: { type: Type.STRING },
                snacks: { type: Type.STRING },
                totalCalories: { type: Type.STRING },
              },
              required: ["breakfast", "lunch", "dinner", "totalCalories"],
            },
            female: {
              type: Type.OBJECT,
              properties: {
                breakfast: { type: Type.STRING },
                lunch: { type: Type.STRING },
                dinner: { type: Type.STRING },
                snacks: { type: Type.STRING },
                totalCalories: { type: Type.STRING },
              },
              required: ["breakfast", "lunch", "dinner", "totalCalories"],
            },
            tips: { type: Type.STRING },
          },
          required: ["male", "female", "tips"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as CouplesMealPlan;
  } catch (error) {
    console.error("Failed to generate meal plan:", error);
    // Fallback data
    if (isFastingDay) {
      return {
        male: {
          breakfast: "水煮鸡蛋2个 + 脱脂牛奶250ml",
          lunch: "苹果1个(200g) + 黄瓜1根",
          dinner: "全麦面包1片 + 水煮鸡胸肉100g + 烫青菜300g",
          totalCalories: "约600千卡"
        },
        female: {
          breakfast: "水煮鸡蛋1个 + 脱脂牛奶200ml",
          lunch: "苹果1个(150g) + 黄瓜1根",
          dinner: "水煮鸡胸肉50g + 烫青菜250g",
          totalCalories: "约500千卡"
        },
        tips: "轻断食日请多喝水，避免剧烈运动。男士基础代谢较高，蛋白质摄入稍多。"
      };
    } else {
      return {
        male: {
          breakfast: "肉包子2个 + 豆浆1杯 + 鸡蛋1个",
          lunch: "米饭1.5碗 + 青椒肉丝(肉100g) + 炒时蔬",
          dinner: "馒头1个 + 清蒸鱼150g + 凉拌海带",
          totalCalories: "约1700千卡"
        },
        female: {
          breakfast: "菜包子1个 + 豆浆1杯 + 鸡蛋1个",
          lunch: "米饭1碗 + 青椒肉丝(肉50g) + 炒时蔬",
          dinner: "杂粮粥1碗 + 清蒸鱼80g + 凉拌海带",
          totalCalories: "约1300千卡"
        },
        tips: "正常饮食日也要注意细嚼慢咽，只吃七分饱。家庭烹饪时少油少盐。"
      };
    }
  }
}
