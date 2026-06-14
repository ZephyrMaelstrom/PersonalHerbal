import { Combobox } from './Combobox';
import type { VocabId } from '@/lib/vocab';

interface EnumSelectProps {
  vocab: VocabId;
  value?: string;
  onChange: (code: string | undefined) => void;
  placeholder?: string;
  /** Enums are usually fixed; allow custom values only when explicitly opted in. */
  allowCreate?: boolean;
  id?: string;
}

/**
 * Single-select for bounded enumerations. Thin wrapper over Combobox with creation off
 * by default — kept as its own primitive so call sites read intentionally and future
 * styling (e.g. segmented control) can change in one place.
 */
export function EnumSelect({ allowCreate = false, ...props }: EnumSelectProps) {
  return <Combobox allowCreate={allowCreate} {...props} />;
}
