/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { WeightTracker, UserType } from '@/components/WeightTracker';
import { DailyDiet } from '@/components/DailyDiet';
import { Calendar, ChevronDown, Activity, Scale, Info, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

// Default fasting days: Monday (1) and Thursday (4)
const DEFAULT_FASTING_DAYS = [1, 4];

export default function App() {
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [fastingDays, setFastingDays] = useState<number[]>(() => {
    const saved = localStorage.getItem('fasting_days');
    return saved ? JSON.parse(saved) : DEFAULT_FASTING_DAYS;
  });
  
  // Weights state lifted from WeightTracker
  const [weights, setWeights] = useState<Array<{date: string, weight: number, user: UserType}>>(() => {
    const saved = localStorage.getItem('weight_history');
    // Migration for old data format if needed, or just default to empty
    // Old format was {date, weight}. We can assume 'male' or just reset.
    // Let's try to migrate safely.
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0 && !parsed[0].user) {
        return parsed.map((p: any) => ({ ...p, user: 'male' }));
      }
      return parsed;
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('weight_history', JSON.stringify(weights));
  }, [weights]);

  const addWeight = (date: string, weight: number, user: UserType) => {
    setWeights(prev => {
      // Remove existing entry for same date AND user
      const filtered = prev.filter(w => !(w.date === date && w.user === user));
      const updated = [...filtered, { date, weight, user }];
      return updated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
  };

  const removeWeight = (date: string, user: UserType) => {
    setWeights(prev => prev.filter(w => !(w.date === date && w.user === user)));
  };

  // Calculate latest weights
  const getLatestWeight = (user: UserType) => {
    const userWeights = weights.filter(w => w.user === user);
    return userWeights.length > 0 
      ? [...userWeights].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].weight 
      : null;
  };

  const maleWeight = getLatestWeight('male');
  const femaleWeight = getLatestWeight('female');

  const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const isFastingDay = fastingDays.includes(dayOfWeek);

  const toggleFastingDay = (dayIndex: number) => {
    setFastingDays(prev => {
      const newDays = prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex];
      localStorage.setItem('fasting_days', JSON.stringify(newDays));
      return newDays;
    });
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-stone-800 font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold font-serif">
              5+2
            </div>
            <h1 className="font-bold text-lg tracking-tight text-stone-900">协和减重助手 <span className="text-xs font-normal text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full ml-1">家庭版</span></h1>
          </div>
          <div className="text-xs font-medium text-stone-500 bg-stone-100 px-3 py-1 rounded-full">
            {format(currentDate, 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        
        {/* Status Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-3xl p-8 text-center relative overflow-hidden shadow-sm transition-colors duration-500",
            isFastingDay ? "bg-emerald-900 text-emerald-50" : "bg-white text-stone-900 border border-stone-100"
          )}
        >
          {/* Background Pattern */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <svg width="100%" height="100%">
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="currentColor" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 mb-4 opacity-80">
              <Activity size={16} />
              <span className="text-sm font-medium tracking-widest uppercase">今日状态</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              {isFastingDay ? "轻断食日" : "正常饮食日"}
            </h2>
            <p className={cn("max-w-md mx-auto text-sm md:text-base opacity-80", isFastingDay ? "text-emerald-200" : "text-stone-500")}>
              {isFastingDay 
                ? "今日目标：控制热量摄入（男~600/女~500千卡），给身体一个休息的机会。" 
                : "今日目标：营养均衡（男~1800/女~1500千卡），享受美食但不过量。"}
            </p>
          </div>
        </motion.div>

        {/* Weekly Schedule Config */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-stone-800 text-sm flex items-center gap-2">
              <Calendar size={16} className="text-emerald-600" />
              本周计划
            </h3>
            <span className="text-xs text-stone-400">点击切换断食日</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, index) => {
              const isFasting = fastingDays.includes(index);
              const isToday = dayOfWeek === index;
              return (
                <button
                  key={index}
                  onClick={() => toggleFastingDay(index)}
                  className={cn(
                    "flex flex-col items-center justify-center py-3 rounded-xl text-sm transition-all relative overflow-hidden",
                    isFasting 
                      ? "bg-emerald-100 text-emerald-800 font-bold ring-1 ring-emerald-200" 
                      : "bg-stone-50 text-stone-500 hover:bg-stone-100",
                    isToday && "ring-2 ring-emerald-500 ring-offset-2"
                  )}
                >
                  <span className="text-xs mb-1 opacity-60">周</span>
                  {day}
                  {isFasting && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500/30" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Weight Section - Dual Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 grid grid-cols-2 md:grid-cols-1 gap-4">
            {/* Male Card */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsWeightModalOpen(true)}
              className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 cursor-pointer group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <User size={16} />
                </div>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">先生</span>
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-stone-900">
                    {maleWeight ? maleWeight : "--"}
                  </span>
                  <span className="text-xs text-stone-500">kg</span>
                </div>
              </div>
            </motion.div>

            {/* Female Card */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsWeightModalOpen(true)}
              className="bg-white p-5 rounded-2xl shadow-sm border border-pink-100 cursor-pointer group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="p-1.5 bg-pink-50 text-pink-600 rounded-lg">
                  <User size={16} />
                </div>
                <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">女士</span>
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-stone-900">
                    {femaleWeight ? femaleWeight : "--"}
                  </span>
                  <span className="text-xs text-stone-500">kg</span>
                </div>
              </div>
            </motion.div>
            
            <div className="col-span-2 md:col-span-1 text-center">
               <button 
                 onClick={() => setIsWeightModalOpen(true)}
                 className="text-xs text-stone-400 hover:text-emerald-600 transition-colors flex items-center justify-center gap-1 w-full py-2"
               >
                 <Scale size={12} />
                 记录体重
               </button>
            </div>
          </div>

          {/* Diet Section */}
          <div className="md:col-span-2">
             <DailyDiet isFastingDay={isFastingDay} />
          </div>
        </div>

        {/* Info Footer */}
        <div className="mt-12 pt-8 border-t border-stone-200 text-center">
          <p className="text-xs text-stone-400 flex items-center justify-center gap-1">
            <Info size={12} />
            建议仅供参考，特殊人群请遵医嘱
          </p>
        </div>

      </main>

      <AnimatePresence>
        {isWeightModalOpen && (
          <WeightTracker 
            isOpen={isWeightModalOpen} 
            onClose={() => setIsWeightModalOpen(false)} 
            weights={weights}
            onAddWeight={addWeight}
            onRemoveWeight={removeWeight}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

