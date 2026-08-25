export function formatBytes(bytes: number, decimals = 0): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (decimals === 0) {
    const val = Math.round(bytes / Math.pow(k, i));
    return `${val} ${sizes[i]}`;
  }
  const dm = decimals < 0 ? 0 : decimals;
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDate(date: Date = new Date()): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const d = date.getDate();
  const m = months[date.getMonth()];
  const y = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${d} ${m} ${y}, ${hours}.${minutes}`;
}

export function getFileCategory(filename: string): 'image' | 'document' | 'video' | 'audio' | 'archive' | 'app' | 'code' | 'other' {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico', 'avif', 'heic'].includes(ext)) {
    return 'image';
  }
  if (['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', '3gp', 'wmv'].includes(ext)) {
    return 'video';
  }
  if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus'].includes(ext)) {
    return 'audio';
  }
  if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'csv', 'xlsx', 'xls', 'pptx', 'ppt', 'ods', 'ppsx', 'md'].includes(ext)) {
    return 'document';
  }
  if (['exe', 'apk', 'msi', 'bat', 'cmd', 'ps1', 'sh', 'app', 'dmg', 'deb', 'rpm'].includes(ext)) {
    return 'app';
  }
  if (['zip', 'rar', '7z', 'tar', 'gz', 'iso', '7zip', 'bz2', 'xz'].includes(ext)) {
    return 'archive';
  }
  if (['js', 'ts', 'jsx', 'tsx', 'html', 'htm', 'css', 'json', 'py', 'sql', 'cpp', 'java', 'php', 'xml', 'yaml', 'yml'].includes(ext)) {
    return 'code';
  }
  return 'other';
}

export interface DetailedFileInfo {
  badgeText: string;
  badgeStyle: string;
  iconType: string;
  iconColor: string;
  category: 'image' | 'document' | 'video' | 'audio' | 'archive' | 'app' | 'code' | 'other';
}

export function getDetailedFileInfo(filename: string): DetailedFileInfo {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const category = getFileCategory(filename);
  const badgeText = ext ? ext.toUpperCase() : 'FILE';

  switch (ext) {
    case 'exe':
      return {
        badgeText: 'EXE',
        badgeStyle: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        iconType: 'window',
        iconColor: 'text-blue-400',
        category: 'code',
      };
    case 'bat':
    case 'cmd':
      return {
        badgeText: ext.toUpperCase(),
        badgeStyle: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        iconType: 'terminal',
        iconColor: 'text-amber-400',
        category: 'code',
      };
    case 'ps1':
      return {
        badgeText: 'PS1',
        badgeStyle: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        iconType: 'terminal',
        iconColor: 'text-cyan-400',
        category: 'code',
      };
    case 'sh':
      return {
        badgeText: 'SH',
        badgeStyle: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        iconType: 'terminal',
        iconColor: 'text-emerald-400',
        category: 'code',
      };
    case 'msi':
      return {
        badgeText: 'MSI',
        badgeStyle: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
        iconType: 'package',
        iconColor: 'text-sky-400',
        category: 'archive',
      };
    case 'apk':
      return {
        badgeText: 'APK',
        badgeStyle: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        iconType: 'smartphone',
        iconColor: 'text-emerald-400',
        category: 'other',
      };
    case 'xlsx':
    case 'xls':
    case 'csv':
    case 'ods':
      return {
        badgeText: ext.toUpperCase(),
        badgeStyle: 'bg-emerald-600/15 text-emerald-400 border-emerald-600/30',
        iconType: 'spreadsheet',
        iconColor: 'text-emerald-400',
        category: 'document',
      };
    case 'pptx':
    case 'ppt':
    case 'ppsx':
      return {
        badgeText: ext.toUpperCase(),
        badgeStyle: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
        iconType: 'presentation',
        iconColor: 'text-orange-400',
        category: 'document',
      };
    case 'docx':
    case 'doc':
      return {
        badgeText: ext.toUpperCase(),
        badgeStyle: 'bg-blue-600/15 text-blue-400 border-blue-600/30',
        iconType: 'document',
        iconColor: 'text-blue-400',
        category: 'document',
      };
    case 'pdf':
      return {
        badgeText: 'PDF',
        badgeStyle: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        iconType: 'pdf',
        iconColor: 'text-rose-400',
        category: 'document',
      };
    case 'txt':
    case 'rtf':
      return {
        badgeText: ext.toUpperCase(),
        badgeStyle: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
        iconType: 'text',
        iconColor: 'text-slate-300',
        category: 'document',
      };
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
    case 'iso':
      return {
        badgeText: ext.toUpperCase(),
        badgeStyle: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        iconType: 'archive',
        iconColor: 'text-purple-400',
        category: 'archive',
      };
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'webp':
    case 'svg':
    case 'gif':
    case 'bmp':
    case 'ico':
      return {
        badgeText: ext.toUpperCase(),
        badgeStyle: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
        iconType: 'image',
        iconColor: 'text-teal-400',
        category: 'image',
      };
    case 'mp4':
    case 'mkv':
    case 'avi':
    case 'mov':
    case 'webm':
    case 'flv':
      return {
        badgeText: ext.toUpperCase(),
        badgeStyle: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        iconType: 'video',
        iconColor: 'text-indigo-400',
        category: 'video',
      };
    case 'mp3':
    case 'wav':
    case 'flac':
    case 'aac':
    case 'ogg':
    case 'm4a':
      return {
        badgeText: ext.toUpperCase(),
        badgeStyle: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
        iconType: 'audio',
        iconColor: 'text-pink-400',
        category: 'audio',
      };
    case 'py':
      return {
        badgeText: 'PY',
        badgeStyle: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        iconType: 'code',
        iconColor: 'text-blue-400',
        category: 'code',
      };
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
      return {
        badgeText: ext.toUpperCase(),
        badgeStyle: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
        iconType: 'code',
        iconColor: 'text-amber-300',
        category: 'code',
      };
    case 'html':
    case 'htm':
      return {
        badgeText: 'HTML',
        badgeStyle: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
        iconType: 'code',
        iconColor: 'text-orange-400',
        category: 'code',
      };
    case 'css':
      return {
        badgeText: 'CSS',
        badgeStyle: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        iconType: 'code',
        iconColor: 'text-cyan-400',
        category: 'code',
      };
    case 'json':
    case 'xml':
    case 'yaml':
    case 'yml':
    case 'sql':
      return {
        badgeText: ext.toUpperCase(),
        badgeStyle: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
        iconType: 'code',
        iconColor: 'text-violet-400',
        category: 'code',
      };
    default:
      return {
        badgeText: badgeText || 'FILE',
        badgeStyle: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
        iconType: 'file',
        iconColor: 'text-slate-400',
        category,
      };
  }
}

export function getFileTypeBadgeColor(ext: string): { bg: string; text: string; border: string } {
  const info = getDetailedFileInfo(`file.${ext}`);
  return {
    bg: info.badgeStyle.split(' ')[0] || 'bg-slate-500/10',
    text: info.badgeStyle.split(' ')[1] || 'text-slate-400',
    border: info.badgeStyle.split(' ')[2] || 'border-slate-500/20',
  };
}
