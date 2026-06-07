// Definiciones de herramientas (function calling) que el modelo Realtime puede invocar,
// y el despachador que las ejecuta en el servidor.
import { recommendModels } from './catalog.js';
import { createPrivateAgent, getAgentPublic, scheduleDomainTransfer } from './orchestrator.js';

// Esquema de herramientas en el formato que espera la Realtime API.
export const TOOLS = [
  {
    type: 'function',
    name: 'recommend_models',
    description:
      'Recomienda el modelo o herramienta de IA mas adecuado para el caso del usuario. ' +
      'Usar siempre que haya que aconsejar que IA usar, en lugar de responder de memoria.',
    parameters: {
      type: 'object',
      properties: {
        useCase: {
          type: 'string',
          description: 'Descripcion en lenguaje natural de lo que el usuario quiere lograr.',
        },
        budget: {
          type: 'string',
          enum: ['gratis', 'mixto', 'sin-limite'],
          description: 'Presupuesto aproximado del usuario.',
        },
        skill: {
          type: 'string',
          enum: ['principiante', 'intermedio', 'avanzado'],
          description: 'Nivel tecnico del usuario.',
        },
      },
      required: ['useCase'],
    },
  },
  {
    type: 'function',
    name: 'create_private_agent',
    description:
      'Crea y aloja un agente de IA privado y a medida para el usuario en un dominio temporal. ' +
      'Usar solo cuando el usuario ha aceptado explicitamente crear su agente. El usuario tendra ' +
      'un plazo maximo de 1 mes para transferirlo a un dominio propio.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nombre del agente (ej. "Asistente de Citas de Clinica Sol").' },
        purpose: { type: 'string', description: 'Para que sirve el agente y que tareas hara.' },
        audience: { type: 'string', description: 'Quien lo usara (clientes, equipo interno, etc.).' },
        baseModel: {
          type: 'string',
          description: 'Modelo base sugerido (ej. gpt-4.1). Opcional.',
        },
        ownerEmail: { type: 'string', description: 'Email del usuario para el seguimiento. Opcional.' },
      },
      required: ['name', 'purpose'],
    },
  },
  {
    type: 'function',
    name: 'schedule_domain_transfer',
    description:
      'Registra el dominio propio al que el usuario quiere transferir su agente y confirma el ' +
      'plazo (maximo 1 mes desde la creacion).',
    parameters: {
      type: 'object',
      properties: {
        agentId: { type: 'string', description: 'Id del agente creado previamente.' },
        targetDomain: { type: 'string', description: 'Dominio de propiedad del usuario (ej. miempresa.com).' },
      },
      required: ['agentId', 'targetDomain'],
    },
  },
];

// Despacha una llamada de herramienta y devuelve un objeto serializable.
export async function dispatchTool(name, args = {}) {
  switch (name) {
    case 'recommend_models':
      return recommendModels(args);
    case 'create_private_agent':
      return await createPrivateAgent(args);
    case 'schedule_domain_transfer':
      return await scheduleDomainTransfer(args.agentId, args.targetDomain);
    default:
      return { error: `Herramienta desconocida: ${name}` };
  }
}

export { getAgentPublic };
