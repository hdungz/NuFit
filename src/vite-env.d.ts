/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TROLLLLM_API_KEY: string;
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_APP_TITLE: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
