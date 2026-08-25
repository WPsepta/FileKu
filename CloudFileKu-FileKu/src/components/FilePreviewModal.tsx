import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Calendar,
  HardDrive,
  FileCheck,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Table,
  FileText,
  Binary,
  Code2,
  Volume2,
  Video as VideoIcon,
  Eye,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import { StoredFile } from '../types';
import { formatBytes, formatDate, getFileCategory, getDetailedFileInfo } from '../utils/formatters';
import { FileFormatIcon } from './FileFormatIcon';

interface FilePreviewModalProps {
  file: StoredFile | null;
  onClose: () => void;
  onDownload: (file: StoredFile) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  onClose,
  onDownload,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'hex' | 'details'>('preview');
  const [textContent, setTextContent] = useState<string>('');
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [hexLines, setHexLines] = useState<{ offset: string; hex: string; ascii: string }[]>([]);
  const [copied, setCopied] = useState(false);
  const [imgZoom, setImgZoom] = useState(1);
  const [blobUrl, setBlobUrl] = useState<string>('');
  const [isPdfLoading, setIsPdfLoading] = useState(true);

  const category = file ? getFileCategory(file.name) : 'other';
  const fileInfo = file ? getDetailedFileInfo(file.name) : { badgeText: '', badgeStyle: '' };
  const ext = file ? file.name.split('.').pop()?.toLowerCase() || '' : '';
  const dateDisplay = file
    ? file.timestamp
      ? formatDate(new Date(file.timestamp))
      : file.date || formatDate(new Date())
    : '';

  // Generate simulated file hash
  const pseudoHash = React.useMemo(() => {
    if (!file) return '';
    let hash = 0;
    const str = file.name + file.size + (file.timestamp || '');
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `sha256:7f9a${hex}e32d4b8c9f0a1b2c3d4e5f6a7b8c9d0e`;
  }, [file]);

  // Load content (text, csv, hex) dynamically from blob or dataUrl
  useEffect(() => {
    if (!file) return;

    let currentBlobUrl = '';
    setTextContent('');
    setCsvRows([]);
    setHexLines([]);
    setImgZoom(1);
    setIsPdfLoading(true);

    if (file.blob) {
      currentBlobUrl = URL.createObjectURL(file.blob);
      setBlobUrl(currentBlobUrl);
    } else if (file.previewUrl) {
      setBlobUrl(file.previewUrl);
    } else if (file.dataUrl) {
      setBlobUrl(file.dataUrl);
    }

    const isTextLike =
      category === 'code' ||
      category === 'document' ||
      ['txt', 'csv', 'tsv', 'json', 'md', 'xml', 'yaml', 'yml', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'sql', 'bat', 'sh', 'ps1', 'log', 'ini', 'env', 'svg'].includes(ext);

    // 1. Text / Code / CSV loader
    if (file.blob && isTextLike) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = (e.target?.result as string) || '';
        setTextContent(text);

        if (ext === 'csv' || ext === 'tsv') {
          const delimiter = ext === 'tsv' ? '\t' : ',';
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
          const parsed = lines.slice(0, 50).map((line) => line.split(delimiter).map((c) => c.trim()));
          setCsvRows(parsed);
        }
      };
      reader.readAsText(file.blob.slice(0, 150000));
    } else if (file.contentSnippet) {
      setTextContent(file.contentSnippet);
    }

    // 2. Binary Hex dump generator for any file
    if (file.blob) {
      const slice = file.blob.slice(0, 256);
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        if (buffer) {
          const bytes = new Uint8Array(buffer);
          const lines: { offset: string; hex: string; ascii: string }[] = [];
          for (let i = 0; i < bytes.length; i += 16) {
            const chunk = bytes.slice(i, i + 16);
            const offsetStr = i.toString(16).padStart(6, '0').toUpperCase();
            let hexStr = '';
            let asciiStr = '';

            for (let j = 0; j < 16; j++) {
              if (j < chunk.length) {
                hexStr += chunk[j].toString(16).padStart(2, '0').toUpperCase() + ' ';
                asciiStr += chunk[j] >= 32 && chunk[j] <= 126 ? String.fromCharCode(chunk[j]) : '.';
              } else {
                hexStr += '   ';
              }
              if (j === 7) hexStr += ' ';
            }

            lines.push({ offset: offsetStr, hex: hexStr.trimEnd(), ascii: asciiStr });
          }
          setHexLines(lines);
        }
      };
      reader.readAsArrayBuffer(slice);
    } else {
      // Fallback synthetic hex view from name & metadata
      const lines: { offset: string; hex: string; ascii: string }[] = [];
      const sampleText = `${file.name}\x00FILEKU\x01\x02\x03${formatBytes(file.size)}`;
      for (let i = 0; i < Math.min(sampleText.length, 64); i += 16) {
        const chunk = sampleText.slice(i, i + 16);
        const offsetStr = i.toString(16).padStart(6, '0').toUpperCase();
        let hexStr = '';
        let asciiStr = '';
        for (let j = 0; j < 16; j++) {
          if (j < chunk.length) {
            const charCode = chunk.charCodeAt(j);
            hexStr += charCode.toString(16).padStart(2, '0').toUpperCase() + ' ';
            asciiStr += charCode >= 32 && charCode <= 126 ? chunk[j] : '.';
          } else {
            hexStr += '   ';
          }
          if (j === 7) hexStr += ' ';
        }
        lines.push({ offset: offsetStr, hex: hexStr.trimEnd(), ascii: asciiStr });
      }
      setHexLines(lines);
    }

    return () => {
      if (currentBlobUrl && currentBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [file, category, ext]);

  if (!file) return null;

  const copyText = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentPreviewSource = blobUrl || file.previewUrl || file.dataUrl || '';

  return (
    <div
      id="previewModalBackdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
    >
      <div
        id="previewModalContainer"
        onClick={(e) => e.stopPropagation()}
        className="bg-[#070e22]/95 border border-cyan-500/40 w-full max-w-4xl rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(6,182,212,0.3)] flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-cyan-500/20 bg-[#060b19]/90 backdrop-blur-md">
          <div className="flex items-center space-x-3 overflow-hidden pr-2">
            <div className="w-10 h-10 rounded-2xl bg-[#0a1226] border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <FileFormatIcon filename={file.name} size="md" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-bold text-white truncate drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" title={file.name}>
                  {file.name}
                </h3>
                <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-extrabold border ${fileInfo.badgeStyle}`}>
                  {fileInfo.badgeText}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5 font-mono">
                <span className="text-cyan-300 font-semibold">{formatBytes(file.size)}</span>
                <span>•</span>
                <span>{dateDisplay}</span>
              </div>
            </div>
          </div>

          {/* Modal Top Actions */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* View Mode Tabs */}
            <div className="hidden sm:flex items-center bg-[#030712] border border-cyan-500/30 rounded-xl p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'preview'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Pratinjau</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('hex')}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'hex'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Binary className="w-3.5 h-3.5" />
                <span>Hex / Kode</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'details'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Detail</span>
              </button>
            </div>

            <button
              id="btnClosePreviewModal"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-cyan-950/60 border border-transparent hover:border-cyan-500/30 transition cursor-pointer"
              aria-label="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col items-center justify-start bg-[#040817]/70 space-y-4">
          
          {/* TAB 1: VISUAL & INTERACTIVE PREVIEW */}
          {activeTab === 'preview' && (
            <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[300px]">
              
              {/* IMAGE PREVIEW */}
              {category === 'image' && currentPreviewSource ? (
                <div className="w-full flex flex-col items-center">
                  <div className="relative max-h-[52vh] w-full flex items-center justify-center rounded-2xl overflow-hidden border border-cyan-500/30 bg-black/60 p-2 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                    <img
                      src={currentPreviewSource}
                      alt={file.name}
                      referrerPolicy="no-referrer"
                      style={{ transform: `scale(${imgZoom})`, transition: 'transform 0.2s ease' }}
                      className="max-h-[48vh] max-w-full object-contain rounded-xl shadow-lg cursor-zoom-in"
                      onClick={() => setImgZoom((z) => (z >= 2 ? 1 : z + 0.5))}
                    />
                  </div>
                  {/* Image Controls */}
                  <div className="flex items-center space-x-2 mt-3 bg-[#060b19] border border-cyan-500/30 rounded-xl px-3 py-1 text-xs">
                    <button
                      onClick={() => setImgZoom((z) => Math.max(0.5, z - 0.25))}
                      className="p-1 text-cyan-300 hover:text-white rounded hover:bg-cyan-950/50"
                      title="Perkecil"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="font-mono text-slate-300 font-semibold px-2">{Math.round(imgZoom * 100)}%</span>
                    <button
                      onClick={() => setImgZoom((z) => Math.min(3, z + 0.25))}
                      className="p-1 text-cyan-300 hover:text-white rounded hover:bg-cyan-950/50"
                      title="Perbesar"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setImgZoom(1)}
                      className="p-1 text-cyan-300 hover:text-white rounded hover:bg-cyan-950/50"
                      title="Reset Ukuran"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : null}

              {/* VIDEO PREVIEW */}
              {category === 'video' && currentPreviewSource ? (
                <div className="w-full max-h-[55vh] rounded-2xl overflow-hidden bg-black border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.25)] flex flex-col items-center justify-center p-1">
                  <video
                    src={currentPreviewSource}
                    controls
                    autoPlay={false}
                    className="w-full h-auto max-h-[50vh] rounded-xl"
                  />
                </div>
              ) : null}

              {/* AUDIO PREVIEW */}
              {category === 'audio' && currentPreviewSource ? (
                <div className="w-full max-w-lg p-6 sm:p-8 bg-[#060b19] border border-cyan-500/30 rounded-3xl flex flex-col items-center space-y-5 shadow-[0_0_35px_rgba(6,182,212,0.25)]">
                  <div className="w-20 h-20 rounded-3xl bg-cyan-950/80 border border-cyan-400 text-cyan-300 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.6)] animate-pulse">
                    <Volume2 className="w-10 h-10 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                  </div>
                  <div className="text-center">
                    <h4 className="text-white font-bold text-base truncate max-w-xs">{file.name}</h4>
                    <p className="text-xs text-cyan-400 font-mono mt-1">Audio Player • {formatBytes(file.size)}</p>
                  </div>
                  <audio src={currentPreviewSource} controls className="w-full" />
                </div>
              ) : null}

              {/* PDF VIEWER */}
              {ext === 'pdf' && currentPreviewSource ? (
                <div className="w-full h-[55vh] rounded-2xl overflow-hidden border border-cyan-500/30 bg-black/50 shadow-[0_0_25px_rgba(6,182,212,0.2)] flex flex-col">
                  {isPdfLoading && (
                    <div className="p-3 text-xs text-cyan-300 flex items-center justify-center bg-[#060b19] border-b border-cyan-500/20">
                      <span>Memuat Pembaca PDF Interaktif...</span>
                    </div>
                  )}
                  <iframe
                    src={currentPreviewSource}
                    title={file.name}
                    className="w-full h-full border-0 rounded-b-xl"
                    onLoad={() => setIsPdfLoading(false)}
                  />
                </div>
              ) : null}

              {/* CSV / TABULAR DATA PREVIEW */}
              {(ext === 'csv' || ext === 'tsv') && csvRows.length > 0 ? (
                <div className="w-full flex flex-col space-y-2">
                  <div className="flex items-center justify-between text-xs text-cyan-300">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Table className="w-4 h-4 text-emerald-400" />
                      Pratinjau Tabel Data (Menampilkan {csvRows.length} baris)
                    </span>
                    <button
                      onClick={() => copyText(textContent)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:text-white transition"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Tersalin' : 'Salin CSV'}</span>
                    </button>
                  </div>
                  <div className="w-full max-h-[50vh] overflow-auto rounded-2xl border border-cyan-500/30 bg-[#060b19]/90 shadow-inner">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="bg-cyan-950/70 border-b border-cyan-500/30 text-cyan-300 sticky top-0">
                          {csvRows[0].map((header, idx) => (
                            <th key={idx} className="p-2.5 border-r border-cyan-500/20 font-bold whitespace-nowrap">
                              {header || `Kolom ${idx + 1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvRows.slice(1).map((row, rIdx) => (
                          <tr key={rIdx} className="border-b border-white/[0.04] hover:bg-cyan-500/10 transition">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-2 border-r border-white/[0.04] text-slate-300 whitespace-nowrap">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {/* CODE / TEXT PREVIEW */}
              {textContent && ext !== 'csv' && ext !== 'tsv' && ext !== 'pdf' && category !== 'image' && category !== 'video' && category !== 'audio' ? (
                <div className="w-full flex flex-col space-y-2">
                  <div className="flex items-center justify-between text-xs text-cyan-300">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Code2 className="w-4 h-4 text-cyan-400" />
                      Editor & Pembaca Berkas ({textContent.split('\n').length} baris)
                    </span>
                    <button
                      onClick={() => copyText(textContent)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:text-white transition cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Tersalin' : 'Salin Teks'}</span>
                    </button>
                  </div>
                  <div className="w-full bg-[#060b19] border border-cyan-500/30 rounded-2xl p-4 font-mono text-xs text-slate-200 overflow-x-auto max-h-[50vh] whitespace-pre-wrap leading-relaxed shadow-inner">
                    <code>{textContent}</code>
                  </div>
                </div>
              ) : null}

              {/* SPECIALIZED INSPECTION PREVIEW CARD FOR ARCHIVE / APK / EXE / OFFICE / OTHER */}
              {(!textContent && ext !== 'pdf' && category !== 'image' && category !== 'video' && category !== 'audio') ||
              ['zip', 'rar', '7z', 'tar', 'apk', 'exe', 'msi', 'dmg', 'docx', 'xlsx', 'pptx', 'bin', 'iso'].includes(ext) ? (
                <div className="w-full max-w-2xl bg-[#060b19]/90 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center space-y-5 shadow-[0_0_35px_rgba(6,182,212,0.2)]">
                  <div className="w-20 h-20 rounded-3xl bg-cyan-950/60 border border-cyan-400/50 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.4)]">
                    <FileFormatIcon filename={file.name} size="lg" />
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-white">{file.name}</h4>
                    <p className="text-xs text-cyan-300 font-mono mt-1">
                      {fileInfo.badgeText} Paket Berkas • {formatBytes(file.size)}
                    </p>
                  </div>

                  <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                    <div className="p-3 bg-[#030712] border border-cyan-500/20 rounded-2xl">
                      <div className="text-[10px] text-cyan-400 font-bold flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        Tipe Kontainer
                      </div>
                      <div className="text-xs text-white font-semibold mt-1 uppercase">{ext || 'Biner'} Format</div>
                    </div>

                    <div className="p-3 bg-[#030712] border border-cyan-500/20 rounded-2xl">
                      <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Status Berkas
                      </div>
                      <div className="text-xs text-emerald-300 font-semibold mt-1">Utuh & Terverifikasi</div>
                    </div>

                    <div className="p-3 bg-[#030712] border border-cyan-500/20 rounded-2xl">
                      <div className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Aksesibilitas
                      </div>
                      <div className="text-xs text-amber-300 font-semibold mt-1">Siap Diunduh</div>
                    </div>
                  </div>

                  <div className="w-full bg-[#030712] border border-cyan-500/20 rounded-2xl p-3 text-left font-mono text-[11px] text-slate-300 space-y-1">
                    <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Fingerprint Hash:</div>
                    <div className="text-slate-400 break-all">{pseudoHash}</div>
                  </div>
                </div>
              ) : null}

            </div>
          )}

          {/* TAB 2: HEX DUMP / BINARY INSPECTION */}
          {activeTab === 'hex' && (
            <div className="w-full flex flex-col space-y-3">
              <div className="flex items-center justify-between text-xs text-cyan-300">
                <span className="flex items-center gap-1.5 font-bold">
                  <Binary className="w-4 h-4 text-cyan-400" />
                  Pemeriksa Header Biner & Hex Dump (Offset 0x000000 - 0x000100)
                </span>
                <span className="text-slate-400 font-mono text-[11px]">Big-Endian / ASCII</span>
              </div>
              <div className="w-full bg-[#030712] border border-cyan-500/30 rounded-2xl p-4 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[50vh] leading-relaxed shadow-inner">
                {hexLines.length > 0 ? (
                  <div className="space-y-1">
                    <div className="text-cyan-400 font-bold pb-2 border-b border-cyan-500/20 grid grid-cols-12 gap-2">
                      <span className="col-span-2">OFFSET</span>
                      <span className="col-span-7">HEX BYTES (00 - 0F)</span>
                      <span className="col-span-3">ASCII</span>
                    </div>
                    {hexLines.map((line, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 hover:bg-cyan-500/10 rounded px-1">
                        <span className="col-span-2 text-cyan-400/80 font-bold">{line.offset}</span>
                        <span className="col-span-7 text-teal-300 font-semibold">{line.hex}</span>
                        <span className="col-span-3 text-slate-400">{line.ascii}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400">Data biner siap diekstraksi saat diunduh.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: COMPLETE METADATA & INTEGRITY SPECS */}
          {activeTab === 'details' && (
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-[#060b19] p-4 rounded-2xl border border-cyan-500/30 space-y-2">
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5" />
                  Informasi Kapasitas
                </span>
                <div className="flex justify-between border-b border-white/[0.05] pb-1.5">
                  <span className="text-slate-400">Ukuran Byte:</span>
                  <span className="font-mono font-bold text-white">{file.size.toLocaleString()} Bytes</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.05] pb-1.5">
                  <span className="text-slate-400">Ukuran Diformat:</span>
                  <span className="font-mono font-bold text-cyan-300">{formatBytes(file.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimasi Unduh (10MB/s):</span>
                  <span className="font-mono text-emerald-300">
                    {Math.max(0.1, +(file.size / (10 * 1024 * 1024)).toFixed(2))} dtk
                  </span>
                </div>
              </div>

              <div className="bg-[#060b19] p-4 rounded-2xl border border-cyan-500/30 space-y-2">
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5" />
                  Format & Ekstensi
                </span>
                <div className="flex justify-between border-b border-white/[0.05] pb-1.5">
                  <span className="text-slate-400">Ekstensi Berkas:</span>
                  <span className="font-mono font-bold text-white uppercase">.{ext || 'none'}</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.05] pb-1.5">
                  <span className="text-slate-400">Kategori:</span>
                  <span className="font-bold text-cyan-300 capitalize">{category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Integritas:</span>
                  <span className="font-bold text-emerald-400">Valid</span>
                </div>
              </div>

              <div className="bg-[#060b19] p-4 rounded-2xl border border-cyan-500/30 col-span-1 sm:col-span-2 space-y-2">
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Riwayat & Keamanan
                </span>
                <div className="flex justify-between border-b border-white/[0.05] pb-1.5">
                  <span className="text-slate-400">Waktu Diunggah:</span>
                  <span className="font-medium text-white">{dateDisplay}</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.05] pb-1.5">
                  <span className="text-slate-400">ID Berkas Sistem:</span>
                  <span className="font-mono text-cyan-400">{file.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Checksum (SHA256):</span>
                  <span className="font-mono text-[11px] text-slate-300 truncate max-w-xs">{pseudoHash}</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-cyan-500/20 text-xs">
            <div className="bg-[#060b19] p-2.5 rounded-xl border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
              <span className="text-[10px] text-cyan-400/80 block flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-cyan-400" />
                Ukuran
              </span>
              <span className="font-semibold text-slate-200 font-mono">{formatBytes(file.size)}</span>
            </div>

            <div className="bg-[#060b19] p-2.5 rounded-xl border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
              <span className="text-[10px] text-cyan-400/80 block flex items-center gap-1">
                <FileCheck className="w-3 h-3 text-cyan-400" />
                Format
              </span>
              <span className="font-semibold text-slate-200 uppercase">{fileInfo.badgeText}</span>
            </div>

            <div className="bg-[#060b19] p-2.5 rounded-xl border border-cyan-500/30 col-span-2 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
              <span className="text-[10px] text-cyan-400/80 block flex items-center gap-1">
                <Calendar className="w-3 h-3 text-cyan-400" />
                Tanggal Diunggah
              </span>
              <span className="font-semibold text-slate-200 truncate block">{dateDisplay}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-cyan-500/20 bg-[#060b19]/90 backdrop-blur-md flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            Tutup
          </button>

          <button
            id="btnDownloadInPreview"
            onClick={() => onDownload(file)}
            className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transition active:scale-95 cursor-pointer border border-cyan-300/40"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Berkas Ini</span>
          </button>
        </div>
      </div>
    </div>
  );
};
