import React, { useState, useEffect } from 'react';
import { generateCouplesMealPlan, CouplesMealPlan } from '@/services/gemini';
import { RefreshCw, Utensils, Coffee, Moon, Info, Sparkles, User, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface MealCardProps {
  title: string;
  maleContent: string;
  femaleContent: string;
  icon: React.ReactNode;
  delay: number;
}

function MealCard({ title, maleContent, femaleContent, icon, delay }: MealCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
          {icon}
        </div>
        <h3 className="font-serif font-bold text-stone-800">{title}</h3>
      </div>
      
      <div className="space-y-3">
        <div className="relative pl-3 border-l-2 border-blue-200">
          <div className="flex items-center gap-1.5 mb-1">
            <User size={12} className="text-blue-500" />
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">先生</span>
          </div>
          <p className="text-stone-600 text-sm leading-relaxed">{maleContent}</p>
        </div>
        
        <div className="relative pl-3 border-l-2 border-pink-200">
          <div className="flex items-center gap-1.5 mb-1">
            <User size={12} className="text-pink-500" />
            <span className="text-xs font-bold text-pink-600 uppercase tracking-wider">女士</span>
          </div>
          <p className="text-stone-600 text-sm leading-relaxed">{femaleContent}</p>
        </div>
      </div>
    </motion.div>
  );
}

interface DailyDietProps {
  isFastingDay: boolean;
}

export function DailyDiet({ isFastingDay }: DailyDietProps) {
  const [plan, setPlan] = useState<CouplesMealPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchPlan = async () => {
      setLoading(true);
      try {
        const todayKey = `couples_meal_plan_${new Date().toDateString()}_${isFastingDay}_${refreshKey}`;
        const saved = localStorage.getItem(todayKey);
        
        if (saved) {
          setPlan(JSON.parse(saved));
        } else {
          const newPlan = await generateCouplesMealPlan(isFastingDay);
          setPlan(newPlan);
          localStorage.setItem(todayKey, JSON.stringify(newPlan));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [isFastingDay, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Users size={20} className="text-emerald-600" />
            今日双人食谱
            {isFastingDay && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">轻断食日</span>}
          </h2>
          <p className="text-stone-500 text-xs mt-1">菜品一致，分量定制</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={cn(loading && "animate-spin")} />
          {loading ? "生成中..." : "换一换"}
        </button>
      </div>

      {plan ? (
        <div className="grid gap-4 md:grid-cols-3">
          <MealCard 
            title="早餐" 
            maleContent={plan.male.breakfast}
            femaleContent={plan.female.breakfast}
            icon={<Coffee size={18} />} 
            delay={0.1}
          />
          <MealCard 
            title="午餐" 
            maleContent={plan.male.lunch}
            femaleContent={plan.female.lunch}
            icon={<Utensils size={18} />} 
            delay={0.2}
          />
          <MealCard 
            title="晚餐" 
            maleContent={plan.male.dinner}
            femaleContent={plan.female.dinner}
            icon={<Moon size={18} />} 
            delay={0.3}
          />
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center gap-2 text-stone-300">
            <Sparkles size={32} />
            <span className="text-sm">正在为您规划双人饮食...</span>
          </div>
        </div>
      )}

      {plan && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-stone-50 rounded-xl p-4 border border-stone-100 flex gap-3 items-start"
        >
          <Info className="text-stone-400 shrink-0 mt-0.5" size={18} />
          <div className="space-y-1 w-full">
            <p className="text-sm font-medium text-stone-700">营养师建议</p>
            <p className="text-xs text-stone-500 leading-relaxed">{plan.tips}</p>
            <div className="flex gap-4 mt-2 text-xs font-mono">
              <span className="text-blue-600">先生: {plan.male.totalCalories}</span>
              <span className="text-pink-600">女士: {plan.female.totalCalories}</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
