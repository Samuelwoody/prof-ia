// Persistencia muy simple en JSON para los agentes creados.
// Suficiente para un MVP; en produccion se sustituiria por una base de datos.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT_DIR } from './config.js';

const DATA_DIR = path.join(ROOT_DIR, 'data');
const FILE = path.join(DATA_DIR, 'agents.json');

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '[]');
}

export function listAgents() {
  ensure();
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return [];
  }
}

export function saveAgent(agent) {
  const agents = listAgents();
  const idx = agents.findIndex((a) => a.id === agent.id);
  if (idx >= 0) agents[idx] = agent;
  else agents.push(agent);
  ensure();
  fs.writeFileSync(FILE, JSON.stringify(agents, null, 2));
  return agent;
}

export function getAgent(id) {
  return listAgents().find((a) => a.id === id) || null;
}
