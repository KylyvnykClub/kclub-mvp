import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const QUOTED_VALUE_PATTERN = /^(["'])(.*)\1$/;

function parseEnvValue(rawValue) {
  const trimmedValue = rawValue.trim();
  const quotedMatch = trimmedValue.match(QUOTED_VALUE_PATTERN);

  if (!quotedMatch) {
    return trimmedValue;
  }

  return quotedMatch[2]
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'");
}

function loadEnvFile(filePath, env) {
  if (!existsSync(filePath)) {
    return;
  }

  const fileContents = readFileSync(filePath, 'utf8');
  const lines = fileContents.split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = parseEnvValue(trimmedLine.slice(separatorIndex + 1));

    env[key] = value;
  }
}

export function loadLocalEnv(appDirectory, env = process.env) {
  loadEnvFile(path.join(appDirectory, '.env'), env);
  loadEnvFile(path.join(appDirectory, '.env.local'), env);
  return env;
}

function startServer(port) {
  if (!port) {
    throw new Error('Port argument is required');
  }

  loadLocalEnv(process.cwd());

  const child = spawn('next', ['start', '--port', port], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: port,
    },
  });

  child.on('exit', (code) => process.exit(code ?? 0));
  process.on('SIGTERM', () => child.kill());
  process.on('SIGINT', () => child.kill());
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer(process.argv[2]);
}
