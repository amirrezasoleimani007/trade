export interface OpCost {
  id: number;
  name: string;
  amount_per_unit: number;
}

export type PaymentMethod = "cash" | "cheque" | "lc" | "boe";
export type SaleMethod = "cash" | "credit";

export interface AppState {
  project_name: string;
  project_desc: string;
  weight_unit: "g" | "kg" | "ton";
  value_unit: "IRR" | "MIRR" | "USD" | "EUR";
  num_months: number;
  discount_rate_annual_pct: number;
  vat_rate_pct: number;
  qty_per_month: number;
  cycle_period_months: number;

  purchase_price_per_unit: number;
  vendor_prepayment: {
    contract_pct: number;
    contract_credit_basis: boolean;
    monthly_pct: number;
  };
  op_costs: OpCost[];
  payment: {
    method: PaymentMethod;
    cheque_interest_monthly_pct: number;
    cheque_due_months: number;
    lc_initial_margin_pct: number;
    lc_initial_fee_pct: number;
    lc_mid_margin_pct: number;
    lc_mid_fee_pct: number;
    lc_interest_monthly_pct: number;
    lc_months: number;
    boe_due_months: number;
    boe_interest_monthly_pct: number;
    boe_bank_fee_pct: number;
  };
  
  sale_price_per_unit: number;
  sale_qty_per_month: number;
  sale_prepayment: {
    contract_pct: number;
    monthly_pct: number;
  };
  sale: {
    method: SaleMethod;
    credit_term_months: number;
    credit_markup_pct_monthly: number;
  };
}

export interface StepValidation {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface ValidationState {
  step1: StepValidation;
  step2: StepValidation;
  step3: StepValidation;
}

export const initialAppState: AppState = {
  project_name: "",
  project_desc: "",
  weight_unit: "ton",
  value_unit: "IRR",
  num_months: 12,
  discount_rate_annual_pct: 30.0,
  vat_rate_pct: 10.0,
  qty_per_month: 1000.0,
  cycle_period_months: 1,

  purchase_price_per_unit: 0,
  vendor_prepayment: {
    contract_pct: 0,
    contract_credit_basis: false,
    monthly_pct: 0,
  },
  op_costs: [{ id: 1, name: "", amount_per_unit: 0 }],
  payment: {
    method: "cash",
    cheque_interest_monthly_pct: 0,
    cheque_due_months: 1,
    lc_initial_margin_pct: 0,
    lc_initial_fee_pct: 0,
    lc_mid_margin_pct: 0,
    lc_mid_fee_pct: 0,
    lc_interest_monthly_pct: 0,
    lc_months: 1,
    boe_due_months: 1,
    boe_interest_monthly_pct: 0,
    boe_bank_fee_pct: 0,
  },
  
  sale_price_per_unit: 0,
  sale_qty_per_month: 1000.0,
  sale_prepayment: {
    contract_pct: 0,
    monthly_pct: 0,
  },
  sale: {
    method: "cash",
    credit_term_months: 1,
    credit_markup_pct_monthly: 0,
  },
};

export interface LedgerEntry {
  month: number;
  in_contract_prepay_sales: number;
  in_prepay_monthly_sales: number;
  in_sales_receipts: number;
  in_lc_margin_release: number;
  out_contract_prepay_purchase: number;
  out_prepay_monthly_purchase: number;
  out_purchase_cash: number;
  out_cheque_interest: number;
  out_cheque_principal_vat: number;
  out_lc_margin_initial: number;
  out_lc_fee_initial: number;
  out_lc_margin_mid: number;
  out_lc_fee_mid: number;
  out_lc_interest: number;
  out_lc_principal_vat: number;
  out_boe_fee: number;
  out_boe_interest: number;
  out_boe_principal_vat: number;
  out_op_costs: number;
  in_total: number;
  out_total: number;
  net_cf: number;
}