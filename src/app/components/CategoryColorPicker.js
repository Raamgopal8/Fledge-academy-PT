'use client';

import React, { useState } from 'react';

export const PRESET_CATEGORY_COLORS = [
    { name: 'Indigo', value: '#4F46E5', bgClass: 'bg-[#4F46E5]' },
    { name: 'Blue', value: '#2563EB', bgClass: 'bg-[#2563EB]' },
    { name: 'Sky', value: '#0284C7', bgClass: 'bg-[#0284C7]' },
    { name: 'Teal', value: '#0D9488', bgClass: 'bg-[#0D9488]' },
    { name: 'Emerald', value: '#059669', bgClass: 'bg-[#059669]' },
    { name: 'Amber', value: '#D97706', bgClass: 'bg-[#D97706]' },
    { name: 'Orange', value: '#EA580C', bgClass: 'bg-[#EA580C]' },
    { name: 'Rose', value: '#E11D48', bgClass: 'bg-[#E11D48]' },
    { name: 'Purple', value: '#9333EA', bgClass: 'bg-[#9333EA]' },
    { name: 'Pink', value: '#DB2777', bgClass: 'bg-[#DB2777]' },
    { name: 'Slate', value: '#475569', bgClass: 'bg-[#475569]' }
];

// Helper to calculate text color & border based on background color luminance
export function getContrastTextColor(hexColor) {
    if (!hexColor || typeof hexColor !== 'string') return '#FFFFFF';
    let hex = hexColor.replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    if (hex.length !== 6) return '#FFFFFF';
    
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    
    // Perceived luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.65 ? '#1E293B' : '#FFFFFF';
}

export function CategoryBadge({ category, color, className = '' }) {
    if (!category) return null;
    
    // If a custom HEX or RGB color is assigned
    if (color && (color.startsWith('#') || color.startsWith('rgb'))) {
        const textColor = getContrastTextColor(color);
        return (
            <span 
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide shadow-xs border transition-all ${className}`}
                style={{
                    backgroundColor: color,
                    color: textColor,
                    borderColor: `${textColor === '#FFFFFF' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)'}`
                }}
            >
                {category}
            </span>
        );
    }

    // Default fallback styling
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 tracking-wide ${className}`}>
            {category}
        </span>
    );
}

export default function CategoryColorPicker({ 
    categoryName = '', 
    selectedColor = '#4F46E5', 
    onColorChange 
}) {
    const [hexInput, setHexInput] = useState(selectedColor || '#4F46E5');

    const handleColorSelect = (newColor) => {
        setHexInput(newColor);
        if (onColorChange) onColorChange(newColor);
    };

    const handleHexChange = (e) => {
        const val = e.target.value;
        setHexInput(val);
        if (/^#[0-9A-F]{6}$/i.test(val) || /^#[0-9A-F]{3}$/i.test(val)) {
            if (onColorChange) onColorChange(val);
        }
    };

    return (
        <div className="space-y-2.5 p-3.5 bg-surface-container-low dark:bg-slate-800/60 rounded-2xl border border-outline-variant/60">
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">palette</span>
                    <span>Category Label Color</span>
                </label>
                
                {/* Live Preview of the Custom Label Shape */}
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-on-surface-variant font-medium">Preview:</span>
                    <CategoryBadge 
                        category={categoryName || 'Sample Label'} 
                        color={selectedColor || '#4F46E5'} 
                    />
                </div>
            </div>

            {/* Color Swatches Grid */}
            <div className="flex flex-wrap items-center gap-2">
                {PRESET_CATEGORY_COLORS.map(c => {
                    const isSelected = selectedColor?.toLowerCase() === c.value.toLowerCase();
                    return (
                        <button
                            key={c.value}
                            type="button"
                            onClick={() => handleColorSelect(c.value)}
                            title={c.name}
                            className={`w-7 h-7 rounded-full transition-all flex items-center justify-center cursor-pointer shadow-xs ${
                                isSelected ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'hover:scale-105 opacity-90 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: c.value }}
                        >
                            {isSelected && (
                                <span className="material-symbols-outlined text-white text-[14px] font-bold drop-shadow-sm">
                                    check
                                </span>
                            )}
                        </button>
                    );
                })}

                {/* All Colors Selector Feature (Native HTML5 Color Picker + Pipette) */}
                <label 
                    className="relative w-7 h-7 rounded-full border border-outline-variant bg-gradient-to-tr from-rose-500 via-amber-400 to-indigo-600 flex items-center justify-center cursor-pointer hover:scale-105 shadow-xs transition-all overflow-hidden"
                    title="Choose any custom color"
                >
                    <input 
                        type="color" 
                        value={selectedColor?.startsWith('#') ? selectedColor : '#4F46E5'}
                        onChange={(e) => handleColorSelect(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <span className="material-symbols-outlined text-white text-[13px] font-bold drop-shadow-md">
                        colorize
                    </span>
                </label>
            </div>

            {/* Custom Hex Input */}
            <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-on-surface-variant font-medium">Custom Hex:</span>
                <div className="relative flex items-center">
                    <input 
                        type="text" 
                        value={hexInput}
                        onChange={handleHexChange}
                        placeholder="#4F46E5"
                        maxLength={7}
                        className="w-24 bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant rounded-lg px-2 py-1 text-xs font-mono uppercase text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                </div>
            </div>
        </div>
    );
}
