// src/components/ui/EnergyDisplay.js
// Visual energy indicator component for MMO Party Quest

import React, { useState, useEffect } from 'react';
import { Battery, Clock, Gift, Play, ShoppingBag } from 'lucide-react';
import { EnergySystem } from '../../systems/energy-system';

const energySystem = new EnergySystem();

export function EnergyDisplay({ userId, onEnergyPurchase, onWatchAd }) {
    const [energy, setEnergy] = useState(0);
    const [maxEnergy, setMaxEnergy] = useState(5);
    const [timeToNext, setTimeToNext] = useState(0);
    const [timeToFull, setTimeToFull] = useState(0);
    const [showPurchaseOptions, setShowPurchaseOptions] = useState(false);

    // Update energy state
    const updateEnergyDisplay = () => {
        if (!userId) return;
        
        const currentEnergy = energySystem.getCurrentEnergy(userId);
        const nextTime = energySystem.getTimeToNextEnergy(userId);
        const fullTime = energySystem.getTimeToFullEnergy(userId);
        
        setEnergy(currentEnergy);
        setMaxEnergy(energySystem.maxEnergy);
        setTimeToNext(nextTime);
        setTimeToFull(fullTime);
    };

    // Set up energy monitoring
    useEffect(() => {
        updateEnergyDisplay();
        
        // Update every second
        const interval = setInterval(updateEnergyDisplay, 1000);
        
        // Listen for energy updates
        const handleEnergyUpdate = (event) => {
            if (event.detail.userId === userId) {
                updateEnergyDisplay();
            }
        };
        
        window.addEventListener('energyUpdated', handleEnergyUpdate);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('energyUpdated', handleEnergyUpdate);
        };
    }, [userId]);

    // Handle watch ad for energy
    const handleWatchAd = async () => {
        try {
            await energySystem.watchAdForEnergy(userId);
            onWatchAd?.();
        } catch (error) {
            console.error('Failed to watch ad:', error);
        }
    };

    // Handle energy purchase
    const handlePurchase = (option) => {
        onEnergyPurchase?.(option);
        setShowPurchaseOptions(false);
    };

    // Get energy bar color
    const getEnergyColor = () => {
        const percentage = energy / maxEnergy;
        if (percentage > 0.6) return 'bg-green-500';
        if (percentage > 0.3) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    // Format time display
    const formatTime = (ms) => {
        if (ms <= 0) return '';
        const minutes = Math.floor(ms / (60 * 1000));
        const seconds = Math.floor((ms % (60 * 1000)) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            {/* Energy Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Battery className="w-5 h-5 text-yellow-400" />
                    <span className="text-white font-semibold">Energy</span>
                </div>
                <div className="text-white font-bold">
                    {energy}/{maxEnergy}
                </div>
            </div>

            {/* Energy Bar */}
            <div className="mb-3">
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${getEnergyColor()}`}
                        style={{ width: `${(energy / maxEnergy) * 100}%` }}
                    />
                </div>
            </div>

            {/* Energy Hearts/Icons */}
            <div className="flex gap-1 mb-3 justify-center">
                {Array.from({ length: maxEnergy }, (_, i) => (
                    <div
                        key={i}
                        className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                            i < energy
                                ? 'bg-yellow-400 border-yellow-400 shadow-lg'
                                : 'bg-gray-600 border-gray-500'
                        }`}
                    />
                ))}
            </div>

            {/* Regeneration Timer */}
            {energy < maxEnergy && (
                <div className="text-center mb-3">
                    <div className="flex items-center justify-center gap-1 text-gray-300 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>Next: {formatTime(timeToNext)}</span>
                    </div>
                    {timeToFull > 0 && (
                        <div className="text-gray-400 text-xs">
                            Full in: {formatTime(timeToFull)}
                        </div>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
                {/* Watch Ad Button */}
                {energy < maxEnergy && (
                    <button
                        onClick={handleWatchAd}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        <Play className="w-4 h-4" />
                        Watch Ad (+1 Energy)
                    </button>
                )}

                {/* Purchase Energy Button */}
                <button
                    onClick={() => setShowPurchaseOptions(!showPurchaseOptions)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                    <ShoppingBag className="w-4 h-4" />
                    Buy Energy
                </button>

                {/* Daily Bonus Button */}
                <button
                    onClick={() => {
                        try {
                            energySystem.getDailyBonus(userId);
                        } catch (error) {
                            console.log('Daily bonus already claimed');
                        }
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                    <Gift className="w-4 h-4" />
                    Daily Bonus
                </button>
            </div>

            {/* Purchase Options Modal */}
            {showPurchaseOptions && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-white text-xl font-bold mb-4 text-center">
                            Buy Energy
                        </h3>
                        
                        <div className="space-y-3 mb-4">
                            {energySystem.getEnergyPurchaseOptions().map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => handlePurchase(option)}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg flex items-center justify-between transition-colors"
                                >
                                    <span>{option.label}</span>
                                    <span>${option.price}</span>
                                </button>
                            ))}
                        </div>
                        
                        <button
                            onClick={() => setShowPurchaseOptions(false)}
                            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Energy Status Indicator (smaller version for header)
export function EnergyStatusIndicator({ userId, onClick }) {
    const [energy, setEnergy] = useState(0);
    const [maxEnergy, setMaxEnergy] = useState(5);

    useEffect(() => {
        const updateEnergy = () => {
            if (userId) {
                setEnergy(energySystem.getCurrentEnergy(userId));
                setMaxEnergy(energySystem.maxEnergy);
            }
        };

        updateEnergy();
        const interval = setInterval(updateEnergy, 5000);
        
        const handleEnergyUpdate = () => updateEnergy();
        window.addEventListener('energyUpdated', handleEnergyUpdate);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('energyUpdated', handleEnergyUpdate);
        };
    }, [userId]);

    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg px-3 py-2 transition-colors"
        >
            <Battery className="w-4 h-4 text-yellow-400" />
            <span className="text-white font-semibold">
                {energy}/{maxEnergy}
            </span>
        </button>
    );
}