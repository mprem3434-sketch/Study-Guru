
export enum MaterialType {
  PDF = 'PDF',
  VIDEO = 'VIDEO',
  NOTE = 'NOTE'
}

export enum ReaderTheme {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  SEPIA = 'SEPIA'
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Material {
  id: string;
  topicId: string;
  type: MaterialType;
  title: string;
  url: string;
  lastAccessed: number;
  progress: number; // General progress percentage
  lastPage?: number; // For PDF resume
  videoPosition?: number; // For Video resume (seconds)
  bookmarks?: number[]; // Page numbers or timestamps
  isFavorite: boolean;
  notes?: string;
  tags: string[]; // List of tag IDs
  isDownloaded?: boolean; // For offline storage tracking
  downloadProgress?: number; // 0 to 100
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  description?: string;
  isCompleted: boolean;
  isPinned: boolean;
  tags: string[];
  materials: Material[];
  lastStudiedAt?: number;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
  topics: Topic[];
  position: number; // For reordering
}

export interface DayStats {
  totalMinutes: number;
  pdfMinutes: number;
  videoMinutes: number;
  noteMinutes: number;
}

export interface UserStats {
  dailyStudyTime: Record<string, DayStats>; // date string YYYY-MM-DD -> Granular stats
  totalTopicsCompleted: number;
  currentStreak: number;
  lastStudyDate?: string;
}

export interface AppState {
  subjects: Subject[];
  tags: Tag[];
  stats: UserStats;
  recentlyOpened: string[]; // List of material IDs
  settings: {
    readerTheme: ReaderTheme;
    isPro: boolean;
  }
}
