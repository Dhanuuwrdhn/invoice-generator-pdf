import type { FontChoice } from '@/types/invoice';

export const FONTS: { value: FontChoice; label: string; desc: string }[] = [
  { value: 'Caladea',    label: 'Caladea',    desc: 'Serif' },
  { value: 'Lato',       label: 'Lato',       desc: 'Sans-serif' },
  { value: 'Montserrat', label: 'Montserrat', desc: 'Geometric' },
];

export const FONT_CSS: Record<FontChoice, string> = {
  Caladea:    "'Caladea', 'Cambria', Georgia, serif",
  Lato:       "'Lato', Arial, sans-serif",
  Montserrat: "'Montserrat', Arial, sans-serif",
};

export const COLOR_PRESETS = [
  { label: 'Navy',    value: '#1A3A5C' },
  { label: 'Forest',  value: '#1A6B3C' },
  { label: 'Indigo',  value: '#3730A3' },
  { label: 'Violet',  value: '#6D28D9' },
  { label: 'Rose',    value: '#BE123C' },
  { label: 'Amber',   value: '#B45309' },
  { label: 'Slate',   value: '#334155' },
];
