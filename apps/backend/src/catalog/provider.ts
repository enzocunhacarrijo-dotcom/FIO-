/** A real product (brand + SKU) that matches a recommended ingredient
 * category. Not used anywhere yet in the MVP — recommendations stay
 * category/ingredient-only (see the AI system prompt) until there's a real
 * catalog to back this with. */
export type CatalogProduct = {
  id: string;
  brand: string;
  name: string;
  ingredientCategory: string;
};

export interface ProductCatalogProvider {
  findByIngredientCategory(ingredientCategory: string): Promise<CatalogProduct[]>;
}
