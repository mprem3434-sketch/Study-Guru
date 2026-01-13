
import { create } from 'zustand';
import { AppState, UserRole, UserStatus, MaterialType, ReaderTheme, Subject, Topic, Material, User, RegisteredUser, Transaction } from './types.ts';
import { saveState, loadState, saveFile, getFile, deleteFile } from './db.ts';

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
  
  // Admin Actions
  adminAddUser: (userData: Omit<RegisteredUser, 'joinedAt'>) => Promise<boolean>;
  adminAddUsersBulk: (users: RegisteredUser[]) => Promise<void>;
  adminDeleteUser: (id: string) => Promise<void>;
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

  login: async (name, role, id) => {
    const { state } = get();
    const registered = state.registeredUsers.find(u => u.id === id);
    
    set(store => ({
      state: {
        ...store.state,
        currentUser: { 
            name, 
            role, 
            id,
            studentClass: registered?.studentClass,
            studentSection: registered?.studentSection,
            assignedClasses: registered?.assignedClasses,
            subjects: registered?.subjects
        }
      }
    }));
  },

  logout: () => {
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
      id,
      name,
      password: pass,
      mobile,
      dob: dob || '',
      studentClass: studentClass || '',
      studentSection: '',
      subjects: subjects || [],
      assignedClasses: [],
      joinedAt: Date.now(),
      status: 'PENDING',
      role: role
    };
    
    set(store => ({
      state: {
        ...store.state,
        registeredUsers: [...store.state.registeredUsers, newUser]
      }
    }));
    return true;
  },

  updateUserStatus: async (id, status) => {
    set(store => ({
      state: {
        ...store.state,
        registeredUsers: store.state.registeredUsers.map(u => 
          u.id === id ? { ...u, status } : u
        )
      }
    }));
  },

  adminAddUser: async (userData) => {
    const { state } = get();
    if (state.registeredUsers.find(u => u.id === userData.id)) return false;

    const newUser: RegisteredUser = {
        ...userData,
        joinedAt: Date.now()
    };

    set(store => ({
        state: {
            ...store.state,
            registeredUsers: [...store.state.registeredUsers, newUser]
        }
    }));
    return true;
  },

  adminAddUsersBulk: async (newUsers) => {
    set(store => ({
        state: {
            ...store.state,
            registeredUsers: [...store.state.registeredUsers, ...newUsers]
        }
    }));
  },

  adminDeleteUser: async (id) => {
      set(store => ({
          state: {
              ...store.state,
              registeredUsers: store.state.registeredUsers.filter(u => u.id !== id)
          }
      }));
  },

  adminUpdateUser: async (originalId, updates) => {
    const { state } = get();
    const userIndex = state.registeredUsers.findIndex(u => u.id === originalId);
    if (userIndex === -1) return false;

    if (updates.id && updates.id !== originalId) {
       const duplicate = state.registeredUsers.find(u => u.id === updates.id);
       if (duplicate) return false;
    }

    const updatedUser = { ...state.registeredUsers[userIndex], ...updates };

    set(store => ({
        state: {
            ...store.state,
            registeredUsers: store.state.registeredUsers.map(u => 
                u.id === originalId ? updatedUser : u
            )
        }
    }));
    return true;
  },

  adminAssignClassToTeacher: async (teacherId, assignedClasses) => {
      set(store => ({
          state: {
              ...store.state,
              registeredUsers: store.state.registeredUsers.map(u => 
                  u.id === teacherId ? { ...u, assignedClasses } : u
              )
          }
      }));
  },

  adminAddTransaction: (data) => {
    const newTransaction: Transaction = {
      ...data,
      id: generateId()
    };
    set(store => ({
      state: {
        ...store.state,
        ledger: [newTransaction, ...store.state.ledger]
      }
    }));
  },

  adminDeleteTransaction: (id) => {
    set(store => ({
      state: {
        ...store.state,
        ledger: store.state.ledger.filter(t => t.id !== id)
      }
    }));
  },

  adminSetClassFee: (className, amount) => {
    set(store => ({
      state: {
        ...store.state,
        classFees: { ...store.state.classFees, [className]: amount }
      }
    }));
  },

  adminSetStudentCustomFee: (studentId, amount) => {
    set(store => ({
      state: {
        ...store.state,
        registeredUsers: store.state.registeredUsers.map(u => 
          u.id === studentId ? { ...u, customFee: amount } : u
        )
      }
    }));
  },

  changePassword: async (newPass) => {
    const { state } = get();
    if (!state.currentUser) return false;
    
    set(store => ({
      state: {
        ...store.state,
        registeredUsers: store.state.registeredUsers.map(u => 
          u.id === state.currentUser!.id ? { ...u, password: newPass } : u
        )
      }
    }));
    return true;
  },

  updateProfileAvatar: async (file) => {
    const { state } = get();
    if (!state.currentUser) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      set(store => ({
        state: {
          ...store.state,
          registeredUsers: store.state.registeredUsers.map(u => 
            u.id === state.currentUser!.id ? { ...u, avatar: result } : u
          ),
          currentUser: { ...store.state.currentUser!, avatar: result }
        }
      }));
    };
    reader.readAsDataURL(file);
  },

  updateUserDOB: async (dob) => {
    const { state } = get();
    if (!state.currentUser) return false;

    set(store => ({
      state: {
        ...store.state,
        registeredUsers: store.state.registeredUsers.map(u => 
          u.id === state.currentUser!.id ? { ...u, dob: dob } : u
        )
      }
    }));
    return true;
  },

  updateUserMobile: async (mobile) => {
    const { state } = get();
    if (!state.currentUser) return false;

    set(store => ({
      state: {
        ...store.state,
        registeredUsers: store.state.registeredUsers.map(u => 
          u.id === state.currentUser!.id ? { ...u, mobile: mobile } : u
        )
      }
    }));
    return true;
  },

  updateStudentClass: async (studentClass) => {
    const { state } = get();
    if (!state.currentUser) return false;

    let userFound = false;
    const newRegisteredUsers = state.registeredUsers.map(u => {
        if (u.id === state.currentUser!.id) {
            userFound = true;
            return { ...u, studentClass: studentClass };
        }
        return u;
    });

    if (!userFound) return false;

    set(store => ({
      state: {
        ...store.state,
        registeredUsers: newRegisteredUsers,
        currentUser: { ...store.state.currentUser!, studentClass }
      }
    }));
    return true;
  },

  updateTeacherSubjects: async (subjects) => {
    const { state } = get();
    if (!state.currentUser) return false;

    let userFound = false;
    const newRegisteredUsers = state.registeredUsers.map(u => {
        if (u.id === state.currentUser!.id) {
            userFound = true;
            return { ...u, subjects: subjects };
        }
        return u;
    });

    if (!userFound) return false;

    set(store => ({
      state: {
        ...store.state,
        registeredUsers: newRegisteredUsers,
        currentUser: { ...store.state.currentUser!, subjects: subjects } 
      }
    }));
    return true;
  },

  addSubject: (name, color, icon, targetClass) => {
    const { state } = get();
    const newSubject: Subject = {
      id: generateId(),
      name,
      color,
      icon,
      targetClass,
      createdBy: state.currentUser?.name,
      topics: [],
      position: get().state.subjects.length
    };
    set(store => ({
      state: { ...store.state, subjects: [...store.state.subjects, newSubject] }
    }));
  },

  deleteSubject: (id) => {
    set(store => ({
      state: { ...store.state, subjects: store.state.subjects.filter(s => s.id !== id) }
    }));
  },

  addTopic: (subjectId, name, description) => {
    const newTopic: Topic = {
      id: generateId(),
      subjectId,
      name,
      description,
      isCompleted: false,
      isPinned: false,
      tags: [],
      materials: []
    };
    set(store => ({
      state: {
        ...store.state,
        subjects: store.state.subjects.map(s => 
          s.id === subjectId ? { ...s, topics: [...s.topics, newTopic] } : s
        )
      }
    }));
  },

  deleteTopic: (subjectId, topicId) => {
    const { state } = get();
    const subject = state.subjects.find(s => s.id === subjectId);
    const topic = subject?.topics.find(t => t.id === topicId);
    
    // Cleanup files associated with this topic to free up space
    topic?.materials.forEach(m => {
        if (m.localFileKey) deleteFile(m.localFileKey);
    });

    set(store => ({
      state: {
        ...store.state,
        subjects: store.state.subjects.map(s => 
          s.id === subjectId 
          ? { ...s, topics: s.topics.filter(t => t.id !== topicId) } 
          : s
        )
      }
    }));
  },

  togglePinTopic: (topicId) => {
    set(store => ({
      state: {
        ...store.state,
        subjects: store.state.subjects.map(s => ({
          ...s,
          topics: s.topics.map(t => t.id === topicId ? { ...t, isPinned: !t.isPinned } : t)
        }))
      }
    }));
  },

  toggleTopicCompletion: (topicId) => {
    set(store => ({
      state: {
        ...store.state,
        subjects: store.state.subjects.map(s => ({
          ...s,
          topics: s.topics.map(t => 
             t.id === topicId 
             ? { 
                 ...t, 
                 isCompleted: !t.isCompleted,
                 lastStudiedAt: Date.now()
               } 
             : t
          )
        }))
      }
    }));
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
      id: generateId(),
      topicId,
      type,
      title,
      url: url || '',
      localFileKey,
      fileName,
      fileSize,
      lastAccessed: Date.now(),
      progress: 0,
      isFavorite: false,
      tags: [],
      isDownloaded: !!localFileKey,
      createdBy: state.currentUser?.name
    };

    set(store => ({
      state: {
        ...store.state,
        subjects: store.state.subjects.map(s => ({
          ...s,
          topics: s.topics.map(t => 
            t.id === topicId ? { ...t, materials: [...t.materials, newMat] } : t
          )
        }))
      }
    }));
  },

  deleteMaterial: (topicId, materialId) => {
    const { state } = get();
    const sub = state.subjects.find(s => s.topics.some(t => t.id === topicId));
    const topic = sub?.topics.find(t => t.id === topicId);
    const mat = topic?.materials.find(m => m.id === materialId);
    
    if (mat?.localFileKey) {
      deleteFile(mat.localFileKey);
    }

    set(store => ({
      state: {
        ...store.state,
        subjects: store.state.subjects.map(s => ({
          ...s,
          topics: s.topics.map(t => 
            t.id === topicId 
            ? { ...t, materials: t.materials.filter(m => m.id !== materialId) } 
            : t
          )
        }))
      }
    }));
  },

  saveMaterialNotes: (materialId, notes) => {
    set(store => ({
      state: {
        ...store.state,
        subjects: store.state.subjects.map(s => ({
          ...s,
          topics: s.topics.map(t => ({
            ...t,
            materials: t.materials.map(m => m.id === materialId ? { ...m, notes } : m)
          }))
        }))
      }
    }));
  },

  updateMaterialProgress: (materialId, progress) => {
    set(store => ({
      state: {
        ...store.state,
        subjects: store.state.subjects.map(s => ({
          ...s,
          topics: s.topics.map(t => ({
            ...t,
            materials: t.materials.map(m => m.id === materialId ? { ...m, progress } : m)
          }))
        }))
      }
    }));
  },

  downloadMaterial: async (materialId) => {
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
     } catch (err) {
       console.error("Download failed", err);
     }
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
            materials: t.materials.map(m => ({
                 ...m, isDownloaded: false, localFileKey: undefined, downloadProgress: undefined 
            }))
          }))
        }))
      }
    }));
  },

  getFileBlob: async (key) => {
    return await getFile(key);
  },

  updateState: (newState) => set({ state: newState }),

  globalSearch: (query) => {
    const { state } = get();
    const q = query.toLowerCase();
    const results: any[] = [];

    state.subjects.forEach(s => {
      if (s.name.toLowerCase().includes(q)) {
        results.push({ type: 'subject', data: s });
      }
      s.topics.forEach(t => {
        if (t.name.toLowerCase().includes(q)) {
          results.push({ type: 'topic', data: t, subject: s });
        }
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
    const exportFileDefaultName = 'study_guru_backup.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  },

  importData: async (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.subjects && parsed.settings) {
        set({ state: parsed });
        await saveState(parsed);
        return true;
      }
    } catch (e) {}
    return false;
  }
}));

loadState().then(s => {
  if (s) useStore.setState({ state: s, isLoaded: true });
  else {
     useStore.setState({ isLoaded: true });
     useStore.getState().addSubject("Mathematics", "bg-blue-500", "math", "10th");
  }
});

useStore.subscribe((store) => {
  if (store.isLoaded) saveState(store.state);
});
