# 🌌 Polaris Web Studio - Portal Comercial & Landing Principal

Plataforma oficial de **Polaris Web Studio**, un estudio boutique de diseño y desarrollo de software de alta gama especializado en crear productos digitales interactivos, ultrarrápidos y de conversión optimizada para clientes internacionales y de la República Dominicana.

Este repositorio alberga tanto la Landing Page inmersiva orientada al diseño premium como el cotizador inteligente con panel de operaciones para clientes.

## ✨ Características Principales

*   **Diseño Inmersivo con Sistema Liquid Glass:** Interfaz de usuario de alta fidelidad, con transiciones orgánicas fluidas mediante Framer Motion y compatibilidad total con modo claro y oscuro.
*   **Wizard de Cotización Inteligente (WizardQuote):** Flujo de tarificación dinámico por pasos que calcula presupuestos en tiempo real según el sector del negocio y los requerimientos del cliente.
*   **Buscador & Sugeridor de Dominios por IA:** Validador en tiempo real integrado con un servicio inteligente para sugerir alternativas disponibles utilizando Inteligencia Artificial.
*   **Portal de Clientes Integrado (ClientDashboard):** Área privada segura donde los clientes de Polaris pueden consultar el avance de sus proyectos, tareas en progreso, facturación, links de reuniones y enviar requerimientos técnicos.
*   **Soporte Multidivisa Avanzado:** Conversor inteligente que procesa montos en dólares (USD) e integra la equivalencia en pesos dominicanos (DOP) usando tasas en tiempo real.
*   **Integraciones Premium:** Agendamientos nativos sin fricciones mediante Cal.com y seguimiento de analíticas mediante Google Analytics 4.

## 🛠️ Stack Tecnológico

*   **Frontend:** React 18, Vite, TypeScript, Tailwind CSS (v4), Framer Motion.
*   **Backend:** Node.js, Express, esbuild (para compilación del servidor local).
*   **Base de Datos & Seguridad:** Firebase Firestore, Firebase Security Rules.
*   **Despliegue:** Optimizado para Vercel.

---

## 🚀 Instalación y Desarrollo Local

### Requisitos Previos
*   **Node.js** (v18 o superior recomendado)
*   **npm** o **pnpm**

### Pasos para Configurar
1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/Raifeeer/Polaris-Web-Studio.git
    cd Polaris-Web-Studio
    ```
2.  **Instalar dependencias:**
    ```bash
    npm install
    ```
3.  **Configurar Variables de Entorno:**
    Crea un archivo `.env` en la raíz del proyecto basándote en el archivo `.env.example` y completa tus credenciales de Firebase y las APIs correspondientes.
4.  **Iniciar Servidor de Desarrollo:**
    ```bash
    npm run dev
    ```
    *Esto levantará tanto el servidor API local en el puerto `3000` como el cliente de Vite.*

---

## 📦 Compilación y Producción

*   **Compilar para producción:**
    ```bash
    npm run build
    ```
*   **Ejecutar Linter:**
    ```bash
    npm run lint
    ```

Diseñado y desarrollado con la obsesión por el detalle de **Polaris Web Studio**.\n