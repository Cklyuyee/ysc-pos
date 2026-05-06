import { CATEGORIES, isPlaceholderName } from '../../../data/categories';
import { PRODUCTS } from '../../../data/products';

export interface Category {
  id: string;        // For backward compat with searchProducts: equals the L1 name
  name: string;
  count?: number;
}

const productCountByL1Name = new Map<string, number>();
PRODUCTS.forEach(p => {
  if (p.Category_L1) {
    productCountByL1Name.set(p.Category_L1, (productCountByL1Name.get(p.Category_L1) ?? 0) + 1);
  }
});

// Flat list of L1 categories (for filter dropdowns) — id = name for searchProducts compat.
export const CATEGORIES_DATABASE: Category[] = [
  { id: 'all', name: 'ทั้งหมด', count: PRODUCTS.length },
  ...CATEGORIES
    .filter(c => c.level === 1 && !isPlaceholderName(c.name))
    .map(c => ({
      id: c.name,
      name: c.name,
      count: productCountByL1Name.get(c.name) ?? 0,
    }))
    .filter(c => (c.count ?? 0) > 0)
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0) || a.name.localeCompare(b.name, 'th')),
];

export const getCategories = async (): Promise<Category[]> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  return CATEGORIES_DATABASE;
};

export const getCategoryById = async (id: string): Promise<Category | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 30));
  return CATEGORIES_DATABASE.find(c => c.id === id);
};
