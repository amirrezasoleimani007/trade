
import React, { useState, useEffect } from 'react';

interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    label: string;
    id: string;
    unit?: string;
    error?: string;
    containerClassName?: string;
    value?: string | number;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onValueChange?: (name: string, value: number | '') => void;
}

const formatNumber = (num: number | string): string => {
    if (num === '' || num === null || num === undefined) return '';
    const cleanNum = String(num).replace(/,/g, '');
    if (isNaN(parseFloat(cleanNum))) return String(num); // Return original if not a valid number
    const parts = cleanNum.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
};

const FormInput: React.FC<FormInputProps> = ({
    label,
    id,
    unit,
    error,
    containerClassName = '',
    type,
    value,
    onChange,
    onValueChange,
    name,
    ...props
}) => {
    const [displayValue, setDisplayValue] = useState(type === 'number' ? formatNumber(value as number) : value as string);

    useEffect(() => {
        setDisplayValue(type === 'number' ? formatNumber(value as number) : (value as string || ''));
    }, [value, type]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (type === 'number') {
            const rawValue = e.target.value;
            const cleanValue = rawValue.replace(/,/g, '');
            
            if (cleanValue === '' || cleanValue === '-') {
                setDisplayValue(cleanValue);
                if (onValueChange && name) {
                    onValueChange(name, '');
                }
            } else if (!isNaN(Number(cleanValue))) {
                setDisplayValue(formatNumber(cleanValue));
                if (onValueChange && name) {
                    onValueChange(name, parseFloat(cleanValue));
                }
            }
        } else {
             if (onChange) {
                onChange(e);
             }
        }
    };

    return (
        <div className={`w-full ${containerClassName}`}>
            <label htmlFor={id} className="block text-sm font-bold text-gray-700 mb-2">
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    name={name}
                    type={type === 'number' ? 'text' : type}
                    value={displayValue}
                    onChange={handleChange}
                    {...props}
                    className={`w-full h-14 ps-4 bg-[#2d3748] text-white border rounded-2xl focus:outline-none focus:ring-2 transition-colors ${
                        unit ? 'pe-16' : 'pe-4'
                    } ${
                        error ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-600 focus:border-[#0B4DA2] focus:ring-[#0B4DA2]/50'
                    }`}
                />
                {unit && (
                    <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-4 text-gray-400">
                        <span className="text-sm">{unit}</span>
                    </div>
                )}
            </div>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
};

export default FormInput;
