import type { CatalogProduct, ProductCatalogProvider } from "./provider.js";

export class MockProductCatalogProvider implements ProductCatalogProvider {
  async findByIngredientCategory(_ingredientCategory: string): Promise<CatalogProduct[]> {
    return [];
  }
}
