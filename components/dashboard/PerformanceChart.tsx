import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

export const CHART_DATA = [
    { name: 'Jan', hold: 4000, strategy: 4000 },
    { name: 'Feb', hold: 8000, strategy: 8200 },
    { name: 'Mar', hold: 12000, strategy: 12500 },
    { name: 'Apr', hold: 16000, strategy: 16900 },
    { name: 'May', hold: 20000, strategy: 21500 },
    { name: 'Jun', hold: 24000, strategy: 26200 },
];

export const PerformanceChart: React.FC = () => {
    return (
        <div className="bg-white border border-black p-8 h-full flex flex-col justify-center">
            <h3 className="font-serif italic text-3xl mb-8">Performance</h3>
            {/* Chart Container - Fixed height, no flex-grow to allow centering */}
            <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={CHART_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" fontFamily="Inter" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                        <YAxis fontFamily="Inter" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                        <Tooltip
                            contentStyle={{ border: '1px solid black', borderRadius: '0px', fontFamily: 'Inter' }}
                            itemStyle={{ color: 'black' }}
                        />
                        <Area type="monotone" dataKey="strategy" stackId="1" stroke="#FF4444" fill="#FF4444" fillOpacity={0.1} strokeWidth={2} />
                        <Area type="monotone" dataKey="hold" stackId="2" stroke="#000000" fill="transparent" strokeDasharray="4 4" strokeWidth={1} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-6 text-xs font-sans font-bold uppercase text-gray-400 shrink-0">
                <span className="flex items-center gap-2"><div className="w-2 h-2 bg-black rounded-full"></div> Standard Hold</span>
                <span className="flex items-center gap-2"><div className="w-2 h-2 bg-swiss-red rounded-full"></div> Aqua0 Strategy</span>
            </div>
        </div>
    );
};
