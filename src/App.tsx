import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Settings, 
  Terminal as TerminalIcon, 
  Download, 
  User, 
  RefreshCw, 
  Play, 
  Square,
  Clock,
  MessageSquare,
  Hash,
  AlertCircle,
  Database,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';

// --- Types ---
interface LogEntry {
  id: string;
  timestamp: string;
  type: 'request' | 'response' | 'error' | 'info';
  method: string;
  url: string;
  status?: number;
  payload: any;
  responseBody?: any;
}

interface IGConfig {
  headers: Record<string, string>;
  baseData: Record<string, any>;
}

// --- Constants (Default from User Script) ---
const DEFAULT_HEADERS = {
  "authority": "www.instagram.com",
  "accept": "*/*",
  "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
  "content-type": "application/x-www-form-urlencoded",
  "origin": "https://www.instagram.com",
  "referer": "https://www.instagram.com/direct/t/17845851594176556/",
  "sec-ch-prefers-color-scheme": "light",
  "sec-ch-ua": '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
  "sec-ch-ua-full-version-list": '"Google Chrome";v="147.0.7727.101", "Not.A/Brand";v="8.0.0.0", "Chromium";v="147.0.7727.101"',
  "sec-ch-ua-mobile": "?1",
  "sec-ch-ua-model": '"SM-A155M"',
  "sec-ch-ua-platform": '"Android"',
  "sec-ch-ua-platform-version": '"16.0.0"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36",
  "x-asbd-id": "359341",
  "x-csrftoken": "evbfFA2Ql2raMA2hNvUqI3DkFEXyx5V1",
  "x-fb-friendly-name": "IGDirectTextSendMutation",
  "x-fb-lsd": "6mDzffl7BCyB_z-SeJqAer",
  "x-ig-app-id": "1217981644879628",
  "x-ig-max-touch-points": "5",
  "cookie": "datr=vozQaZ9FTfSuYSDOh8c3S56v; ig_did=0A7CD33E-D3EC-401D-9761-77259A2493C3; ps_l=1; ps_n=1; dpr=2.206249952316284; mid=adFo6AABAAG5tAitm_wsuvQy4hMH; csrftoken=evbfFA2Ql2raMA2hNvUqI3DkFEXyx5V1; ds_user_id=80209457261; sessionid=80209457261%3AxBOsuFTw8plBk5%3A20%3AAYj9zoUn35eEcrtpWHkTN4lkiml1jjUaMfEb35BVyw; wd=489x920; rur=\"NHA\\05480209457261\\0541808077248:01fed5f06db47e8173b26ea57af8b09fdb4158087385bd8404aca914d8ddbb9446772f8f\""
};

const DEFAULT_BASE_DATA = {
  "av": "17841480197836182",
  "__d": "www",
  "__user": "0",
  "__a": "1",
  "__req": "1p",
  "__hs": "20561.HYP:instagram_web_pkg.2.1...0",
  "dpr": "3",
  "__ccg": "GOOD",
  "__rev": "1037647310",
  "__s": "q1eusu:szsmm3:ygg3ad",
  "__hsi": "7630186531540494450",
  "__dyn": "7xeUjG1mxu1syaxG4Vp41twpUnwgU7SbzEdF8aUco2qwJyEiw9-1DwUx609vCwjE1EEc87m0yE462mcw5Mx62G5UswoEcE7O2l0Fwqo31w9O1lwxwQzXw8W58jwGzEaE2iwNwmE2eUlwhEe88o5i7U1oEbUGdwtUd-2u2J0bS1LyUaUbGwmk0zU8oC1Iwqo5p0OwUQp6x6Ub9UKUnAwCAK6E5y4UrwlE2xyVrx60jyi6oGq2K18whE984O0XE",
  "__csr": "ghR3Y2b7NAr4hIgGNkTi9rOQCB99ismRSDTjBj8V9BWx6WGpaQl5mAHldaHHXLiqGECGpF5UqyuHGEGRaEg-LyECmhkv_UCEJuhFXFbRKLti6Ax15AEGKvAyK4UyLiS9yFWjWyniyQ8x94HGhd6HyqppQt7mUWi8DCG98Fu4tKiQhavmi8KimBHJ9eWiy-48PAXx6qVVC8VpGgxoG8-EGEB4VGGcABype4TGdg5q0PE3lCwu801mW8kz9EO1rIIhCAia0lK19wjV205QwDxm3W2G3O0-eeg13o2Iwm-e5i08Cph2xd1rc2G1fKDxG0_d07vx-Ee85G3uEb4th00Oe5t9HU1eUO0GE0wW0DIgEjgC5JwP2wKnwFwpUqxymE78xosx-2Hw4-w9K1ca0xE4VwYw5SK687O2dx2yB54J2xm78fkjhUZwtKeBu6Ero5O1Uw-w36k18w4Kwoy0zAxW0oKmu58ny-13wLKp0Ig-8w30U1zU0i6y4bXjwloW0ki04Yo-Ey0lW01eUG1Jwm-ESrG0TU2mxi0CU2Hw5Vwt_Cy84czUx2U1RUe8",
  "__comet_req": "7",
  "fb_dtsg": "NAfvlxSvYFvJ2cntUxhD38_AkXIHJPqAh-IbBa0oJ8IRsBnGvkJpGdg:17843708194158284:1776394668",
  "jazoest": "26357",
  "lsd": "6mDzffl7BCyB_z-SeJqAer",
  "__spin_r": "1037647310",
  "__spin_b": "trunk",
  "__spin_t": "1776541241",
  "fb_api_caller_class": "RelayModern",
  "fb_api_req_friendly_name": "IGDirectTextSendMutation",
  "doc_id": "27548200411446444"
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'send' | 'account' | 'logs'>('send');
  const [threadId, setThreadId] = useState('17844148881673262');
  const [message, setMessage] = useState('Teste de funcionamento técnico');
  const [count, setCount] = useState(1);
  const [delay, setDelay] = useState(0.1);
  const [isSending, setIsSending] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<any>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [config, setConfig] = useState<IGConfig>(() => {
    const saved = localStorage.getItem('ig_config');
    return saved ? JSON.parse(saved) : { headers: DEFAULT_HEADERS, baseData: DEFAULT_BASE_DATA };
  });

  const [targetInfo, setTargetInfo] = useState<{ name: string; avatar: string; username?: string } | null>(null);
  const [botInfo, setBotInfo] = useState<{ name: string; avatar: string; username?: string } | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Fetch Bot Info on Mount or Config change
  useEffect(() => {
    const fetchBot = async () => {
      try {
        const res = await axios.post('/api/ig-bot-info', { headers: config.headers });
        setBotInfo({
          name: res.data.full_name || res.data.username,
          avatar: res.data.profile_pic,
          username: res.data.username
        });
      } catch (err) {
        console.error("Bot info fetch failed", err);
      }
    };
    fetchBot();
  }, [config.headers]);

  // Fetch Target Info when threadId changes
  useEffect(() => {
    const fetchTarget = async () => {
      if (!threadId || threadId.length < 3) return; // Don't fetch for very short strings
      try {
        const res = await axios.post('/api/ig-thread-info', { 
          threadId, 
          headers: config.headers,
          baseData: config.baseData 
        });
        setTargetInfo({
          name: res.data.name,
          avatar: res.data.profile_pic,
          username: res.data.username
        });
      } catch (err: any) {
        // Silently handle common 404s during typing
        if (err.response?.status !== 404) {
          console.log("Target info fetch note:", err.message);
        }
        
        // Fallback to placeholder if failed
        setTargetInfo({ 
          name: `Alvo: ${threadId.substring(0, 8)}${threadId.length > 8 ? '...' : ''}`, 
          avatar: `https://picsum.photos/seed/${threadId}/200` 
        });
      }
    };

    const timer = setTimeout(fetchTarget, 1000); // Debounce
    return () => clearTimeout(timer);
  }, [threadId, config]);

  useEffect(() => {
    localStorage.setItem('ig_config', JSON.stringify(config));
  }, [config]);

  // Polling for background tasks
  useEffect(() => {
    let interval: any;
    if (activeTaskId) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(`/api/tasks/${activeTaskId}`);
          setTaskStatus(res.data);
          
          // Sync logs from server task
          if (res.data.logs) {
            const mappedLogs = res.data.logs.map((L: any, i: number) => ({
              id: `server-${activeTaskId}-${i}`,
              timestamp: L.timestamp,
              type: L.type,
              status: L.status,
              payload: L.payload,
              responseBody: L.data || L.message
            }));
            setLogs(mappedLogs);
          }

          if (res.data.status === 'completed' || res.data.status === 'failed' || res.data.status === 'stopped') {
            setIsSending(false);
            setActiveTaskId(null);
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Polling error", err);
          clearInterval(interval);
          setActiveTaskId(null);
          setIsSending(false);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [activeTaskId]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (type: LogEntry['type'], payload: any, responseBody?: any, status?: number) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type,
      method: 'POST',
      url: 'https://www.instagram.com/api/graphql',
      status,
      payload,
      responseBody
    };
    setLogs(prev => [...prev, newLog]);
  };

  const handleSend = async () => {
    if (isSending) return;
    setIsSending(true);
    setLogs([]); // Clear local logs for new task
    
    try {
      const res = await axios.post('/api/tasks/start', {
        threadId,
        message,
        count,
        delay,
        headers: config.headers,
        baseData: config.baseData
      });
      setActiveTaskId(res.data.taskId);
    } catch (error: any) {
      addLog('error', { error: error.message });
      setIsSending(false);
    }
  };

  const handleStop = async () => {
    if (!activeTaskId) return;
    try {
      await axios.post(`/api/tasks/${activeTaskId}/stop`);
      setActiveTaskId(null);
      setIsSending(false);
    } catch (err) {
      console.error("Stop error", err);
    }
  };

  const downloadLogs = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ig_logs_${Date.now()}.json`;
    a.click();
  };

  const clearLogs = () => setLogs([]);

  return (
    <div className="min-h-screen bg-bg text-text-primary font-sans selection:bg-accent selection:text-white flex flex-col lg:flex-row">
      {/* Sidebar Navigation - Desktop */}
      <aside className="hidden lg:flex w-60 bg-card-bg border-r border-border flex-col py-6 px-4 z-50 shrink-0">
        <div className="flex items-center gap-2 mb-10 px-2">
          <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center text-accent">
            <Send className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">IG DIRECT PRO</span>
        </div>
        
        <nav className="flex flex-col gap-1">
          <NavItem label="Painel de Envio" icon={<Send size={18}/>} active={activeTab === 'send'} onClick={() => setActiveTab('send')} />
          <NavItem label="Configurar Conta" icon={<Settings size={18}/>} active={activeTab === 'account'} onClick={() => setActiveTab('account')} />
          <NavItem label="Histórico & Logs" icon={<TerminalIcon size={18}/>} active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
        </nav>

        <div className="mt-auto pt-6 border-t border-border px-2">
          <button 
            onClick={downloadLogs}
            className="flex items-center gap-3 w-full text-text-secondary hover:text-white transition-colors"
          >
            <Download size={18} />
            <span className="text-sm font-medium">Baixar JSON</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card-bg border-t border-border flex items-center justify-around py-3 px-6 z-50 pb-safe">
        <MobileNavItem icon={<Send size={20}/>} label="Envio" active={activeTab === 'send'} onClick={() => setActiveTab('send')} />
        <MobileNavItem icon={<Settings size={20}/>} label="Conta" active={activeTab === 'account'} onClick={() => setActiveTab('account')} />
        <MobileNavItem icon={<TerminalIcon size={20}/>} label="Logs" active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden pb-16 lg:pb-0">
        {/* Top Header */}
        <header className="h-16 lg:h-20 flex items-center justify-between px-4 lg:px-8 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
             <div className="lg:hidden w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center text-accent">
                <Send className="w-4 h-4" />
              </div>
            <div>
              <h2 className="text-base lg:text-xl font-bold text-white tracking-tight">Painel de Automação</h2>
              <div className="text-[10px] lg:text-[11px] text-success flex items-center gap-1.5 mt-0.5 font-medium">
                <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                <span className="hidden sm:inline">SESSÃO ATIVA:</span> 80209457261
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-white">{botInfo?.name || 'Administrador'}</div>
              <div className="text-[11px] text-text-secondary">{botInfo?.username ? `@${botInfo.username}` : 'Premium'}</div>
            </div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] p-[2px]">
              <div className="w-full h-full rounded-full bg-card-bg flex items-center justify-center overflow-hidden border border-border">
                {botInfo?.avatar ? (
                  <img src={botInfo.avatar} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <User size={16} className="text-text-secondary lg:hidden" />
                    <User size={20} className="text-text-secondary hidden lg:block" />
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'send' && (
              <motion.section 
                key="send"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 lg:gap-8"
              >
                {/* Configuration Card */}
                <div className="bg-card-bg border border-border rounded-xl p-6 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Parâmetros de Envio</h3>
                    <p className="text-sm text-text-secondary">Configure os detalhes da mensagem e alvos.</p>
                  </div>

                  <div className="space-y-5">
                    <InputField 
                      label="Link ou ID do Direct" 
                      icon={<Hash size={14}/>}
                      value={threadId}
                      onChange={setThreadId}
                      placeholder="Ex: 17844148881673262"
                    />
                    
                      <div className="grid grid-cols-2 gap-4">
                      <InputField 
                        label="Quantidade" 
                        type="number"
                        icon={<RefreshCw size={14}/>}
                        value={isNaN(count) ? '' : count}
                        onChange={(v: string) => setCount(parseInt(v) || 0)}
                        min={1}
                      />
                      <InputField 
                        label="Delay (Segundos)" 
                        type="number"
                        step="0.1"
                        icon={<Clock size={14}/>}
                        value={isNaN(delay) ? '' : delay}
                        onChange={(v: string) => setDelay(parseFloat(v) || 0)}
                        min={0.1}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                         Mensagem Personalizada
                      </label>
                      <textarea 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full bg-bg border border-border rounded-lg p-4 text-sm text-white focus:border-accent outline-none transition-all h-32 resize-none"
                        placeholder="Digite sua mensagem de teste..."
                      />
                    </div>

                    <button 
                      onClick={isSending ? handleStop : handleSend}
                      className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg active:scale-[0.98] ${
                        isSending 
                        ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' 
                        : 'bg-accent text-white hover:bg-accent/90 shadow-accent/20'
                      }`}
                    >
                      {isSending ? (
                        <><Square size={20} fill="currentColor" /> PARAR PROCESSO</>
                      ) : (
                        <><Play size={20} fill="currentColor" /> INICIAR ENVIO EM MASSA</>
                      )}
                    </button>

                    {isSending && taskStatus && (
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between text-[10px] font-bold text-text-secondary uppercase">
                          <span>Progresso do Servidor</span>
                          <span>{taskStatus.progress || 0}%</span>
                        </div>
                        <div className="h-1.5 bg-bg border border-border rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${taskStatus.progress || 0}%` }}
                            className="h-full bg-accent shadow-[0_0_10px_rgba(58,134,255,0.4)]"
                          />
                        </div>
                        <p className="text-[10px] text-center text-accent animate-pulse font-medium">Rodando em Segundo Plano no Servidor</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Target Preview & Status */}
                <div className="space-y-6">
                  <div className="bg-card-bg border border-border rounded-xl p-8 flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <img 
                        src={targetInfo?.avatar || "https://picsum.photos/seed/user/200"} 
                        alt="" 
                        className="w-24 h-24 rounded-full border-2 border-accent p-1 object-cover" 
                        referrerPolicy="no-referrer" 
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success border-4 border-card-bg rounded-full" />
                    </div>
                    <h3 className="text-white font-bold mb-1">{targetInfo?.name || "Detectando Alvo..." }</h3>
                    <p className="text-accent text-sm font-semibold mb-4">
                      {targetInfo?.username ? `@${targetInfo.username}` : `ID: ${threadId.substring(0, 10)}...`}
                    </p>
                    <p className="text-xs text-text-secondary leading-relaxed max-w-[200px]">
                      Verificando permissões de thread para ID {threadId.substring(0, 10)}... Próximo envio disponível.
                    </p>
                  </div>

                  {/* Micro-Terminal Wrapper */}
                  <div className="bg-terminal-bg border border-border rounded-xl overflow-hidden flex flex-col">
                    <div className="bg-[#1a1a1e] px-4 py-2 border-b border-border flex justify-between items-center shrink-0">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-text-secondary">Terminal Log</span>
                      <button onClick={downloadLogs} className="text-[10px] text-accent hover:underline font-bold">DOWN JSON</button>
                    </div>
                    <div className="p-4 h-[160px] overflow-y-auto custom-scrollbar font-mono text-[11px] space-y-2">
                      {logs.slice(-10).reverse().map(log => (
                        <div key={log.id} className={`${log.type === 'error' ? 'text-red-500' : 'text-success'} opacity-90`}>
                          [{log.timestamp}] {JSON.stringify(log.type === 'request' ? { status: 'sending', thread: threadId.substring(0, 5) + '...' } : log.responseBody || { status: 'success' })}
                        </div>
                      ))}
                      {logs.length === 0 && <div className="text-text-secondary opacity-40 italic">Aguardando gatilho de API...</div>}
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {activeTab === 'account' && (
              <motion.section 
                key="account"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="max-w-4xl"
              >
                <div className="bg-card-bg border border-border rounded-xl p-4 lg:p-8 shadow-sm">
                  <header className="mb-6 lg:mb-8">
                    <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">Configuração da Conta</h2>
                    <p className="text-xs lg:text-sm text-text-secondary mt-1">Gerencie os cabeçalhos das requisições e payload principal.</p>
                  </header>

                  <div className="space-y-6 lg:space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] block">HTTP Headers (JSON)</label>
                      <textarea 
                        value={JSON.stringify(config.headers, null, 2)}
                        onChange={(e) => {
                          try {
                            const val = JSON.parse(e.target.value);
                            setConfig(prev => ({ ...prev, headers: val }));
                          } catch {}
                        }}
                        className="w-full bg-bg border border-border rounded-lg p-4 lg:p-5 text-[11px] lg:text-[12px] font-mono text-success outline-none focus:border-accent h-48 lg:h-72 custom-scrollbar resize-none"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] block">GraphQL Base Data (JSON)</label>
                      <textarea 
                        value={JSON.stringify(config.baseData, null, 2)}
                        onChange={(e) => {
                          try {
                            const val = JSON.parse(e.target.value);
                            setConfig(prev => ({ ...prev, baseData: val }));
                          } catch {}
                        }}
                        className="w-full bg-bg border border-border rounded-lg p-4 lg:p-5 text-[11px] lg:text-[12px] font-mono text-blue-400 outline-none focus:border-accent h-48 lg:h-72 custom-scrollbar resize-none"
                      />
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-border mt-10">
                      <span className="text-xs text-text-secondary italic">Última atualização: {new Date().toLocaleDateString()}</span>
                      <button 
                        onClick={() => setConfig({ headers: DEFAULT_HEADERS, baseData: DEFAULT_BASE_DATA })}
                        className="text-accent hover:opacity-80 transition-opacity font-bold text-xs uppercase tracking-widest flex items-center gap-2"
                      >
                        <RefreshCw size={14}/> Restaurar Padrões
                      </button>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {activeTab === 'logs' && (
              <motion.section 
                key="logs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col"
              >
                <div className="flex justify-between items-center shadow-lg bg-card-bg p-4 border border-border rounded-t-xl shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/10 rounded-lg text-accent">
                      <TerminalIcon size={18}/>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white tracking-tight">Logs do Sistema</h2>
                      <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest">Resposta JSON Kompleta</p>
                    </div>
                  </div>
                  <div className="flex gap-2 lg:gap-3">
                    <button 
                      onClick={clearLogs}
                      className="p-2 lg:p-2.5 rounded-lg border border-border text-text-secondary hover:text-red-500 hover:bg-red-500/5 transition-all"
                    >
                      <Trash2 size={16} className="lg:hidden" />
                      <Trash2 size={18} className="hidden lg:block" />
                    </button>
                    <button 
                      onClick={downloadLogs}
                      className="bg-accent text-white px-3 lg:px-5 py-2 lg:py-2.5 rounded-lg text-[10px] lg:text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-accent/20"
                    >
                      <Download size={14} /> <span className="hidden sm:inline">EXPORTAR JSON</span><span className="sm:hidden">EXPORT</span>
                    </button>
                  </div>
                </div>

                <div 
                  ref={terminalRef}
                  className="flex-1 bg-terminal-bg border-x border-b border-border rounded-b-xl p-6 font-mono text-[12px] overflow-y-auto custom-scrollbar"
                >
                  {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-text-secondary/20 gap-4">
                      <TerminalIcon size={64} />
                      <p className="font-sans text-sm font-medium">Nenhum rastro detectado...</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {logs.map(log => (
                        <div key={log.id} className="relative pl-6 border-l border-border/50 group">
                          <div className={`absolute left-0 top-0 -ml-[5px] w-2.5 h-2.5 rounded-full border-2 border-bg ${
                            log.type === 'request' ? 'bg-accent' :
                            log.type === 'response' ? 'bg-success' :
                            log.type === 'error' ? 'bg-red-500' :
                            'bg-zinc-500'
                          }`} />
                          
                          <div className="flex items-center gap-3 mb-2">
                             <span className="text-[11px] font-bold text-text-secondary/50">{log.timestamp}</span>
                             <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${
                               log.type === 'request' ? 'bg-accent/10 text-accent' :
                               log.type === 'response' ? 'bg-success/10 text-success' :
                               log.type === 'error' ? 'bg-red-500/10 text-red-500' :
                               'bg-zinc-500/10 text-zinc-400'
                             }`}>
                               {log.type}
                             </span>
                             {log.status && (
                               <span className={`text-[10px] font-bold ${log.status >= 400 ? 'text-red-500' : 'text-success'}`}>
                                 HTTP {log.status}
                               </span>
                             )}
                          </div>
                          <div className="p-4 bg-bg border border-border/50 rounded-lg group-hover:border-border transition-colors">
                            <pre className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                              {JSON.stringify(log.type === 'request' ? log.payload : log.responseBody, null, 2)}
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2d2d33;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3a86ff;
        }
      `}</style>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all group w-full text-left ${
        active 
        ? 'text-accent bg-accent/10 font-bold shadow-sm' 
        : 'text-text-secondary hover:text-white hover:bg-border/50'
      }`}
    >
      <div className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:translate-x-0.5'}`}>
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-line"
          className="absolute right-0 w-1 h-5 bg-accent rounded-l-full shadow-[0_0_10px_rgba(58,134,255,0.5)]"
        />
      )}
    </button>
  );
}

function MobileNavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${
        active ? 'text-accent' : 'text-text-secondary'
      }`}
    >
      <div className="relative">
        {icon}
        {active && (
          <motion.div 
            layoutId="mobile-nav-dot"
            className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-accent rounded-full"
          />
        )}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function InputField({ label, icon, value, onChange, placeholder, type = 'text', ...props }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
        {label}
      </label>
      <div className="relative flex items-center group">
        <div className="absolute left-3.5 text-text-secondary pointer-events-none group-focus-within:text-accent transition-colors">
          {icon}
        </div>
        <input 
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-bg border border-border rounded-lg pl-10 pr-4 py-3 lg:py-2.5 text-sm text-white focus:border-accent outline-none transition-all placeholder:text-text-secondary/30"
          placeholder={placeholder}
          {...props}
        />
      </div>
    </div>
  );
}

