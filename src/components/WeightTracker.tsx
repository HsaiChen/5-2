import React, { useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { format, parseISO } from "date-fns";
import { motion } from "motion/react";
import { Plus, Trash2, X, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type UserType = 'male' | 'female';

export interface WeightEntry {
  date: string;
  weight: number;
  user: UserType;
}

interface WeightTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  weights: WeightEntry[];
  onAddWeight: (date: string, weight: number, user: UserType) => void;
  onRemoveWeight: (date: string, user: UserType) => void;
}

export function WeightTracker({ isOpen, onClose, weights, onAddWeight, onRemoveWeight }: WeightTrackerProps) {
  const [newWeight, setNewWeight] = useState("");
  const [inputDate, setInputDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activeUser, setActiveUser] = useState<UserType>('male');

  const handleAdd = () => {
    if (!newWeight) return;
    const weightVal = parseFloat(newWeight);
    if (isNaN(weightVal)) return;

    onAddWeight(inputDate, weightVal, activeUser);
    setNewWeight("");
  };

  // Prepare data for chart
  // We need to group by date to have both lines on the same chart
  const processChartData = () => {
    const dataMap = new Map<string, { date: string; male?: number; female?: number }>();
    
    weights.forEach(w => {
      const existing = dataMap.get(w.date) || { date: w.date };
      if (w.user === 'male') existing.male = w.weight;
      if (w.user === 'female') existing.female = w.weight;
      dataMap.set(w.date, existing);
    });

    return Array.from(dataMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14);
  };

  const chartData = processChartData();

  // Filter list by active user
  const currentList = weights
    .filter(w => w.user === activeUser)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-emerald-50/50">
          <div>
            <h2 className="text-2xl font-bold text-emerald-900">家庭体重记录</h2>
            <p className="text-emerald-600/80 text-sm">双人同步，共同进步</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-emerald-100 rounded-full transition-colors text-emerald-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          
          {/* User Toggle */}
          <div className="flex p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setActiveUser('male')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all",
                activeUser === 'male' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <User size={16} /> 先生
            </button>
            <button
              onClick={() => setActiveUser('female')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all",
                activeUser === 'female' ? "bg-white text-pink-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <User size={16} /> 女士
            </button>
          </div>

          {/* Input Section */}
          <div className={cn(
            "flex gap-3 items-end p-4 rounded-2xl border shadow-sm transition-colors",
            activeUser === 'male' ? "bg-blue-50/50 border-blue-100" : "bg-pink-50/50 border-pink-100"
          )}>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">日期</label>
              <input 
                type="date" 
                value={inputDate}
                onChange={(e) => setInputDate(e.target.value)}
                className="w-full bg-white border-transparent focus:border-emerald-500 focus:ring-0 rounded-xl px-3 py-2 text-sm transition-all shadow-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">体重 (kg)</label>
              <input 
                type="number" 
                step="0.1"
                placeholder="0.0"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="w-full bg-white border-transparent focus:border-emerald-500 focus:ring-0 rounded-xl px-3 py-2 text-sm transition-all shadow-sm"
              />
            </div>
            <button 
              onClick={handleAdd}
              className={cn(
                "text-white p-2.5 rounded-xl transition-all shadow-md active:scale-95",
                activeUser === 'male' ? "bg-blue-500 hover:bg-blue-600 shadow-blue-200" : "bg-pink-500 hover:bg-pink-600 shadow-pink-200"
              )}
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Chart Section */}
          {chartData.length > 1 ? (
            <div className="h-64 w-full">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 ml-1">双人趋势对比</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(str) => format(parseISO(str), 'MM/dd')}
                    tick={{fontSize: 10, fill: '#9CA3AF'}}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    tick={{fontSize: 10, fill: '#9CA3AF'}}
                    axisLine={false}
                    tickLine={false}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                  />
                  <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/>
                  <Line 
                    name="先生"
                    type="monotone" 
                    dataKey="male" 
                    stroke="#3B82F6" 
                    strokeWidth={3} 
                    connectNulls
                    dot={{fill: '#3B82F6', strokeWidth: 2, r: 3, stroke: '#fff'}}
                    activeDot={{r: 5, strokeWidth: 0}}
                  />
                  <Line 
                    name="女士"
                    type="monotone" 
                    dataKey="female" 
                    stroke="#EC4899" 
                    strokeWidth={3} 
                    connectNulls
                    dot={{fill: '#EC4899', strokeWidth: 2, r: 3, stroke: '#fff'}}
                    activeDot={{r: 5, strokeWidth: 0}}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              记录更多数据以查看双人对比
            </div>
          )}

          {/* History List */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 ml-1">
              {activeUser === 'male' ? '先生' : '女士'}的历史记录
            </h3>
            <div className="space-y-2">
              {currentList.map((entry) => (
                <div key={`${entry.date}-${entry.user}`} className="flex justify-between items-center p-3 bg-gray-50 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 rounded-xl transition-all group">
                  <span className="text-gray-600 font-medium text-sm">
                    {format(parseISO(entry.date), 'yyyy年MM月dd日')}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-900">{entry.weight} <span className="text-xs font-normal text-gray-500">kg</span></span>
                    <button 
                      onClick={() => onRemoveWeight(entry.date, entry.user)}
                      className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {currentList.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-4">暂无记录</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
