
import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import ProgressBar from './components/ProgressBar';
import Step1 from './components/Step1';
import Step2 from './components/Step2';
import Step3 from './components/Step3';
import Step4 from './components/Step4';
import { AppState, initialAppState, ValidationState } from './types';
import { validateStep1, validateStep2, validateStep3 } from './services/validationService';

// Helper function for deep object updates
const updateNestedState = (obj: any, path: string, value: any) => {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    return obj;
};


const App: React.FC = () => {
    const [step, setStep] = useState<number>(1);
    const [appState, setAppState] = useState<AppState>(initialAppState);

    // Sync sale_qty_per_month with qty_per_month from step 1
    useEffect(() => {
        setAppState(prevState => ({
            ...prevState,
            sale_qty_per_month: prevState.qty_per_month
        }));
    }, [appState.qty_per_month]);


    const validationState: ValidationState = useMemo(() => ({
        step1: validateStep1(appState),
        step2: validateStep2(appState),
        step3: validateStep3(appState),
    }), [appState]);

    const updateState = (path: string, value: any) => {
        setAppState(prevState => {
            const newState = JSON.parse(JSON.stringify(prevState)); // Deep copy
            updateNestedState(newState, path, value);
            return newState;
        });
    };

    const nextStep = () => {
        if (step === 1 && validationState.step1.isValid) {
            setStep(s => s + 1);
        } else if (step === 2 && validationState.step2.isValid) {
            setStep(s => s + 1);
        } else if (step === 3 && validationState.step3.isValid) {
            setStep(s => s + 1);
        }
    };

    const prevStep = () => setStep(s => Math.max(1, s - 1));

    const renderStep = () => {
        switch (step) {
            case 1:
                return <Step1 state={appState} updateState={updateState} validation={validationState.step1} />;
            case 2:
                return <Step2 state={appState} updateState={updateState} validation={validationState.step2} />;
            case 3:
                return <Step3 state={appState} updateState={updateState} validation={validationState.step3} />;
            case 4:
                return <Step4 appState={appState} />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen font-sans print-container">
            <Header />
            <main className="max-w-5xl mx-auto p-4 md:p-8">
                <div className="bg-white rounded-3xl shadow-[0_12px_36px_rgba(11,77,162,0.1)] p-6 md:p-10 border border-gray-200/80 print-container">
                    <ProgressBar step={step} />
                    <div className="mt-10">
                        {renderStep()}
                    </div>
                    <div className="mt-10 flex justify-between items-center no-print">
                        <div>
                            {step > 1 && (
                                <button
                                    onClick={prevStep}
                                    className="px-8 py-3 text-base font-bold text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors"
                                >
                                    مرحله قبل
                                </button>
                            )}
                        </div>
                        <div>
                            {step < 4 ? (
                                <button
                                    onClick={nextStep}
                                    className="px-8 py-3 text-base font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors disabled:bg-gray-400"
                                    disabled={
                                        (step === 1 && !validationState.step1.isValid) ||
                                        (step === 2 && !validationState.step2.isValid) ||
                                        (step === 3 && !validationState.step3.isValid)
                                    }
                                >
                                    مرحله بعد
                                </button>
                            ) : (
                                <button
                                     onClick={() => window.print()}
                                    className="px-8 py-3 text-base font-bold text-white bg-[#0B4DA2] rounded-xl hover:bg-opacity-90 transition-colors"
                                >
                                    چاپ نتایج
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
