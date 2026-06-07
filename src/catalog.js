// Catalogo de modelos/herramientas de IA y motor de recomendacion.
// El objetivo de Prof-IA es ayudar a cada persona a elegir el modelo que mas le
// conviene segun su caso de uso, presupuesto y nivel tecnico, de forma honesta.
//
// Nota: el panorama de modelos cambia rapido. Este catalogo es una base editable;
// Prof-IA siempre debe matizar que conviene verificar precios y limites actuales.

export const MODELS = [
  {
    id: 'chatgpt',
    name: 'ChatGPT (OpenAI)',
    vendor: 'OpenAI',
    kind: 'asistente-generalista',
    strengths: ['conversacion', 'escritura', 'codigo', 'voz en tiempo real', 'analisis de imagenes'],
    bestFor: ['escribir', 'estudiar', 'programar', 'productividad diaria', 'aprender'],
    cost: 'freemium',
    difficulty: 'muy facil',
    privacy: 'nube',
    notes: 'Punto de partida ideal para la mayoria. Plan gratuito util; el de pago da modelos mas potentes.',
  },
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    vendor: 'Anthropic',
    kind: 'asistente-generalista',
    strengths: ['textos largos', 'razonamiento', 'codigo', 'tono cuidado', 'documentos extensos'],
    bestFor: ['analizar documentos largos', 'redaccion', 'programar', 'trabajo cuidadoso'],
    cost: 'freemium',
    difficulty: 'muy facil',
    privacy: 'nube',
    notes: 'Excelente con documentos largos y respuestas matizadas.',
  },
  {
    id: 'gemini',
    name: 'Gemini (Google)',
    vendor: 'Google',
    kind: 'asistente-generalista',
    strengths: ['integracion con Google', 'multimodal', 'contexto largo', 'busqueda'],
    bestFor: ['usuarios de Workspace', 'investigar', 'multimodal', 'ofimatica'],
    cost: 'freemium',
    difficulty: 'muy facil',
    privacy: 'nube',
    notes: 'Comodo si ya vives en Gmail/Docs/Drive.',
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    vendor: 'Midjourney',
    kind: 'imagen',
    strengths: ['imagenes de alta calidad', 'estilo artistico'],
    bestFor: ['arte', 'diseno', 'marketing visual', 'ilustracion'],
    cost: 'pago',
    difficulty: 'media',
    privacy: 'nube',
    notes: 'Top en calidad estetica. Curva de prompts algo mayor.',
  },
  {
    id: 'dalle',
    name: 'DALL-E / Imagenes de ChatGPT',
    vendor: 'OpenAI',
    kind: 'imagen',
    strengths: ['imagenes desde el chat', 'facil', 'texto dentro de imagenes'],
    bestFor: ['imagenes rapidas', 'principiantes', 'contenido casual'],
    cost: 'freemium',
    difficulty: 'muy facil',
    privacy: 'nube',
    notes: 'Lo mas facil para empezar a generar imagenes.',
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    vendor: 'ElevenLabs',
    kind: 'voz',
    strengths: ['voz natural', 'clonacion de voz', 'multilingue'],
    bestFor: ['locucion', 'podcasts', 'doblaje', 'audiolibros'],
    cost: 'freemium',
    difficulty: 'media',
    privacy: 'nube',
    notes: 'Referente en voz sintetica realista.',
  },
  {
    id: 'whisper',
    name: 'Whisper (transcripcion)',
    vendor: 'OpenAI',
    kind: 'transcripcion',
    strengths: ['transcripcion precisa', 'muchos idiomas'],
    bestFor: ['transcribir reuniones', 'subtitulos', 'notas de voz'],
    cost: 'barato',
    difficulty: 'media',
    privacy: 'nube-o-local',
    notes: 'Hay versiones locales gratuitas para mayor privacidad.',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    vendor: 'Perplexity',
    kind: 'busqueda',
    strengths: ['respuestas con fuentes', 'investigacion', 'actualidad'],
    bestFor: ['investigar', 'datos actuales', 'citar fuentes'],
    cost: 'freemium',
    difficulty: 'muy facil',
    privacy: 'nube',
    notes: 'Como un buscador que responde y cita fuentes.',
  },
  {
    id: 'llama-local',
    name: 'Modelos locales (Llama / Mistral via Ollama)',
    vendor: 'Open source',
    kind: 'asistente-generalista',
    strengths: ['privacidad total', 'sin coste por uso', 'offline'],
    bestFor: ['datos sensibles', 'privacidad', 'sin conexion', 'control total'],
    cost: 'gratis-con-hardware',
    difficulty: 'avanzada',
    privacy: 'local',
    notes: 'Maxima privacidad: corre en tu equipo. Requiere algo de hardware y montaje.',
  },
  {
    id: 'agente-privado',
    name: 'Agente privado de Prof-IA (a medida)',
    vendor: 'Prof-IA',
    kind: 'agente',
    strengths: ['especializado en tu caso', 'con tus datos/instrucciones', 'desplegable en tu dominio'],
    bestFor: ['tareas repetitivas propias', 'atencion a clientes', 'flujos especificos', 'negocio'],
    cost: 'variable',
    difficulty: 'gestionado',
    privacy: 'tu-eliges',
    notes: 'Cuando un modelo generico no basta: Prof-IA crea y aloja un agente a tu medida y te lo transfiere a tu dominio.',
  },
];

// Senales que detectamos en lo que cuenta el usuario para puntuar modelos.
const SIGNAL_RULES = [
  { keys: ['imagen', 'foto', 'dibuj', 'ilustr', 'logo', 'diseñ', 'diseno', 'arte'], tag: 'imagen' },
  { keys: ['voz', 'locuc', 'narra', 'podcast', 'audiolibro', 'doblaje'], tag: 'voz' },
  { keys: ['transcrib', 'subtitul', 'reunion', 'acta', 'dictado'], tag: 'transcripcion' },
  { keys: ['buscar', 'investig', 'fuente', 'actualidad', 'noticia', 'datos recientes'], tag: 'busqueda' },
  { keys: ['programa', 'codigo', 'código', 'desarroll', 'app', 'software', 'bug'], tag: 'codigo' },
  { keys: ['document', 'contrato', 'pdf', 'informe largo', 'libro'], tag: 'documentos largos' },
  { keys: ['privac', 'sensible', 'confidencial', 'local', 'offline', 'sin conexion'], tag: 'privacidad' },
  { keys: ['gratis', 'barato', 'economic', 'económic', 'sin pagar', 'presupuesto'], tag: 'economia' },
  { keys: ['negocio', 'empresa', 'cliente', 'automatiz', 'repetit', 'flujo', 'agente', 'integrar'], tag: 'agente' },
  { keys: ['escribir', 'redact', 'estudiar', 'aprender', 'productividad', 'organiz'], tag: 'generalista' },
];

function detectSignals(text = '') {
  const t = (text || '').toLowerCase();
  const tags = new Set();
  for (const rule of SIGNAL_RULES) {
    if (rule.keys.some((k) => t.includes(k))) tags.add(rule.tag);
  }
  return tags;
}

function scoreModel(model, { tags, budget, skill }) {
  let score = 0;
  const reasons = [];

  const has = (arr, v) => arr.some((x) => x.includes(v) || v.includes(x));

  if (tags.has('imagen') && model.kind === 'imagen') { score += 5; reasons.push('genera imagenes'); }
  if (tags.has('voz') && model.kind === 'voz') { score += 5; reasons.push('especializado en voz'); }
  if (tags.has('transcripcion') && model.kind === 'transcripcion') { score += 5; reasons.push('transcribe audio'); }
  if (tags.has('busqueda') && model.kind === 'busqueda') { score += 5; reasons.push('responde con fuentes'); }
  if (tags.has('agente') && model.kind === 'agente') { score += 4; reasons.push('agente a medida para tu flujo'); }
  if (tags.has('codigo') && has(model.bestFor, 'programar')) { score += 3; reasons.push('bueno para programar'); }
  if (tags.has('documentos largos') && has(model.strengths, 'largos')) { score += 3; reasons.push('maneja textos largos'); }
  if (tags.has('generalista') && model.kind === 'asistente-generalista') { score += 2; reasons.push('asistente versatil'); }

  // Privacidad.
  if (tags.has('privacidad')) {
    if (model.privacy === 'local') { score += 5; reasons.push('privacidad total (corre local)'); }
    else if (model.privacy === 'tu-eliges') { score += 2; reasons.push('puedes controlar donde viven tus datos'); }
    else { score -= 2; }
  }

  // Economia.
  if (budget === 'gratis' || tags.has('economia')) {
    if (['freemium', 'gratis-con-hardware', 'barato'].includes(model.cost)) { score += 2; reasons.push('tiene opcion economica/gratuita'); }
    if (model.cost === 'pago') { score -= 2; }
  }

  // Nivel tecnico.
  if (skill === 'principiante') {
    if (model.difficulty === 'muy facil') { score += 2; reasons.push('muy facil de usar'); }
    if (model.difficulty === 'avanzada') { score -= 3; }
  }
  if (skill === 'avanzado' && model.difficulty === 'avanzada') { score += 1; }

  // Sesgo suave hacia generalistas faciles para que siempre haya un punto de partida.
  if (model.kind === 'asistente-generalista' && model.difficulty === 'muy facil') score += 0.5;

  return { score, reasons };
}

/**
 * Recomienda modelos a partir de la descripcion del usuario.
 * @param {Object} input
 * @param {string} input.useCase  - descripcion libre de lo que quiere hacer.
 * @param {('gratis'|'mixto'|'sin-limite')} [input.budget]
 * @param {('principiante'|'intermedio'|'avanzado')} [input.skill]
 * @returns {{ recommendations: Array, signals: string[], suggestsPrivateAgent: boolean }}
 */
export function recommendModels({ useCase = '', budget = 'mixto', skill = 'principiante' } = {}) {
  const tags = detectSignals(useCase);
  const scored = MODELS.map((m) => {
    const { score, reasons } = scoreModel(m, { tags, budget, skill });
    return { model: m, score, reasons };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  // Si nada puntua (descripcion vaga), proponemos los generalistas faciles.
  let list = scored;
  if (list.length === 0) {
    list = MODELS.filter((m) => m.kind === 'asistente-generalista' && m.difficulty === 'muy facil').map((m) => ({
      model: m,
      score: 1,
      reasons: ['punto de partida sencillo y versatil'],
    }));
  }

  const recommendations = list.slice(0, 4).map((x) => ({
    id: x.model.id,
    name: x.model.name,
    vendor: x.model.vendor,
    why: x.reasons.length ? x.reasons.join('; ') : x.model.notes,
    cost: x.model.cost,
    difficulty: x.model.difficulty,
    privacy: x.model.privacy,
    notes: x.model.notes,
  }));

  // Sugerimos agente privado si el caso es de negocio/automatizacion o si pidio agente.
  const suggestsPrivateAgent = tags.has('agente');

  return {
    recommendations,
    signals: [...tags],
    suggestsPrivateAgent,
  };
}

export function getModel(id) {
  return MODELS.find((m) => m.id === id) || null;
}
