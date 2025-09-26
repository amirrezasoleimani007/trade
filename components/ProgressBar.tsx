
import React from 'react';

interface ProgressBarProps {
    step: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ step }) => {
    const percentage = Math.max(1, Math.min(4, step)) * 25;

    return (
        <div>
            <div className="font-black text-2xl text-gray-800 mb-4 text-center">
                مرحله {step}: {['اطلاعات پایه', 'اطلاعات خرید', 'اطلاعات فروش', 'نتایج و شاخص‌ها'][step - 1]}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                    className="bg-[#0B4DA2] h-4 rounded-full text-center text-white text-xs font-bold transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                >
                    {percentage}%
                </div>
            </div>
        </div>
    );
};

export default ProgressBar;