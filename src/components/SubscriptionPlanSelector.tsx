"use client"

import React from 'react';
import { PLAN_FEATURES, SubscriptionPlan } from '@/lib/constants/plans';
import { Rocket, Trophy, Gem, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubscriptionPlanSelectorProps {
    selectedPlan: SubscriptionPlan | null;
    onSelect: (plan: SubscriptionPlan) => void;
}

export function SubscriptionPlanSelector({ selectedPlan, onSelect }: SubscriptionPlanSelectorProps) {
    const planIcons: Record<SubscriptionPlan, React.ReactNode> = {
        STARTER: <Rocket className="w-6 h-6 text-black" />,
        PRO: <Trophy className="w-6 h-6 text-black" />,
        BUSINESS: <Gem className="w-6 h-6 text-black" />,
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 w-full h-full pb-2">
            {(Object.keys(PLAN_FEATURES) as SubscriptionPlan[]).map((planKey) => {
                const planConfig = PLAN_FEATURES[planKey];
                const isSelected = selectedPlan === planKey;

                const baseStyle = {
                    STARTER: 'bg-white hover:bg-gray-50',
                    PRO: 'bg-orange-400 hover:bg-orange-300',
                    BUSINESS: 'bg-lime-400 hover:bg-lime-300',
                }[planKey];

                return (
                    <button
                        key={planKey}
                        onClick={() => onSelect(planKey)}
                        className={cn(
                            "relative border-[3px] border-black rounded-xl p-3 flex flex-col items-center text-center transition-all group h-full",
                            isSelected
                                ? `shadow-none transform translate-x-[2px] translate-y-[2px] ${planKey === 'STARTER' ? 'bg-gray-100' : baseStyle}`
                                : `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${baseStyle}`
                        )}
                    >
                        {/* Selection Indicator Overlay for Selected State */}
                        {isSelected && (
                            <div className="absolute top-2 right-2 bg-black text-white p-0.5 rounded-full border-2 border-white shadow-sm z-10">
                                <Check className="w-3 h-3" />
                            </div>
                        )}

                        {/* Icon Box */}
                        <div className={cn(
                            "bg-white border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg mb-3",
                            isSelected && "shadow-none"
                        )}>
                            {planIcons[planKey]}
                        </div>

                        {/* Content */}
                        <div className="w-full flex-1 flex flex-col">
                            <h4 className="font-black text-sm uppercase italic tracking-tight mb-1">{planConfig.displayName}</h4>
                            <div className="font-black text-lg mb-2 leading-tight">
                                Rp {(planConfig.priceMonthly / 1000).toLocaleString('id-ID')}rb
                                <span className="text-[10px] font-bold text-black/60 block">/bln</span>
                            </div>

                            <p className="text-[10px] font-bold text-black/80 mb-2 leading-tight border-b-2 border-black/10 pb-2 min-h-[30px]">
                                {planConfig.description}
                            </p>

                            {/* Features List */}
                            <div className="space-y-1 text-left w-full mt-auto">
                                <div className="flex items-start gap-1.5 text-[10px] font-bold uppercase leading-tight">
                                    <div className="w-1 h-1 bg-black rounded-full mt-1 shrink-0" />
                                    <span>Max {planConfig.maxCourts === 999 ? 'Unlim.' : planConfig.maxCourts} Crt</span>
                                </div>
                                {planConfig.features.slice(0, 3).map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-1.5 text-[10px] font-bold uppercase leading-tight">
                                        <div className="w-1 h-1 bg-black rounded-full mt-1 shrink-0" />
                                        <span className="truncate">{feature.replace(/_/g, ' ')}</span>
                                    </div>
                                ))}
                                {planConfig.features.length > 3 && (
                                    <div className="text-[10px] text-black/50 font-bold pl-2.5">
                                        + {planConfig.features.length - 3} more
                                    </div>
                                )}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
