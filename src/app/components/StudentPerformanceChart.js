'use client';
// This component isolates the chart visualization.
// It uses SVG for visual fidelity right now, but can easily be replaced 
// with an interactive charting library (e.g., Recharts, Chart.js) 
// connected to a Python backend later.

export default function StudentPerformanceChart({ data }) {
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

    const pathD = points.length > 0 
        ? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}` 
        : '';
        
    const areaD = pathD ? `${pathD} L ${width},${height} L 0,${height} Z` : '';

    return (
        <div className="w-full h-64 mt-lg flex items-end justify-between gap-base relative">
            {/* Chart Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between opacity-10 pointer-events-none">
                <div className="border-t border-outline"></div>
                <div className="border-t border-outline"></div>
                <div className="border-t border-outline"></div>
                <div className="border-t border-outline"></div>
            </div>
            
            {/* SVG Visualization */}
            <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#265998" stopOpacity="0.3"></stop>
                        <stop offset="100%" stopColor="#265998" stopOpacity="0"></stop>
                    </linearGradient>
                </defs>
                <path d={pathD} fill="none" stroke="#265998" strokeWidth="0.8"></path>
                <path d={areaD} fill="url(#chartGradient)"></path>
                
                {/* Interactive Dots */}
                {points.map((p, i) => (
                    <circle key={i} className="hover:r-2 transition-all cursor-pointer" cx={p.x} cy={p.y} fill="#265998" r="1.5">
                        <title>{`${p.name}: ${p.score}`}</title>
                    </circle>
                ))}
            </svg>
            
            {/* Labels */}
            <div className="absolute bottom-[-24px] left-0 w-full font-label-sm text-label-sm text-outline">
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
