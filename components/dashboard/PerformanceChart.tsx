import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { SablierStream } from '../../hooks/useSablierStreams';

interface PerformanceChartProps {
    stream: SablierStream | null;
}

// Generate simulated performance data based on stream
function generateChartData(stream: SablierStream | null) {
    if (!stream) {
        return [
            { name: 'Jan', hold: 0, strategy: 0 },
            { name: 'Feb', hold: 0, strategy: 0 },
            { name: 'Mar', hold: 0, strategy: 0 },
            { name: 'Apr', hold: 0, strategy: 0 },
            { name: 'May', hold: 0, strategy: 0 },
            { name: 'Jun', hold: 0, strategy: 0 },
        ];
    }

    const withdrawable = parseFloat(stream.formattedWithdrawable);
    const ratePerMonth = parseFloat(stream.formattedRatePerSecond) * 30 * 24 * 60 * 60;

    // Simulate 6 months of data
    const data = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

    for (let i = 0; i < 6; i++) {
        const holdValue = ratePerMonth * (i + 1);
        // Strategy earns ~15% more due to LP rewards
        const strategyValue = holdValue * (1 + 0.025 * (i + 1));

        data.push({
            name: months[i],
            hold: Math.round(holdValue * 100) / 100,
            strategy: Math.round(strategyValue * 100) / 100,
        });
    }

    return data;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ stream }) => {
    const chartData = generateChartData(stream);
    const tokenSymbol = stream?.tokenSymbol || 'USD';

    return (
        <div className="bg-white border border-black p-8 h-full flex flex-col justify-center">
            <h3 className="font-serif italic text-3xl mb-8">Performance</h3>
            {/* Chart Container */}
            <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" fontFamily="Inter" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                        <YAxis
                            fontFamily="Inter"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => {
                                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
                                return value.toFixed(0);
                            }}
                        />
                        <Tooltip
                            contentStyle={{ border: '1px solid black', borderRadius: '0px', fontFamily: 'Inter' }}
                            itemStyle={{ color: 'black' }}
                            formatter={(value: number) => [`${value.toFixed(2)} ${tokenSymbol}`, '']}
                        />
                        <Area type="monotone" dataKey="strategy" stackId="1" stroke="#FF4444" fill="#FF4444" fillOpacity={0.1} strokeWidth={2} />
                        <Area type="monotone" dataKey="hold" stackId="2" stroke="#000000" fill="transparent" strokeDasharray="4 4" strokeWidth={1} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-6 text-xs font-sans font-bold uppercase text-gray-400 shrink-0">
                <span className="flex items-center gap-2"><div className="w-2 h-2 bg-black rounded-full"></div> Standard Hold</span>
                <span className="flex items-center gap-2"><div className="w-2 h-2 bg-swiss-red rounded-full"></div> FlowState Strategy</span>
            </div>
        </div>
    );
};
