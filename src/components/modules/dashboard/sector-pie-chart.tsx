'use client';

import React, { useState } from 'react';

interface SectorDemandItem {
  id: string;
  name: string;
  slug: string;
  count: number;
}

interface SectorPieChartProps {
  sectors: SectorDemandItem[];
  totalTickets: number;
}

const PALETTE = [
  { fill: '#2563EB', bg: 'bg-blue-600', text: 'text-blue-600' },
  { fill: '#F59E0B', bg: 'bg-amber-500', text: 'text-amber-500' },
  { fill: '#8B5CF6', bg: 'bg-purple-500', text: 'text-purple-500' },
  { fill: '#10B981', bg: 'bg-emerald-500', text: 'text-emerald-500' },
  { fill: '#F43F5E', bg: 'bg-rose-500', text: 'text-rose-500' },
  { fill: '#06B6D4', bg: 'bg-cyan-500', text: 'text-cyan-500' },
];

export function SectorPieChart({ sectors, totalTickets }: SectorPieChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Filtra apenas setores que possuem dados ou exibe todos se todos forem 0
  const activeSectors = sectors.filter((s) => s.count > 0);
  const displaySectors = activeSectors.length > 0 ? activeSectors : sectors;

  // Cálculo dos arcos do Donut Chart (Raio = 40, Centro = 50, 50, Circunferência = 2 * PI * 40 ≈ 251.327)
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  const slices = displaySectors.map((sector, index) => {
    const percentage = totalTickets > 0 ? sector.count / totalTickets : 0;
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedOffset;
    accumulatedOffset += percentage * circumference;

    const color = PALETTE[index % PALETTE.length] ?? PALETTE[0]!;
    return {
      ...sector,
      percentage: Math.round(percentage * 100),
      strokeDasharray,
      strokeDashoffset,
      color,
      index,
    };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
      {/* Visual Donut Chart SVG */}
      <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
        {totalTickets === 0 ? (
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#E2E8F0"
              strokeWidth="14"
            />
          </svg>
        ) : (
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Fundo do Donut */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#F1F5F9"
              strokeWidth="14"
            />
            {/* Arcos de cada setor */}
            {slices.map((slice) => (
              <circle
                key={slice.id}
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke={slice.color.fill}
                strokeWidth={hoveredIdx === slice.index ? 16 : 14}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                strokeLinecap="butt"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(slice.index)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            ))}
          </svg>
        )}

        {/* Informação Centralizada no Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            {totalTickets}
          </span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            {totalTickets === 1 ? 'Chamado' : 'Chamados'}
          </span>
        </div>
      </div>

      {/* Legenda Lateral Interativa */}
      <div className="flex-1 w-full space-y-2.5">
        {displaySectors.map((sector, index) => {
          const color = PALETTE[index % PALETTE.length] ?? PALETTE[0]!;
          const pct = totalTickets > 0 ? Math.round((sector.count / totalTickets) * 100) : 0;
          const isHovered = hoveredIdx === index;

          return (
            <div
              key={sector.id}
              className={`flex items-center justify-between p-2 rounded-xl text-xs transition cursor-pointer ${
                isHovered ? 'bg-slate-50 font-bold' : 'hover:bg-slate-50/60'
              }`}
              onMouseEnter={() => setHoveredIdx(index)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-3 h-3 rounded-full shrink-0 ${color.bg}`}
                  style={{ backgroundColor: color.fill }}
                />
                <span className="font-semibold text-slate-700 truncate max-w-[150px] sm:max-w-[180px]">
                  {sector.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-bold text-slate-900">{sector.count}</span>
                <span className="text-slate-400 text-[11px] font-medium min-w-[32px] text-right">
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
