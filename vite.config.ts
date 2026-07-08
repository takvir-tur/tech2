// import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// // 1. Detect if we are building on Vercel
// const isVercel = !!process.env.VERCEL;

// export default defineConfig({
//   // 2. Force Nitro to generate Vercel's required Build Output format
//   nitro: isVercel ? { preset: "vercel" } : true,
//   tanstackStart: {
//     // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
//     // nitro/vite builds from this
//     server: { entry: "server" },
//   },
//   vite: {
//     server: {
//       proxy: {
//         "/api": {
//           target: "http://localhost:8000",
//           changeOrigin: true,
//         },
//       },
//     },
//   },
// });


import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts
    server: { entry: "server" },
    // Correctly nest the Nitro preset override here so it only triggers during a production build
    nitro: {
      preset: process.env.VERCEL ? "vercel" : undefined
    }
  },
  vite: {
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:8000", // <--- CHANGED THIS TO 8080
          changeOrigin: true,
        },
      },
    },
  },
});