import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // PHASE 6 TODO: temporary shim. The (uninstalled) firebase npm package is
      // replaced by src/firestore-shim.ts until the SPA is rewired to Supabase.
      'firebase/firestore': '/src/firestore-shim.ts',
    },
  },
});
