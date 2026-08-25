import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Setup directories for persistent data storage
const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'files.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}
ensureDirectories();

interface ServerFileRecord {
  id: string;
  name: string;
  storedFileName: string;
  size: number;
  type: string;
  date: string;
  timestamp: number;
  isPublic: boolean;
  mimeType: string;
  contentSnippet?: string;
}

interface ServerSettings {
  isPublic: boolean;
  passwordProtected: boolean;
  password?: string;
  allowDownload: boolean;
}

function formatDate(date: Date = new Date()): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const d = date.getDate();
  const m = months[date.getMonth()];
  const y = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${d} ${m} ${y}, ${hours}.${minutes}`;
}

// Initial default demo files
const INITIAL_DEMO_FILES = [
  {
    name: 'setup-cloud-env.ps1',
    content: '# FileKu Cloud Storage Automated Config\nWrite-Host "Initializing cloud storage sync..." -ForegroundColor Cyan\nSet-Location -Path "$HOME/FileKuDrive"\nWrite-Host "Environment configured successfully!" -ForegroundColor Green\nWrite-Host "Connected to Public Cloud Drive" -ForegroundColor Yellow',
    type: 'ps1',
    mimeType: 'text/plain',
  },
  {
    name: 'catatan-proyek-fileku.txt',
    content: 'Dokumentasi FileKu Cloud Storage (Drive Publik):\n- Semua berkas tersimpan di cloud server secara publik\n- Pengunjung yang membuka tautan dapat langsung melihat dan mengunduh berkas\n- Fitur tambah & hapus tersinkronisasi langsung ke server\n- Pratinjau langsung untuk gambar & kode teks\n- Unduh kembali berkas asli kapan saja',
    type: 'txt',
    mimeType: 'text/plain',
  },
  {
    name: 'backup-database-script.bat',
    content: '@echo off\n:: FileKu Automatic Local Backup\necho Starting FileKu Storage Backup...\nmkdir backup_data 2>nul\necho Syncing public cloud storage...\necho Backup completed at %date% %time%.\npause',
    type: 'bat',
    mimeType: 'text/plain',
  },
];

// Helper to load files database
function loadFiles(): ServerFileRecord[] {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading DB_FILE:', err);
  }

  // Seed default files
  const initialRecords: ServerFileRecord[] = [];
  const now = Date.now();

  INITIAL_DEMO_FILES.forEach((demo, idx) => {
    const fileId = `file_demo_${idx + 1}`;
    const storedFileName = `${fileId}_${demo.name}`;
    const filePath = path.join(UPLOADS_DIR, storedFileName);
    fs.writeFileSync(filePath, demo.content, 'utf-8');

    initialRecords.push({
      id: fileId,
      name: demo.name,
      storedFileName,
      size: Buffer.byteLength(demo.content, 'utf-8'),
      type: demo.type,
      date: formatDate(new Date(now - (idx + 1) * 3600000 * 4)),
      timestamp: now - (idx + 1) * 3600000 * 4,
      isPublic: true,
      mimeType: demo.mimeType,
      contentSnippet: demo.content.slice(0, 5000),
    });
  });

  saveFiles(initialRecords);
  return initialRecords;
}

function saveFiles(files: ServerFileRecord[]) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(files, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB_FILE:', err);
  }
}

function loadSettings(): ServerSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading SETTINGS_FILE:', err);
  }
  const defaultSettings: ServerSettings = {
    isPublic: true,
    passwordProtected: false,
    allowDownload: true,
  };
  saveSettings(defaultSettings);
  return defaultSettings;
}

function saveSettings(settings: ServerSettings) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing SETTINGS_FILE:', err);
  }
}

// Configure Multer for disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDirectories();
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB per file
});

// Middleware
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Initialize records
let fileRecords = loadFiles();
let driveSettings = loadSettings();

// ==================== API ROUTES ====================

// GET /api/files - Get all files
app.get('/api/files', (req, res) => {
  res.json({
    success: true,
    files: fileRecords,
    settings: driveSettings,
  });
});

// GET /api/settings - Get drive settings
app.get('/api/settings', (req, res) => {
  res.json({
    success: true,
    settings: driveSettings,
  });
});

// POST /api/settings - Update drive settings
app.post('/api/settings', (req, res) => {
  const newSettings = req.body;
  driveSettings = {
    ...driveSettings,
    ...newSettings,
  };
  saveSettings(driveSettings);
  res.json({
    success: true,
    settings: driveSettings,
  });
});

// POST /api/upload - Upload one or multiple files
app.post('/api/upload', (req, res) => {
  upload.array('files', 50)(req, res, async (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ success: false, message: 'Ukuran berkas melebihi batas maksimal 500 MB' });
        return;
      }
      res.status(400).json({ success: false, message: err.message || 'Gagal mengunggah berkas' });
      return;
    }

    try {
      const uploadedFiles = req.files as Express.Multer.File[];
      if (!uploadedFiles || uploadedFiles.length === 0) {
        res.status(400).json({ success: false, message: 'Tidak ada berkas yang diunggah' });
        return;
      }

      const newRecords: ServerFileRecord[] = [];
      const now = Date.now();

      for (let i = 0; i < uploadedFiles.length; i++) {
        const f = uploadedFiles[i];
        const ext = f.originalname.split('.').pop()?.toLowerCase() || 'bin';
        const fileId = 'file_' + now + '_' + i + '_' + Math.random().toString(36).substring(2, 6);

        let snippet: string | undefined = undefined;
        // Read snippet for text/code files
        if (
          f.mimetype.startsWith('text/') ||
          ['txt', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'py', 'bat', 'ps1', 'sh', 'sql', 'md'].includes(ext)
        ) {
          try {
            const content = fs.readFileSync(f.path, 'utf-8');
            snippet = content.slice(0, 5000);
          } catch (e) {
            console.warn('Could not read text snippet:', e);
          }
        }

        const record: ServerFileRecord = {
          id: fileId,
          name: f.originalname,
          storedFileName: f.filename,
          size: f.size,
          type: ext,
          date: formatDate(new Date()),
          timestamp: now + i,
          isPublic: driveSettings.isPublic,
          mimeType: f.mimetype || 'application/octet-stream',
          contentSnippet: snippet,
        };

        newRecords.unshift(record);
      }

      fileRecords = [...newRecords, ...fileRecords];
      saveFiles(fileRecords);

      res.json({
        success: true,
        message: `Berhasil mengunggah ${newRecords.length} berkas`,
        files: newRecords,
        allFiles: fileRecords,
      });
    } catch (err: any) {
      console.error('Upload error in handler:', err);
      res.status(500).json({ success: false, message: err.message || 'Gagal mengunggah berkas' });
    }
  });
});

// GET /api/files/:id/download - Download file directly
app.get('/api/files/:id/download', (req, res) => {
  const fileId = req.params.id;
  const file = fileRecords.find((f) => f.id === fileId);

  if (!file) {
    res.status(404).send('Berkas tidak ditemukan');
    return;
  }

  const filePath = path.join(UPLOADS_DIR, file.storedFileName);
  if (!fs.existsSync(filePath)) {
    res.status(404).send('File biner tidak ditemukan pada server');
    return;
  }

  res.download(filePath, file.name);
});

// GET /api/files/:id/preview - Inline stream preview (for images, text, media)
app.get('/api/files/:id/preview', (req, res) => {
  const fileId = req.params.id;
  const file = fileRecords.find((f) => f.id === fileId);

  if (!file) {
    res.status(404).send('Berkas tidak ditemukan');
    return;
  }

  const filePath = path.join(UPLOADS_DIR, file.storedFileName);
  if (!fs.existsSync(filePath)) {
    res.status(404).send('File biner tidak ditemukan');
    return;
  }

  if (file.mimeType) {
    res.setHeader('Content-Type', file.mimeType);
  }
  res.sendFile(filePath);
});

// DELETE /api/files/:id - Delete single file
app.delete('/api/files/:id', (req, res) => {
  const fileId = req.params.id;
  const index = fileRecords.findIndex((f) => f.id === fileId);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'Berkas tidak ditemukan' });
    return;
  }

  const file = fileRecords[index];
  const filePath = path.join(UPLOADS_DIR, file.storedFileName);

  // Delete physical file from disk
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.warn('Could not delete physical file:', e);
    }
  }

  // Remove from metadata
  fileRecords.splice(index, 1);
  saveFiles(fileRecords);

  res.json({
    success: true,
    message: `Berkas "${file.name}" berhasil dihapus`,
    deletedId: fileId,
    allFiles: fileRecords,
  });
});

// POST /api/files/batch-delete - Batch delete multiple files
app.post('/api/files/batch-delete', (req, res) => {
  const { ids } = req.body as { ids: string[] };

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ success: false, message: 'Daftar ID berkas tidak valid' });
    return;
  }

  const idsToDelete = new Set(ids);
  const remainingFiles: ServerFileRecord[] = [];

  fileRecords.forEach((file) => {
    if (idsToDelete.has(file.id)) {
      const filePath = path.join(UPLOADS_DIR, file.storedFileName);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn('Could not delete physical file:', e);
        }
      }
    } else {
      remainingFiles.push(file);
    }
  });

  fileRecords = remainingFiles;
  saveFiles(fileRecords);

  res.json({
    success: true,
    message: `Berhasil menghapus ${ids.length} berkas`,
    allFiles: fileRecords,
  });
});

// POST /api/files/clear-all - Clear all files in drive
app.post('/api/files/clear-all', (req, res) => {
  fileRecords.forEach((file) => {
    const filePath = path.join(UPLOADS_DIR, file.storedFileName);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {}
    }
  });

  fileRecords = [];
  saveFiles(fileRecords);

  res.json({
    success: true,
    message: 'Semua berkas di drive cloud telah dibersihkan',
    allFiles: [],
  });
});

// PATCH /api/files/:id/rename - Rename file
app.patch('/api/files/:id/rename', (req, res) => {
  const fileId = req.params.id;
  const { newName } = req.body as { newName: string };

  if (!newName || !newName.trim()) {
    res.status(400).json({ success: false, message: 'Nama baru tidak boleh kosong' });
    return;
  }

  const file = fileRecords.find((f) => f.id === fileId);
  if (!file) {
    res.status(404).json({ success: false, message: 'Berkas tidak ditemukan' });
    return;
  }

  file.name = newName.trim();
  file.type = newName.split('.').pop()?.toLowerCase() || file.type;
  saveFiles(fileRecords);

  res.json({
    success: true,
    message: `Nama berkas diubah menjadi "${newName}"`,
    file,
    allFiles: fileRecords,
  });
});

// Error handling middleware for upload limit
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({
      success: false,
      message: 'Ukuran berkas melebihi batas maksimal 500 MB',
    });
    return;
  }
  next(err);
});

// ==================== VITE MIDDLEWARE / STATIC SERVE ====================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FileKu Cloud Storage Server running on http://localhost:${PORT}`);
  });
}

startServer();
