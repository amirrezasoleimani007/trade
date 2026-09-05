# تصمیم‌یار بازرگانی آتیه فولاد — نسخه ۱۲

[اجرای نرم‌افزار](https://amirrezasoleimani007.github.io/trade/)

برنامه فعال index.html است. موتور trade-engine.js و نمایش economics-view.js و economics-view.css همراه آن منتشر شده‌اند. فایل‌های TypeScript قدیمی در اجرای این صفحه نقش ندارند.

شماره نسخه در سربرگ قابل مشاهده است. شرح اصلاحات و آزمون‌ها در RELEASE-v12.md و reports قرار دارد. روش محاسبه و محدودیت‌های اکسل ممیزی در RELEASE-v11.md است.

برای اجرای آفلاین، کل شاخه gh-pages را دریافت و index.html را باز کنید.

آزمون موتور: node tests/finance-v11.cjs
آزمون اتصال رابط: node tests/integration-v12.cjs (نیازمند acorn)
اکسل: node tests/export-v11.cjs audit.xlsx
تطبیق اکسل: python3 tests/audit-workbook-v11.py audit.xlsx (نیازمند openpyxl)
