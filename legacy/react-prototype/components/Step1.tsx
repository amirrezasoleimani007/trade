
import React from 'react';
import { AppState, StepValidation } from '../types';
import FormInput from './FormInput';
import FormSelect from './FormSelect';
import { WEIGHT_UNITS, VALUE_UNITS } from '../constants';

interface Step1Props {
  state: AppState;
  updateState: (path: string, value: any) => void;
  validation: StepValidation;
}

const Step1: React.FC<Step1Props> = ({ state, updateState, validation }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateState(name, value);
  };
  
  const handleNumericChange = (name: string, value: number | '') => {
      updateState(name, value);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-extrabold text-gray-800">۱. اطلاعات پایه طرح</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput
          label="نام طرح"
          id="project_name"
          name="project_name"
          value={state.project_name}
          onChange={handleChange}
          error={validation.errors.project_name}
          placeholder="مثال: طرح تولید کنسانتره آهن"
        />
        <div className="md:col-span-2">
          <label htmlFor="project_desc" className="block text-sm font-bold text-gray-700 mb-2">
            توضیحات طرح (اختیاری)
          </label>
          <textarea
            id="project_desc"
            name="project_desc"
            value={state.project_desc}
            onChange={handleChange}
            rows={3}
            className="w-full p-4 bg-[#2d3748] text-white border border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:border-[#0B4DA2] focus:ring-[#0B4DA2]/50 transition-colors"
            placeholder="توضیح مختصری در مورد طرح تجاری خود بنویسید..."
          />
        </div>
        <FormSelect
          label="واحد وزنی"
          id="weight_unit"
          name="weight_unit"
          value={state.weight_unit}
          onChange={handleChange}
          options={WEIGHT_UNITS}
          error={validation.errors.weight_unit}
        />
        <FormSelect
          label="واحد پولی"
          id="value_unit"
          name="value_unit"
          value={state.value_unit}
          onChange={handleChange}
          options={VALUE_UNITS}
          error={validation.errors.value_unit}
        />
        <FormInput
          label="تعداد ماه‌های دوره طرح"
          id="num_months"
          name="num_months"
          type="number"
          value={state.num_months}
          onValueChange={handleNumericChange}
          error={validation.errors.num_months}
          unit="ماه"
        />
        <FormInput
          label="نرخ تنزیل سالانه"
          id="discount_rate_annual_pct"
          name="discount_rate_annual_pct"
          type="number"
          value={state.discount_rate_annual_pct}
          onValueChange={handleNumericChange}
          error={validation.errors.discount_rate_annual_pct}
          unit="درصد"
        />
        <FormInput
          label="نرخ مالیات بر ارزش افزوده (VAT)"
          id="vat_rate_pct"
          name="vat_rate_pct"
          type="number"
          value={state.vat_rate_pct}
          onValueChange={handleNumericChange}
          error={validation.errors.vat_rate_pct}
          unit="درصد"
        />
        <FormInput
          label="ظرفیت تولید/خرید ماهانه"
          id="qty_per_month"
          name="qty_per_month"
          type="number"
          value={state.qty_per_month}
          onValueChange={handleNumericChange}
          error={validation.errors.qty_per_month}
          unit={WEIGHT_UNITS.find(u => u.value === state.weight_unit)?.label || ""}
        />
         <FormInput
          label="دوره تکرار چرخه (خرید تا فروش)"
          id="cycle_period_months"
          name="cycle_period_months"
          type="number"
          value={state.cycle_period_months}
          onValueChange={handleNumericChange}
          error={validation.errors.cycle_period_months}
          unit="ماه"
        />
      </div>
    </div>
  );
};

export default Step1;
