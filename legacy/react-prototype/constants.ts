
export const WEIGHT_UNITS = [
    { label: "گرم", value: "g" },
    { label: "کیلوگرم", value: "kg" },
    { label: "تن", value: "ton" },
];

export const VALUE_UNITS = [
    { label: "ریال", value: "IRR" },
    { label: "میلیون ریال", value: "MIRR" },
    { label: "دلار", value: "USD" },
    { label: "یورو", value: "EUR" },
];

export const unitLabel = (weightUnit: string, valueUnit: string): { weight: string, value: string } => {
    const w = WEIGHT_UNITS.find(u => u.value === weightUnit)?.label || "";
    const v = VALUE_UNITS.find(u => u.value === valueUnit)?.label || "";
    return { weight: w, value: v };
};
