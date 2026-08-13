'use client';
import { useState } from 'react';
// This component isolates the chart visualization.
// It uses SVG for visual fidelity right now, but can easily be replaced 
// with an interactive charting library (e.g., Recharts, Chart.js) 
// connected to a Python backend later.

export default function StudentPerformanceChart({ data }) {
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const chartData = data && data.length > 0 ? data : [];

    if (chartData.length === 0) {
        return (
            <div className="w-full h-64 mt-lg flex items-center justify-center">
                <p className="font-label-md text-outline">No performance data available</p>
            </div>
        );
    }

    const maxScore = 100;
    const width = 100;
    const height = 40;
    
    // Map data to SVG points
    const points = chartData.map((item, index) => {
        const x = (index / (chartData.length - 1)) * width;
        const y = height - (item.score / maxScore) * height;
        return { x, y, name: item.name, score: item.score };
    });

    // Smooth curve generation using cubic bezier
    const getControlPoint = (current, previous, next, reverse) => {
        const p = previous || current;
        const n = next || current;
        const smoothing = 0.15; // smooth factor
        const lengthX = n.x - p.x;
        const lengthY = n.y - p.y;
        const angle = Math.atan2(lengthY, lengthX);
        const length = Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)) * smoothing;
        const x = current.x + Math.cos(angle + (reverse ? Math.PI : 0)) * length;
        const y = current.y + Math.sin(angle + (reverse ? Math.PI : 0)) * length;
        return { x, y };
    };

    const bezierCommand = (point, i, a) => {
        const cps = getControlPoint(a[i - 1], a[i - 2], point, false);
        const cpe = getControlPoint(point, a[i - 1], a[i + 1], true);
        return `C ${cps.x},${cps.y} ${cpe.x},${cpe.y} ${point.x},${point.y}`;
    };

    const pathD = points.length > 0 
        ? points.reduce((acc, point, i, a) => i === 0 ? `M ${point.x},${point.y}` : `${acc} ${bezierCommand(point, i, a)}`, '')
        : '';
        
    const areaD = pathD ? `${pathD} L ${width},${height} L 0,${height} Z` : '';

    return (
        <div className="w-full h-64 mt-lg flex items-end justify-between gap-base relative">
            {/* Chart Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between opacity-30 pointer-events-none">
                <div className="border-t border-outline-variant border-dashed"></div>
                <div className="border-t border-outline-variant border-dashed"></div>
                <div className="border-t border-outline-variant border-dashed"></div>
                <div className="border-t border-outline-variant border-dashed"></div>
                <div className="border-t border-outline-variant border-dashed"></div>
            </div>
            
            {/* SVG Visualization */}
            <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="chartGradientLine" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="#465AA3"></stop>
                        <stop offset="50%" stopColor="#5D8BCC"></stop>
                        <stop offset="100%" stopColor="#6FB7E4"></stop>
                    </linearGradient>
                    <linearGradient id="chartGradientFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#5D8BCC" stopOpacity="0.4"></stop>
                        <stop offset="100%" stopColor="#5D8BCC" stopOpacity="0"></stop>
                    </linearGradient>
                </defs>
                <path d={pathD} fill="none" stroke="url(#chartGradientLine)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d={areaD} fill="url(#chartGradientFill)"></path>
                
                {/* Interactive Dots */}
                {points.map((p, i) => (
                    <circle 
                        key={i} 
                        className="transition-all cursor-pointer origin-center hover:scale-150 shadow-sm" 
                        cx={p.x} cy={p.y} 
                        fill={hoveredPoint?.name === p.name ? "#265998" : "#5D8BCC"} 
                        r="1.5"
                        onMouseEnter={() => setHoveredPoint(p)}
                        onMouseLeave={() => setHoveredPoint(null)}
                    >
                    </circle>
                ))}
            </svg>
            
            {/* Hover Tooltip */}
            {hoveredPoint && (
                <div 
                    className="absolute bg-white shadow-lg rounded-lg px-3 py-2 text-sm font-medium z-10 whitespace-nowrap transform -translate-x-1/2 pointer-events-none border border-outline-variant transition-all animate-in fade-in zoom-in duration-200"
                    style={{ 
                        left: `${hoveredPoint.x}%`, 
                        bottom: `calc(${(hoveredPoint.score / maxScore) * 100}% + 15px)` 
                    }}
                >
                    <div className="font-bold text-on-surface">{hoveredPoint.name}</div>
                    <div className="text-on-surface-variant font-normal">Score: {hoveredPoint.score}</div>
                </div>
            )}
            
            {/* Labels */}
            <div className="absolute bottom-[-24px] left-0 w-full font-label-sm text-label-sm text-on-surface-variant">
                {points.map((p, i) => (
                    <span 
                        key={i} 
                        className="absolute text-center w-8 -ml-4" 
                        style={{ left: `${p.x}%` }}
                    >
                        {p.name}
                    </span>
                ))}
            </div>
        </div>
    );
}

