import React from 'react';
import { useCalendar } from './CalendarContext';

interface SyncStatusProps {
  className?: string;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({ className = '' }) => {
  const { syncStatus, lastSyncTime, isLoading } = useCalendar();

  const formatLastSync = (date: Date | null): string => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getSyncStatusInfo = () => {
    if (isLoading) {
      return {
        icon: '⏳',
        text: 'Loading...',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      };
    }

    switch (syncStatus) {
      case 'syncing':
        return {
          icon: '🔄',
          text: 'Syncing...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        };
      case 'success':
        return {
          icon: '✅',
          text: 'Synced',
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        };
      case 'error':
        return {
          icon: '❌',
          text: 'Sync Error',
          color: 'text-red-600',
          bgColor: 'bg-red-50'
        };
      default:
        return {
          icon: '⭕',
          text: 'Ready',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50'
        };
    }
  };

  const statusInfo = getSyncStatusInfo();

  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${statusInfo.bgColor} ${className}`}>
      <span className="text-sm">{statusInfo.icon}</span>
      <div className="flex flex-col">
        <span className={`text-xs font-medium ${statusInfo.color}`}>
          {statusInfo.text}
        </span>
        {lastSyncTime && (
          <span className="text-xs text-gray-500">
            Last sync: {formatLastSync(lastSyncTime)}
          </span>
        )}
      </div>
    </div>
  );
};

// Optional: Storage Info Component
export const StorageInfo: React.FC = () => {
  const { events } = useCalendar();
  
  const getStorageInfo = () => {
    // Check if IndexedDB is supported
    const hasIndexedDB = 'indexedDB' in window;
    
    // Calculate approximate storage usage
    const eventsJsonSize = new Blob([JSON.stringify(events)]).size;
    const sizeInKB = Math.round(eventsJsonSize / 1024 * 100) / 100;
    
    return {
      hasIndexedDB,
      eventCount: events.length,
      storageSize: sizeInKB
    };
  };

  const info = getStorageInfo();

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
      <h3 className="text-sm font-semibold text-gray-800">Storage Information</h3>
      <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
        <div>
          <span className="font-medium">Database:</span>
          <br />
          {info.hasIndexedDB ? 'IndexedDB + localStorage' : 'localStorage only'}
        </div>
        <div>
          <span className="font-medium">Events:</span>
          <br />
          {info.eventCount} events
        </div>
        <div>
          <span className="font-medium">Storage Size:</span>
          <br />
          ~{info.storageSize} KB
        </div>
        <div>
          <span className="font-medium">Auto-sync:</span>
          <br />
          Every 30 seconds
        </div>
      </div>
    </div>
  );
};

// Backup and Restore Component
export const BackupRestore: React.FC = () => {
  const { exportEvents, importEvents } = useCalendar();
  const [importStatus, setImportStatus] = React.useState<string>('');

  const handleExport = () => {
    const data = exportEvents();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendar-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = await importEvents(text);
      setImportStatus(result.success ? '✅ ' + (result.message || 'Import successful') : '❌ ' + (result.message || 'Import failed'));
      
      // Clear status after 3 seconds
      setTimeout(() => setImportStatus(''), 3000);
    } catch (error) {
      setImportStatus('❌ Failed to read file');
      setTimeout(() => setImportStatus(''), 3000);
    }

    // Reset file input
    event.target.value = '';
  };

  return (
    <div className="bg-white border rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-800">Backup & Restore</h3>
      
      <div className="flex flex-col space-y-2">
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          📥 Export Events
        </button>
        
        <div className="relative">
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <button className="w-full px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
            📤 Import Events
          </button>
        </div>
        
        {importStatus && (
          <div className="text-xs p-2 rounded bg-gray-100">
            {importStatus}
          </div>
        )}
      </div>
    </div>
  );
};