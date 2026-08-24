import { MockProductCatalogProvider } from "./mock-provider.js";
import type { ProductCatalogProvider } from "./provider.js";

export const productCatalog: ProductCatalogProvider = new MockProductCatalogProvider();

export * from "./provider.js";
