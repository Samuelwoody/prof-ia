// Genera los archivos de un agente privado autonomo y desplegable (en Vercel).
// El agente es una pequena app: una funcion serverless que conversa usando el modelo
// elegido + una UI minima. Las instrucciones del agente se inyectan en build time.

export function buildSystemPrompt(spec) {
  return [
    `Eres "${spec.name}", un agente de IA privado creado por Prof-IA.`,
    `Proposito: ${spec.purpose}.`,
    spec.audience ? `Tu publico: ${spec.audience}.` : '',
    'Responde en el idioma del usuario, con utilidad, brevedad y honestidad.',
    'No inventes datos; si no sabes algo, dilo. No compartas informacion sensible.',
  ]
    .filter(Boolean)
    .join('\n');
}

// Devuelve un mapa { ruta: contenido } listo para desplegar como proyecto Vercel.
export function generateAgentFiles(spec) {
  const systemPrompt = buildSystemPrompt(spec);
  const model = spec.baseModel || 'gpt-4.1';

  const api = `import OpenAIShim from './_openai.js';

const SYSTEM_PROMPT = ${JSON.stringify(systemPrompt)};
const MODEL = ${JSON.stringify(model)};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Falta OPENAI_API_KEY en el agente.' });
    return;
  }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  try {
    const reply = await OpenAIShim.chat({
      apiKey,
      model: MODEL,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    });
    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
}
`;

  const openaiShim = `// Cliente minimo de OpenAI Chat Completions usando fetch nativo.
export default {
  async chat({ apiKey, model, messages }) {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
      body: JSON.stringify({ model, messages }),
    });
    if (!r.ok) throw new Error('OpenAI ' + r.status + ': ' + (await r.text()));
    const data = await r.json();
    return data.choices?.[0]?.message?.content ?? '';
  },
};
`;

  const index = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(spec.name)}</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: system-ui, sans-serif; max-width: 720px; margin: 0 auto; padding: 24px; }
  h1 { font-size: 1.25rem; }
  #log { display: flex; flex-direction: column; gap: 10px; margin: 16px 0; }
  .msg { padding: 10px 14px; border-radius: 12px; max-width: 85%; white-space: pre-wrap; }
  .user { align-self: flex-end; background: #2563eb; color: #fff; }
  .bot { align-self: flex-start; background: rgba(127,127,127,0.18); }
  form { display: flex; gap: 8px; }
  input { flex: 1; padding: 12px; border-radius: 10px; border: 1px solid #8884; }
  button { padding: 12px 18px; border-radius: 10px; border: 0; background: #2563eb; color: #fff; cursor: pointer; }
  .note { opacity: .6; font-size: .8rem; }
</style>
</head>
<body>
  <h1>${escapeHtml(spec.name)}</h1>
  <p class="note">Agente privado creado por Prof-IA. ${escapeHtml(spec.purpose)}</p>
  <div id="log"></div>
  <form id="f">
    <input id="i" placeholder="Escribe tu mensaje..." autocomplete="off" />
    <button>Enviar</button>
  </form>
  <p class="note">Dominio temporal. Transfierelo a tu dominio propio antes de la fecha limite indicada por Prof-IA.</p>
<script>
const log = document.getElementById('log');
const history = [];
function add(role, text) {
  const d = document.createElement('div');
  d.className = 'msg ' + (role === 'user' ? 'user' : 'bot');
  d.textContent = text;
  log.appendChild(d);
  log.scrollIntoView({ block: 'end' });
}
document.getElementById('f').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('i');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  add('user', text);
  history.push({ role: 'user', content: text });
  try {
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history }),
    });
    const data = await r.json();
    const reply = data.reply || data.error || '(sin respuesta)';
    add('bot', reply);
    history.push({ role: 'assistant', content: reply });
  } catch (err) {
    add('bot', 'Error: ' + err.message);
  }
});
</script>
</body>
</html>
`;

  const pkg = JSON.stringify(
    {
      name: slug(spec.name),
      version: '1.0.0',
      private: true,
      description: 'Agente privado generado por Prof-IA: ' + spec.purpose,
    },
    null,
    2,
  );

  const readme = `# ${spec.name}

Agente privado generado por **Prof-IA**.

- **Proposito:** ${spec.purpose}
- **Modelo base:** ${model}

## Variables de entorno
- \`OPENAI_API_KEY\`: clave de OpenAI del propietario del agente.

## Transferencia de dominio
Este agente se aloja en un dominio TEMPORAL. Debes transferirlo a un dominio de tu
propiedad en un plazo MAXIMO de 1 mes. Consulta las instrucciones que te dio Prof-IA.
`;

  return {
    'api/chat.js': api,
    'api/_openai.js': openaiShim,
    'public/index.html': index,
    'package.json': pkg,
    'README.md': readme,
  };
}

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function slug(s = '') {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'agente';
}
