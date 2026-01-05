
import { useState, useEffect } from 'react';
import { AppState, Subject, Topic, Material, MaterialType, ReaderTheme, Tag, DayStats } from './types';

const STORAGE_KEY = 'study_guru_data_v5';

const DEFAULT_TAGS: Tag[] = [
  { id: 't-important', name: 'Important', color: 'bg-rose-500' },
  { id: 't-revision', name: 'Revision', color: 'bg-indigo-500' },
  { id: 't-exam', name: 'Exam', color: 'bg-amber-500' },
  { id: 't-doubt', name: 'Doubt', color: 'bg-cyan-500' },
  { id: 't-formula', name: 'Formula', color: 'bg-emerald-500' },
];

const getInitialData = (): AppState => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);

  const initialSubjects: Subject[] = [
    {
      id: 's1',
      name: 'Physics',
      color: 'bg-blue-500',
      icon: 'atom',
      position: 0,
      topics: [
        {
          id: 't1',
          subjectId: 's1',
          name: 'Laws of Motion',
          description: 'Basic mechanics and Newton\'s laws',
          isCompleted: false,
          isPinned: true,
          tags: [],
          materials: [
            {
              id: 'm1',
              topicId: 't1',
              type: MaterialType.VIDEO,
              title: 'Concept Explanation',
              url: 'https://www.youtube.com/watch?v=kKKM8Y-u7ds',
              lastAccessed: Date.now(),
              progress: 0,
              videoPosition: 0,
              isFavorite: true,
              notes: "Newton's first law is about inertia.",
              tags: ['t-important'],
              bookmarks: []
            }
          ]
        }
      ]
    }
  ];

  return {
    subjects: initialSubjects,
    tags: DEFAULT_TAGS,
    stats: {
      dailyStudyTime: {},
      totalTopicsCompleted: 0,
      currentStreak: 0
    },
    recentlyOpened: ['m1'],
    settings: {
      readerTheme: ReaderTheme.LIGHT,
      isPro: false
    }
  };
};

const saveToStorage = (state: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

// Simulated Download Registry (Persistent across re-renders)
const downloadIntervals: Record<string, number> = {};

export const useStore = () => {
  // Use state to make the store reactive
  const [state, setState] = useState<AppState>(getInitialData());

  // Subscribe to storage updates
  useEffect(() => {
    const handleUpdate = () => {
      setState(getInitialData());
    };
    window.addEventListener('storage_update', handleUpdate);
    return () => window.removeEventListener('storage_update', handleUpdate);
  }, []);

  const updateState = (newState: AppState) => {
    saveToStorage(newState);
    window.dispatchEvent(new Event('storage_update'));
  };

  const updateRecentlyOpened = (materialId: string) => {
    const newState = { ...state };
    const filtered = newState.recentlyOpened.filter(id => id !== materialId);
    newState.recentlyOpened = [materialId, ...filtered].slice(0, 5);
    updateState(newState);
  };

  const trackStudyTime = (minutes: number, type: MaterialType) => {
    const newState = { ...state };
    const today = new Date().toISOString().split('T')[0];
    
    if (!newState.stats.dailyStudyTime[today]) {
      newState.stats.dailyStudyTime[today] = {
        totalMinutes: 0,
        pdfMinutes: 0,
        videoMinutes: 0,
        noteMinutes: 0
      };
    }

    const day = newState.stats.dailyStudyTime[today];
    day.totalMinutes += minutes;
    if (type === MaterialType.PDF) day.pdfMinutes += minutes;
    if (type === MaterialType.VIDEO) day.videoMinutes += minutes;
    if (type === MaterialType.NOTE) day.noteMinutes += minutes;

    if (newState.stats.lastStudyDate !== today) {
      newState.stats.currentStreak += 1;
      newState.stats.lastStudyDate = today;
    }
    
    updateState(newState);
  };

  const updateMaterialProgress = (materialId: string, progress: number, position?: number) => {
    const newState = { ...state };
    let found = false;
    for (const subject of newState.subjects) {
      for (const topic of subject.topics) {
        const material = topic.materials.find(m => m.id === materialId);
        if (material) {
          material.progress = progress;
          if (material.type === MaterialType.VIDEO) material.videoPosition = position;
          if (material.type === MaterialType.PDF) material.lastPage = position;
          material.lastAccessed = Date.now();
          topic.lastStudiedAt = Date.now();
          
          const filtered = newState.recentlyOpened.filter(id => id !== materialId);
          newState.recentlyOpened = [materialId, ...filtered].slice(0, 5);
          
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (found) updateState(newState);
  };

  const toggleBookmark = (materialId: string, position: number) => {
    const newState = { ...state };
    let found = false;
    for (const subject of newState.subjects) {
      for (const topic of subject.topics) {
        const material = topic.materials.find(m => m.id === materialId);
        if (material) {
          if (!material.bookmarks) material.bookmarks = [];
          if (material.bookmarks.includes(position)) {
            material.bookmarks = material.bookmarks.filter(p => p !== position);
          } else {
            material.bookmarks.push(position);
            material.bookmarks.sort((a, b) => a - b);
          }
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (found) updateState(newState);
  };

  // Step 5: Enhanced Download Manager Engine
  const downloadMaterial = (materialId: string) => {
    const currentState = getInitialData();
    let targetMat: Material | null = null;
    for (const subject of currentState.subjects) {
      for (const topic of subject.topics) {
        const m = topic.materials.find(mat => mat.id === materialId);
        if (m) { targetMat = m; break; }
      }
      if (targetMat) break;
    }

    if (!targetMat || targetMat.isDownloaded || downloadIntervals[materialId]) return;

    // Start download simulation
    targetMat.downloadProgress = 1;
    updateState(currentState);

    let prog = 1;
    const interval = window.setInterval(() => {
      const data = getInitialData();
      let foundInInterval = false;
      
      for (const subject of data.subjects) {
        for (const topic of subject.topics) {
          const m = topic.materials.find(mat => mat.id === materialId);
          if (m) {
            prog += Math.floor(Math.random() * 12) + 4;
            if (prog >= 100) {
              prog = 100;
              m.isDownloaded = true;
              m.downloadProgress = 100;
              clearInterval(downloadIntervals[materialId]);
              delete downloadIntervals[materialId];
            } else {
              m.downloadProgress = prog;
            }
            foundInInterval = true;
            break;
          }
        }
        if (foundInInterval) break;
      }
      
      updateState(data);
    }, 700);
    
    downloadIntervals[materialId] = interval;
  };

  const cancelDownload = (materialId: string) => {
    if (downloadIntervals[materialId]) {
      clearInterval(downloadIntervals[materialId]);
      delete downloadIntervals[materialId];
      
      const newState = getInitialData();
      for (const subject of newState.subjects) {
        for (const topic of subject.topics) {
          const m = topic.materials.find(mat => mat.id === materialId);
          if (m) {
            m.downloadProgress = undefined;
            break;
          }
        }
      }
      updateState(newState);
    }
  };

  const removeDownload = (materialId: string) => {
    const newState = { ...state };
    for (const subject of newState.subjects) {
      for (const topic of subject.topics) {
        const m = topic.materials.find(mat => mat.id === materialId);
        if (m) {
          m.isDownloaded = false;
          m.downloadProgress = undefined;
          break;
        }
      }
    }
    updateState(newState);
  };

  const clearAllDownloads = () => {
    const newState = { ...state };
    for (const subject of newState.subjects) {
      for (const topic of subject.topics) {
        for (const material of topic.materials) {
          material.isDownloaded = false;
          material.downloadProgress = undefined;
        }
      }
    }
    updateState(newState);
  };

  const addMaterial = (topicId: string, title: string, type: MaterialType, url: string) => {
    const newState = { ...state };
    for (const subject of newState.subjects) {
      const topic = subject.topics.find(t => t.id === topicId);
      if (topic) {
        topic.materials.push({ 
          id: Math.random().toString(36).substr(2, 9), 
          topicId, 
          type, 
          title, 
          url: type === MaterialType.NOTE ? '' : url, 
          lastAccessed: Date.now(), 
          progress: 0, 
          isFavorite: false, 
          notes: "",
          tags: [],
          bookmarks: []
        });
        updateState(newState);
        break;
      }
    }
  };

  return {
    state,
    updateState,
    trackStudyTime,
    updateMaterialProgress,
    updateRecentlyOpened,
    toggleBookmark,
    downloadMaterial,
    cancelDownload,
    removeDownload,
    clearAllDownloads,
    addMaterial,
    addSubject: (name: string, color: string, icon: string) => {
      const newSubject: Subject = {
        id: Math.random().toString(36).substr(2, 9),
        name, color, icon, position: state.subjects.length, topics: []
      };
      updateState({ ...state, subjects: [...state.subjects, newSubject] });
    },
    addTopic: (subjectId: string, name: string, description: string = '') => {
      const newState = { ...state };
      const subject = newState.subjects.find(s => s.id === subjectId);
      if (subject) {
        subject.topics.push({ 
          id: Math.random().toString(36).substr(2, 9), 
          subjectId, name, description, isCompleted: false, isPinned: false, tags: [], materials: [] 
        });
        updateState(newState);
      }
    },
    togglePinTopic: (topicId: string) => {
      const newState = { ...state };
      for (const sub of newState.subjects) {
        const topic = sub.topics.find(t => t.id === topicId);
        if (topic) { topic.isPinned = !topic.isPinned; break; }
      }
      updateState(newState);
    },
    toggleTopicCompletion: (topicId: string) => {
      const newState = { ...state };
      for (const subject of newState.subjects) {
        const topic = subject.topics.find(t => t.id === topicId);
        if (topic) {
          topic.isCompleted = !topic.isCompleted;
          if (topic.isCompleted) newState.stats.totalTopicsCompleted += 1;
          else newState.stats.totalTopicsCompleted -= 1;
          break;
        }
      }
      updateState(newState);
    },
    deleteSubject: (id: string) => {
      const subject = state.subjects.find(s => s.id === id);
      if (subject) {
        subject.topics.forEach(t => t.materials.forEach(m => {
          if (downloadIntervals[m.id]) clearInterval(downloadIntervals[m.id]);
        }));
      }
      updateState({ ...state, subjects: state.subjects.filter(s => s.id !== id) });
    },
    deleteMaterial: (topicId: string, materialId: string) => {
      const newState = { ...state };
      if (downloadIntervals[materialId]) clearInterval(downloadIntervals[materialId]);
      for (const sub of newState.subjects) {
        const topic = sub.topics.find(t => t.id === topicId);
        if (topic) { topic.materials = topic.materials.filter(m => m.id !== materialId); break; }
      }
      updateState(newState);
    },
    saveMaterialNotes: (materialId: string, notes: string) => {
      const newState = { ...state };
      let found = false;
      for (const sub of newState.subjects) {
        for (const topic of sub.topics) {
          const mat = topic.materials.find(m => m.id === materialId);
          if (mat) { mat.notes = notes; found = true; break; }
        }
        if (found) break;
      }
      if (found) updateState(newState);
    },
    exportData: () => {
      const dataStr = JSON.stringify(state);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `study_guru_backup_${new Date().toISOString().split('T')[0]}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    },
    importData: (jsonData: string) => {
      try {
        const data = JSON.parse(jsonData);
        if (data && data.subjects && data.stats) {
          updateState(data);
          return true;
        }
      } catch (e) {
        console.error("Data import error:", e);
      }
      return false;
    },
    globalSearch: (query: string) => {
      const q = query.toLowerCase();
      const results: any[] = [];
      state.subjects.forEach(s => {
        if (s.name.toLowerCase().includes(q)) results.push({ type: 'subject', data: s });
        s.topics.forEach(t => {
          if (t.name.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))) {
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
    }
  };
};
