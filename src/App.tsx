import React, { useState, useEffect, useRef } from "react";
import { UserProfile, StrategicAnalysis, SituationType } from "./types";
import Header from "./components/Header";
import EvolutionProfile from "./components/EvolutionProfile";
import ScenarioHistory from "./components/ScenarioHistory";
import PhilosopherQuotes from "./components/PhilosopherQuotes";
import InteractiveChat from "./components/InteractiveChat";
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Brain, 
  Sparkles, 
  MessageSquare, 
  AlertTriangle, 
  HelpCircle,
  Lightbulb,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  FileText,
  BookOpen,
  Award,
  TrendingUp,
  ChevronDown,
  Menu,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const INITIAL_PROFILE: UserProfile = {
  nivel: 1,
  progressToNextLevel: 10,
  racionalidade: 35,
  impulsividade: 75,
  comunicacaoStyle: "Reativo",
  padrõesErro: ["Reagir sob influência da emoção inicial"],
  pontosFortes: ["Desejo consciente de evolução tática"]
};

const CLASSIFICATION_INFOS = [
  { value: "auto", label: "Auto-detectar", desc: "Permite ao mentor discernir a dinâmica do cenário." },
  { value: "conflito", label: "Conflito", desc: "Duelos diretos, oposição, ataques à reputação ou sabotagem." },
  { value: "decisao", label: "Decisão Crítica", desc: "Bifurcações de carreira, negócios ou encruzilhadas pessoais." },
  { value: "oportunidade", label: "Oportunidade", desc: "Cenários de vantagem, vácuos de liderança ou fraqueza alheia." },
  { value: "pressao", label: "Pressão Social", desc: "Adulação, intimidação passiva ou manipulação em grupo." },
  { value: "negociacao", label: "Negociação", desc: "Troca de concessões, barganhas e alianças de conveniência." },
  { value: "risco_emocional", label: "Risco Emocional", desc: "Gatilhos internos de ira, orgulho ou pressa." }
];

export default function App() {
  // --- Active Tab Navigation ---
  const [activeTab, setActiveTab] = useState<"chat" | "analise" | "historico" | "perfil" | "filosofia">("chat");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- Persistent States ---
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("mentor_profile");
    return saved ? JSON.parse(saved) : INITIAL_PROFILE;
  });

  const [history, setHistory] = useState<StrategicAnalysis[]>(() => {
    const saved = localStorage.getItem("mentor_history");
    return saved ? JSON.parse(saved) : [];
  });

  // --- Structured Analysis UI & Input States ---
  const [scenario, setScenario] = useState("");
  const [classification, setClassification] = useState<SituationType | "auto">("auto");
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  
  // --- Audio States ---
  const [recording, setRecording] = useState(false);
  const [speechActive, setSpeechActive] = useState(false);

  // --- Refs for Speech APIs ---
  const recognitionRef = useRef<any>(null);
  const speechUttRef = useRef<SpeechSynthesisUtterance | null>(null);

  // --- Synchronize LocalStorage ---
  useEffect(() => {
    localStorage.setItem("mentor_profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("mentor_history", JSON.stringify(history));
  }, [history]);

  // --- Speech Synthesis Setup ---
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel(); // Reset standard speech synth
    }
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // --- Speech Recognition (Speech-to-Text) Setup ---
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = "pt-BR";
      rec.continuous = false;
      rec.interimResults = false;

      rec.onstart = () => {
        setRecording(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setScenario(prev => {
          const spacing = prev.trim() ? " " : "";
          return prev + spacing + transcript;
        });
      };

      rec.onerror = (event: any) => {
        console.error("Erro no reconhecimento de voz:", event.error);
        setRecording(false);
      };

      rec.onend = () => {
        setRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // --- Trigger Speech Output (TTS) ---
  const speakText = (text: string, id: string | null = null) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // Stop any current audio

    if (!voiceEnabled) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    
    // Attempt to select a solid Portuguese voice
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.startsWith("pt-BR") || v.lang.startsWith("pt"));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }
    
    // Tactical authoritative mentor pacing: slightly slower and steady
    utterance.rate = 0.94;
    utterance.pitch = 0.95;

    utterance.onstart = () => {
      setSpeechActive(true);
      if (id) setActivePlayingId(id);
    };

    utterance.onend = () => {
      setSpeechActive(false);
      setActivePlayingId(null);
    };

    utterance.onerror = () => {
      setSpeechActive(false);
      setActivePlayingId(null);
    };

    speechUttRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeechActive(false);
    setActivePlayingId(null);
  };

  // --- Toggle Microphone (Speech to Text) ---
  const handleToggleRecord = () => {
    if (!recognitionRef.current) {
      alert("O seu navegador não suporta o Reconhecimento de Voz nativo. Por favor, digite o cenário manualmente.");
      return;
    }

    if (recording) {
      recognitionRef.current.stop();
    } else {
      stopSpeaking();
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // --- Handle Reset Data ---
  const handleResetData = () => {
    stopSpeaking();
    setProfile(INITIAL_PROFILE);
    setHistory([]);
    setScenario("");
    localStorage.removeItem("mentor_profile");
    localStorage.removeItem("mentor_history");
    localStorage.removeItem("mentor_chat_messages");
    // Reload to guarantee full state refresh
    window.location.reload();
  };

  // --- Handle Custom Imported State ---
  const handleImportData = (newProfile: UserProfile, newHistory: StrategicAnalysis[]) => {
    stopSpeaking();
    setProfile(newProfile);
    setHistory(newHistory);
    setScenario("");
  };

  // --- Handle Submit Scenario and Request Mentorship ---
  const handleSubmitScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenario.trim() || loading) return;

    stopSpeaking();
    setLoading(true);

    try {
      const summaries = history.slice(0, 5).map(item => ({
        scenario: item.scenario.substring(0, 100) + "...",
        classification: item.classification,
        racionalidade: item.profileAfter.racionalidade,
        impulsividade: item.profileAfter.impulsividade,
        level: item.profileAfter.nivel
      }));

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: scenario,
          classification: classification === "auto" ? undefined : classification,
          profile: profile,
          history: summaries
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Houve uma falha interna ao analisar a situação.");
      }

      const result = await response.json();

      const newAnalysis: StrategicAnalysis = {
        id: Math.random().toString(36).substring(2, 11),
        timestamp: new Date().toISOString(),
        scenario: scenario,
        classification: (classification === "auto" ? (result.profileUpdates?.comunicacaoStyle?.toLowerCase() || "conflito") : classification) as SituationType,
        leituraCenario: result.leituraCenario,
        padraoEstrategico: result.padraoEstrategico,
        leituraEvolutiva: result.leituraEvolutiva,
        direcaoAcao: result.direcaoAcao || [],
        erroCritico: result.erroCritico,
        voiceScript: result.voiceScript,
        profileAfter: result.profileUpdates
      };

      setHistory(prev => [newAnalysis, ...prev]);
      setProfile(result.profileUpdates);
      setScenario("");

      if (voiceEnabled) {
        setTimeout(() => {
          speakText(result.voiceScript, newAnalysis.id);
        }, 600);
      }

    } catch (err: any) {
      console.error(err);
      alert(err.message || "Erro de conexão ao servidor de mentor.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualFillExample = (exampleText: string, exampleClass: "conflito" | "decisao" | "oportunidade" | "pressao" | "negociacao" | "risco_emocional") => {
    setScenario(exampleText);
    setClassification(exampleClass);
    stopSpeaking();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-emerald-500/30 selection:text-emerald-100 relative overflow-x-hidden">
      {/* Executive Command Header */}
      <Header 
        onReset={handleResetData}
        onImport={handleImportData}
        profile={profile}
        history={history}
      />

      {/* Mobile Floating Bar for Lateral Menu Trigger */}
      <div className="lg:hidden bg-slate-900/80 border-b border-slate-800/80 px-4 py-3 sticky top-0 z-30 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
            {activeTab === "chat" && "Bate-Papo"}
            {activeTab === "analise" && "Mapeamento"}
            {activeTab === "historico" && "Registros"}
            {activeTab === "perfil" && "Perfil Evolutivo"}
            {activeTab === "filosofia" && "Manual Filosófico"}
          </span>
        </div>
        
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700/60 rounded-lg text-xs font-mono text-slate-300 transition"
        >
          <Menu className="w-4 h-4 text-emerald-400" />
          <span>Menu</span>
        </button>
      </div>

      {/* Slide-out Mobile Sidebar Drawer (AnimatePresence) */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 lg:hidden"
            />

            {/* Slide-in Menu Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              className="fixed top-0 bottom-0 left-0 w-[290px] bg-slate-950 border-r border-slate-800/80 p-5 z-50 flex flex-col gap-6 lg:hidden"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">Menu Lateral</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-850"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer HUD Metrics */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono text-xs font-bold">
                    N{profile.nivel}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Mapeador</span>
                    <span className="text-[11px] font-sans text-white font-bold block truncate">
                      Estilo: <span className="text-emerald-400">{profile.comunicacaoStyle}</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] font-mono text-slate-500">
                    <span>Progresso</span>
                    <span>{profile.progressToNextLevel}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden border border-slate-850">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-1"
                      style={{ width: `${profile.progressToNextLevel}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-900/60 text-center">
                  <div>
                    <span className="text-[7px] font-mono text-slate-500 uppercase">Racio</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 block">{profile.racionalidade}%</span>
                  </div>
                  <div>
                    <span className="text-[7px] font-mono text-slate-500 uppercase">Impul</span>
                    <span className="text-[10px] font-mono font-bold text-amber-500 block">{profile.impulsividade}%</span>
                  </div>
                </div>
              </div>

              {/* Drawer Menu Items */}
              <div className="flex flex-col gap-1.5 overflow-y-auto pr-1">
                {/* Chat Tab */}
                <button
                  onClick={() => { stopSpeaking(); setActiveTab("chat"); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition duration-200 border ${
                    activeTab === "chat"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-medium"
                      : "bg-transparent border-transparent hover:bg-slate-900/50 hover:text-white text-slate-400"
                  }`}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs block font-bold">Bate-Papo</span>
                    <span className="text-[9px] font-mono text-slate-500 block truncate">Conselhos, fotos & documentos</span>
                  </div>
                </button>

                {/* Analysis Tab */}
                <button
                  onClick={() => { stopSpeaking(); setActiveTab("analise"); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition duration-200 border ${
                    activeTab === "analise"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-medium"
                      : "bg-transparent border-transparent hover:bg-slate-900/50 hover:text-white text-slate-400"
                  }`}
                >
                  <Sparkles className="w-4 h-4 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs block font-bold">Nova Análise</span>
                    <span className="text-[9px] font-mono text-slate-500 block truncate">Cenários táticos estruturados</span>
                  </div>
                </button>

                {/* Saved logs Tab */}
                <button
                  onClick={() => { stopSpeaking(); setActiveTab("historico"); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition duration-200 border ${
                    activeTab === "historico"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-medium"
                      : "bg-transparent border-transparent hover:bg-slate-900/50 hover:text-white text-slate-400"
                  }`}
                >
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs block font-bold">Registros Salvos</span>
                    <span className="text-[9px] font-mono text-slate-500 block truncate">Conselhos salvos ({history.length})</span>
                  </div>
                </button>

                {/* Profile Tab */}
                <button
                  onClick={() => { stopSpeaking(); setActiveTab("perfil"); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition duration-200 border ${
                    activeTab === "perfil"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-medium"
                      : "bg-transparent border-transparent hover:bg-slate-900/50 hover:text-white text-slate-400"
                  }`}
                >
                  <UserCheck className="w-4 h-4 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs block font-bold">Perfil Evolutivo</span>
                    <span className="text-[9px] font-mono text-slate-500 block truncate">Métricas e gráficos</span>
                  </div>
                </button>

                {/* Philosophy Tab */}
                <button
                  onClick={() => { stopSpeaking(); setActiveTab("filosofia"); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition duration-200 border ${
                    activeTab === "filosofia"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-medium"
                      : "bg-transparent border-transparent hover:bg-slate-900/50 hover:text-white text-slate-400"
                  }`}
                >
                  <BookOpen className="w-4 h-4 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs block font-bold">Manual de Filosofia</span>
                    <span className="text-[9px] font-mono text-slate-500 block truncate">Máximas estratégicas</span>
                  </div>
                </button>
              </div>

              {/* Drawer Footer info */}
              <div className="mt-auto border-t border-slate-900 pt-3 text-center">
                <span className="text-[9px] font-mono text-slate-600 block">Mentor Estratégico v1.5</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Responsive Grid Container with Sidebar Navigation */}
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Desktop Persistent Sidebar Navigation & HUD Metrics (3 cols on desktop) */}
        <aside className="hidden lg:flex lg:col-span-3 flex-col gap-5 bg-slate-900/30 p-4 rounded-xl border border-slate-900/80 sticky top-24 z-25 shadow-lg">
          
          {/* Real-time Mini User HUD */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3.5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono text-sm font-bold">
                N{profile.nivel}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Mapeador Tático</span>
                <span className="text-xs font-sans text-white font-bold block truncate">
                  Estilo: <span className="text-emerald-400">{profile.comunicacaoStyle}</span>
                </span>
              </div>
            </div>

            {/* Level progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>Nível {profile.nivel}</span>
                <span>Progresso: {profile.progressToNextLevel}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-1.5 transition-all duration-500"
                  style={{ width: `${profile.progressToNextLevel}%` }}
                />
              </div>
            </div>

            {/* Micro stats indicators */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-900/80">
              <div className="space-y-0.5">
                <span className="text-[8px] font-mono text-slate-500 uppercase">Racionalidade</span>
                <span className="text-xs font-mono font-bold text-emerald-400 block">{profile.racionalidade}%</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[8px] font-mono text-slate-500 uppercase">Impulsividade</span>
                <span className="text-xs font-mono font-bold text-amber-500 block">{profile.impulsividade}%</span>
              </div>
            </div>
          </div>

          {/* Vertical Sidebar Tabs switcher */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-wider px-2 mb-1 block">
              Menu de Ação
            </span>

            {/* Tab: Bate-Papo */}
            <button
              onClick={() => { stopSpeaking(); setActiveTab("chat"); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition duration-200 border ${
                activeTab === "chat"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-medium"
                  : "bg-transparent border-transparent hover:bg-slate-900/50 hover:text-white text-slate-400"
              }`}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-xs block font-bold">Bate-Papo</span>
                <span className="text-[9px] font-mono text-slate-500 group-hover:text-slate-400 block truncate">Conversa tática, áudio & arquivos</span>
              </div>
            </button>

            {/* Tab: Nova Análise */}
            <button
              onClick={() => { stopSpeaking(); setActiveTab("analise"); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition duration-200 border ${
                activeTab === "analise"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-medium"
                  : "bg-transparent border-transparent hover:bg-slate-900/50 hover:text-white text-slate-400"
              }`}
            >
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-xs block font-bold">Nova Análise</span>
                <span className="text-[9px] font-mono text-slate-500 block truncate">Mapear cenários estruturados</span>
              </div>
            </button>

            {/* Tab: Histórico */}
            <button
              onClick={() => { stopSpeaking(); setActiveTab("historico"); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition duration-200 border ${
                activeTab === "historico"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-medium"
                  : "bg-transparent border-transparent hover:bg-slate-900/50 hover:text-white text-slate-400"
              }`}
            >
              <FileText className="w-4 h-4 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-xs block font-bold">Registros Salvos</span>
                <span className="text-[9px] font-mono text-slate-500 block truncate">Conselhos e históricos de poder ({history.length})</span>
              </div>
            </button>

            {/* Tab: Perfil Evolutivo */}
            <button
              onClick={() => { stopSpeaking(); setActiveTab("perfil"); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition duration-200 border ${
                activeTab === "perfil"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-medium"
                  : "bg-transparent border-transparent hover:bg-slate-900/50 hover:text-white text-slate-400"
              }`}
            >
              <UserCheck className="w-4 h-4 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-xs block font-bold">Perfil Evolutivo</span>
                <span className="text-[9px] font-mono text-slate-500 block truncate">Métricas, gráficos e tendências</span>
              </div>
            </button>

            {/* Tab: Filosofia */}
            <button
              onClick={() => { stopSpeaking(); setActiveTab("filosofia"); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition duration-200 border ${
                activeTab === "filosofia"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-medium"
                  : "bg-transparent border-transparent hover:bg-slate-900/50 hover:text-white text-slate-400"
              }`}
            >
              <BookOpen className="w-4 h-4 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-xs block font-bold">Manual de Filosofia</span>
                <span className="text-[9px] font-mono text-slate-500 block truncate">Baltasar, Maquiavel, Greene e Sun Tzu</span>
              </div>
            </button>
          </div>
        </aside>

        {/* Right Side: Main workspace display (9 cols on desktop) */}
        <section className="col-span-1 lg:col-span-9 w-full min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              {/* TAB: BATE-PAPO (CHAT DIRECTO) */}
              {activeTab === "chat" && (
                <InteractiveChat 
                  profile={profile} 
                  onUpdateProfile={(p) => setProfile(p)}
                />
              )}

              {/* TAB: NOVA ANÁLISE DE CENÁRIO */}
              {activeTab === "analise" && (
                <div className="space-y-6">
                  {/* Executive Scenario Input Panel */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                        <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                          Mapeamento Estruturado de Cenários
                        </h2>
                      </div>

                      {/* Autoplay voice checkbox toggle */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setVoiceEnabled(!voiceEnabled)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono border transition ${
                            voiceEnabled 
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                              : "bg-slate-900 border-slate-800 text-slate-500"
                          }`}
                          title={voiceEnabled ? "Leitura automática de voz ativada" : "Leitura por voz mutada"}
                        >
                          {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                          <span>Voz: {voiceEnabled ? "Ativa" : "Muda"}</span>
                        </button>
                      </div>
                    </div>

                    <form onSubmit={handleSubmitScenario} className="space-y-4">
                      {/* Text Area Input with integrated floating Mic & Waveform */}
                      <div className="relative bg-slate-900/40 border border-slate-800 rounded-lg focus-within:border-emerald-500 transition-colors overflow-hidden">
                        <textarea
                          value={scenario}
                          onChange={(e) => setScenario(e.target.value)}
                          placeholder="Relate aqui em detalhe uma situação real recente: conflito no trabalho, decisão crítica pendente, pressão social, negociação de alto valor ou algum comportamento reativo do qual se arrependeu..."
                          className="w-full min-h-[120px] max-h-[250px] p-4 text-sm bg-transparent outline-none border-none text-slate-200 placeholder-slate-500 resize-y leading-relaxed font-sans"
                          disabled={loading}
                        />

                        {/* Animated Voice/Waveform feedback */}
                        {(recording || speechActive) && (
                          <div className="absolute top-4 right-4 flex items-center gap-1 bg-slate-950/80 border border-slate-800 px-2 py-1 rounded-full backdrop-blur-md">
                            <span className="text-[9px] font-mono tracking-wider text-slate-400 uppercase animate-pulse">
                              {recording ? "Escutando..." : "Orientando..."}
                            </span>
                            <div className="flex items-center gap-0.5 h-2.5">
                              <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                              <span className="w-0.5 h-3 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                              <span className="w-0.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                              <span className="w-0.5 h-3 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                            </div>
                          </div>
                        )}

                        {/* Floating Microfone controls */}
                        <div className="absolute bottom-3 right-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleToggleRecord}
                            className={`p-2 rounded-full border transition ${
                              recording 
                                ? "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse" 
                                : "bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white border-slate-800"
                            }`}
                            title={recording ? "Parar de falar" : "Relatar por Voz (Speech-to-Text)"}
                            disabled={loading}
                          >
                            {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Select Category classification row */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                          Classificação Estratégica do Cenário:
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {CLASSIFICATION_INFOS.map((info) => (
                            <button
                              key={info.value}
                              type="button"
                              onClick={() => setClassification(info.value as any)}
                              className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition text-left flex flex-col justify-between ${
                                classification === info.value
                                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                                  : "bg-slate-900/30 border-slate-900 text-slate-400 hover:border-slate-800 hover:text-slate-300"
                              }`}
                              title={info.desc}
                            >
                              <span className="font-bold">{info.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Submit & Control Buttons */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                        <span className="text-[10px] font-mono text-slate-500 text-center sm:text-left leading-normal">
                          Gere uma análise dividida em 5 pilares com recomendações passo a passo.
                        </span>

                        <button
                          type="submit"
                          disabled={loading || !scenario.trim()}
                          className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold font-sans rounded-lg shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
                        >
                          {loading ? (
                            <>
                              <Brain className="w-4 h-4 animate-spin" />
                              <span>Processando Vetores...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Mapear Cenário</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>

                    {/* Quick Demonstration Prompts */}
                    {history.length === 0 && (
                      <div className="border-t border-slate-900 pt-3 space-y-2">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">
                          Ou experimente cenários de testes sugeridos:
                        </span>
                        <div className="grid sm:grid-cols-2 gap-2 text-xs font-mono">
                          <button
                            onClick={() => handleManualFillExample(
                              "Um colega no trabalho repete piadinhas irônicas na reunião para desestabilizar minha liderança de equipe técnica. Tive vontade de mandar ele calar a boca na hora, mas respirei fundo e ignorei, o que me fez parecer fraco.",
                              "conflito"
                            )}
                            className="p-2.5 rounded border border-slate-900 hover:border-slate-800 bg-slate-900/10 hover:bg-slate-900/30 text-left text-slate-400 hover:text-slate-300 transition"
                          >
                            💡 <strong className="text-slate-300">Conflito corporativo:</strong> Ironia de rivais...
                          </button>
                          <button
                            onClick={() => handleManualFillExample(
                              "Um concorrente do setor propôs uma fusão rápida de operações. Ele elogia muito meu trabalho e oferece cargo alto, mas exige que a marca principal seja a dele. Sinto que estou prestes a ser engolido por pura pressa e ego.",
                              "negociacao"
                            )}
                            className="p-2.5 rounded border border-slate-900 hover:border-slate-800 bg-slate-900/10 hover:bg-slate-900/30 text-left text-slate-400 hover:text-slate-300 transition"
                          >
                            🤝 <strong className="text-slate-300">Negociação perigosa:</strong> Fusão acelerada...
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Active / Current Analysis Highlight (If latest advice exists) */}
                  {history.length > 0 && !loading && (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4 border-l-4 border-l-emerald-500">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-5 h-5 text-emerald-400" />
                          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                            Orientação Estratégica Recente
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(history[0].timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      <div className="space-y-4 text-xs leading-relaxed font-sans">
                        {/* Scenario summary */}
                        <div className="p-3 bg-slate-900/30 rounded border border-slate-900">
                          <p className="text-slate-400 italic">"{history[0].scenario}"</p>
                        </div>

                        {/* Analysis & Pattern */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <h4 className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Leitura Fria</h4>
                            <p className="text-slate-300 bg-slate-950/40 p-3 rounded border border-slate-900">{history[0].leituraCenario}</p>
                          </div>
                          <div className="space-y-1.5">
                            <h4 className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Dinâmica de Poder</h4>
                            <p className="text-slate-300 bg-slate-950/40 p-3 rounded border border-slate-900">{history[0].padraoEstrategico}</p>
                          </div>
                        </div>

                        {/* Evolutionary analysis */}
                        <div className="p-3 rounded bg-emerald-500/5 border border-emerald-500/10 space-y-1">
                          <h4 className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">Feedback Evolutivo de Conduta</h4>
                          <p className="text-slate-200">{history[0].leituraEvolutiva}</p>
                        </div>

                        {/* Practical steps */}
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Como Agir Agora (Diretrizes de Ação):</h4>
                          <div className="grid sm:grid-cols-2 gap-2">
                            {history[0].direcaoAcao.map((passo, idx) => (
                              <div key={idx} className="flex items-start gap-2 bg-slate-950/20 p-2.5 rounded border border-slate-900">
                                <ChevronRight className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <span className="text-slate-300 text-xs">{passo}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Critical error danger */}
                        <div className="p-3 rounded bg-red-500/5 border border-red-500/10 space-y-1">
                          <h4 className="text-[10px] font-mono uppercase tracking-wider text-red-400 font-bold">Aviso de Erro Crítico:</h4>
                          <p className="text-slate-200">{history[0].erroCritico}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: HISTÓRICO DE CONSELHOS */}
              {activeTab === "historico" && (
                <ScenarioHistory 
                  history={history}
                  onDeleteLog={(id) => {
                    if (activePlayingId === id) stopSpeaking();
                    setHistory(prev => prev.filter(item => item.id !== id));
                  }}
                  onPlayVoice={(script, id) => speakText(script, id)}
                  onStopVoice={stopSpeaking}
                  activePlayingId={activePlayingId}
                  isVoiceMuted={!voiceEnabled}
                />
              )}

              {/* TAB: PERFIL DO USUÁRIO & MÉTRICAS DETALHADAS */}
              {activeTab === "perfil" && (
                <EvolutionProfile profile={profile} history={history} />
              )}

              {/* TAB: FUNDAMENTAÇÃO FILOSÓFICA (CONSELHOS DOS FILÓSOFOS) */}
              {activeTab === "filosofia" && (
                <PhilosopherQuotes />
              )}
            </motion.div>
          </AnimatePresence>
        </section>

      </div>

      {/* Footer copyright */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs font-mono text-slate-600 bg-slate-950/40">
        Mentor Estratégico • Baseado em Baltasar Gracián, Maquiavel, Robert Greene e Sun Tzu • Memória Evolutiva Integrada
      </footer>
    </div>
  );
}
