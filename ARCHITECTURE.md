# ARCHITECTURE.md — Servicio Express Thimpson
> Documento maestro de arquitectura del ecosistema completo.  
> Actualizar este archivo con cada decisión técnica importante.  
> Versión: 1.0.0 | Fecha: 2026-06-18

---

## Clasificación del ecosistema

**SaaS multi-tenant con Marketplace integrado**

- **SaaS:** la plataforma de gestión de delivery (Admin Panel, Apps Móviles, API) es Software como Servicio.
- **Marketplace:** negocios afiliados publican catálogos; los pedidos se enrutan automáticamente a través de Thimpson.
- **Multi-tenant:** arquitectura de sucursales (tabla `branches`) que permite operar múltiples sedes desde el mismo ecosistema.
- **CMS:** el Super Admin controla dinámicamente el contenido de la web pública (banners, promociones, anuncios por rango de fechas).

---

## Patrón de arquitectura

**Monolito Modular Serverless** en Vercel + Supabase.

No se usan microservicios en la fase inicial. La arquitectura es modular internamente con límites claros entre módulos, lo que permite extraer servicios individuales cuando el tráfico lo justifique. Supabase maneja autenticación, base de datos, tiempo real y almacenamiento sin gestión de servidores.

---

## Repositorios

| Repo | Tecnología | Deploy | Directorio local |
|---|---|---|---|
| `AdminThimpson` | React + Vite + Tailwind | Vercel | `C:\Users\DMLM\Desktop\AdminThimpson\` |
| `appwebThimpson` | React + Vite + Tailwind | Vercel | `C:\Users\DMLM\Desktop\appwebThimpson\` |
| `ThimpsonExpressDB` | PostgreSQL / Supabase | Supabase | `C:\Users\DMLM\Desktop\ThimpsonExpressDB\` |
| `ThimpsonExpressMovilPublic` | React Native + Expo | Expo / App Stores | `C:\Users\DMLM\Desktop\ThimpsonExpressMovilPublic\` |
| `ThimpsonExpressDrivers` | React Native + Expo | Expo / App Stores | `C:\Users\DMLM\Desktop\ThimpsonExpressDrivers\` |

GitHub: https://github.com/DenDev93

---

## Stack tecnológico completo

### Frontend Web
- **Framework:** React 18 + Vite
- **Estilos:** Tailwind CSS + variables CSS de marca
- **Estado global:** Zustand o React Context
- **Cliente API:** Supabase JS Client + fetch nativo
- **Gráficas (Admin):** Recharts
- **Formularios:** React Hook Form + Zod
- **Routing:** React Router v6

### Mobile Apps
- **Framework:** React Native + Expo SDK (latest)
- **Navegación:** Expo Router (file-based)
- **Estilos:** StyleSheet + NativeWind (Tailwind para RN)
- **Estado:** Zustand
- **Maps:** react-native-maps + Google Maps API

### Backend / API
- **Runtime:** Next.js API Routes (serverless en Vercel)
- **Auth:** Supabase Auth (JWT)
- **ORM:** Supabase JS Client directo (sin ORM adicional)
- **Validación:** Zod

### Base de datos
- **Motor:** PostgreSQL (Supabase)
- **Extensiones:** PostGIS (geolocalización), uuid-ossp, pgcrypto
- **Tiempo real:** Supabase Realtime (WebSockets)
- **Storage:** Supabase Storage (imágenes de productos, logos, galería)

### IA / Agentes
- **Proveedor:** Anthropic Claude API
- **Modelos:**
  - Chatbot web/WhatsApp: `claude-haiku-4-5` (velocidad + costo)
  - Agente admin (decisiones): `claude-sonnet-4-6` (razonamiento)
- **WhatsApp:** WhatsApp Business API Cloud (Meta — gratuito en tier básico)
- **Webhooks:** Vercel Serverless Functions como receptor

### Infraestructura
- **Deploy web:** Vercel (auto-deploy desde GitHub)
- **Deploy mobile:** Expo EAS Build
- **CI/CD:** GitHub Actions + Vercel integración nativa
- **Variables de entorno:** Vercel Dashboard + `.env.local`

---

## Identidad visual

### Colores de marca (Web / Admin)
```css
:root {
  --thimpson-yellow:    #FBB03B;  /* Logo, textos resaltados, CTAs */
  --thimpson-black:     #000000;  /* Fondos principales */
  --thimpson-white:     #FFFFFF;  /* Texto de lectura */
  --thimpson-dark-teal: #0B1F22;  /* Cajas y fondos secundarios */
  --thimpson-brown:     #BC8A5F;  /* Acento (bolsa kraft) */
  --whatsapp-green:     #25D366;  /* Botón WhatsApp */
  --tigo-blue:          #00377B;  /* Logo Tigo */
  --claro-red:          #E53935;  /* Logo Claro */
}
```

### Colores de marca (Apps Móviles)
```css
:root {
  --app-yellow:         #FFD500;  /* Botones, cabeceras, menú activo */
  --app-bg-white:       #FFFFFF;  /* Fondo general */
  --app-card-dark:      #1A1A1A;  /* Tarjetas oscuras */
  --app-text-main:      #000000;  /* Textos principales */
  --app-text-muted:     #757575;  /* Textos secundarios */
  --app-border-light:   #EEEEEE;  /* Bordes y separadores */
  --cat-food-red:       #E53935;
  --cat-pharmacy-green: #4CAF50;
  --cat-super-blue:     #1976D2;
  --rating-star-orange: #FF9800;
}
```

---

## Servicios y precios (Ocotal, Nicaragua)

| Servicio | Precio base | Precio por parada | Precio manual |
|---|---|---|---|
| Mandado | C$40 | C$40 | No |
| Delivery | C$40 | C$40 | No |
| Encomienda | C$40 | C$40 | No |
| Viaje expreso | — | — | Sí (CEO) |
| Transporte | — | — | Sí (CEO) |
| Acarreo | — | — | Sí (CEO) |
| Mudanza | — | — | Sí (CEO) |

---

## Reglas de negocio críticas

1. **Asignación automática de motorizados:**
   - Radio máximo: **3.5 km** desde el origen de la solicitud
   - Carga máxima: **3 órdenes activas** por motorizado simultáneamente
   - Algoritmo: seleccionar el más cercano disponible con PostGIS

2. **Marketplace:**
   - Pedido a negocio afiliado → automáticamente usa delivery Thimpson
   - Plan gratuito: funciones básicas
   - Plan premium: funciones avanzadas (precio mensual, definido por CEO)

3. **CMS:**
   - Contenidos con `start_date` y `end_date` se activan/expiran automáticamente
   - Trigger en base de datos actualiza el estado

4. **Suscripciones de clientes:**
   - Público general puede ver info básica sin suscripción
   - Suscripción requerida para acceder a catálogos completos y hacer pedidos

---

## Agentes de IA

### Agente 1: Admin Virtual (24/7)
- Recibe solicitudes de chatbot web, WhatsApp y formularios
- Registra solicitudes en base de datos
- Ejecuta algoritmo de asignación automática
- Modelo: `claude-sonnet-4-6`

### Agente 2: Chatbot Web público
- Saludo con verificación de suscripción
- Muestra servicios y precios
- Recopila origen, destino, paradas
- Calcula precio y envía al Agente Admin
- Modelo: `claude-haiku-4-5`

### Agente 3: Bot de WhatsApp
- Mismas funciones que chatbot web
- Canal: WhatsApp Business API Cloud
- Webhooks en Vercel Serverless
- Modelo: `claude-haiku-4-5`

---

## Contacto del negocio

- **Claro:** +50584159112
- **Tigo:** +50585932295
- **Ubicación:** Ocotal, Nueva Segovia, Nicaragua

---

## Fases de construcción

| Fase | Qué se construye | Estado |
|---|---|---|
| **1** | Esquema BD completo (ThimpsonExpressDB) | ✅ Completado |
| **1** | API serverless base (Next.js) | 🔲 Pendiente |
| **2** | Panel Admin (AdminThimpson) | 🔲 Pendiente |
| **2** | Agentes IA (Admin + Chatbot web) | 🔲 Pendiente |
| **3** | App Web Pública (appwebThimpson) | 🔲 Pendiente |
| **3** | Bot WhatsApp (WhatsApp Business Cloud) | 🔲 Pendiente |
| **4** | App Cliente Móvil (ThimpsonExpressMovilPublic) | 🔲 Pendiente |
| **4** | App Motorizados (ThimpsonExpressDrivers) | 🔲 Pendiente |

---

## Historial de decisiones

| Fecha | Decisión | Razón |
|---|---|---|
| 2026-06-18 | Monolito Modular Serverless en lugar de microservicios | Reducir complejidad operacional en fase inicial |
| 2026-06-18 | WhatsApp Business API Cloud (vs API Key) | Gratuito, mejor mantenimiento, webhooks nativos |
| 2026-06-18 | PostGIS para geolocalización | Búsquedas geoespaciales nativas en PostgreSQL sin servicio externo |
| 2026-06-18 | Supabase Realtime para estados en tiempo real | Integrado en Supabase, sin Redis adicional |
| 2026-06-18 | Esquema multi-tenant con tabla branches | Permite múltiples sucursales desde el inicio |
