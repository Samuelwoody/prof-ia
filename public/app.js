// Cliente Realtime de Prof-IA (WebRTC en el navegador).
// Flujo: pedimos token efimero al servidor -> conectamos por WebRTC a OpenAI ->
// hablamos por microfono y/o texto -> manejamos function calls del modelo.

const $ = (id) => document.getElementById(id);
const statusEl = $('status');
const transcriptEl = $('transcript');
const recosEl = $('recos');
const agentBox = $('agentBox');

let pc = null;
let dc = null;
let micStream = null;
let cfg = null;
let assistantMsgEl = null; // mensaje del bot en construccion (streaming)

function setStatus(text, cls) {
  statusEl.textContent = text;
  statusEl.className = 'status ' + cls;
}

function addMessage(role, text) {
  const hint = transcriptEl.querySelector('.hint');
  if (hint) hint.remove();
  const div = document.createElement('div');
  div.className = 'msg ' + role;
  div.textContent = text;
  transcriptEl.appendChild(div);
  transcriptEl.scrollTop = transcriptEl.scrollHeight;
  return div;
}

async function loadConfig() {
  cfg = await fetch('/api/config').then((r) => r.json());
  if (!cfg.hasKey) {
    addMessage('tool', 'Falta configurar OPENAI_API_KEY en el servidor: la conversacion no funcionara.');
  }
}

async function connect() {
  try {
    setStatus('Conectando...', 'connecting');
    $('connectBtn').disabled = true;

    // 1) Token efimero.
    const session = await fetch('/api/session', { method: 'POST' }).then((r) => r.json());
    if (!session.value) throw new Error(session.error || 'No se obtuvo token de sesion');

    // 2) PeerConnection + audio de salida.
    pc = new RTCPeerConnection();
    pc.ontrack = (e) => { $('botAudio').srcObject = e.streams[0]; };

    // 3) Microfono (salvo modo solo-texto).
    if (!$('textMode').checked) {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStream.getTracks().forEach((t) => pc.addTrack(t, micStream));
    } else {
      // En modo texto seguimos necesitando un transceiver de audio para recibir voz.
      pc.addTransceiver('audio', { direction: 'recvonly' });
    }

    // 4) Canal de datos para eventos.
    dc = pc.createDataChannel('oai-events');
    dc.addEventListener('open', onChannelOpen);
    dc.addEventListener('message', (e) => onServerEvent(JSON.parse(e.data)));

    // 5) Oferta SDP -> OpenAI -> respuesta SDP.
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const sdpRes = await fetch(`${cfg.callsUrl}?model=${encodeURIComponent(cfg.model)}`, {
      method: 'POST',
      body: offer.sdp,
      headers: { Authorization: `Bearer ${session.value}`, 'Content-Type': 'application/sdp' },
    });
    if (!sdpRes.ok) throw new Error('Fallo al negociar WebRTC: ' + sdpRes.status);
    const answer = { type: 'answer', sdp: await sdpRes.text() };
    await pc.setRemoteDescription(answer);

    setStatus('En directo', 'live');
    $('hangupBtn').disabled = false;
    $('textForm').hidden = false;
  } catch (err) {
    console.error(err);
    setStatus('Error', 'error');
    addMessage('tool', 'Error de conexion: ' + (err.message || err));
    $('connectBtn').disabled = false;
  }
}

function onChannelOpen() {
  // Prof-IA saluda primero.
  sendEvent({ type: 'response.create', response: { instructions: cfg.greeting } });
}

function sendEvent(obj) {
  if (dc && dc.readyState === 'open') dc.send(JSON.stringify(obj));
}

// --- Manejo de eventos del servidor Realtime ---
async function onServerEvent(ev) {
  const t = ev.type || '';

  // Transcripcion de lo que dice el usuario (voz -> texto).
  if (t.includes('input_audio_transcription') && t.endsWith('.completed')) {
    if (ev.transcript) addMessage('user', ev.transcript);
    return;
  }

  // Transcripcion en streaming de la voz del asistente.
  if (t.includes('audio_transcript') && t.endsWith('.delta')) {
    if (!assistantMsgEl) assistantMsgEl = addMessage('bot', '');
    assistantMsgEl.textContent += ev.delta || '';
    transcriptEl.scrollTop = transcriptEl.scrollHeight;
    return;
  }
  if (t.includes('audio_transcript') && t.endsWith('.done')) {
    assistantMsgEl = null;
    return;
  }

  // Respuestas de texto (modo solo-texto).
  if (t === 'response.output_text.delta' || t === 'response.text.delta') {
    if (!assistantMsgEl) assistantMsgEl = addMessage('bot', '');
    assistantMsgEl.textContent += ev.delta || '';
    return;
  }
  if (t === 'response.output_text.done' || t === 'response.text.done') {
    assistantMsgEl = null;
    return;
  }

  // Llamada a herramienta completada por el modelo.
  if (t === 'response.function_call_arguments.done') {
    await handleToolCall(ev);
    return;
  }

  if (t === 'error') {
    console.warn('Realtime error:', ev);
    addMessage('tool', 'Aviso del modelo: ' + (ev.error?.message || 'error desconocido'));
  }
}

async function handleToolCall(ev) {
  let args = {};
  try { args = JSON.parse(ev.arguments || '{}'); } catch {}
  addMessage('tool', `Prof-IA usa la herramienta: ${ev.name}`);

  let result;
  try {
    result = await fetch(`/api/tools/${ev.name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    }).then((r) => r.json());
  } catch (err) {
    result = { error: String(err.message || err) };
  }

  // Pintar resultados en los paneles.
  if (ev.name === 'recommend_models') renderRecos(result);
  if (ev.name === 'create_private_agent') renderAgent(result);
  if (ev.name === 'schedule_domain_transfer') renderTransfer(result);

  // Devolver el resultado al modelo y pedir que continue.
  sendEvent({
    type: 'conversation.item.create',
    item: { type: 'function_call_output', call_id: ev.call_id, output: JSON.stringify(result) },
  });
  sendEvent({ type: 'response.create' });
}

// --- Render de paneles ---
function renderRecos(result) {
  if (!result?.recommendations?.length) return;
  recosEl.innerHTML = '';
  for (const r of result.recommendations) {
    const el = document.createElement('div');
    el.className = 'reco';
    el.innerHTML =
      `<div class="name">${escapeHtml(r.name)}</div>` +
      `<div class="why">${escapeHtml(r.why || r.notes || '')}</div>` +
      `<div class="tags">` +
      `<span class="tag">💸 ${escapeHtml(r.cost)}</span>` +
      `<span class="tag">🎚️ ${escapeHtml(r.difficulty)}</span>` +
      `<span class="tag">🔒 ${escapeHtml(r.privacy)}</span>` +
      `</div>`;
    recosEl.appendChild(el);
  }
}

function renderAgent(result) {
  if (!result?.agentId) {
    if (result?.error) agentBox.innerHTML = `<p class="empty">No se pudo crear el agente: ${escapeHtml(result.error)}</p>`;
    return;
  }
  const deadline = result.transferDeadline ? new Date(result.transferDeadline).toLocaleDateString() : '';
  agentBox.innerHTML =
    `<div class="card">` +
    `<div class="name"><b>${escapeHtml(result.name)}</b></div>` +
    `<div class="why">Modo: ${escapeHtml(result.mode)}</div>` +
    (result.tempUrl ? `<div>URL temporal: <a href="${escapeAttr(result.tempUrl)}" target="_blank" rel="noopener">${escapeHtml(result.tempUrl)}</a></div>` : '') +
    `<div class="deadline">⏳ Transfiere a tu dominio antes del ${escapeHtml(deadline)} (max. 1 mes)</div>` +
    `<div class="why" style="margin-top:8px">ID: ${escapeHtml(result.agentId)}</div>` +
    `</div>`;
}

function renderTransfer(result) {
  if (!result?.ok) return;
  const note = document.createElement('div');
  note.className = 'deadline';
  note.textContent = `✅ Transferencia hacia ${result.targetDomain} registrada. ${result.message || ''}`;
  agentBox.appendChild(note);
}

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escapeAttr(s = '') { return escapeHtml(s); }

// --- Modo texto ---
$('textForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('textInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  addMessage('user', text);
  sendEvent({
    type: 'conversation.item.create',
    item: { type: 'message', role: 'user', content: [{ type: 'input_text', text }] },
  });
  sendEvent({ type: 'response.create' });
});

function hangup() {
  if (dc) dc.close();
  if (pc) pc.close();
  if (micStream) micStream.getTracks().forEach((t) => t.stop());
  pc = dc = micStream = null;
  setStatus('Desconectado', 'idle');
  $('connectBtn').disabled = false;
  $('hangupBtn').disabled = true;
  $('textForm').hidden = true;
}

$('connectBtn').addEventListener('click', connect);
$('hangupBtn').addEventListener('click', hangup);

loadConfig();
