// PHASE 6 TODO: this entire file is a temporary shim to unblock the build after
// the real src/firebase.ts was deleted in the v0 migration. The SPA is being
// rewired to Supabase (src/supabase.ts). Every symbol below is an inert no-op
// that returns empty/never-resolves so the App.tsx call sites compile but do
// nothing at runtime. This file is deleted wholesale in Phase 6 of the RAG
// rebuild (docs/superpowers/plans/2026-06-26-rag-rebuild.md, Task 6.1).

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db: any = {};

export async function googleSignIn(): Promise<never> {
  console.warn('[firebase shim] googleSignIn is a no-op; Phase 6 rewires to supabase.auth.signInWithOAuth');
  return Promise.reject(new Error('firebase shim: googleSignIn not implemented'));
}

export async function logout(): Promise<void> {
  console.warn('[firebase shim] logout is a no-op');
}

export async function initAuth(): Promise<(() => void) | undefined> {
  console.warn('[firebase shim] initAuth is a no-op');
  return undefined;
}

export function handleFirestoreError(_err: unknown): void {
  console.warn('[firebase shim] handleFirestoreError is a no-op');
}

// Mimics firebase's OperationType enum enough to satisfy the import.
export enum OperationType {
  OVERWRITE = 'overwrite',
  MERGE = 'merge',
}
