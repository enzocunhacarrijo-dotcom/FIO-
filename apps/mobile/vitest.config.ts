import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Espelha o alias "@/*" -> "./src/*" definido em tsconfig.json (usado pelo
// Metro no app) para que os testes possam importar módulos do app do mesmo
// jeito que o código de produção.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
