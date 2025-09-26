
import React from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
    value: string | number;
    label: string;
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    id: string;
    options: Option[];
    error?: string;
}

const FormSelect: React.FC<FormSelectProps> = ({ label, id, options, error, ...props }) => {
    return (
        <div className="w-full">
            <label htmlFor={id} className="block text-sm font-bold text-gray-700 mb-2">
                {label}
            </label>
            <div className="relative">
                <select
                    id={id}
                    {...props}
                    className={`w-full h-14 pl-4 pr-10 appearance-none bg-[#2d3748] text-white border rounded-2xl focus:outline-none focus:ring-2 transition-colors ${
                        error ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-600 focus:border-[#0B4DA2] focus:ring-[#0B4DA2]/50'
                    }`}
                >
                    {options.map(option => (
                        <option key={option.value} value={option.value} className="bg-gray-700 text-white">
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center px-4 text-gray-400">
                    <ChevronDown size={20} />
                </div>
            </div>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
};

export default FormSelect;
