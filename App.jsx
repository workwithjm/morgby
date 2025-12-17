import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Video, Settings, Activity, Trash2, Wifi, WifiOff, Zap, User, Play, Square, Save, Terminal, AlertTriangle, EyeOff, Eye, HardDrive, Sun, Moon, HelpCircle, ExternalLink, ShieldCheck, Cpu, Database, Bell } from 'lucide-react';

const TF_SCRIPT = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0';
const COCO_SCRIPT = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.2';
const JSZIP_SCRIPT = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';

const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

const formatTime = (date) => {
  return date.toLocaleString('en-US', {
    month: '2-digit', day: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
};

export default function App() {
  const [activeTab, setActiveTab] = useState('monitor'); 
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [lastCaptureTime, setLastCaptureTime] = useState(null);
  const [logs, setLogs] = useState([]);
  const [queue, setQueue] = useState([]); 
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isBlackout, setIsBlackout] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0); 

  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('morgby_config');
    return saved ? JSON.parse(saved) : {
        botToken: '',
        chatId: '',
        intervalMinutes: 15,
        mode: 'photo',
        flashEnabled: false,
        flashStartHour: 18,
        flashEndHour: 6,
        detectPerson: true,
        storageLimitMb: 100,
    };
  });

  useEffect(() => {
    localStorage.setItem('morgby_config', JSON.stringify(config));
  }, [config]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const netRef = useRef(null);
  const intervalRef = useRef(null);
  const pollRef = useRef(null);
  const wakeLockRef = useRef(null);
  const offsetRef = useRef(0);
  const dbRef = useRef(null);

  const addLog = useCallback((msg, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [{ time: timestamp, msg, type }, ...prev].slice(0, 100));
  }, []);

  const initDB = () => {
    return new Promise((resolve) => {
      const request = indexedDB.open('MorgbyStorage', 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'id', autoIncrement: true });
        }
      };
      request.onsuccess = (e) => {
        dbRef.current = e.target.result;
        updateStorageStats();
        resolve();
      };
    });
  };

  const saveFileToDB = async (blob, caption, type) => {
    if (!dbRef.current) return;
    const transaction = dbRef.current.transaction(['files'], 'readwrite');
    const store = transaction.objectStore('files');
    const item = { blob, caption, type, timestamp: Date.now(), size: blob.size };
    store.add(item);
    transaction.oncomplete = () => updateStorageStats();
  };

  const updateStorageStats = () => {
    if (!dbRef.current) return;
    const transaction = dbRef.current.transaction(['files'], 'readonly');
    const store = transaction.objectStore('files');
    const request = store.getAll();
    request.onsuccess = () => {
      const items = request.result;
      const totalSize = items.reduce((acc, curr) => acc + curr.size, 0);
      setStorageUsed(Number((totalSize / (1024 * 1024)).toFixed(2)));
      setQueue(items);
    };
  };

  const clearAllFiles = () => {
    const transaction = dbRef.current.transaction(['files'], 'readwrite');
    const store = transaction.objectStore('files');
    store.clear();
    transaction.oncomplete = () => {
        updateStorageStats();
        addLog('Storage folder cleared.', 'success');
    };
  };

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        addLog('Wake Lock Active', 'success');
      } catch (err) {}
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        addLog('Morgby.OS Initializing...', 'info');
        await initDB();
        await loadScript(TF_SCRIPT);
        await loadScript(COCO_SCRIPT);
        await loadScript(JSZIP_SCRIPT);
        if (window.cocoSsd) {
          netRef.current = await window.cocoSsd.load();
          setIsModelLoaded(true);
          addLog('AI Engine Online', 'success');
        }
      } catch (err) {
        addLog(`Init Error: ${err.message}`, 'error');
      }
    };
    init();
    window.addEventListener('online', () => { setIsOnline(true); processQueue(); });
    window.addEventListener('offline', () => setIsOnline(false));
    return () => { stopCamera(); releaseWakeLock(); clearInterval(intervalRef.current); clearInterval(pollRef.current); };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      await requestWakeLock();
    } catch (err) {
      addLog(`Camera Error: ${err.message}`, 'error');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
    releaseWakeLock();
  };

  const toggleFlash = async (enable) => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
        const capabilities = track.getCapabilities();
        if (capabilities.torch) await track.applyConstraints({ advanced: [{ torch: enable }] });
    } catch (e) {}
  };

  const sendTelegramFile = async (id, blob, caption) => {
    if (!config.botToken || !config.chatId || !navigator.onLine) return;
    const formData = new FormData();
    formData.append('chat_id', config.chatId);
    formData.append('caption', caption);
    formData.append('photo', blob, `morgby_${id}.jpg`);
    try {
      const res = await fetch(`https://api.telegram.org/bot${config.botToken}/sendPhoto`, { method: 'POST', body: formData });
      if (res.ok) {
        const transaction = dbRef.current.transaction(['files'], 'readwrite');
        transaction.objectStore('files').delete(id);
        transaction.oncomplete = () => updateStorageStats();
      }
    } catch (err) {}
  };

  const processQueue = async () => {
      if (!dbRef.current || queue.length === 0) return;
      if (queue.length > 5 && window.JSZip) {
          const zip = new window.JSZip();
          queue.forEach((item) => zip.file(`morgby_${item.timestamp}.jpg`, item.blob));
          try {
            const content = await zip.generateAsync({type:"blob"});
            const fd = new FormData();
            fd.append('chat_id', config.chatId);
            fd.append('document', content, `morgby_batch_${Date.now()}.zip`);
            const res = await fetch(`https://api.telegram.org/bot${config.botToken}/sendDocument`, { method: 'POST', body: fd });
            if (res.ok) clearAllFiles();
          } catch (err) {}
      } else {
          for (const item of queue) await sendTelegramFile(item.id, item.blob, item.caption);
      }
  };

  const pollCommands = useCallback(async () => {
    if (!config.botToken || !isMonitoring) return;
    try {
      const res = await fetch(`https://api.telegram.org/bot${config.botToken}/getUpdates?offset=${offsetRef.current + 1}&timeout=5`);
      const data = await res.json();
      if (data.ok && data.result.length > 0) {
        offsetRef.current = data.result[data.result.length - 1].update_id;
        data.result.forEach(u => {
          const txt = u.message?.text?.toLowerCase();
          if (txt === '/photo') captureAndSave('Remote Trigger');
          if (txt === '/status') sendTelegramMessage(`MORGBY STATUS:\n📂 Storage: ${storageUsed}MB\n📡 Net: ${isOnline ? 'ON' : 'OFF'}`);
        });
      }
    } catch (err) {}
  }, [config, isMonitoring, storageUsed, isOnline]);

  const sendTelegramMessage = async (text) => {
    if (!config.botToken || !config.chatId) return;
    try { fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: config.chatId, text: text }) }); } catch (err) {}
  };

  const captureAndSave = async (reason) => {
    if (!videoRef.current) return;
    const hour = new Date().getHours();
    const useFlash = config.flashEnabled && (config.flashStartHour > config.flashEndHour ? (hour >= config.flashStartHour || hour < config.flashEndHour) : (hour >= config.flashStartHour && hour < config.flashEndHour));
    if (useFlash) { await toggleFlash(true); await new Promise(r => setTimeout(r, 800)); }
    let detected = false;
    if (config.detectPerson && netRef.current) {
        const preds = await netRef.current.detect(videoRef.current);
        detected = preds.some(p => p.class === 'person');
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    const time = formatTime(new Date());
    ctx.font = '24px Arial'; ctx.fillStyle = 'yellow'; ctx.fillText(time + (detected ? ' [PERSON]' : ''), 20, 40);
    canvas.toBlob(async (blob) => {
        const cap = `⏰ ${time}\n📝 Reason: ${reason}\n⚠️ Person: ${detected ? 'YES' : 'No'}`;
        await saveFileToDB(blob, cap, 'photo');
        if (isOnline) processQueue();
    }, 'image/jpeg', 0.7);
    if (useFlash) await toggleFlash(false);
    setLastCaptureTime(new Date());
  };

  const toggleMonitoring = () => {
      if (isMonitoring) { setIsMonitoring(false); stopCamera(); clearInterval(intervalRef.current); clearInterval(pollRef.current); }
      else { startCamera().then(() => { setIsMonitoring(true); captureAndSave('Init'); intervalRef.current = setInterval(() => captureAndSave('Scheduled'), config.intervalMinutes * 60000); pollRef.current = setInterval(pollCommands, 4000); }); }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 relative overflow-hidden font-sans">
        {isBlackout && <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center cursor-pointer" onClick={() => setIsBlackout(false)}><p className="text-[10px] text-slate-900 uppercase">Morgby Active</p></div>}
        <header className="bg-slate-900 p-4 flex justify-between items-center border-b border-slate-800">
            <h1 className="font-bold flex items-center gap-2 tracking-tighter uppercase">
                <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`}></div>
                MORGBY<span className="text-red-500">.</span>OS
            </h1>
            <div className="flex gap-4 items-center">
                <button onClick={() => setIsBlackout(true)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white"><EyeOff size={18} /></button>
                {isOnline ? <Wifi size={18} className="text-green-500" /> : <WifiOff size={18} className="text-red-500" />}
            </div>
        </header>

        <main className="flex-1 p-4 overflow-y-auto max-w-xl mx-auto w-full space-y-4">
            <div className="flex gap-4 text-xs font-bold uppercase tracking-widest border-b border-slate-800 pb-2">
                <button onClick={() => setActiveTab('monitor')} className={activeTab === 'monitor' ? 'text-blue-500 border-b border-blue-500' : 'text-slate-500'}>Monitor</button>
                <button onClick={() => setActiveTab('config')} className={activeTab === 'config' ? 'text-blue-500 border-b border-blue-500' : 'text-slate-500'}>Config</button>
                <button onClick={() => setActiveTab('logs')} className={activeTab === 'logs' ? 'text-blue-500 border-b border-blue-500' : 'text-slate-500'}>Logs</button>
                <button onClick={() => setActiveTab('help')} className={activeTab === 'help' ? 'text-blue-500 border-b border-blue-500' : 'text-slate-500 ml-auto'}>Guide</button>
            </div>

            {activeTab === 'monitor' && (
                <div className="space-y-4 animate-in fade-in">
                    <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 relative">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-60" />
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                    <button onClick={toggleMonitoring} className={`w-full py-4 rounded-xl font-bold transition-all shadow-xl flex items-center justify-center gap-3 ${isMonitoring ? 'bg-red-600' : 'bg-blue-600'}`}>
                        {isMonitoring ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                        {isMonitoring ? 'DEACTIVATE' : 'ARM SYSTEM'}
                    </button>
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800"><span className="text-[10px] font-bold text-slate-500 uppercase">Queue</span><p className="text-xl font-bold">{queue.length}</p></div>
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800"><span className="text-[10px] font-bold text-slate-500 uppercase">AI Status</span><p className={`text-xl font-bold ${isModelLoaded ? 'text-green-500' : 'text-yellow-500'}`}>{isModelLoaded ? 'READY' : 'LOADING'}</p></div>
                    </div>
                </div>
            )}

            {activeTab === 'config' && (
                <div className="space-y-4 animate-in slide-in-from-right">
                    <div className="bg-slate-900 p-4 rounded-xl space-y-3 border border-slate-800">
                        <p className="text-xs font-bold text-slate-500 uppercase">Telegram Setup</p>
                        <input type="password" placeholder="Bot Token" className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-sm outline-none" value={config.botToken} onChange={e => setConfig({...config, botToken: e.target.value})} />
                        <input type="text" placeholder="Chat ID" className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-sm outline-none" value={config.chatId} onChange={e => setConfig({...config, chatId: e.target.value})} />
                    </div>
                    <div className="bg-slate-900 p-4 rounded-xl space-y-3 border border-slate-800">
                        <p className="text-xs font-bold text-slate-500 uppercase">Rules</p>
                        <div className="flex justify-between items-center text-sm"><label>Interval (Mins)</label><input type="number" className="w-16 bg-slate-950 border border-slate-800 p-1 rounded text-right" value={config.intervalMinutes} onChange={e => setConfig({...config, intervalMinutes: parseInt(e.target.value)})} /></div>
                        <div className="flex justify-between items-center text-sm"><label>Person Only</label><input type="checkbox" checked={config.detectPerson} onChange={e => setConfig({...config, detectPerson: e.target.checked})} className="w-5 h-5" /></div>
                        <div className="flex justify-between items-center text-sm"><label>Night Flash</label><input type="checkbox" checked={config.flashEnabled} onChange={e => setConfig({...config, flashEnabled: e.target.checked})} className="w-5 h-5" /></div>
                    </div>
                    <button onClick={clearAllFiles} className="w-full py-2 bg-red-900/20 text-red-500 rounded-lg text-xs font-bold border border-red-900/40">CLEAR LOCAL CACHE</button>
                </div>
            )}

            {activeTab === 'logs' && (
                <div className="bg-slate-900 p-2 rounded-xl h-96 overflow-y-auto font-mono text-[10px] border border-slate-800">
                    {logs.map((l, i) => <div key={i} className={`p-1 border-b border-white/5 ${l.type === 'error' ? 'text-red-400' : 'text-slate-400'}`}>[{l.time}] {l.msg}</div>)}
                    {logs.length === 0 && <p className="text-center text-slate-600 mt-10">No logs yet.</p>}
                </div>
            )}

            {activeTab === 'help' && (
                <div className="space-y-6 animate-in slide-in-from-bottom pb-10">
                    {/* Setup Steps */}
                    <section className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Settings size={14} className="text-blue-500" /> Initial Setup
                        </h4>
                        <div className="space-y-2 text-sm text-slate-300 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                            <ol className="list-decimal list-inside space-y-3">
                                <li>Message <b className="text-blue-400">@BotFather</b> on Telegram to create a bot and get your <b className="text-blue-400">Token</b>.</li>
                                <li>Message <b className="text-blue-400">@userinfobot</b> to find your personal <b className="text-blue-400">Chat ID</b>.</li>
                                <li>Enter these credentials in the <b>Config</b> tab.</li>
                                <li>Tap <b>"ARM SYSTEM"</b> and keep your phone connected to power.</li>
                            </ol>
                        </div>
                    </section>

                    {/* Features List */}
                    <section className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck size={14} className="text-green-500" /> Key Features
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                            <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg flex items-start gap-3">
                                <User size={16} className="text-blue-400 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-slate-200 uppercase tracking-tighter">AI Person Filtering</p>
                                    <p className="text-[11px] text-slate-500 leading-tight">Uses TensorFlow to ignore pets or movement, only capturing when humans are visible.</p>
                                </div>
                            </div>
                            <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg flex items-start gap-3">
                                <Database size={16} className="text-blue-400 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-slate-200 uppercase tracking-tighter">Offline Evidence Cache</p>
                                    <p className="text-[11px] text-slate-500 leading-tight">If internet is cut, captures are saved to a secure internal database and uploaded when connection returns.</p>
                                </div>
                            </div>
                            <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg flex items-start gap-3">
                                <EyeOff size={16} className="text-blue-400 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-slate-200 uppercase tracking-tighter">Stealth Blackout</p>
                                    <p className="text-[11px] text-slate-500 leading-tight">Tap the eye icon to hide the UI. The phone will look "off" while continuing to monitor secretly.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Bot Commands */}
                    <section className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Terminal size={14} className="text-purple-500" /> Bot Commands
                        </h4>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-[11px]">
                                <thead className="bg-slate-800 text-slate-400 uppercase font-bold">
                                    <tr>
                                        <th className="p-2 px-3">Command</th>
                                        <th className="p-2 px-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    <tr>
                                        <td className="p-2 px-3 font-mono text-purple-400 font-bold">/photo</td>
                                        <td className="p-2 px-3 text-slate-300">Take and send a high-res snapshot instantly.</td>
                                    </tr>
                                    <tr>
                                        <td className="p-2 px-3 font-mono text-purple-400 font-bold">/status</td>
                                        <td className="p-2 px-3 text-slate-300">Check connection status and offline storage usage.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="text-[10px] text-slate-600 italic px-2 text-center">Morgby polls for commands every 4 seconds when armed.</p>
                    </section>
                </div>
            )}
        </main>
        <footer className="p-3 bg-slate-900/50 text-center text-[10px] text-slate-600 uppercase tracking-widest border-t border-slate-800">
            {isMonitoring ? 'System Armed' : 'System Standby'} • {storageUsed}MB Cache
        </footer>
    </div>
  );
}
