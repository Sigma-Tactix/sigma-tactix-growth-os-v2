// Internal TypeScript imports are bundled before Vercel traces this entry point.
// This keeps stock Node ESM resolution identical locally and in the function.
export { default } from '../build/server.mjs';
