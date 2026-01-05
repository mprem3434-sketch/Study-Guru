
import React from 'react';
import { 
  Book, 
  Atom, 
  FlaskConical, 
  Globe, 
  History, 
  Calculator, 
  Music, 
  Code,
  Languages,
  Palette
} from 'lucide-react';

export const SUBJECT_ICONS = [
  { id: 'book', component: <Book size={20} /> },
  { id: 'atom', component: <Atom size={20} /> },
  { id: 'flask', component: <FlaskConical size={20} /> },
  { id: 'globe', component: <Globe size={20} /> },
  { id: 'history', component: <History size={20} /> },
  { id: 'math', component: <Calculator size={20} /> },
  { id: 'music', component: <Music size={20} /> },
  { id: 'code', component: <Code size={20} /> },
  { id: 'lang', component: <Languages size={20} /> },
  { id: 'art', component: <Palette size={20} /> },
];

export const SUBJECT_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-cyan-500',
  'bg-orange-500',
];

export const DEFAULT_TAGS = [
  'Important',
  'Revision',
  'Exam',
  'Doubt',
  'Formula',
];
