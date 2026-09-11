
import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="py-3" style={{ background: "linear-gradient(180deg, #f7f9ff, rgba(247, 249, 255, 0))" }}>
            <div className="max-w-5xl mx-auto px-4">
                <div className="flex items-center bg-white rounded-2xl p-3 shadow-[0_8px_26px_rgba(11,77,162,0.12)] border border-[#edf1fb]">
                    <img
                        src="https://picsum.photos/54/54"
                        height="54"
                        width="54"
                        alt="Logo"
                        className="object-cover bg-white rounded-2xl p-1.5 shadow-[0_5px_18px_rgba(0,0,0,0.08)] border border-[#eef2fb]"
                    />
                    <div className="ms-4 flex items-center">
                        <span className="text-2xl font-black text-[#0B4DA2] leading-tight">ارزیاب مالی طرح‌های تجاری</span>
                        <span className="w-2 h-2 rounded-full bg-[#C89B4A] inline-block mx-3"></span>
                        <span className="text-base font-bold text-[#0B4DA2] opacity-90">هلدینگ آتیه فولاد نقش جهان</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
