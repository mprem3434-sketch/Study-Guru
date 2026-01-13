
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

export type UserRole = 'ADMIN' | 'USER' | 'TEACHER';

export type UserStatus = 'PENDING' | 'APPROVED' | 'BLOCKED';

export type TransactionType = 'INCOME' | 'EXPENSE';

export type TransactionCategory = 
  | 'STUDENT_FEES' 
  | 'STAFF_SALARY' 
  | 'UTILITY_ELECTRICITY' 
  | 'UTILITY_WATER' 
  | 'MAINTENANCE' 
  | 'TRANSPORT_BUS' 
  | 'OTHER';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  subCategory?: string; 
  amount: number;
  gstAmount?: number;
  totalWithGst?: number;
  date: number;
  description: string;
  payerName: string;
  payerId?: string; 
  payerClass?: string; 
  payerSection?: string; 
  status: 'PAID' | 'PENDING';
  referenceNo?: string;
}

export interface User {
  id?: string;
  name: string;
  role: UserRole;
  avatar?: string;
  studentClass?: string;
  studentSection?: string;
  assignedClasses?: string[];
  subjects?: string[];
  isFirstLogin?: boolean;
}

export interface StudentDocuments {
  adhaarCard?: string;
  birthCertificate?: string;
  previousMarksheet?: string;
  transferCertificate?: string;
  categoryCertificate?: string;
}

export interface RegisteredUser {
  id: string;
  name: string;
  mobile?: string;
  dob?: string;
  studentClass?: string;
  studentSection?: string;
  subjects?: string[];
  assignedClasses?: string[];
  password: string;
  joinedAt: number;
  avatar?: string;
  status: UserStatus;
  role: UserRole;
  customFee?: number; // Admin set custom fee for this student
  isFirstLogin?: boolean;
  documents?: StudentDocuments;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Material {
  id: string;
  topicId: string;
  type: MaterialType;
  title: string;
  url: string;
  localFileKey?: string;
  fileName?: string;
  fileSize?: number;
  lastAccessed: number;
  progress: number;
  lastPage?: number;
  videoPosition?: number;
  bookmarks?: number[];
  isFavorite: boolean;
  notes?: string;
  tags: string[];
  isDownloaded?: boolean;
  downloadProgress?: number;
  createdBy?: string;
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
  targetClass: string;
  createdBy?: string;
  topics: Topic[];
  position: number;
}

export interface DayStats {
  totalMinutes: number;
  pdfMinutes: number;
  videoMinutes: number;
  noteMinutes: number;
}

export interface UserStats {
  dailyStudyTime: Record<string, DayStats>;
  totalTopicsCompleted: number;
  currentStreak: number;
  lastStudyDate?: string;
}

export interface AppState {
  currentUser: User | null;
  registeredUsers: RegisteredUser[];
  subjects: Subject[];
  tags: Tag[];
  stats: UserStats;
  ledger: Transaction[];
  classFees: Record<string, number>; // Mapping class name to base fee
  recentlyOpened: string[];
  settings: {
    readerTheme: ReaderTheme;
    isPro: boolean;
    fontScale: number;
    reduceMotion: false;
  }
}
