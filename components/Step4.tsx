import React, { useMemo, useState, useEffect, useRef } from 'react';
import { AppState } from '../types';
import { calculateLedger, calculateFinancialMetrics } from '../services/financialService';
import { unitLabel } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { pipeline, Pipeline } from '@xenova/transformers';
import { Loader2 } from 'lucide-react';


const KpiCard: React.FC<{ title: string; value: string; unit: string; }> = ({ title, value, unit }) => (
    <div className="bg-white p-4 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-gray-200/80 text-center">
        <h3 className="text-sm font-bold text-gray-600">{title}</h3>
        <p className="text-2xl font-black text-[#0B4DA2] mt-2">
            {value} <span className="text-xs font-semibold text-gray-500">{unit}</span>
        </p>
    </div>
);

const AIAnalysis: React.FC<{ appState: AppState, metrics: ReturnType<typeof calculateFinancialMetrics> }> = ({ appState, metrics }) => {
    const [analysis, setAnalysis] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const generator = useRef<Pipeline | null>(null);

    useEffect(() => {
        const initGenerator = async () => {
            try {
                // Use a smaller, faster model for in-browser summarization/generation
                generator.current = await pipeline('text-generation', 'Xenova/distilgpt2');
                setLoading(false);
            } catch (error) {
                console.error("Failed to load AI model:", error);
                setAnalysis("خطا در بارگذاری مدل هوش مصنوعی. لطفاً از اتصال اینترنت خود برای بار اول مطمئن شوید و صفحه را مجدداً بارگیری کنید.");
                setLoading(false);
            }
        };
        initGenerator();
    }, []);

    useEffect(() => {
        if (!loading && generator.current) {
            const generateAnalysis = async () => {
                const { project_name } = appState;
                const { npv, bcr, netCashFlow, profitMargin } = metrics;
                const valueUnitLabel = appState.value_unit === 'IRR' ? 'میلیون ریال' : unitLabel(appState.weight_unit, appState.value_unit).value;

                const prompt = `Financial analysis for project "${project_name}".
- Net Present Value (NPV): ${npv.toFixed(2)} ${valueUnitLabel}
- Benefit-Cost Ratio (BCR): ${isFinite(bcr) ? bcr.toFixed(3) : 'very high'}
- Net Cash Flow: ${netCashFlow.toFixed(2)} ${valueUnitLabel}
- Profit Margin: ${profitMargin.toFixed(2)}%

Summary:`;

                try {
                     const result = await generator.current(prompt, {
                        max_new_tokens: 100,
                        no_repeat_ngram_size: 2,
                        num_beams: 2,
                    });
                    
                    if (Array.isArray(result) && result.length > 0 && typeof result[0] === 'object' && 'generated_text' in result[0]) {
                        const generated_text = (result[0] as { generated_text: string }).generated_text;
                        const summary = generated_text.replace(prompt, '').trim();
                        // A simple post-processing to make it more readable in Persian
                        const formattedSummary = `تحلیل طرح «${project_name}» نشان می‌دهد که با ارزش فعلی خالص (NPV) حدود ${npv.toLocaleString('fa-IR')} ${valueUnitLabel} و نسبت منفعت به هزینه (BCR) ${isFinite(bcr) ? bcr.toFixed(3) : 'بسیار بالا'}، این طرح از نظر اقتصادی مطلوب به نظر می‌رسد. خالص جریان نقدی مثبت به میزان ${netCashFlow.toLocaleString('fa-IR')} ${valueUnitLabel} و حاشیه سود ${profitMargin.toFixed(2)}٪، بیانگر پتانسیل سودآوری مناسب در طول دوره پروژه است. ${summary.split('.')[0] || ''}.`;
                        setAnalysis(formattedSummary);
                    } else {
                         setAnalysis("تحلیل خودکار در حال حاضر امکان‌پذیر نیست.");
                    }
                } catch (error) {
                    console.error("Error generating analysis:", error);
                    setAnalysis("خطا در ایجاد تحلیل.");
                }
            };
            generateAnalysis();
        }
    }, [loading, appState, metrics]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
                <Loader2 className="animate-spin mr-2" />
                <span className="text-gray-600">در حال بارگذاری و تحلیل توسط هوش مصنوعی...</span>
            </div>
        );
    }

    return (
        <div className="bg-blue-50/60 p-5 rounded-xl border border-blue-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">تحلیل و پیشنهاد هوش مصنوعی</h3>
            <p className="text-gray-700 leading-relaxed text-justify">{analysis}</p>
        </div>
    );
};


const Step4: React.FC<{ appState: AppState }> = ({ appState }) => {
    const { ledger, metrics } = useMemo(() => {
        const ledgerData = calculateLedger(appState);
        const metricsData = calculateFinancialMetrics(appState, ledgerData);
        return { ledger: ledgerData, metrics: metricsData };
    }, [appState]);

    const conversionFactor = appState.value_unit === 'IRR' ? 1000000 : 1;
    const valueUnitLabel = appState.value_unit === 'IRR' ? 'میلیون ریال' : unitLabel(appState.weight_unit, appState.value_unit).value;

    const chartData = ledger
      .filter(entry => entry.month > 0 && entry.month <= appState.num_months)
      .map(entry => ({
        name: `ماه ${entry.month}`,
        'جریان خالص': parseFloat((entry.net_cf / conversionFactor).toFixed(2)),
    }));
    
    return (
        <div className="space-y-8">
            <div>
                 <h2 className="text-xl font-extrabold text-gray-800 mb-4">نتایج پروژه: <span className="text-[#0B4DA2]">{appState.project_name}</span></h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <KpiCard title="ارزش فعلی خالص (NPV)" value={metrics.npv.toLocaleString('fa-IR', { maximumFractionDigits: 2 })} unit={valueUnitLabel} />
                    <KpiCard title="نسبت منفعت به هزینه (BCR)" value={isFinite(metrics.bcr) ? metrics.bcr.toFixed(3) : '∞'} unit="(شاخص)" />
                    <KpiCard title="جمع جریان ورودی" value={metrics.totalCashInflow.toLocaleString('fa-IR', { maximumFractionDigits: 2 })} unit={valueUnitLabel} />
                    <KpiCard title="جمع جریان خروجی" value={metrics.totalCashOutflow.toLocaleString('fa-IR', { maximumFractionDigits: 2 })} unit={valueUnitLabel} />
                    <KpiCard title="خالص جریان نقدی" value={metrics.netCashFlow.toLocaleString('fa-IR', { maximumFractionDigits: 2 })} unit={valueUnitLabel} />
                    <KpiCard title="حاشیه سود کل دوره" value={metrics.profitMargin.toFixed(2)} unit="(درصد)" />
                </div>
            </div>

            <div>
                <h2 className="text-xl font-extrabold text-gray-800 mb-4">نمودار جریان نقدی خالص ماهانه</h2>
                <div className="w-full h-96 bg-white p-4 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-gray-200/80 print-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis dataKey="name" tick={{ fontFamily: 'Vazirmatn', fontSize: 12 }} />
                            <YAxis 
                                tickFormatter={(value) => `${value.toLocaleString('fa-IR')}`}
                                label={{ value: `(${valueUnitLabel})`, angle: -90, position: 'insideLeft', offset: -20, style: { fontFamily: 'Vazirmatn', fontSize: 14, fill: '#666' } }}
                                tick={{ fontFamily: 'Vazirmatn', fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '12px',
                                    fontFamily: 'Vazirmatn',
                                    direction: 'rtl',
                                    textAlign: 'right',
                                    border: '1px solid #ddd'
                                }}
                                formatter={(value, name) => [`${Number(value).toLocaleString('fa-IR', { maximumFractionDigits: 2 })} ${valueUnitLabel}`, name]}
                                labelStyle={{ fontWeight: 'bold' }}
                            />
                            <Bar dataKey="جریان خالص">
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry['جریان خالص'] >= 0 ? '#16a34a' : '#dc2626'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
             <div>
                <AIAnalysis appState={appState} metrics={metrics} />
            </div>
        </div>
    );
};

export default Step4;