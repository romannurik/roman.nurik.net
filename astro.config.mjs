import { defineConfig } from 'astro/config';
import yaml from '@modyfi/vite-plugin-yaml';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [
      yaml()
    ],
  },
});
