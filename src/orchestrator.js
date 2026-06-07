// Orquestador de agentes privados.
// - Genera la especificacion y el codigo del agente.
// - Lo despliega de forma REAL en Vercel si hay VERCEL_TOKEN; si no, simula.
// - Asigna un dominio temporal y rastrea el plazo MAXIMO de 1 mes para que el
//   usuario lo transfiera a un dominio de su propiedad.
import crypto from 'node:crypto';
import { config } from './config.js';
import { saveAgent, getAgent } from './store.js';
import { generateAgentFiles, slug } from './agentTemplate.js';

const VERCEL_API = 'https://api.vercel.com';

function teamQuery() {
  return config.vercel.teamId ? `?teamId=${encodeURIComponent(config.vercel.teamId)}` : '';
}

// Despliega los archivos generados como un nuevo deployment de Vercel.
async function deployViaVercel(projectName, files) {
  const fileArray = Object.entries(files).map(([file, data]) => ({ file, data }));
  const res = await fetch(`${VERCEL_API}/v13/deployments${teamQuery()}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.vercel.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: projectName,
      files: fileArray,
      target: 'production',
      projectSettings: { framework: null },
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Vercel ${res.status}: ${data?.error?.message || JSON.stringify(data)}`);
  }
  const url = data.url ? `https://${data.url}` : null;
  return { id: data.id, url, alias: data.alias, raw: { inspectorUrl: data.inspectorUrl } };
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Crea (y despliega) un agente privado para el usuario.
 */
export async function createPrivateAgent(spec = {}) {
  if (!spec.name || !spec.purpose) {
    return { error: 'Faltan datos: se requieren "name" y "purpose".' };
  }

  const id = 'agt_' + crypto.randomBytes(6).toString('hex');
  const projectName = `profia-${slug(spec.name)}-${id.slice(4, 10)}`;
  const createdAt = new Date();
  const deadline = addDays(createdAt, config.transferDeadlineDays);

  const files = generateAgentFiles(spec);

  let deployment = null;
  let mode = 'simulado';
  let tempUrl = `https://${projectName}.${config.tempDomain}`; // placeholder en modo simulado

  if (config.vercel.token) {
    try {
      deployment = await deployViaVercel(projectName, files);
      if (deployment.url) tempUrl = deployment.url;
      mode = 'desplegado';
    } catch (err) {
      mode = 'error-despliegue';
      deployment = { error: String(err.message || err) };
    }
  }

  const agent = {
    id,
    name: spec.name,
    purpose: spec.purpose,
    audience: spec.audience || null,
    baseModel: spec.baseModel || 'gpt-4.1',
    ownerEmail: spec.ownerEmail || null,
    projectName,
    mode, // 'simulado' | 'desplegado' | 'error-despliegue'
    tempUrl,
    deployment,
    targetDomain: null,
    transfer: {
      status: 'pendiente',
      createdAt: createdAt.toISOString(),
      deadline: deadline.toISOString(),
      deadlineDays: config.transferDeadlineDays,
    },
    files: Object.keys(files),
  };

  saveAgent(agent);

  return {
    ok: true,
    agentId: id,
    name: agent.name,
    mode,
    tempUrl,
    transferDeadline: deadline.toISOString(),
    message:
      mode === 'desplegado'
        ? `Agente desplegado en ${tempUrl}. Importante: tienes hasta ${deadline.toLocaleDateString()} ` +
          `(maximo 1 mes) para transferirlo a un dominio de tu propiedad.`
        : mode === 'error-despliegue'
        ? `Agente creado pero el despliegue automatico fallo (${deployment?.error}). Spec guardada; ` +
          `se puede reintentar el despliegue.`
        : `Agente creado en modo simulacion (sin VERCEL_TOKEN). URL temporal de ejemplo: ${tempUrl}. ` +
          `Recuerda: plazo maximo de 1 mes para transferir a tu dominio (${deadline.toLocaleDateString()}).`,
    setup:
      mode === 'desplegado'
        ? 'Configura la variable OPENAI_API_KEY del proyecto en Vercel para que el agente responda.'
        : undefined,
  };
}

/**
 * Registra el dominio propio del usuario y confirma el plazo.
 */
export async function scheduleDomainTransfer(agentId, targetDomain) {
  const agent = getAgent(agentId);
  if (!agent) return { error: `No existe el agente ${agentId}.` };
  if (!targetDomain) return { error: 'Falta el dominio destino.' };

  agent.targetDomain = targetDomain;
  agent.transfer.status = 'programada';
  agent.transfer.targetDomain = targetDomain;
  saveAgent(agent);

  const deadline = new Date(agent.transfer.deadline);
  return {
    ok: true,
    agentId,
    targetDomain,
    deadline: agent.transfer.deadline,
    message:
      `Transferencia registrada hacia ${targetDomain}. Recuerda completarla antes del ` +
      `${deadline.toLocaleDateString()} (plazo maximo de 1 mes). Pasado el plazo, el alojamiento ` +
      `temporal puede caducar.`,
    nextSteps: [
      `Anade el dominio ${targetDomain} al proyecto "${agent.projectName}" en Vercel (Settings > Domains).`,
      `Apunta el DNS de ${targetDomain} segun indique Vercel (registro A o CNAME).`,
      'Configura OPENAI_API_KEY en el proyecto para que el agente funcione con tu propia clave.',
    ],
  };
}

// Version publica/segura del agente (sin datos internos del deployment).
export function getAgentPublic(id) {
  const a = getAgent(id);
  if (!a) return null;
  const now = Date.now();
  const deadline = new Date(a.transfer.deadline).getTime();
  const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
  return {
    id: a.id,
    name: a.name,
    purpose: a.purpose,
    mode: a.mode,
    tempUrl: a.tempUrl,
    targetDomain: a.targetDomain,
    transfer: { ...a.transfer, daysLeft },
  };
}
