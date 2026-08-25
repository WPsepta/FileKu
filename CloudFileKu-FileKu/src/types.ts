export interface StoredFile {
  id: string;
  name: string;
  size: number;
  type: string;
  date: string;
  timestamp: number;
  isPublic: boolean;
  blob?: Blob;
  previewUrl?: string;
  dataUrl?: string;
  contentSnippet?: string;
}

export type FileCategory = 'all' | 'document' | 'image' | 'video' | 'audio' | 'archive' | 'app';

export type SortField = 'date' | 'name' | 'size';
export type SortOrder = 'asc' | 'desc';

export interface PermissionSettings {
  isPublic: boolean;
  passwordProtected: boolean;
  password?: string;
  allowDownload: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}


