
import { AppState, LedgerEntry } from '../types';

const newLedgerEntry = (month: number): LedgerEntry => ({
    month,
    in_contract_prepay_sales: 0,
    in_prepay_monthly_sales: 0,
    in_sales_receipts: 0,
    in_lc_margin_release: 0,
    out_contract_prepay_purchase: 0,
    out_prepay_monthly_purchase: 0,
    out_purchase_cash: 0,
    out_cheque_interest: 0,
    out_cheque_principal_vat: 0,
    out_lc_margin_initial: 0,
    out_lc_fee_initial: 0,
    out_lc_margin_mid: 0,
    out_lc_fee_mid: 0,
    out_lc_interest: 0,
    out_lc_principal_vat: 0,
    out_boe_fee: 0,
    out_boe_interest: 0,
    out_boe_principal_vat: 0,
    out_op_costs: 0,
    in_total: 0,
    out_total: 0,
    net_cf: 0,
});


export const calculateLedger = (state: AppState): LedgerEntry[] => {
    const { num_months, cycle_period_months, qty_per_month, vat_rate_pct, op_costs, purchase_price_per_unit, vendor_prepayment, payment, sale_price_per_unit, sale_qty_per_month, sale_prepayment, sale } = state;

    const max_term = Math.max(payment.cheque_due_months, payment.lc_months, payment.boe_due_months, sale.credit_term_months, 12);
    const ledger_length = num_months + max_term + 1;
    const ledger: LedgerEntry[] = Array.from({ length: ledger_length }, (_, i) => newLedgerEntry(i));

    const vat_rate = vat_rate_pct / 100;
    
    // --- Purchase Logic ---
    const purchase_months = Array.from({ length: num_months }, (_, i) => i + 1)
        .filter(m => (m - 1) % cycle_period_months === 0);
    const num_purchase_cycles = purchase_months.length;
    
    const total_purchase_value = purchase_price_per_unit * qty_per_month * num_purchase_cycles;
    
    // Contract Prepayment (Purchase)
    const contract_prepay_amount = total_purchase_value * (vendor_prepayment.contract_pct / 100);
    if (contract_prepay_amount > 0) {
        ledger[1].out_contract_prepay_purchase += contract_prepay_amount * (1 + vat_rate);
    }
    const contract_prepay_per_cycle = num_purchase_cycles > 0 ? contract_prepay_amount / num_purchase_cycles : 0;

    purchase_months.forEach(m => {
        // Op Costs
        const monthly_op_costs_total = op_costs.reduce((sum, cost) => sum + (cost.amount_per_unit || 0), 0) * qty_per_month;
        if (monthly_op_costs_total > 0) {
            ledger[m].out_op_costs += monthly_op_costs_total;
        }

        const cycle_purchase_value = purchase_price_per_unit * qty_per_month;
        const cycle_base_after_contract_prepay = cycle_purchase_value - contract_prepay_per_cycle;

        // Monthly Prepayment (Purchase)
        const monthly_prepay_amount = cycle_base_after_contract_prepay * (vendor_prepayment.monthly_pct / 100);
        if (monthly_prepay_amount > 0) {
            ledger[m].out_prepay_monthly_purchase += monthly_prepay_amount * (1 + vat_rate);
        }

        // Financed Amount
        const financed_amount = cycle_base_after_contract_prepay - monthly_prepay_amount;

        if (financed_amount > 0) {
            switch (payment.method) {
                case 'cash':
                    ledger[m].out_purchase_cash += financed_amount * (1 + vat_rate);
                    break;
                case 'cheque': {
                    const interest_per_month = financed_amount * (payment.cheque_interest_monthly_pct / 100);
                    for (let i = 1; i <= payment.cheque_due_months; i++) {
                        if (m + i < ledger_length) ledger[m + i].out_cheque_interest += interest_per_month;
                    }
                    if (m + payment.cheque_due_months < ledger_length) {
                        ledger[m + payment.cheque_due_months].out_cheque_principal_vat += financed_amount * (1 + vat_rate);
                    }
                    break;
                }
                case 'lc': {
                    const lc_value = financed_amount; // Base for fees/margins
                    const total_interest = lc_value * (payment.lc_interest_monthly_pct / 100) * payment.lc_months;
                    const lc_base_for_fees = lc_value + total_interest;
                    
                    const initial_margin = lc_base_for_fees * (payment.lc_initial_margin_pct / 100);
                    const mid_margin = lc_base_for_fees * (payment.lc_mid_margin_pct / 100);

                    ledger[m].out_lc_margin_initial += initial_margin;
                    ledger[m].out_lc_fee_initial += lc_base_for_fees * (payment.lc_initial_fee_pct / 100);
                    
                    if (payment.lc_months > 1) {
                         const mid_month = m + Math.floor(payment.lc_months / 2);
                         if (mid_month < ledger_length) {
                             ledger[mid_month].out_lc_margin_mid += mid_margin;
                             ledger[mid_month].out_lc_fee_mid += lc_base_for_fees * (payment.lc_mid_fee_pct / 100);
                         }
                    }

                    const due_month = m + payment.lc_months;
                    if (due_month < ledger_length) {
                        ledger[due_month].out_lc_interest += total_interest;
                        ledger[due_month].out_lc_principal_vat += lc_value * (1 + vat_rate);
                        ledger[due_month].in_lc_margin_release += (initial_margin + mid_margin);
                    }
                    break;
                }
                case 'boe': {
                    const interest_per_month = financed_amount * (payment.boe_interest_monthly_pct / 100);
                    ledger[m].out_boe_fee += financed_amount * (payment.boe_bank_fee_pct / 100);
                    for (let i = 1; i <= payment.boe_due_months; i++) {
                        if (m + i < ledger_length) ledger[m + i].out_boe_interest += interest_per_month;
                    }
                    if (m + payment.boe_due_months < ledger_length) {
                        ledger[m + payment.boe_due_months].out_boe_principal_vat += financed_amount * (1 + vat_rate);
                    }
                    break;
                }
            }
        }
    });

    // --- Sales Logic ---
    const effective_sale_price_per_unit = sale.method === 'credit'
        ? sale_price_per_unit * Math.pow(1 + sale.credit_markup_pct_monthly / 100, sale.credit_term_months)
        : sale_price_per_unit;

    const total_sales_value = effective_sale_price_per_unit * sale_qty_per_month * num_months;
    const contract_prepay_sales = total_sales_value * (sale_prepayment.contract_pct / 100);
    if (contract_prepay_sales > 0) {
        ledger[1].in_contract_prepay_sales += contract_prepay_sales * (1 + vat_rate);
    }
    const contract_prepay_per_cycle_sales = contract_prepay_sales / num_months;

    for (let m = 1; m <= num_months; m++) {
        const cycle_sales_value = effective_sale_price_per_unit * sale_qty_per_month;
        const cycle_base_after_contract_prepay = cycle_sales_value - contract_prepay_per_cycle_sales;

        const monthly_prepay_sales = cycle_base_after_contract_prepay * (sale_prepayment.monthly_pct / 100);
        if (monthly_prepay_sales > 0) {
            ledger[m].in_prepay_monthly_sales += monthly_prepay_sales * (1 + vat_rate);
        }
        
        const remaining_sales = cycle_base_after_contract_prepay - monthly_prepay_sales;
        const receipt_month = sale.method === 'credit' ? m + sale.credit_term_months : m;
        if (receipt_month < ledger_length) {
            ledger[receipt_month].in_sales_receipts += remaining_sales * (1 + vat_rate);
        }
    }

    // --- Totals ---
    for (let i = 0; i < ledger_length; i++) {
        const entry = ledger[i];
        entry.in_total = entry.in_contract_prepay_sales + entry.in_prepay_monthly_sales + entry.in_sales_receipts + entry.in_lc_margin_release;
        entry.out_total = entry.out_contract_prepay_purchase + entry.out_prepay_monthly_purchase + entry.out_purchase_cash +
                          entry.out_cheque_interest + entry.out_cheque_principal_vat +
                          entry.out_lc_margin_initial + entry.out_lc_fee_initial + entry.out_lc_margin_mid + entry.out_lc_fee_mid +
                          entry.out_lc_interest + entry.out_lc_principal_vat +
                          entry.out_boe_fee + entry.out_boe_interest + entry.out_boe_principal_vat +
                          entry.out_op_costs;
        entry.net_cf = entry.in_total - entry.out_total;
    }

    return ledger;
};

export const calculateFinancialMetrics = (state: AppState, ledger: LedgerEntry[]) => {
    const { discount_rate_annual_pct, num_months, sale_price_per_unit, purchase_price_per_unit, op_costs, sale_qty_per_month } = state;
    const monthly_discount_rate = Math.pow(1 + (discount_rate_annual_pct / 100), 1 / 12) - 1;

    const conversionFactor = state.value_unit === 'IRR' ? 1000000 : 1;

    let npv = 0;
    let totalDiscountedInflows = 0;
    let totalDiscountedOutflows = 0;

    for (let i = 0; i < ledger.length; i++) {
        const entry = ledger[i];
        if (entry.month > num_months) continue;
        const discount_factor = Math.pow(1 + monthly_discount_rate, entry.month);
        
        npv += entry.net_cf / discount_factor;
        totalDiscountedInflows += entry.in_total / discount_factor;
        totalDiscountedOutflows += entry.out_total / discount_factor;
    }
    
    const project_ledger = ledger.slice(0, num_months + 1);
    const totalCashInflow = project_ledger.reduce((sum, e) => sum + e.in_total, 0);
    const totalCashOutflow = project_ledger.reduce((sum, e) => sum + e.out_total, 0);

    // Profit Margin Calculation
    const total_revenue = sale_price_per_unit * sale_qty_per_month * num_months;
    const total_cogs = purchase_price_per_unit * sale_qty_per_month * num_months;
    const total_op_costs = op_costs.reduce((sum, cost) => sum + (cost.amount_per_unit || 0), 0) * sale_qty_per_month * num_months;
    const gross_profit = total_revenue - total_cogs - total_op_costs;
    const profitMargin = total_revenue > 0 ? (gross_profit / total_revenue) * 100 : 0;
    
    return {
        npv: npv / conversionFactor,
        bcr: totalDiscountedOutflows > 0 ? totalDiscountedInflows / totalDiscountedOutflows : Infinity,
        totalCashInflow: totalCashInflow / conversionFactor,
        totalCashOutflow: totalCashOutflow / conversionFactor,
        netCashFlow: (totalCashInflow - totalCashOutflow) / conversionFactor,
        profitMargin,
    };
};
