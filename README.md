# 🎓 Prof-IA

**Prof-IA** es un profesor de inteligencia artificial que enseña a cualquier persona a usar la IA
de la forma más **rápida, segura, fiable, amena y económica** — hablando con él en **tiempo real**.

Prof-IA hace tres cosas:

1. **Conversa contigo por voz (y texto) en tiempo real** usando la **Realtime API de OpenAI** (WebRTC).
2. **Te recomienda el modelo/herramienta de IA concreto** que mejor encaja con *tu* caso, presupuesto
   y nivel — con honestidad, priorizando lo gratuito o barato cuando cubre la necesidad.
3. **Crea y aloja un agente privado a tu medida** cuando un modelo genérico no basta. El agente se
   despliega en un **dominio temporal** que tú debes **transferir a un dominio de tu propiedad en un
   plazo máximo de 1 mes**.

Es **multilingüe**: detecta tu idioma y responde en él.

---

## 🚀 Puesta en marcha

Requisitos: **Node.js 20+** y una clave de **OpenAI** con acceso a la Realtime API.

```bash
git clone <este-repo>
cd prof-ia
npm install
cp .env.example .env      # edita .env y pon tu OPENAI_API_KEY
npm start
```

Abre **http://localhost:3000**, pulsa **🎙️ Empezar a hablar**, permite el micrófono y cuéntale a
Prof-IA qué quieres lograr.

> La clave secreta de OpenAI **nunca** llega al navegador: el servidor emite *tokens efímeros* de
> corta duración para que el navegador se conecte a la Realtime API por WebRTC.

---

## 🧠 Cómo funciona

```
Navegador (WebRTC, voz/texto)
   │  1) pide token efímero
   ▼
Servidor Node/Express ──► OpenAI /realtime/client_secrets  (token efímero)
   ▲                                                         
   │  3) ejecuta herramientas (function calling)            
   │     · recommend_models                                 
   │     · create_private_agent  ──► Orquestador ──► Vercel (despliegue real)
   │     · schedule_domain_transfer                          
   │
Navegador ◄── 2) conecta por WebRTC directo a OpenAI con el token efímero
```

### Herramientas que Prof-IA puede invocar
| Herramienta | Qué hace |
|---|---|
| `recommend_models` | Analiza tu caso de uso y devuelve los modelos de IA más adecuados (`src/catalog.js`). |
| `create_private_agent` | Genera y **despliega** un agente privado a tu medida (`src/orchestrator.js`). |
| `schedule_domain_transfer` | Registra tu dominio propio y confirma el plazo de 1 mes. |

---

## 🤖 Agentes privados y transferencia de dominio

Cuando aceptas crear un agente, el **orquestador**:

1. Genera el código del agente (una mini-app con su propia UI y endpoint de chat — ver `src/agentTemplate.js`).
2. Lo **despliega en Vercel** (integración real vía REST API) y le asigna una **URL temporal**.
3. Crea un registro con el **plazo máximo de 1 mes** para que lo transfieras a tu dominio.

> ⏳ **Importante:** el dominio temporal es provisional. Tienes **30 días** para transferir el agente a
> un dominio de tu propiedad. Pasado el plazo, el alojamiento temporal puede caducar.

### Integración real con Vercel
Para despliegues reales, configura en `.env`:

```env
VERCEL_TOKEN=tu_token_de_vercel
VERCEL_TEAM_ID=opcional
```

- **Con `VERCEL_TOKEN`** → el agente se despliega de verdad y obtienes una URL `*.vercel.app`.
- **Sin `VERCEL_TOKEN`** → modo **simulación**: se genera la spec y una URL temporal de ejemplo, ideal
  para probar el flujo sin desplegar nada.

Para que el agente desplegado responda, configura su variable `OPENAI_API_KEY` en el proyecto de Vercel.

### Pasos de transferencia (los explica Prof-IA y los devuelve `schedule_domain_transfer`)
1. Añade tu dominio al proyecto en Vercel (*Settings → Domains*).
2. Apunta el DNS de tu dominio según indique Vercel (registro A o CNAME).
3. Configura `OPENAI_API_KEY` en el proyecto con tu propia clave.

---

## 📁 Estructura

```
prof-ia/
├─ src/
│  ├─ server.js        # Express: estáticos, token efímero, ejecución de herramientas
│  ├─ config.js        # carga .env y configuración central
│  ├─ persona.js       # instrucciones del profesor (multilingüe)
│  ├─ catalog.js       # catálogo de modelos + motor de recomendación
│  ├─ tools.js         # esquemas de herramientas + despachador
│  ├─ orchestrator.js  # crea/despliega agentes + plazo de transferencia
│  ├─ agentTemplate.js # genera el código del agente desplegable
│  └─ store.js         # persistencia JSON de agentes
├─ public/             # frontend WebRTC (index.html, app.js, styles.css)
├─ vercel.json         # despliegue de la propia app Prof-IA
└─ .env.example
```

---

## ⚙️ Configuración (variables de entorno)

| Variable | Por defecto | Descripción |
|---|---|---|
| `OPENAI_API_KEY` | — | **Obligatoria.** Clave de OpenAI (solo en el servidor). |
| `OPENAI_REALTIME_MODEL` | `gpt-realtime` | Modelo de la Realtime API. |
| `OPENAI_REALTIME_VOICE` | `marin` | Voz del profesor. |
| `OPENAI_TEXT_MODEL` | `gpt-4.1` | Modelo base por defecto de los agentes creados. |
| `VERCEL_TOKEN` | — | Token para despliegues reales (si falta → simulación). |
| `PORT` | `3000` | Puerto del servidor. |

Los nombres de modelo/endpoint son **configurables** porque la Realtime API evoluciona; ajústalos a lo
que ofrezca tu cuenta de OpenAI si fuera necesario.

---

## 🔐 Seguridad y honestidad
- La clave de OpenAI vive solo en el servidor; el navegador usa tokens efímeros.
- Prof-IA avisa de posibles *alucinaciones*, recomienda no compartir datos sensibles en la nube y
  sugiere modelos **locales** cuando la privacidad es prioritaria.
- Verifica siempre la información crítica.

## Licencia
MIT
