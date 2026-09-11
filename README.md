# تصمیم‌یار بازرگانی آتیه فولاد — نسخه ۱۱.۳

نسخه اجرایی این مخزن یک برنامه وب استاتیک و فارسی است. صفحه اصلی از `index.html` بارگذاری می‌شود و تنها مرجع محاسبات مالی `trade-engine.js` است. رابط، نمودارها، ماتریس حساسیت، مقایسه سناریو و خروجی Excel همگی داده خود را از همین موتور می‌گیرند.

## اجرای محلی

```bash
python3 -m http.server 8080
```

سپس `http://localhost:8080` را باز کنید. ورود از صفحه معرفی فقط با کلیک یا صفحه‌کلید انجام می‌شود و هیچ مثال عددی از پیش در فرم قرار ندارد.

## ساختار نسخه اجرایی

- `index.html`: رابط فارسی RTL، فرم‌ها و Decision Cockpit
- `trade-engine.js`: موتور مرکزی رویدادمحور، NPV، نقدینگی، VAT، کارمزدها و تصمیم
- `single-sheet-export.js`: مدل Excel تک‌شیتی و فرمول‌محور
- `economics-view.js` و `economics-view.css`: پل اقتصاد معامله
- `tests/`: آزمون‌های قطعی، تصادفی، فرمول، صادرات و رابط
- `reports/`: خروجی قابل ممیزی آزمون‌های انتشار
- `legacy/`: نمونه اولیه قدیمی React/TypeScript که در Runtime استفاده نمی‌شود

## آزمون انتشار

```bash
node tests/release-113.cjs
python3 tests/formulas-113.py /tmp/release113/formulas.jsonl
python3 tests/export-release-113.py
node tests/managerial-113.cjs
node tests/integration-v12.cjs
```

جزئیات تغییرات، فرمول‌ها و دامنه آزمون در [RELEASE-v11.3.md](RELEASE-v11.3.md) ثبت شده است.
