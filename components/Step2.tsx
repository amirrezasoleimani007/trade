
import React from 'react';
import { AppState, OpCost, StepValidation } from '../types';
import FormInput from './FormInput';
import FormSelect from './FormSelect';
import { X, Plus } from 'lucide-react';
import { unitLabel } from '../constants';

interface Step2Props {
  state: AppState;
  updateState: (path: string, value: any) => void;
  validation: StepValidation;
}

const Step2: React.FC<Step2Props> = ({ state, updateState, validation }) => {
  const units = unitLabel(state.weight_unit, state.value_unit);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    updateState(name, value);
  };

  const handleNumericChange = (name: string, value: number | '') => {
      updateState(name, value);
  };
  
  // FIX: handleOpCostChange was updated to be type-safe.
  // It now explicitly handles 'name' and 'amount_per_unit' fields,
  // coercing values to the correct types (string and number respectively)
  // to resolve assignment errors.
  const handleOpCostChange = (index: number, field: keyof Omit<OpCost, 'id'>, value: string | number) => {
    const newOpCosts = [...state.op_costs];
    if (field === 'amount_per_unit') {
        newOpCosts[index] = { ...newOpCosts[index], amount_per_unit: Number(value) };
    } else { // field === 'name'
        newOpCosts[index] = { ...newOpCosts[index], name: String(value) };
    }
    updateState('op_costs', newOpCosts);
  };

  const addOpCost = () => {
    updateState('op_costs', [...state.op_costs, { id: Date.now(), name: '', amount_per_unit: 0 }]);
  };

  const removeOpCost = (index: number) => {
    const newOpCosts = state.op_costs.filter((_, i) => i !== index);
    if (newOpCosts.length === 0) {
        updateState('op_costs', [{ id: Date.now(), name: '', amount_per_unit: 0 }]);
    } else {
        updateState('op_costs', newOpCosts);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-extrabold text-gray-800 mb-4">۲. اطلاعات خرید و هزینه‌ها</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            label="قیمت خرید هر واحد"
            id="purchase_price_per_unit"
            name="purchase_price_per_unit"
            type="number"
            value={state.purchase_price_per_unit}
            onValueChange={handleNumericChange}
            error={validation.errors.purchase_price_per_unit}
            unit={`${units.value} / ${units.weight}`}
          />
          <FormInput
            label="پیش‌پرداخت اولیه به فروشنده"
            id="vendor_prepayment.contract_pct"
            name="vendor_prepayment.contract_pct"
            type="number"
            value={state.vendor_prepayment.contract_pct}
            onValueChange={handleNumericChange}
            error={validation.errors.vendor_prepayment_contract_pct}
            unit="درصد"
          />
          <FormInput
            label="پیش‌پرداخت ماهانه به فروشنده"
            id="vendor_prepayment.monthly_pct"
            name="vendor_prepayment.monthly_pct"
            type="number"
            value={state.vendor_prepayment.monthly_pct}
            onValueChange={handleNumericChange}
            error={validation.errors.vendor_prepayment_monthly_pct}
            unit="درصد"
          />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-bold text-gray-700 mb-3">هزینه‌های عملیاتی</h3>
        <div className="space-y-4">
          {state.op_costs.map((cost, index) => (
            <div key={cost.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <FormInput
                label="نام هزینه"
                id={`op_cost_name_${cost.id}`}
                value={cost.name}
                onChange={(e) => handleOpCostChange(index, 'name', e.target.value)}
                placeholder="مثال: حمل و نقل"
                containerClassName="flex-grow"
              />
              <FormInput
                label="مبلغ هر واحد"
                id={`op_cost_amount_${cost.id}`}
                type="number"
                value={cost.amount_per_unit}
                onValueChange={(name, value) => handleOpCostChange(index, 'amount_per_unit', value)}
                unit={`${units.value} / ${units.weight}`}
                containerClassName="w-48"
              />
              <button
                type="button"
                onClick={() => removeOpCost(index)}
                className="self-end mb-2 p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                aria-label="حذف هزینه"
              >
                <X size={20} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addOpCost}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0B4DA2] rounded-lg hover:bg-opacity-90 transition-colors"
          >
            <Plus size={16} />
            افزودن هزینه عملیاتی
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-700 mb-3">روش پرداخت به فروشنده</h3>
        <FormSelect
          label="روش پرداخت"
          id="payment.method"
          name="payment.method"
          value={state.payment.method}
          onChange={handleChange}
          options={[
            { value: 'cash', label: 'نقدی' },
            { value: 'cheque', label: 'چک' },
            { value: 'lc', label: 'اعتبار اسنادی (LC)' },
            { value: 'boe', label: 'برات (BOE)' },
          ]}
        />

        {state.payment.method === 'cheque' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 p-4 bg-gray-50 rounded-lg">
            <FormInput
              label="نرخ بهره ماهانه چک"
              // FIX: Added missing 'id' prop
              id="payment.cheque_interest_monthly_pct"
              name="payment.cheque_interest_monthly_pct"
              type="number"
              value={state.payment.cheque_interest_monthly_pct}
              onValueChange={handleNumericChange}
              error={validation.errors.cheque_interest_monthly_pct}
              unit="درصد"
            />
            <FormInput
              label="سررسید چک"
              // FIX: Added missing 'id' prop
              id="payment.cheque_due_months"
              name="payment.cheque_due_months"
              type="number"
              value={state.payment.cheque_due_months}
              onValueChange={handleNumericChange}
              error={validation.errors.cheque_due_months}
              unit="ماه"
            />
          </div>
        )}

        {state.payment.method === 'lc' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 p-4 bg-gray-50 rounded-lg">
             {/* FIX: Added missing 'id' prop */}
<FormInput label="دوره LC" id="payment.lc_months" name="payment.lc_months" type="number" value={state.payment.lc_months} onValueChange={handleNumericChange} error={validation.errors.lc_months} unit="ماه" />
             {/* FIX: Added missing 'id' prop */}
<FormInput label="بهره ماهانه LC" id="payment.lc_interest_monthly_pct" name="payment.lc_interest_monthly_pct" type="number" value={state.payment.lc_interest_monthly_pct} onValueChange={handleNumericChange} error={validation.errors.lc_interest_monthly_pct} unit="درصد" />
             {/* FIX: Added missing 'id' prop */}
<FormInput label="مارجین اولیه" id="payment.lc_initial_margin_pct" name="payment.lc_initial_margin_pct" type="number" value={state.payment.lc_initial_margin_pct} onValueChange={handleNumericChange} error={validation.errors.lc_initial_margin_pct} unit="درصد" />
             {/* FIX: Added missing 'id' prop */}
<FormInput label="کارمزد اولیه" id="payment.lc_initial_fee_pct" name="payment.lc_initial_fee_pct" type="number" value={state.payment.lc_initial_fee_pct} onValueChange={handleNumericChange} error={validation.errors.lc_initial_fee_pct} unit="درصد" />
             {/* FIX: Added missing 'id' prop */}
<FormInput label="مارجین میانی" id="payment.lc_mid_margin_pct" name="payment.lc_mid_margin_pct" type="number" value={state.payment.lc_mid_margin_pct} onValueChange={handleNumericChange} error={validation.errors.lc_mid_margin_pct} unit="درصد" />
             {/* FIX: Added missing 'id' prop */}
<FormInput label="کارمزد میانی" id="payment.lc_mid_fee_pct" name="payment.lc_mid_fee_pct" type="number" value={state.payment.lc_mid_fee_pct} onValueChange={handleNumericChange} error={validation.errors.lc_mid_fee_pct} unit="درصد" />
          </div>
        )}

        {state.payment.method === 'boe' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 p-4 bg-gray-50 rounded-lg">
              {/* FIX: Added missing 'id' prop */}
<FormInput label="سررسید برات" id="payment.boe_due_months" name="payment.boe_due_months" type="number" value={state.payment.boe_due_months} onValueChange={handleNumericChange} error={validation.errors.boe_due_months} unit="ماه" />
              {/* FIX: Added missing 'id' prop */}
<FormInput label="نرخ بهره ماهانه" id="payment.boe_interest_monthly_pct" name="payment.boe_interest_monthly_pct" type="number" value={state.payment.boe_interest_monthly_pct} onValueChange={handleNumericChange} error={validation.errors.boe_interest_monthly_pct} unit="درصد" />
              {/* FIX: Added missing 'id' prop */}
<FormInput label="کارمزد بانک" id="payment.boe_bank_fee_pct" name="payment.boe_bank_fee_pct" type="number" value={state.payment.boe_bank_fee_pct} onValueChange={handleNumericChange} error={validation.errors.boe_bank_fee_pct} unit="درصد" />
           </div>
        )}
      </div>
    </div>
  );
};

export default Step2;
