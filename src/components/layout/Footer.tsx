import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-stone-100 border-t border-stone-200 text-stone-500 py-3 px-4 text-center text-[10px] space-y-1 print:hidden">
      <p className="font-semibold text-stone-600">&copy; 2026 AyurScribe Clinical Companion</p>
      <p className="max-w-2xl mx-auto leading-relaxed hidden sm:block">
        Upload your classical texts or submit learning corrections in the Knowledge Base tab.
      </p>
    </footer>
  );
}
