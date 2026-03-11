// Offline history storage utility
export class OfflineHistory {
  static STORAGE_KEY = 'leafcure_history';
  static MAX_ENTRIES = 100;
  
  static saveHistory(historyData) {
    try {
      const existing = this.getHistory();
      const updated = [...historyData, ...existing].slice(0, this.MAX_ENTRIES);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('Failed to save history:', error);
      return false;
    }
  }
  
  static getHistory() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load history:', error);
      return [];
    }
  }
  
  static addEntry(entry) {
    try {
      const history = this.getHistory();
      const newEntry = {
        ...entry,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        offline: true
      };
      
      const updated = [newEntry, ...history].slice(0, this.MAX_ENTRIES);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      return newEntry;
    } catch (error) {
      console.error('Failed to add history entry:', error);
      return null;
    }
  }
  
  static clearHistory() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear history:', error);
      return false;
    }
  }
  
  static exportHistory() {
    try {
      const history = this.getHistory();
      const dataStr = JSON.stringify(history, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `leafcure-history-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(link.href);
      return true;
    } catch (error) {
      console.error('Failed to export history:', error);
      return false;
    }
  }
}