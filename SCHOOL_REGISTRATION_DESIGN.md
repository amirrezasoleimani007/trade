# طراحی نرم‌افزار ثبت‌نام مدرسه

## 1) هدف سامانه
این سامانه برای **ثبت‌نام دانش‌آموزان**، مدیریت ظرفیت کلاس‌ها، مدیریت مدارک، وضعیت پرداخت، و پیگیری مراحل ثبت‌نام تا تأیید نهایی طراحی شده است.

---

## 2) نقش‌های کاربری

- **ولی/دانش‌آموز**
  - ایجاد درخواست ثبت‌نام
  - تکمیل فرم مشخصات فردی
  - بارگذاری مدارک
  - پرداخت آنلاین هزینه ثبت‌نام
  - مشاهده وضعیت پرونده

- **کارشناس آموزش**
  - بررسی مدارک و اطلاعات
  - تأیید/رد درخواست با درج توضیح
  - تخصیص به پایه/کلاس

- **مدیر مدرسه**
  - تعریف سال تحصیلی و پایه‌ها
  - تعریف ظرفیت کلاس‌ها
  - گزارش‌گیری آماری و مالی
  - مدیریت کاربران سامانه

---

## 3) جریان ثبت‌نام (Workflow)

1. ایجاد حساب کاربری (شماره موبایل + OTP)
2. تکمیل اطلاعات دانش‌آموز و ولی
3. انتخاب پایه تحصیلی و شیفت
4. بارگذاری مدارک (شناسنامه، کارنامه، عکس)
5. پرداخت هزینه اولیه ثبت‌نام
6. بررسی توسط کارشناس
7. اعلام نتیجه (تأیید/نیاز به اصلاح/رد)
8. نهایی‌سازی ثبت‌نام و تخصیص کلاس

---

## 4) ماژول‌های اصلی

### 4.1 مدیریت دانش‌آموز
- پرونده کامل دانش‌آموز
- سوابق ثبت‌نام سال‌های قبل
- وضعیت فعال/انتقالی/انصرافی

### 4.2 مدیریت اولیا
- امکان اتصال چند دانش‌آموز به یک ولی
- اطلاعات تماس و نشانی
- سوابق پرداخت

### 4.3 مدیریت کلاس و ظرفیت
- تعریف پایه، کلاس، معلم، شیفت
- ظرفیت کل و ظرفیت باقیمانده
- جلوگیری از ثبت‌نام بیش از ظرفیت

### 4.4 مدیریت مدارک
- آپلود فایل با فرمت‌های مجاز (PDF/JPG/PNG)
- اعتبارسنجی حجم فایل
- وضعیت هر مدرک: در انتظار بررسی / تأیید / رد

### 4.5 مدیریت مالی
- تعریف تعرفه‌ها (ثابت یا بر اساس پایه)
- پرداخت آنلاین
- صدور رسید دیجیتال
- گزارش بدهی و پرداخت

### 4.6 گزارش‌گیری
- تعداد ثبت‌نام به تفکیک پایه
- ثبت‌نام‌های ناقص و ردشده
- گزارش درآمد روزانه/ماهانه
- ظرفیت تکمیل‌شده کلاس‌ها

---

## 5) طراحی دیتابیس (پیشنهادی)

### جدول `users`
- `id` (PK)
- `mobile` (unique)
- `password_hash`
- `role` (parent, staff, admin)
- `created_at`

### جدول `students`
- `id` (PK)
- `national_code` (unique)
- `first_name`
- `last_name`
- `birth_date`
- `gender`
- `parent_user_id` (FK -> users.id)

### جدول `academic_years`
- `id` (PK)
- `title` (مثلاً 1406-1405)
- `is_active`

### جدول `grades`
- `id` (PK)
- `name` (اول ابتدایی، دوم ...)

### جدول `classes`
- `id` (PK)
- `academic_year_id` (FK)
- `grade_id` (FK)
- `name` (الف، ب ...)
- `capacity`

### جدول `enrollments`
- `id` (PK)
- `student_id` (FK)
- `academic_year_id` (FK)
- `grade_id` (FK)
- `class_id` (nullable FK)
- `status` (draft, submitted, under_review, approved, rejected, need_edit)
- `submitted_at`

### جدول `documents`
- `id` (PK)
- `enrollment_id` (FK)
- `doc_type` (id_card, transcript, photo, ...)
- `file_url`
- `review_status` (pending, approved, rejected)
- `review_note`

### جدول `payments`
- `id` (PK)
- `enrollment_id` (FK)
- `amount`
- `gateway_ref`
- `status` (pending, paid, failed, refunded)
- `paid_at`

---

## 6) APIهای کلیدی (نمونه)

- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`
- `POST /api/students`
- `GET /api/students/:id`
- `POST /api/enrollments`
- `PATCH /api/enrollments/:id`
- `POST /api/enrollments/:id/documents`
- `POST /api/enrollments/:id/payments`
- `POST /api/enrollments/:id/review`
- `GET /api/reports/enrollments-summary`

---

## 7) قواعد اعتبارسنجی مهم

- کد ملی معتبر و یکتا باشد.
- ظرفیت کلاس نباید از حد مجاز عبور کند.
- فقط بعد از تکمیل مدارک، وضعیت به `submitted` تغییر کند.
- فقط کاربر دارای نقش `staff/admin` مجاز به تغییر وضعیت بررسی باشد.
- تغییر وضعیت به `approved` فقط در صورت پرداخت موفق امکان‌پذیر باشد.

---

## 8) تکنولوژی پیشنهادی

- **Frontend:** React + TypeScript + Tailwind
- **Backend:** Node.js (NestJS/Express)
- **Database:** PostgreSQL
- **Storage:** S3-compatible object storage
- **Auth:** OTP + JWT
- **Deploy:** Docker + Nginx + CI/CD

---

## 9) نسخه MVP (قابل تحویل سریع)

برای شروع سریع، نسخه MVP شامل این بخش‌ها باشد:
1. ورود با OTP
2. فرم ثبت‌نام دانش‌آموز
3. بارگذاری مدارک
4. پرداخت آنلاین
5. پنل کارشناس برای تأیید/رد
6. گزارش ساده تعداد ثبت‌نام

این نسخه معمولاً در 2 تا 4 اسپرینت قابل پیاده‌سازی است.
