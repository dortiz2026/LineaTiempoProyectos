export const DEFAULT_RESPONSABLES: string[] = [
  'Daniel Ortiz',
  'Lorena Sabogal',
];

export const STORAGE_KEY = 'patprimo_frequent_responsables';

/**
 * Obtiene la lista de personas sugeridas frecuentes desde localStorage o defaults.
 */
export function getStoredResponsables(): string[] {
  if (typeof window === 'undefined') return DEFAULT_RESPONSABLES;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_RESPONSABLES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((s) => String(s).trim()).filter(Boolean);
    }
    return DEFAULT_RESPONSABLES;
  } catch {
    return DEFAULT_RESPONSABLES;
  }
}

/**
 * Guarda la lista de sugerencias en localStorage y emite un evento para sincronizar pestañas y componentes.
 */
export function saveStoredResponsables(list: string[]): void {
  if (typeof window === 'undefined') return;

  try {
    const cleanList = Array.from(
      new Set(list.map((s) => s.trim()).filter(Boolean))
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanList));
    window.dispatchEvent(new CustomEvent('responsables-updated', { detail: cleanList }));
  } catch (err) {
    console.error('Error guardando responsables frecuentes:', err);
  }
}

/**
 * Agrega un nuevo responsable a la lista de sugerencias rápidas.
 */
export function addStoredResponsable(name: string): string[] {
  const clean = name.trim();
  if (!clean) return getStoredResponsables();

  const current = getStoredResponsables();
  const exists = current.some((item) => item.toLowerCase() === clean.toLowerCase());
  if (exists) return current;

  const next = [...current, clean];
  saveStoredResponsables(next);
  return next;
}

/**
 * Elimina un responsable de la lista de sugerencias rápidas.
 */
export function removeStoredResponsable(name: string): string[] {
  const current = getStoredResponsables();
  const next = current.filter(
    (item) => item.toLowerCase() !== name.trim().toLowerCase()
  );
  saveStoredResponsables(next);
  return next;
}

/**
 * Restaura la lista por defecto.
 */
export function resetStoredResponsables(): string[] {
  saveStoredResponsables(DEFAULT_RESPONSABLES);
  return DEFAULT_RESPONSABLES;
}
