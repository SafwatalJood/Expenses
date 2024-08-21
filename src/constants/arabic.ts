export const ARABIC_TEXTS = {
  // Project Dashboard
  PROJECTS_DASHBOARD: 'لوحة المشاريع',
  ADD_PROJECT: 'إضافة مشروع جديد',
  EDIT_PROJECT: 'تعديل المشروع',
  DELETE_PROJECT: 'حذف المشروع',
  EXPORT_REPORT: 'تصدير التقرير',
  TOTAL_EXPENSES: 'إجمالي المصروفات',
  TOTAL_DEPOSITS: 'إجمالي الإيداعات',
  REMAINING_BALANCE: 'الرصيد المتبقي',
  VIEW_DETAILS: 'عرض التفاصيل',  // View details for project

  // Expense Management
  DESCRIPTION: 'الوصف',
  AMOUNT: 'المبلغ',
  VAT: 'ضريبة القيمة المضافة',
  TOTAL_AMOUNT: 'المبلغ الكلي',
  DATE: 'التاريخ',
  TYPE: 'النوع',
  ADDED_BY: 'مضاف بواسطة',
  RECEIPT: 'الإيصال',
  ACTIONS: 'الإجراءات',
  EXPENSE: 'مصروف',
  DEPOSIT: 'إيداع',
  EDIT: 'تعديل',
  DELETE: 'حذف',
  VIEW_RECEIPT: 'عرض الإيصال',
  ADD_EXPENSE: 'إضافة قيد جديد',
  UPDATE_EXPENSE: 'تحديث القيد',
  CANCEL: 'إلغاء',
  UPLOAD_RECEIPT: 'تحميل الإيصال',

  // Error and Confirmation Messages
  ERROR_LOADING: 'حدث خطأ أثناء التحميل',
  ERROR_ADDING_EXPENSE: 'حدث خطأ أثناء إضافة المصروف',
  ERROR_UPDATING_EXPENSE: 'حدث خطأ أثناء تحديث المصروف',
  ERROR_DELETING_EXPENSE: 'حدث خطأ أثناء حذف المصروف',
  ERROR_FETCHING_PROJECTS: 'حدث خطأ أثناء جلب المشاريع. يرجى المحاولة مرة أخرى.',
  ERROR_FETCHING_EXPENSES: 'حدث خطأ أثناء جلب المصروفات. يرجى المحاولة مرة أخرى.',
  ERROR_HANDLING_EXPENSE: 'حدث خطأ أثناء معالجة المصروف',
  CONFIRM_DELETE: 'هل أنت متأكد أنك تريد حذف هذا القيد؟',
  CONFIRM_DELETE_EXPENSE: 'هل أنت متأكد من أنك تريد حذف هذا المصروف؟',
  PROJECT_NOT_FOUND: 'المشروع غير موجود',
  ERROR_FETCHING_PROJECT: 'حدث خطأ أثناء جلب المشروع',
  ERROR_DELETING_EXPENSE: 'حدث خطأ أثناء حذف المصروف',

  // Auth & User Management
  WELCOME_TITLE: 'مرحبًا بك في صفوة الجود للمقاولات',
  WELCOME_DESCRIPTION: 'هذا التطبيق هو نظام لتتبع مصروفات المشاريع، يسمح للمستخدمين بتسجيل الدخول وإدارة المشاريع والمصروفات.',
  COMPANY_LOGO_ALT: 'شعار صفوة الجود',
  FEATURES: 'الميزات',
  FEATURE_1: 'تسجيل الدخول للمستخدمين مع أدوار مختلفة',
  FEATURE_2: 'إنشاء وإدارة المشاريع',
  FEATURE_3: 'تسجيل المصروفات والإيداعات',
  FEATURE_4: 'عرض تقارير المشاريع',
  FEATURE_5: 'إدارة المستخدمين (للمسؤولين)',
  GO_TO_DASHBOARD: 'الذهاب إلى لوحة التحكم',
  SIGN_IN: 'تسجيل الدخول',
  PROJECT_NAME_REQUIRED: 'اسم المشروع مطلوب',
  PROJECT_NAME: 'اسم المشروع',
  PROJECT_DESCRIPTION: 'وصف المشروع',
  OPTIONAL: 'اختياري',
  NO_ASSIGNED_PROJECTS: 'لا توجد مشاريع مخصصة',
  PLEASE_SIGN_IN: 'الرجاء تسجيل الدخول لعرض الملف الشخصي',

  // User Management
  USER_MANAGEMENT: 'إدارة المستخدمين',
  ROLE: 'الدور',
  ADMIN: 'مدير',
  COLLABORATOR: 'مدخل',
  VIEWER: 'مشاهد',
  ASSIGNED_PROJECTS: 'المشاريع المخصصة',
  LOAD_USERS_PROJECTS_ERROR: 'حدث خطأ أثناء تحميل المستخدمين والمشاريع',
  UPDATE_USER_ROLE_ERROR: 'حدث خطأ أثناء تحديث دور المستخدم',
  UPDATE_PROJECT_ASSIGNMENT_ERROR: 'حدث خطأ أثناء تحديث تعيين المشروع',
  PROFILE: 'الملف الشخصي',
  EMAIL: 'البريد الإلكتروني',
  SIGN_OUT: 'تسجيل الخروج',

  // Newer Additions
  CONFIRM_DELETE_EXPENSE: 'هل أنت متأكد من أنك تريد حذف هذا المصروف؟',
  ERROR_DELETING_EXPENSE: 'حدث خطأ أثناء حذف المصروف',
  PROJECT_NOT_FOUND: 'المشروع غير موجود',
  ERROR_FETCHING_PROJECT: 'حدث خطأ أثناء جلب المشروع',
  REMAINING_BALANCE: 'الرصيد المتبقي',
  TOTAL_EXPENSES: 'إجمالي المصروفات',
  TOTAL_DEPOSITS: 'إجمالي الإيداعات',
  UPDATE_EXPENSE: 'تحديث القيد',
  ADD_EXPENSE: 'إضافة قيد جديد',
  CANCEL: 'إلغاء',
  UPLOAD_RECEIPT: 'تحميل الإيصال',
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount);
};

export const formatDate = (date: string): string => {
  return new Intl.DateTimeFormat('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(date));
};

export const calculateVAT = (amount: number, vatRate: number = 0.15): number => {
  return amount * vatRate;
};

export const calculateTotalWithVAT = (amount: number, vat: number): number => {
  return amount + vat;
};
