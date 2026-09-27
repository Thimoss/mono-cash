export const EXPENSE_CATEGORIES = [
  'FOOD & BEVERAGE',
  'BILLS & UTILITIES',
  'OBLIGATIONS / DEBTS',
  'TRANSPORTATION',
  'LIFESTYLE & HOBBY',
  'OTHERS',
] as const;

export const INCOME_CATEGORIES = [
  'SALARY',
  'FREELANCE',
  'INVESTMENT',
  'OTHERS',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];
export type Category = ExpenseCategory | IncomeCategory;
