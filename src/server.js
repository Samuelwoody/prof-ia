// Servidor Prof-IA.
// - Sirve el frontend (public/).
// - Emite tokens efimeros para que el navegador conecte a la Realtime API por WebRTC.
//   La clave secreta de OpenAI NUNCA llega al navegador.
// - Ejecuta las herramientas (recomendaciones, creacion de agentes) cuando el modelo
//   las invoca via function calling.
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config, assertOpenAIKey, ROOT_DIR } from './config.js';
import { PROFIA_INSTRUCTIONS, PROFIA_GREETING } from './persona.js';
import { TOOLS, dispatchTool, getAgentPublic } from './tools.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(ROOT_DIR, 'public')));

// Config publica que necesita el cliente (sin secretos).
app.get('/api/config', (_req, res) => {
  res.json({
    model: config.openai.realtimeModel,
    voice: config.openai.voice,
    callsUrl: config.openai.callsUrl,
    greeting: PROFIA_GREETING,
    hasKey: Boolean(config.openai.apiKey),
    vercelEnabled: Boolean(config.vercel.token),
  });
});

// Emite un token efimero (client secret) para la sesion Realtime.
app.post('/api/session', async (_req, res) => {
  try {
    assertOpenAIKey();
    const sessionConfig = {
      session: {
        type: 'realtime',
        model: config.openai.realtimeModel,
        instructions: PROFIA_INSTRUCTIONS,
        audio: {
          input: { transcription: { model: 'gpt-4o-mini-transcribe' } },
          output: { voice: config.openai.voice },
        },
        tools: TOOLS,
      },
    };
    const r = await fetch(config.openai.clientSecretsUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.openai.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionConfig),
    });
    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: data?.error?.message || 'No se pudo crear la sesion', detail: data });
    }
    // El valor del token efimero puede venir como data.value o data.client_secret.value
    const value = data.value || data.client_secret?.value || null;
    res.json({ value, expires_at: data.expires_at, model: config.openai.realtimeModel });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

// Ejecuta una herramienta invocada por el modelo (o por la UI auxiliar).
app.post('/api/tools/:name', async (req, res) => {
  try {
    const result = await dispatchTool(req.params.name, req.body || {});
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

// Estado publico de un agente (incluye dias restantes para transferir).
app.get('/api/agents/:id', (req, res) => {
  const a = getAgentPublic(req.params.id);
  if (!a) return res.status(404).json({ error: 'Agente no encontrado' });
  res.json(a);
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(config.port, () => {
  console.log(`\nProf-IA escuchando en http://localhost:${config.port}`);
  if (!config.openai.apiKey) {
    console.log('  AVISO: falta OPENAI_API_KEY (copia .env.example a .env). La conversacion no funcionara sin ella.');
  }
  if (!config.vercel.token) {
    console.log('  Nota: sin VERCEL_TOKEN, el orquestador de agentes corre en modo SIMULACION.');
  }
});
