import { loadEnvConfig } from "@next/env";

let loaded = false;

export function loadServerEnv(): void {
  if (loaded) {
    return;
  }
  loadEnvConfig(process.cwd());
  loaded = true;
}

export function readEnv(name: string): string | undefined {
  loadServerEnv();
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}
