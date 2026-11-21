// Vercel owns the HTTP listener. server.ts exports the same authenticated API
// used by the standalone process, without starting timers or binding a port.
export { default } from '../server.js';
