
import { create } from 'zustand';
import { AppState, UserRole, UserStatus, MaterialType, ReaderTheme, Subject, Topic, Material, User, RegisteredUser, Transaction, StudentDocuments } from './types.ts';
import { saveFile, getFile, deleteFile } from './db.ts';
import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot
} from './firebase.ts';

const generateId = () => Math.random().toString(36).substr(2, 9);

const initialState: AppState = {
  currentUser: null,
  registeredUsers: [],
  subjects: [],
  tags: [],
  stats: {
    dailyStudyTime: {},
    totalTopicsCompleted: 0,
    currentStreak: 0
  },
  ledger: [],
  classFees: {
    '1st': 12000, '2nd': 12000, '3rd': 14000, '4th': 14000, '5th': 16000,
    '6th': 18000, '7th': 18000, '8th': 20000, '9th': 22000, '10th': 25000,
    '11th': 30000, '12th': 35000
  },
  recentlyOpened: [],
  settings: {
    readerTheme: ReaderTheme.LIGHT,
    isPro: false,
    fontScale: 1,
    reduceMotion: false
  }
};

interface StoreState {
  state: AppState;
  isLoaded: boolean;
  
  // Real-time Sync
  initializeRealtimeListeners: () => void;

  // Auth
  login: (name: string, role: UserRole, id: string) => Promise<void>;
  logout: () => void;
  signup: (name: string, id: string, pass: string, mobile: string, dob?: string, studentClass?: string, subjects?: string[], role?: UserRole) => Promise<boolean>;
  updateUserStatus: (id: string, status: UserStatus) => Promise<void>;
  changePassword: (newPass: string) => Promise<boolean>;
  updateProfileAvatar: (file: File) => Promise<void>;
  updateUserDOB: (dob: string) => Promise<boolean>;
  updateUserMobile: (mobile: string) => Promise<boolean>;
  updateStudentClass: (studentClass: string) => Promise<boolean>;
  updateTeacherSubjects: (subjects: string[]) => Promise<boolean>;
  updateUserDocuments: (userId: string, documents: Partial<StudentDocuments>) => Promise<boolean>;
  completeUserOnboarding: () => Promise<void>;
  
  // Admin Actions
  adminAddUser: (userData: Omit<RegisteredUser, 'joinedAt'>) => Promise<boolean>;
  adminAddUsersBulk: (users: RegisteredUser[]) => Promise<void>;
  adminDeleteUser: (id: string) => Promise<void>;
  adminDeleteUsersBulk: (ids: string[]) => Promise<void>;
  adminUpdateUser: (originalId: string, updates: Partial<RegisteredUser>) => Promise<boolean>;
  adminAssignClassToTeacher: (teacherId: string, assignedClasses: string[]) => Promise<void>;
  
  // Finance Actions
  adminAddTransaction: (data: Omit<Transaction, 'id'>) => void;
  adminDeleteTransaction: (id: string) => void;
  adminSetClassFee: (className: string, amount: number) => void;
  adminSetStudentCustomFee: (studentId: string, amount: number | undefined) => void;

  // Subjects
  addSubject: (name: string, color: string, icon: string, targetClass: string) => void;
  deleteSubject: (id: string) => void;

  // Topics
  addTopic: (subjectId: string, name: string, description?: string) => void;
  deleteTopic: (subjectId: string, topicId: string) => void;
  togglePinTopic: (topicId: string) => void;
  toggleTopicCompletion: (topicId: string) => void;

  // Materials
  addMaterial: (topicId: string, title: string, type: MaterialType, url: string, file?: File) => Promise<void>;
  deleteMaterial: (topicId: string, materialId: string) => void;
  saveMaterialNotes: (materialId: string, notes: string) => void;
  updateMaterialProgress: (materialId: string, progress: number) => void;
  downloadMaterial: (materialId: string) => Promise<void>;
  removeDownload: (materialId: string) => Promise<void>;
  clearAllDownloads: () => Promise<void>;
  getFileBlob: (key: string) => Promise<Blob | null>;

  // Misc
  updateState: (newState: AppState) => void;
  globalSearch: (query: string) => any[];
  exportData: () => void;
  importData: (jsonString: string) => Promise<boolean>;
}

export const useStore = create<StoreState>((set, get) => ({
  state: initialState,
  isLoaded: false,

  initializeRealtimeListeners: () => {
    // FAILSAFE: Ensure app loads even if DB hangs or is misconfigured
    setTimeout(() => {
        const { isLoaded } = get();
        if (!isLoaded) {
            console.warn("Firebase connection timed out. Forcing offline mode.");
            set({ isLoaded: true });
        }
    }, 1500);

    // If DB failed to initialize (e.g. no config), run in Offline Mode with Mock Data
    if (!db) {
        const mockUsers: RegisteredUser[] = [
             { id: 'student@demo.com', name: 'Demo Student', role: 'USER', status: 'APPROVED', studentClass: '10th', studentSection: 'A', joinedAt: Date.now(), password: '123', mobile: '+91 9876543210' },
             { id: 'teacher@demo.com', name: 'Demo Teacher', role: 'TEACHER', status: 'APPROVED', joinedAt: Date.now(), password: '123', subjects: ['Maths', 'Science'], mobile: '+91 9876543211' }
        ];
        
        set(s => ({ 
            state: { ...s.state, registeredUsers: mockUsers },
            isLoaded: true 
        }));
        return;
    }

    try {
        // Listen to Subjects
        onSnapshot(collection(db, "subjects"), (snapshot) => {
            const subjects: Subject[] = [];
            snapshot.forEach((doc) => {
                subjects.push(doc.data() as Subject);
            });
            subjects.sort((a,b) => a.position - b.position);
            set((store) => ({ state: { ...store.state, subjects }, isLoaded: true }));
        }, (error) => {
            console.error("Subjects sync error:", error);
            set({ isLoaded: true });
        });

        // Listen to Registered Users
        onSnapshot(collection(db, "users"), (snapshot) => {
            const registeredUsers: RegisteredUser[] = [];
            snapshot.forEach((doc) => {
                registeredUsers.push(doc.data() as RegisteredUser);
            });
            set((store) => ({ state: { ...store.state, registeredUsers } }));
        });

        // Listen to Ledger
        onSnapshot(collection(db, "ledger"), (snapshot) => {
            const ledger: Transaction[] = [];
            snapshot.forEach((doc) => {
                ledger.push(doc.data() as Transaction);
            });
            ledger.sort((a,b) => b.date - a.date);
            set((store) => ({ state: { ...store.state, ledger } }));
        });
    } catch (e) {
        console.error("Error setting up listeners:", e);
        set({ isLoaded: true });
    }
  },

  login: async (name, role, id) => {
    const { state } = get();
    const registered = state.registeredUsers.find(u => u.id === id);
    
    const userObj = { 
        name, 
        role, 
        id,
        studentClass: registered?.studentClass,
        studentSection: registered?.studentSection,
        assignedClasses: registered?.assignedClasses,
        subjects: registered?.subjects,
        isFirstLogin: registered?.isFirstLogin ?? false
    };

    set(store => ({
      state: {
        ...store.state,
        currentUser: userObj
      }
    }));
    
    localStorage.setItem('currentUser', JSON.stringify(userObj));
  },

  logout: () => {
    localStorage.removeItem('currentUser');
    set(store => ({
      state: {
        ...store.state,
        currentUser: null
      }
    }));
  },

  signup: async (name, id, pass, mobile, dob, studentClass, subjects, role: UserRole = 'USER') => {
    const { state } = get();
    if (state.registeredUsers.find(u => u.id === id)) return false;
    
    const newUser: RegisteredUser = {
      id, name, password: pass, mobile, dob: dob || '', studentClass: studentClass || '',
      studentSection: '', subjects: subjects || [], assignedClasses: [], joinedAt: Date.now(),
      status: 'PENDING', role: role, isFirstLogin: true, documents: {}
    };
    
    if (!db) {
        set(s => ({ state: { ...s.state, registeredUsers: [...s.state.registeredUsers, newUser] } }));
        return true;
    }

    try {
        await setDoc(doc(db, "users", id), newUser);
        return true;
    } catch (e) { return false; }
  },

  updateUserStatus: async (id, status) => {
    if (!db) {
        set(s => ({
            state: { ...s.state, registeredUsers: s.state.registeredUsers.map(u => u.id === id ? { ...u, status } : u) }
        }));
        return;
    }
    try { await updateDoc(doc(db, "users", id), { status }); } catch (e) {}
  },

  adminAddUser: async (userData) => {
    const { state } = get();
    if (state.registeredUsers.find(u => u.id === userData.id)) return false;

    const newUser: RegisteredUser = {
        ...userData, joinedAt: Date.now(), isFirstLogin: true, documents: {}
    };

    if (!db) {
        set(s => ({ state: { ...s.state, registeredUsers: [...s.state.registeredUsers, newUser] } }));
        return true;
    }

    try {
        await setDoc(doc(db, "users", newUser.id), newUser);
        return true;
    } catch(e) { return false; }
  },

  adminAddUsersBulk: async (newUsers) => {
    if (!db) {
        set(s => ({ 
            state: { 
                ...s.state, 
                registeredUsers: [
                    ...s.state.registeredUsers, 
                    ...newUsers.map(u => ({ ...u, isFirstLogin: true, documents: u.documents || {} }))
                ] 
            } 
        }));
        return;
    }
    for (const u of newUsers) {
        const processedUser = { ...u, isFirstLogin: true, documents: u.documents || {} };
        await setDoc(doc(db, "users", u.id), processedUser);
    }
  },

  adminDeleteUser: async (id) => {
      if (!db) {
          set(s => ({ state: { ...s.state, registeredUsers: s.state.registeredUsers.filter(u => u.id !== id) } }));
          return;
      }
      await deleteDoc(doc(db, "users", id));
  },

  adminDeleteUsersBulk: async (ids) => {
      if (!db) {
          set(s => ({ state: { ...s.state, registeredUsers: s.state.registeredUsers.filter(u => !ids.includes(u.id)) } }));
          return;
      }
      for (const id of ids) await deleteDoc(doc(db, "users", id));
  },

  adminUpdateUser: async (originalId, updates) => {
    const { state } = get();
    
    // Check duplication if ID changed
    if (updates.id && updates.id !== originalId) {
        if (state.registeredUsers.find(u => u.id === updates.id)) return false;
    }

    if (!db) {
        set(s => {
            // Remove old, add new if ID changed
            if (updates.id && updates.id !== originalId) {
                const oldUser = s.state.registeredUsers.find(u => u.id === originalId);
                if (!oldUser) return s;
                const newUser = { ...oldUser, ...updates };
                return {
                    state: {
                        ...s.state,
                        registeredUsers: [...s.state.registeredUsers.filter(u => u.id !== originalId), newUser]
                    }
                };
            }
            // Update in place
            return {
                state: {
                    ...s.state,
                    registeredUsers: s.state.registeredUsers.map(u => u.id === originalId ? { ...u, ...updates } : u)
                }
            };
        });
        return true;
    }

    // DB Logic
    if (updates.id && updates.id !== originalId) {
       const oldUser = state.registeredUsers.find(u => u.id === originalId);
       if(!oldUser) return false;
       const newUser = { ...oldUser, ...updates };
       try {
           await setDoc(doc(db, "users", newUser.id), newUser);
           await deleteDoc(doc(db, "users", originalId));
           return true;
       } catch (e) { return false; }
    }

    try { await updateDoc(doc(db, "users", originalId), updates); return true; } catch (e) { return false; }
  },

  adminAssignClassToTeacher: async (teacherId, assignedClasses) => {
      if (!db) {
          set(s => ({
              state: { ...s.state, registeredUsers: s.state.registeredUsers.map(u => u.id === teacherId ? { ...u, assignedClasses } : u) }
          }));
          return;
      }
      await updateDoc(doc(db, "users", teacherId), { assignedClasses });
  },

  adminAddTransaction: async (data) => {
    const id = generateId();
    const newTransaction: Transaction = { ...data, id };
    if (!db) {
        set(s => ({ state: { ...s.state, ledger: [...s.state.ledger, newTransaction] } }));
        return;
    }
    await setDoc(doc(db, "ledger", id), newTransaction);
  },

  adminDeleteTransaction: async (id) => {
    if (!db) {
        set(s => ({ state: { ...s.state, ledger: s.state.ledger.filter(t => t.id !== id) } }));
        return;
    }
    await deleteDoc(doc(db, "ledger", id));
  },

  adminSetClassFee: (className, amount) => {
    set(store => ({
      state: {
        ...store.state,
        classFees: { ...store.state.classFees, [className]: amount }
      }
    }));
  },

  adminSetStudentCustomFee: async (studentId, amount) => {
    if (!db) {
        set(s => ({
            state: { ...s.state, registeredUsers: s.state.registeredUsers.map(u => u.id === studentId ? { ...u, customFee: amount } : u) }
        }));
        return;
    }
    await updateDoc(doc(db, "users", studentId), { customFee: amount || null });
  },

  changePassword: async (newPass) => {
    const { state } = get();
    if (!state.currentUser) return false;
    
    if (!db) {
        set(s => ({
            state: { ...s.state, registeredUsers: s.state.registeredUsers.map(u => u.id === state.currentUser!.id ? { ...u, password: newPass } : u) }
        }));
        return true;
    }
    
    try { await updateDoc(doc(db, "users", state.currentUser.id), { password: newPass }); return true; } catch(e) { return false; }
  },

  updateProfileAvatar: async (file) => {
    const { state } = get();
    if (!state.currentUser) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      
      set(store => ({
        state: { ...store.state, currentUser: { ...store.state.currentUser!, avatar: result } }
      }));

      if (!db) {
          set(s => ({
              state: { ...s.state, registeredUsers: s.state.registeredUsers.map(u => u.id === state.currentUser!.id ? { ...u, avatar: result } : u) }
          }));
          return;
      }
      
      await updateDoc(doc(db, "users", state.currentUser!.id), { avatar: result });
    };
    reader.readAsDataURL(file);
  },

  updateUserDOB: async (dob) => {
    const { state } = get();
    if (!state.currentUser) return false;
    if (!db) {
        set(s => ({
            state: { ...s.state, registeredUsers: s.state.registeredUsers.map(u => u.id === state.currentUser!.id ? { ...u, dob } : u) }
        }));
        return true;
    }
    await updateDoc(doc(db, "users", state.currentUser.id), { dob });
    return true;
  },

  updateUserMobile: async (mobile) => {
    const { state } = get();
    if (!state.currentUser) return false;
    if (!db) {
        set(s => ({
            state: { ...s.state, registeredUsers: s.state.registeredUsers.map(u => u.id === state.currentUser!.id ? { ...u, mobile } : u) }
        }));
        return true;
    }
    await updateDoc(doc(db, "users", state.currentUser.id), { mobile });
    return true;
  },

  updateStudentClass: async (studentClass) => {
    const { state } = get();
    if (!state.currentUser) return false;
    
    set(store => ({
        state: { ...store.state, currentUser: { ...store.state.currentUser!, studentClass } }
    }));

    if (!db) {
        set(s => ({
            state: { ...s.state, registeredUsers: s.state.registeredUsers.map(u => u.id === state.currentUser!.id ? { ...u, studentClass } : u) }
        }));
        return true;
    }

    await updateDoc(doc(db, "users", state.currentUser.id), { studentClass });
    return true;
  },

  updateTeacherSubjects: async (subjects) => {
    const { state } = get();
    if (!state.currentUser) return false;
    
    set(store => ({
        state: { ...store.state, currentUser: { ...store.state.currentUser!, subjects } }
    }));

    if (!db) {
        set(s => ({
            state: { ...s.state, registeredUsers: s.state.registeredUsers.map(u => u.id === state.currentUser!.id ? { ...u, subjects } : u) }
        }));
        return true;
    }

    await updateDoc(doc(db, "users", state.currentUser.id), { subjects });
    return true;
  },

  updateUserDocuments: async (userId, documents) => {
      const { state } = get();
      const user = state.registeredUsers.find(u => u.id === userId);
      if(!user) return false;

      const updatedDocs = { ...user.documents, ...documents };
      Object.keys(updatedDocs).forEach(key => updatedDocs[key as keyof StudentDocuments] === undefined && delete updatedDocs[key as keyof StudentDocuments]);

      if (!db) {
          set(s => ({
              state: { ...s.state, registeredUsers: s.state.registeredUsers.map(u => u.id === userId ? { ...u, documents: updatedDocs } : u) }
          }));
          return true;
      }

      await updateDoc(doc(db, "users", userId), { documents: updatedDocs });
      return true;
  },

  completeUserOnboarding: async () => {
      const { state } = get();
      if (!state.currentUser) return;
      
      set(store => ({
          state: { ...store.state, currentUser: { ...store.state.currentUser!, isFirstLogin: false } }
      }));

      if (!db) {
          set(s => ({
              state: { ...s.state, registeredUsers: s.state.registeredUsers.map(u => u.id === state.currentUser!.id ? { ...u, isFirstLogin: false } : u) }
          }));
          return;
      }

      await updateDoc(doc(db, "users", state.currentUser.id), { isFirstLogin: false });
  },

  addSubject: async (name, color, icon, targetClass) => {
    const { state } = get();
    const id = generateId();
    const newSubject: Subject = {
      id, name, color, icon, targetClass, createdBy: state.currentUser?.name, topics: [], position: state.subjects.length
    };
    if (!db) {
        set(s => ({ state: { ...s.state, subjects: [...s.state.subjects, newSubject] } }));
        return;
    }
    await setDoc(doc(db, "subjects", id), newSubject);
  },

  deleteSubject: async (id) => {
    if (!db) {
        set(s => ({ state: { ...s.state, subjects: s.state.subjects.filter(sub => sub.id !== id) } }));
        return;
    }
    await deleteDoc(doc(db, "subjects", id));
  },

  addTopic: async (subjectId, name, description) => {
    const { state } = get();
    const subject = state.subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const newTopic: Topic = {
      id: generateId(), subjectId, name, description, isCompleted: false, isPinned: false, tags: [], materials: []
    };

    if (!db) {
        const updatedTopics = [...subject.topics, newTopic];
        set(s => ({
            state: { ...s.state, subjects: s.state.subjects.map(sub => sub.id === subjectId ? { ...sub, topics: updatedTopics } : sub) }
        }));
        return;
    }

    const updatedTopics = [...subject.topics, newTopic];
    await updateDoc(doc(db, "subjects", subjectId), { topics: updatedTopics });
  },

  deleteTopic: async (subjectId, topicId) => {
    const { state } = get();
    const subject = state.subjects.find(s => s.id === subjectId);
    if (!subject) return;
    
    // Cleanup local files
    const topic = subject.topics.find(t => t.id === topicId);
    topic?.materials.forEach(m => {
        if (m.localFileKey) deleteFile(m.localFileKey);
    });

    if (!db) {
        const updatedTopics = subject.topics.filter(t => t.id !== topicId);
        set(s => ({
            state: { ...s.state, subjects: s.state.subjects.map(sub => sub.id === subjectId ? { ...sub, topics: updatedTopics } : sub) }
        }));
        return;
    }

    const updatedTopics = subject.topics.filter(t => t.id !== topicId);
    await updateDoc(doc(db, "subjects", subjectId), { topics: updatedTopics });
  },

  togglePinTopic: async (topicId) => {
    const { state } = get();
    const subject = state.subjects.find(s => s.topics.some(t => t.id === topicId));
    if (!subject) return;

    const updatedTopics = subject.topics.map(t => t.id === topicId ? { ...t, isPinned: !t.isPinned } : t);
    
    if (!db) {
        set(s => ({
            state: { ...s.state, subjects: s.state.subjects.map(sub => sub.id === subject.id ? { ...sub, topics: updatedTopics } : sub) }
        }));
        return;
    }
    
    await updateDoc(doc(db, "subjects", subject.id), { topics: updatedTopics });
  },

  toggleTopicCompletion: async (topicId) => {
    const { state } = get();
    const subject = state.subjects.find(s => s.topics.some(t => t.id === topicId));
    if (!subject) return;

    const updatedTopics = subject.topics.map(t => 
       t.id === topicId ? { ...t, isCompleted: !t.isCompleted, lastStudiedAt: Date.now() } : t
    );

    if (!db) {
        set(s => ({
            state: { ...s.state, subjects: s.state.subjects.map(sub => sub.id === subject.id ? { ...sub, topics: updatedTopics } : sub) }
        }));
        return;
    }

    await updateDoc(doc(db, "subjects", subject.id), { topics: updatedTopics });
  },

  addMaterial: async (topicId, title, type, url, file) => {
    let localFileKey;
    let fileName;
    let fileSize;
    const { state } = get();

    if (file) {
      localFileKey = `file_${generateId()}`;
      fileName = file.name;
      fileSize = file.size;
      await saveFile(localFileKey, file);
    }

    const newMat: Material = {
      id: generateId(), topicId, type, title, url: url || '', localFileKey, fileName, fileSize,
      lastAccessed: Date.now(), progress: 0, isFavorite: false, tags: [],
      isDownloaded: !!localFileKey, createdBy: state.currentUser?.name
    };

    const subject = state.subjects.find(s => s.topics.some(t => t.id === topicId));
    if (!subject) return;

    const updatedTopics = subject.topics.map(t => 
        t.id === topicId ? { ...t, materials: [...t.materials, newMat] } : t
    );

    if (!db) {
        set(s => ({
            state: { ...s.state, subjects: s.state.subjects.map(sub => sub.id === subject.id ? { ...sub, topics: updatedTopics } : sub) }
        }));
        return;
    }

    await updateDoc(doc(db, "subjects", subject.id), { topics: updatedTopics });
  },

  deleteMaterial: async (topicId, materialId) => {
    const { state } = get();
    const subject = state.subjects.find(s => s.topics.some(t => t.id === topicId));
    if (!subject) return;

    const topic = subject.topics.find(t => t.id === topicId);
    const mat = topic?.materials.find(m => m.id === materialId);
    
    if (mat?.localFileKey) {
      deleteFile(mat.localFileKey);
    }

    const updatedTopics = subject.topics.map(t => 
        t.id === topicId ? { ...t, materials: t.materials.filter(m => m.id !== materialId) } : t
    );

    if (!db) {
        set(s => ({
            state: { ...s.state, subjects: s.state.subjects.map(sub => sub.id === subject.id ? { ...sub, topics: updatedTopics } : sub) }
        }));
        return;
    }

    await updateDoc(doc(db, "subjects", subject.id), { topics: updatedTopics });
  },

  saveMaterialNotes: async (materialId, notes) => {
    const { state } = get();
    let subject: Subject | undefined;
    for (const s of state.subjects) {
        if (s.topics.some(t => t.materials.some(m => m.id === materialId))) {
            subject = s;
            break;
        }
    }
    if (!subject) return;

    const updatedTopics = subject.topics.map(t => ({
        ...t,
        materials: t.materials.map(m => m.id === materialId ? { ...m, notes } : m)
    }));

    if (!db) {
        set(s => ({
            state: { ...s.state, subjects: s.state.subjects.map(sub => sub.id === subject!.id ? { ...sub, topics: updatedTopics } : sub) }
        }));
        return;
    }

    await updateDoc(doc(db, "subjects", subject.id), { topics: updatedTopics });
  },

  updateMaterialProgress: async (materialId, progress) => {
    const { state } = get();
    let subject: Subject | undefined;
    for (const s of state.subjects) {
        if (s.topics.some(t => t.materials.some(m => m.id === materialId))) {
            subject = s;
            break;
        }
    }
    if (!subject) return;

    const updatedTopics = subject.topics.map(t => ({
        ...t,
        materials: t.materials.map(m => m.id === materialId ? { ...m, progress } : m)
    }));

    if (!db) {
        set(s => ({
            state: { ...s.state, subjects: s.state.subjects.map(sub => sub.id === subject!.id ? { ...sub, topics: updatedTopics } : sub) }
        }));
        return;
    }

    await updateDoc(doc(db, "subjects", subject.id), { topics: updatedTopics });
  },

  downloadMaterial: async (materialId) => {
     // ... (Local logic same as before, already offline-first) ...
     const { state } = get();
     let mat: Material | undefined;
     for (const s of state.subjects) {
       for (const t of s.topics) {
         const m = t.materials.find(x => x.id === materialId);
         if (m) { mat = m; break; }
       }
     }
     if (!mat || !mat.url) return;

     try {
       let blob: Blob;
       try {
         const res = await fetch(mat.url);
         blob = await res.blob();
       } catch (e) {
         blob = new Blob(["Offline Content Placeholder"], { type: 'text/plain' });
       }
       const key = `dl_${materialId}`;
       await saveFile(key, blob);
       
       set(store => ({
         state: {
           ...store.state,
           subjects: store.state.subjects.map(s => ({
             ...s,
             topics: s.topics.map(t => ({
               ...t,
               materials: t.materials.map(m => 
                 m.id === materialId 
                 ? { ...m, isDownloaded: true, localFileKey: key, downloadProgress: 100 } 
                 : m
               )
             }))
           }))
         }
       }));
     } catch (err) { console.error("Download failed", err); }
  },

  removeDownload: async (materialId) => {
    const { state } = get();
    let fileKey: string | undefined;
    for (const s of state.subjects) {
        for (const t of s.topics) {
            const m = t.materials.find(x => x.id === materialId);
            if (m) fileKey = m.localFileKey;
        }
    }
    if (fileKey) await deleteFile(fileKey);

    set(store => ({
      state: {
        ...store.state,
        subjects: store.state.subjects.map(s => ({
          ...s,
          topics: s.topics.map(t => ({
            ...t,
            materials: t.materials.map(m => 
              m.id === materialId 
              ? { ...m, isDownloaded: false, localFileKey: undefined, downloadProgress: undefined } 
              : m
            )
          }))
        }))
      }
    }));
  },

  clearAllDownloads: async () => {
    set(store => ({
      state: {
        ...store.state,
        subjects: store.state.subjects.map(s => ({
          ...s,
          topics: s.topics.map(t => ({
            ...t,
            materials: t.materials.map(m => ({ ...m, isDownloaded: false, localFileKey: undefined, downloadProgress: undefined }))
          }))
        }))
      }
    }));
  },

  getFileBlob: async (key) => await getFile(key),
  updateState: (newState) => set({ state: newState }),
  globalSearch: (query) => {
    const { state } = get();
    const q = query.toLowerCase();
    const results: any[] = [];
    state.subjects.forEach(s => {
      if (s.name.toLowerCase().includes(q)) results.push({ type: 'subject', data: s });
      s.topics.forEach(t => {
        if (t.name.toLowerCase().includes(q)) results.push({ type: 'topic', data: t, subject: s });
        t.materials.forEach(m => {
          if (m.title.toLowerCase().includes(q) || (m.notes && m.notes.toLowerCase().includes(q))) {
            results.push({ type: 'material', data: m, topic: t, subject: s });
          }
        });
      });
    });
    return results;
  },
  exportData: () => {
    const { state } = get();
    const dataStr = JSON.stringify(state);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'study_guru_backup.json');
    linkElement.click();
  },
  importData: async (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.subjects && parsed.settings) {
        set({ state: parsed });
        return true;
      }
    } catch (e) {}
    return false;
  }
}));

useStore.getState().initializeRealtimeListeners();

const savedUser = localStorage.getItem('currentUser');
if (savedUser) {
    try {
        const parsed = JSON.parse(savedUser);
        useStore.setState(s => ({ state: { ...s.state, currentUser: parsed } }));
    } catch(e) {}
}
