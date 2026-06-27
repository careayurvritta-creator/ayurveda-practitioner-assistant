// PHASE 6 TODO: temporary shim for 'firebase/firestore' to unblock the build.
// The SPA is being rewired to Supabase. These functions are inert no-ops that
// satisfy App.tsx imports without the (uninstalled) firebase npm package.
// Deleted wholesale in Phase 6 (RAG rebuild Task 6.1).

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function collection(_db: unknown, _name: string): any {
  return {};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function doc(_db: unknown, _name: string, _id?: string): any {
  return {};
}

export async function setDoc(): Promise<void> {
  console.warn('[firestore shim] setDoc is a no-op');
}

export async function deleteDoc(): Promise<void> {
  console.warn('[firestore shim] deleteDoc is a no-op');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function query(..._constraints: any[]): any {
  return {};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function where(_field: string, _op: string, _value: any): any {
  return {};
}

export function onSnapshot(): () => void {
  console.warn('[firestore shim] onSnapshot is a no-op');
  return () => {};
}
