import { createServer } from 'node:net';

let probe: Promise<boolean> | undefined;

/**
 * Resolves whether this environment is allowed to bind a local TCP socket.
 *
 * Sandboxes that deny `listen()` on 127.0.0.1 (EPERM) should skip
 * socket-based tests instead of failing the gate; CI and normal dev
 * environments pass and keep running them. Override explicitly with
 * `SIGMATACTIX_SOCKET_TESTS=off` or `=force`.
 */
export function canUseLocalSockets(): Promise<boolean> {
  const flag = process.env.SIGMATACTIX_SOCKET_TESTS;
  if (flag === 'off') return Promise.resolve(false);
  if (flag === 'force') return Promise.resolve(true);
  probe ??= new Promise(resolve => {
    const server = createServer();
    const timer = setTimeout(() => {
      server.close();
      resolve(false);
    }, 2000);
    timer.unref();
    server.once('error', () => {
      clearTimeout(timer);
      server.close();
      resolve(false);
    });
    server.listen(0, '127.0.0.1', () => {
      clearTimeout(timer);
      server.close();
      resolve(true);
    });
  });
  return probe;
}
