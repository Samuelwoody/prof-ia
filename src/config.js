// Configuracion central leida de variables de entorno con valores por defecto.
// Carga un .env muy simple sin dependencias externas (solo KEY=VALUE).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function loadDotEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadDotEnv();

export const ROOT_DIR = ROOT;

export const config = {
  port: Number(process.env.PORT || 3000),
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    realtimeModel: process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime',
    voice: process.env.OPENAI_REALTIME_VOICE || 'marin',
    textModel: process.env.OPENAI_TEXT_MODEL || 'gpt-4.1',
    clientSecretsUrl:
      process.env.OPENAI_CLIENT_SECRETS_URL || 'https://api.openai.com/v1/realtime/client_secrets',
    callsUrl: process.env.OPENAI_REALTIME_CALLS_URL || 'https://api.openai.com/v1/realtime/calls',
  },
  vercel: {
    token: process.env.VERCEL_TOKEN || '',
    teamId: process.env.VERCEL_TEAM_ID || '',
  },
  tempDomain: process.env.PROFIA_TEMP_DOMAIN || 'prof-ia.app',
  // Plazo maximo para transferir el agente a un dominio propio (en dias).
  transferDeadlineDays: 30,
};

export function assertOpenAIKey() {
  if (!config.openai.apiKey) {
    throw new Error('Falta OPENAI_API_KEY. Copia .env.example a .env y configura tu clave.');
  }
}
