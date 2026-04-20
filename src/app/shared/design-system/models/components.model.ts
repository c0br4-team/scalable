import { Observable } from 'rxjs';

export interface StepItem {
  /** Unique index (1-based) */
  index: number;
  /** i18n key or plain label string */
  label: string;
  /** Whether the step has been completed */
  completed: boolean;
}

export interface DropdownOption {
  label: string;
  value: string;
}

/**
 * Función que el consumidor provee para buscar opciones remotamente.
 * Recibe el término de búsqueda y retorna un Observable con las opciones.
 */
export type DropdownSearchFn = (query: string) => Observable<DropdownOption[]>;

export interface DropdownConfig {
  /** Permite selección múltiple */
  multiple?: boolean;
  /** Habilita campo de búsqueda local (filtra las options en memoria) */
  searchable?: boolean;
  /** Si se provee, la búsqueda se hace remotamente llamando esta función */
  searchFn?: DropdownSearchFn;
  /** Milisegundos de debounce para la búsqueda remota (default: 300) */
  debounceMs?: number;
  /** Mínimo de caracteres para disparar la búsqueda remota (default: 2) */
  minChars?: number;
}
