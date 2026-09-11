
import { AppState, StepValidation } from '../types';

export const validateStep1 = (state: AppState): StepValidation => {
  const errors: Record<string, string> = {};
  if (!state.project_name.trim()) errors.project_name = "نام طرح الزامی است.";
  if (state.num_months <= 0) errors.num_months = "باید بزرگ‌تر از صفر باشد.";
  if (state.discount_rate_annual_pct < 0) errors.discount_rate_annual_pct = "نرخ تنزیل نامعتبر است.";
  if (state.vat_rate_pct < 0) errors.vat_rate_pct = "نرخ VAT نامعتبر است.";
  if (state.qty_per_month < 0) errors.qty_per_month = "ظرفیت نامعتبر است.";
  if (state.cycle_period_months <= 0) errors.cycle_period_months = "دوره تکرار باید حداقل ۱ باشد.";

  return { isValid: Object.keys(errors).length === 0, errors };
};

export const validateStep2 = (state: AppState): StepValidation => {
    const errors: Record<string, string> = {};
    if (state.purchase_price_per_unit < 0) errors.purchase_price_per_unit = "قیمت خرید نامعتبر است.";
    if (state.vendor_prepayment.contract_pct < 0 || state.vendor_prepayment.contract_pct > 100) errors.vendor_prepayment_contract_pct = "باید بین ۰ تا ۱۰۰ باشد.";
    if (state.vendor_prepayment.monthly_pct < 0 || state.vendor_prepayment.monthly_pct > 100) errors.vendor_prepayment_monthly_pct = "باید بین ۰ تا ۱۰۰ باشد.";
    
    const { payment } = state;
    if (payment.method === 'cheque') {
        if (payment.cheque_interest_monthly_pct < 0) errors.cheque_interest_monthly_pct = "نرخ بهره نامعتبر است.";
        if (payment.cheque_due_months <= 0) errors.cheque_due_months = "سررسید باید حداقل ۱ باشد.";
    } else if (payment.method === 'lc') {
        if (payment.lc_initial_margin_pct < 0) errors.lc_initial_margin_pct = "نامعتبر.";
        if (payment.lc_initial_fee_pct < 0) errors.lc_initial_fee_pct = "نامعتبر.";
        if (payment.lc_interest_monthly_pct < 0) errors.lc_interest_monthly_pct = "نامعتبر.";
        if (payment.lc_months <= 0) errors.lc_months = "باید حداقل ۱ باشد.";
    } else if (payment.method === 'boe') {
        if (payment.boe_due_months <= 0) errors.boe_due_months = "سررسید باید حداقل ۱ باشد.";
        if (payment.boe_interest_monthly_pct < 0) errors.boe_interest_monthly_pct = "نرخ بهره نامعتبر است.";
        if (payment.boe_bank_fee_pct < 0) errors.boe_bank_fee_pct = "کارمزد نامعتبر است.";
    }
    
    return { isValid: Object.keys(errors).length === 0, errors };
};

export const validateStep3 = (state: AppState): StepValidation => {
    const errors: Record<string, string> = {};
    if (state.sale_price_per_unit < 0) errors.sale_price_per_unit = "قیمت فروش نامعتبر است.";
    if (state.sale_qty_per_month < 0) errors.sale_qty_per_month = "مقدار فروش نامعتبر است.";
    if (state.sale_prepayment.contract_pct < 0 || state.sale_prepayment.contract_pct > 100) errors.sale_prepayment_contract_pct = "باید بین ۰ تا ۱۰۰ باشد.";
    if (state.sale_prepayment.monthly_pct < 0 || state.sale_prepayment.monthly_pct > 100) errors.sale_prepayment_monthly_pct = "باید بین ۰ تا ۱۰۰ باشد.";
    
    if (state.sale.method === 'credit') {
        if (state.sale.credit_term_months <= 0) errors.sale_credit_term_months = "دوره باید حداقل ۱ باشد.";
        if (state.sale.credit_markup_pct_monthly < 0) errors.sale_credit_markup_pct_monthly = "افزایش قیمت نامعتبر است.";
    }

    return { isValid: Object.keys(errors).length === 0, errors };
};
