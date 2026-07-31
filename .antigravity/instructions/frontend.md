# Feature Instruction: Frontend & Vite SPAs

## Overview
Built with **React 19**, **Redux Toolkit**, **Tailwind CSS v4**, and **Vite 8**.

## Entry Points
- `resources/js/marketplace.jsx` $\rightarrow$ Mounts `#marketplace-root` in `marketplace.blade.php`.
- `resources/js/shop.jsx` $\rightarrow$ Mounts `#shop-owner-root` in `shop.blade.php`.
- `resources/js/admin.jsx` $\rightarrow$ Mounts `#admin-root` in `admin.blade.php`.

## Asset Compilation
- Dev mode: `npm run dev` (Vite dev server)
- Production build: `npm run build` (Outputs assets to `public/build/`)
