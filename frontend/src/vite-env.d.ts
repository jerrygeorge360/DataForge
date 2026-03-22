/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MARKETPLACE_ADDRESS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
