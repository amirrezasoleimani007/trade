
import React from 'react';
import { AppState, StepValidation } from '../types';
import FormInput from './FormInput';
import FormSelect from './FormSelect';
import { unitLabel } from '../constants';

interface Step3Props {
  state: AppState;
  updateState: (path: string, value: any) => void;
  validation: StepValidation;
}

const Step3: React.FC<Step3Props> = ({ state, updateState, validation }) => {
  const units = unitLabel(state.weight_unit, state.value_unit);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    updateState(name, value);
  };
  
  const handleNumericChange = (name: string, value: number | '') => {
      updateState(name, value);
  };

  return (
    <div className="space-y-8">
       <div>
        <h2 className="text-xl font-extrabold text-gray-800 mb-4">۳. اطلاعات فروش</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            label="قیمت فروش هر واحد"
            id="sale_price_per_unit"
            name="sale_price_per_unit"
            type="number"
            value={state.sale_price_per_unit}
            onValueChange={handleNumericChange}
            error={validation.errors.sale_price_per_unit}
            unit={`${units.value} / ${units.weight}`}
          />
          <FormInput
            label="مقدار فروش ماهانه"
            id="sale_qty_per_month"
            name="sale_qty_per_month"
            type="number"
            value={state.sale_qty_per_month}
            onValueChange={handleNumericChange}
            error={validation.errors.sale_qty_per_month}
            unit={units.weight}
          />
          <FormInput
            label="پیش‌دریافت اولیه از خریدار"
            id="sale_prepayment.contract_pct"
            name="sale_prepayment.contract_pct"
            type="number"
            value={state.sale_prepayment.contract_pct}
            onValueChange={handleNumericChange}
            error={validation.errors.sale_prepayment_contract_pct}
            unit="درصد"
          />
          <FormInput
            label="پیش‌دریافت ماهانه از خریدار"
            id="sale_prepayment.monthly_pct"
            name="sale_prepayment.monthly_pct"
            type="number"
            value={state.sale_prepayment.monthly_pct}
            onValueChange={handleNumericChange}
            error={validation.errors.sale_prepayment_monthly_pct}
            unit="درصد"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-700 mb-3">روش فروش</h3>
        <FormSelect
          label="روش فروش"
          id="sale.method"
          name="sale.method"
          value={state.sale.method}
          onChange={handleChange}
          options={[
            { value: 'cash', label: 'نقدی' },
            { value: 'credit', label: 'اعتباری' },
          ]}
        />
        {state.sale.method === 'credit' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 p-4 bg-gray-50 rounded-lg">
             <FormInput
              label="دوره اعتبار"
              // FIX: Added missing 'id' prop
              id="sale.credit_term_months"
              name="sale.credit_term_months"
              type="number"
              value={state.sale.credit_term_months}
              onValueChange={handleNumericChange}
              error={validation.errors.sale_credit_term_months}
              unit="ماه"
            />
            <FormInput
              label="افزایش قیمت ماهانه"
              // FIX: Added missing 'id' prop
              id="sale.credit_markup_pct_monthly"
              name="sale.credit_markup_pct_monthly"
              type="number"
              value={state.sale.credit_markup_pct_monthly}
              onValueChange={handleNumericChange}
              error={validation.errors.sale_credit_markup_pct_monthly}
              unit="درصد"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Step3;
