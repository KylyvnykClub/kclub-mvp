import net from 'node:net';
import { spawn } from 'node:child_process';
import process from 'node:process';

const preferredPort = parseInt(process.argv[2] || '3000', 10);

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, '127.0.0.1');
  });
}

async function findFreePort(start) {
  for (let port = start; port < start + 100; port++) {
    if (await isPortFree(port)) return port;
  }
  throw new Error(`No free port found in range ${start}-${start + 99}`);
}

const port = await findFreePort(preferredPort);

if (port !== preferredPort) {
  console.log(`\n  ▲ Port ${preferredPort} is busy, using port ${port} instead\n`);
} else {
  console.log(`\n  ▲ Starting on port ${port}\n`);
}

const child = spawn('next', ['dev', '--turbopack', '--port', String(port)], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: String(port) },
});

child.on('exit', (code) => process.exit(code ?? 0));
process.on('SIGTERM', () => child.kill());
process.on('SIGINT', () => child.kill());
