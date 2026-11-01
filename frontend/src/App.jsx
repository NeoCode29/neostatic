import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  UploadCloud,
  FileArchive,
  ExternalLink,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Key,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Server,
  Zap,
  HardDrive
} from 'lucide-react';

export default function App() {
  const [slug, setSlug] = useState('');
  const [file, setFile] = useState(null);
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('neostatic_admin_token') || '');
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenInput, setTokenInput] = useState(adminToken);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadReport, setUploadReport] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const [sites, setSites] = useState([]);
  const [systemStats, setSystemStats] = useState(null);
  const [isLoadingSites, setIsLoadingSites] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState(null);

  const [serverOnline, setServerOnline] = useState(null);
  const [serverVersion, setServerVersion] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const apiBase = typeof window !== 'undefined' && window.location.pathname.startsWith('/deploy-manager')
    ? '/deploy-manager/api'
    : '/api';

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const checkHealth = async () => {
    try {
      const res = await fetch(`${apiBase}/health`);
      if (res.ok) {
        const data = await res.json();
        setServerOnline(true);
        setServerVersion(data.version);
      } else {
        setServerOnline(false);
      }
    } catch {
      setServerOnline(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${apiBase}/stats`);
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setSystemStats(result.data);
        }
      }
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  };

  const fetchSites = async () => {
    setIsLoadingSites(true);
    try {
      const headers = {};
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }
      const res = await fetch(`${apiBase}/sites`, { headers });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setSites(result.data);
        }
      }
    } catch (e) {
      console.error('Failed to fetch sites:', e);
    } finally {
      setIsLoadingSites(false);
    }
  };

  useEffect(() => {
    checkHealth();
    fetchSites();
    fetchStats();
    const interval = setInterval(() => {
      checkHealth();
      fetchStats();
    }, 15000);
    return () => clearInterval(interval);
  }, [adminToken]);

  const saveToken = () => {
    const trimmed = tokenInput.trim();
    setAdminToken(trimmed);
    localStorage.setItem('neostatic_admin_token', trimmed);
    setShowTokenModal(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.zip')) {
        setFile(droppedFile);
        if (!slug) {
          const autoSlug = droppedFile.name.replace(/\.zip$/i, '').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
          setSlug(autoSlug);
        }
      } else {
        alert('Mohon pilih file arsip dengan format .zip');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!slug) {
        const autoSlug = selected.name.replace(/\.zip$/i, '').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
        setSlug(autoSlug);
      }
    }
  };

  const handleDeploy = async (e) => {
    e.preventDefault();
    if (!slug) {
      setErrorMessage('Nama halaman (slug) tidak boleh kosong');
      return;
    }
    if (!file) {
      setErrorMessage('Pilih berkas ZIP yang ingin dideploy');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setUploadReport(null);

    const formData = new FormData();
    formData.append('slug', slug);
    formData.append('file', file);

    const headers = {};
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }

    try {
      const res = await fetch(`${apiBase}/deploy`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUploadReport(data.data);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchSites();
        fetchStats();
      } else {
        setErrorMessage(data.message || 'Terjadi kesalahan saat memverifikasi atau mengekstrak file');
      }
    } catch (err) {
      setErrorMessage(`Koneksi gagal: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteSite = async (targetSlug) => {
    if (!confirm(`Hapus situs '${targetSlug}' dan seluruh file rilisnya?`)) {
      return;
    }

    const headers = {};
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }

    try {
      const res = await fetch(`${apiBase}/sites/${targetSlug}`, {
        method: 'DELETE',
        headers,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSites(sites.filter((s) => s.slug !== targetSlug));
        fetchStats();
      } else {
        alert(data.message || 'Gagal menghapus situs');
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const copyToClipboard = (url, slugKey) => {
    navigator.clipboard.writeText(url);
    setCopiedSlug(slugKey);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#12141a] text-slate-200 flex flex-col justify-between p-6 sm:p-10 max-w-7xl mx-auto font-sans">
      <div>
        {/* COMPONENT 1: HEADER & ENGINE STATUS */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/5 mb-8 gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#00d18f] to-emerald-400 flex items-center justify-center shadow-lg shadow-[#00d18f]/20">
              <ShieldCheck className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-white">NEOSTATIC</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00d18f]/10 text-[#00d18f] border border-[#00d18f]/20 font-mono">
                  v{serverVersion || '0.1.0'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Public Route: <span className="text-slate-300">neoproject.my.id/staticpage/</span><span className="text-[#00d18f]">&lt;slug&gt;</span>/
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#1b1f2b] border border-white/5 text-xs font-mono shadow-sm">
              <span className={`w-2.5 h-2.5 rounded-full ${serverOnline ? 'bg-[#00d18f] animate-pulse' : 'bg-red-400'}`}></span>
              <span className="text-slate-300">{serverOnline ? 'Rust Axum • 8080' : 'Disconnected'}</span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400 font-bold">18.4 MB RAM</span>
            </div>

            <button
              onClick={() => {
                setTokenInput(adminToken);
                setShowTokenModal(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1b1f2b] hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition border border-white/5 font-medium shadow-sm"
            >
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              <span>{adminToken ? 'Token Configured' : 'Admin Token'}</span>
            </button>
          </div>
        </header>

        {/* COMPONENT 2: METRICS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Metric 1 */}
          <div className="bg-[#1b1f2b] border border-white/5 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Deployed Sites</span>
              <span className={`w-2.5 h-2.5 rounded-full ${sites.length > 0 ? 'bg-[#00d18f] animate-pulse' : 'bg-slate-500'}`}></span>
            </div>
            <div className="my-4">
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-extrabold text-white tracking-tight">{sites.length}</h3>
                <span className="text-sm font-semibold text-slate-400 font-mono">sites live</span>
                <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full border font-mono ${
                  sites.length > 0 
                    ? 'bg-[#00d18f]/10 text-[#00d18f] border-[#00d18f]/20' 
                    : 'bg-slate-800 text-slate-400 border-white/5'
                }`}>
                  {sites.length > 0 ? 'Online' : 'Standby'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">Disajikan langsung via Nginx subpath</p>
            </div>
            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Routing: Subpath</span>
              <span className="text-emerald-400 font-bold">{serverOnline ? '100% Uptime' : 'Offline'}</span>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="bg-[#1b1f2b] border border-white/5 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Security Integrity</span>
              <span className="text-[11px] font-mono text-[#00d18f] bg-[#00d18f]/10 px-2 py-0.5 rounded-md border border-[#00d18f]/20">
                Zero-Trust
              </span>
            </div>
            <div className="my-4">
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-extrabold text-white tracking-tight">
                  {systemStats?.integrity_rate ?? 100}
                </h3>
                <span className="text-sm font-semibold text-slate-400 font-mono">%</span>
                <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                  Clean
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">Anti Zip-Slip • Extension Allowlist Guard</p>
            </div>
            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>{systemStats?.blocked_traversals ?? 0} Traversal Blocked</span>
              <span>{systemStats?.blocked_forbidden ?? 0} Injections</span>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="bg-[#1b1f2b] border border-white/5 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Storage & Releases</span>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                {formatBytes(systemStats?.total_bytes ?? 0)} Total
              </span>
            </div>
            <div className="my-3 space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white text-slate-900 font-mono">
                    {formatBytes(systemStats?.static_bytes ?? 0)}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Staticpage</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#00d18f] text-slate-950 font-mono">
                    {formatBytes(systemStats?.releases_bytes ?? 0)}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Releases</span>
                </div>
              </div>
              <div className="w-full">
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                  <div
                    className="h-full bg-white transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (((systemStats?.static_bytes ?? 0) / (50 * 1024 * 1024)) * 100)
                      )}%`,
                    }}
                  ></div>
                  <div
                    className="h-full bg-[#00d18f] transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (((systemStats?.releases_bytes ?? 0) / (50 * 1024 * 1024)) * 100)
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Batas: 50 MB / zip</span>
              <span>Atomic Symlink Active</span>
            </div>
          </div>

        </div>

        {/* BALANCED 2-COLUMN SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COMPONENT 3: DEPLOY STATION (Col span 6) */}
          <div className="lg:col-span-6 bg-[#1b1f2b] border border-white/5 rounded-2xl p-6 sm:p-7 text-slate-100 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00d18f]/10 text-[#00d18f] flex items-center justify-center border border-[#00d18f]/20 shadow-md shadow-[#00d18f]/10">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Deploy Static Website</h3>
                  <p className="text-xs text-slate-400">Verifikasi Zero-Trust & Ekstraksi Atomik</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                ZIP Only • Max 50MB
              </span>
            </div>

            <form onSubmit={handleDeploy} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nama Halaman (Slug Subpath) <span className="text-[#00d18f]">*</span>
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="contoh: landing-page, company-profile"
                  required
                  className="w-full bg-[#141824] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#00d18f]/40 font-mono placeholder:text-slate-600 transition"
                />
                <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-500 font-mono">
                  <span>Target:</span>
                  <span className="text-slate-300">https://neoproject.my.id/staticpage/</span>
                  <span className="text-[#00d18f] font-bold">{slug || '<nama-halaman>'}/</span>
                </div>
              </div>

              {/* Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2.5 ${
                  isDragging
                    ? 'border-[#00d18f] bg-[#00d18f]/10'
                    : file
                    ? 'border-[#00d18f]/60 bg-[#00d18f]/5'
                    : 'border-white/10 hover:border-[#00d18f]/60 bg-[#141824]/60'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".zip"
                  className="hidden"
                />
                {file ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-[#00d18f]/10 text-[#00d18f] flex items-center justify-center">
                      <FileArchive className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#00d18f]">{file.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    <span className="text-[10px] text-cyan-400 underline">Klik untuk mengganti berkas</span>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-slate-800/80 text-[#00d18f] flex items-center justify-center">
                      <FileArchive className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">
                        Tarik & letakkan berkas <span className="text-[#00d18f] font-mono">.zip</span> di sini
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">atau klik untuk memilih file dari komputer</p>
                    </div>
                    <span className="text-[10px] text-slate-600 font-mono">Ekstensi diizinkan: .html, .css, .js, .svg, .png, font</span>
                  </>
                )}
              </div>

              {/* Security Badges */}
              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 text-slate-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00d18f]"></span>
                  <span>Anti Zip-Slip</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 text-slate-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00d18f]"></span>
                  <span>Allowlist Ekstensi</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 text-slate-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00d18f]"></span>
                  <span>Atomic Symlink</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isUploading || !slug || !file}
                className={`w-full py-3.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.99] ${
                  isUploading || !slug || !file
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                    : 'bg-gradient-to-r from-[#00d18f] to-emerald-400 hover:from-[#00ba7f] hover:to-emerald-300 text-slate-950 shadow-[#00d18f]/20'
                }`}
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi & Mengekstrak...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Verifikasi & Deploy Atomik</span>
                  </>
                )}
              </button>
            </form>

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-200">Deployment Ditolak</p>
                  <p className="mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Success Report */}
            {uploadReport && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2 text-[#00d18f] text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Halaman Berhasil Diverifikasi & Dideploy!</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1.5 bg-slate-900/60 p-3 rounded-lg border border-white/5 font-mono">
                  <p className="flex justify-between">
                    <span className="text-slate-500">Slug:</span>
                    <span className="text-[#00d18f] font-bold">{uploadReport.slug}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500">Rilis ID:</span>
                    <span>{uploadReport.release_id}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500">File Aman:</span>
                    <span>{uploadReport.total_files} berkas</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500">Ukuran:</span>
                    <span>{(uploadReport.total_bytes / 1024).toFixed(1)} KB</span>
                  </p>
                </div>
                <a
                  href={uploadReport.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2 bg-[#00d18f] hover:bg-[#00ba7f] text-slate-950 font-bold rounded-lg text-xs transition"
                >
                  <span>Buka Halaman Live</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* COMPONENT 4: SITES REGISTRY (Col span 6) */}
          <div className="lg:col-span-6 bg-[#1b1f2b] border border-white/5 rounded-2xl p-6 sm:p-7 text-slate-100 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Active Sites Registry</h3>
                <p className="text-xs text-slate-400">Halaman statis yang sedang online di Nginx</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-[#00d18f]/10 text-[#00d18f] font-mono border border-[#00d18f]/20 font-bold">
                  {sites.length} Live
                </span>
                <button
                  onClick={fetchSites}
                  disabled={isLoadingSites}
                  className="p-2 rounded-xl bg-[#141824] text-slate-400 hover:text-white transition border border-white/5"
                  title="Segarkan daftar situs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSites ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {isLoadingSites ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#00d18f]" />
                <p className="text-xs">Memuat daftar halaman dari server...</p>
              </div>
            ) : sites.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-white/10 rounded-xl space-y-2">
                <Server className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs text-slate-400">Belum ada situs yang dideploy.</p>
                <p className="text-[11px] text-slate-600">Unggah berkas ZIP pertama Anda di kolom sebelah kiri.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {sites.map((site) => (
                  <div
                    key={site.slug}
                    className="p-4 rounded-xl bg-[#141824] border border-white/5 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#00d18f]"></span>
                        <h4 className="text-xs font-bold text-white font-mono truncate">{site.slug}</h4>
                        <span className="px-2 py-0.5 rounded-md text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                          current
                        </span>
                      </div>
                      <a href={site.url} target="_blank" rel="noreferrer" className="text-[11px] text-slate-400 hover:text-[#00d18f] truncate block transition font-mono">
                        {site.url}
                      </a>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Rilis: {site.active_release} • Active Symlink
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => copyToClipboard(site.url, site.slug)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-medium text-slate-300 hover:text-white transition border border-white/5 flex items-center gap-1 font-mono"
                      >
                        {copiedSlug === site.slug ? (
                          <Check className="w-3.5 h-3.5 text-[#00d18f]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>Copy</span>
                      </button>
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 rounded-lg bg-[#00d18f]/10 text-xs font-bold text-[#00d18f] hover:bg-[#00d18f]/20 transition border border-[#00d18f]/20 flex items-center gap-1 font-mono"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        onClick={() => handleDeleteSite(site.slug)}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition border border-rose-500/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="pt-10 pb-4 text-center text-xs text-slate-600 font-mono">
        Neostatic Single-Binary Engine • Powered by Rust Axum & Nginx Atomic Symlinks
      </footer>

      {/* Admin Token Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1b1f2b] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 font-sans">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Konfigurasi Token Admin</h3>
                <p className="text-xs text-slate-400">Token rahasia untuk otorisasi deployment di VPS</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Admin Token (ADMIN_TOKEN)
              </label>
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Masukkan token rahasia..."
                className="w-full bg-[#141824] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00d18f]/40 font-mono"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Disimpan di penyimpanan lokal browser Anda. Cocokkan dengan environment variable di VPS.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowTokenModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveToken}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00d18f] hover:bg-[#00ba7f] text-slate-950 transition shadow-lg shadow-[#00d18f]/20"
              >
                Simpan Token
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
