import { defineConfig } from 'astro/config';
import yaml from '@modyfi/vite-plugin-yaml';

// https://astro.build/config
export default defineConfig({
  site: 'https://roman.nurik.net',
  build: {
    assets: 'astro', // underscores don't work in GitHub Pages
  },
  vite: {
    plugins: [
      yaml()
    ],
  },
});
