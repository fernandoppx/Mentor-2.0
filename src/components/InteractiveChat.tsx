import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Mic, 
  MicOff, 
  Paperclip, 
  X, 
  Volume2, 
  VolumeX, 
  Play, 
  Trash2, 
  Sparkles, 
  Brain, 
  FileText, 
  Image as ImageIcon,
  MessageSquare,
  Compass,
  ArrowDownCircle,
  Clock,
  RotateCcw
} from "lucide-react";
import { UserProfile, StrategicAnalysis } from "../types";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  id: string;
  sender: "user" | "model";
  text: string;
  timestamp: string;
  voiceScript?: string;
  fileName?: string;
  fileType?: string;
  fileData?: string; // base64
}

interface InteractiveChatProps {
  profile: UserProfile;
  onUpdateProfile: (newProfile: UserProfile) => void;
}

const QUICK_SUGGESTIONS = [
  { text: "Como devo reagir a elogios excessivos de um rival no trabalho?", icon: "🧠" },
  { text: "Suspeito de uma armadilha em uma proposta de aliança comercial. Como investigar?", icon: "⚔️" },
  { text: "Tenho uma reunião de negociação de orçamento amanhã. Qual postura adotar?", icon: "💼" },
  { text: "Como me manter frio após ser injustamente criticado em público?", icon: "❄️" }
];

export default function InteractiveChat({ profile, onUpdateProfile }: InteractiveChatProps) {
  // --- Persistent Chat History State ---
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("mentor_chat_messages");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [
      {
        id: "welcome",
        sender: "model",
        text: "Saudações. Sou seu mentor estratégico pessoal. Estou aqui para ler com você os jogos de poder, as sutilezas sociais e as decisões de alto risco.\n\nFale-me do seu cenário atual, envie um documento de negociação ou anexe uma captura de tela. O que está tirando seu foco ou exigindo precisão cirúrgica neste momento?",
        timestamp: new Date().toISOString(),
        voiceScript: "Saudações. Sou seu mentor estratégico pessoal. Fale-me do seu cenário atual ou envie um documento. O que está exigindo precisão cirúrgica neste momento?"
      }
    ];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [activeVoiceId, setActiveVoiceId] = useState<string | null>(null);

  // --- Voice Input (STT) & Output (TTS) States ---
  const [recording, setRecording] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // --- File Attachment States ---
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    mimeType: string;
    data: string; // base64
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // --- Auto Scroll & Save ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    localStorage.setItem("mentor_chat_messages", JSON.stringify(messages));
  }, [messages]);

  // --- Speech Recognition (STT) Init ---
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = "pt-BR";
      rec.continuous = false;
      rec.interimResults = false;

      rec.onstart = () => setRecording(true);
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev.trim() ? prev + " " + transcript : transcript));
      };
      rec.onerror = (e: any) => {
        console.error("Erro no reconhecimento de voz:", e.error);
        setRecording(false);
      };
      rec.onend = () => setRecording(false);
      recognitionRef.current = rec;
    }
  }, []);

  // --- Text to Speech (TTS) ---
  const speak = (text: string, id: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Mute active sounds

    if (!voiceEnabled) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    
    // Choose Brazilian voice if possible
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.startsWith("pt-BR") || v.lang.startsWith("pt"));
    if (ptVoice) utterance.voice = ptVoice;
    
    utterance.rate = 0.95; // Pacing for a steady wise tone
    utterance.pitch = 0.94;

    utterance.onstart = () => setActiveVoiceId(id);
    utterance.onend = () => setActiveVoiceId(null);
    utterance.onerror = () => setActiveVoiceId(null);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setActiveVoiceId(null);
  };

  // --- Handle Recording Button Toggle ---
  const handleToggleRecord = () => {
    if (!recognitionRef.current) {
      alert("O seu navegador não suporta reconhecimento de voz nativo.");
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

  // --- Handle File Selected ---
  const processFile = (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      alert("O arquivo excede o limite recomendado de 8MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      setAttachedFile({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        data: base64Data
      });
    };
    reader.onerror = () => {
      alert("Falha ao ler o arquivo.");
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // --- Drag and Drop Usability Pattern ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // --- Send Message ---
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() && !attachedFile) return;

    stopSpeaking();
    setLoading(true);

    const userMsgId = Math.random().toString(36).substring(2, 11);
    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text: input,
      timestamp: new Date().toISOString(),
      fileName: attachedFile?.name,
      fileType: attachedFile?.mimeType,
      fileData: attachedFile?.data
    };

    // Update message list instantly
    setMessages(prev => [...prev, userMessage]);
    
    const originalInput = input;
    const originalFile = attachedFile;
    
    setInput("");
    setAttachedFile(null);

    try {
      // Prepare payload to `/api/chat`
      // Filter out raw file data from historical messages to save token bandwidth
      const cleanedHistory = messages.map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: originalInput,
          chatHistory: cleanedHistory,
          profile: profile,
          file: originalFile ? {
            mimeType: originalFile.mimeType,
            data: originalFile.data
          } : undefined
        })
      });

      if (!response.ok) {
        throw new Error("Falha na conexão com o servidor do mentor.");
      }

      const result = await response.json();

      const modelMsgId = Math.random().toString(36).substring(2, 11);
      const modelMessage: ChatMessage = {
        id: modelMsgId,
        sender: "model",
        text: result.text,
        timestamp: new Date().toISOString(),
        voiceScript: result.voiceScript
      };

      setMessages(prev => [...prev, modelMessage]);

      if (result.profileUpdates) {
        onUpdateProfile(result.profileUpdates);
      }

      // Automatically speak the wisdom if enabled
      if (voiceEnabled && result.voiceScript) {
        setTimeout(() => {
          speak(result.voiceScript, modelMsgId);
        }, 500);
      }

    } catch (err: any) {
      console.error(err);
      const errorMessage: ChatMessage = {
        id: Math.random().toString(36).substring(2, 11),
        sender: "model",
        text: "Desculpe a falha técnica. Minha conexão com o conselho tático falhou. Por favor, reenvie sua dúvida.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // --- Reset Chat ---
  const handleClearChat = () => {
    if (window.confirm("Deseja arquivar e apagar o histórico deste bate-papo? Suas métricas de nível não serão perdidas.")) {
      stopSpeaking();
      setMessages([
        {
          id: "welcome",
          sender: "model",
          text: "Pronto para um novo cenário tático. Do que precisamos nos precaver ou qual vitória pretendemos arquitetar hoje?",
          timestamp: new Date().toISOString()
        }
      ]);
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[650px] relative shadow-2xl ${
        isDragOver ? "ring-2 ring-emerald-500 border-transparent bg-emerald-950/10" : ""
      }`}
    >
      {/* Header of Chat with Sound Control & Trash */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-emerald-400 animate-pulse" />
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Bate-Papo com o Mentor
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Conselhos por voz ativa • Análise de Mídia Habilitada
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Voice Switcher */}
          <button
            onClick={() => {
              if (activeVoiceId) stopSpeaking();
              setVoiceEnabled(!voiceEnabled);
            }}
            className={`p-1.5 rounded text-xs font-mono border transition ${
              voiceEnabled 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-slate-900 border-slate-800 text-slate-500"
            }`}
            title={voiceEnabled ? "Mudar para mudo" : "Ativar resposta por voz de mentor"}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Reset chat */}
          <button
            onClick={handleClearChat}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-red-400 border border-slate-800 rounded transition"
            title="Limpar histórico de conversa"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drag Over Overlay Alert */}
      {isDragOver && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-emerald-500">
          <Paperclip className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
          <h4 className="text-sm font-mono font-bold text-white">Solte o arquivo aqui</h4>
          <p className="text-xs text-slate-400 mt-1">
            Anexe imagens ou documentos de texto para avaliação do mentor.
          </p>
        </div>
      )}

      {/* Chat History List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/20">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          const isPlaying = activeVoiceId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"} items-start gap-2.5`}
            >
              {/* Profile Avatar for model */}
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-mono text-xs font-bold flex-shrink-0">
                  M
                </div>
              )}

              <div className="flex flex-col max-w-[82%] gap-1">
                {/* Meta details */}
                <span className={`text-[9px] font-mono text-slate-500 ${isUser ? "text-right" : "text-left"}`}>
                  {isUser ? "Você" : "Mentor"} • {new Date(msg.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>

                {/* Message Balloon */}
                <div
                  className={`p-3.5 rounded-xl border text-xs leading-relaxed relative group ${
                    isUser
                      ? "bg-emerald-950/20 border-emerald-800/40 text-slate-100 rounded-tr-none"
                      : "bg-slate-900/60 border-slate-800 text-slate-200 rounded-tl-none"
                  }`}
                >
                  {/* Attached file visual in user messages */}
                  {msg.fileName && (
                    <div className="mb-2 p-2 bg-slate-950/60 rounded border border-slate-850 flex items-center gap-2">
                      {msg.fileType?.startsWith("image/") ? (
                        <img 
                          src={msg.fileData} 
                          alt={msg.fileName} 
                          className="w-8 h-8 rounded object-cover border border-slate-800"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <FileText className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono text-slate-300 truncate">{msg.fileName}</p>
                        <p className="text-[8px] font-mono text-slate-500 uppercase">{msg.fileType?.split("/")[1]}</p>
                      </div>
                    </div>
                  )}

                  <div className="markdown-body font-sans space-y-2">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>

                  {/* Play audio widget on model messages */}
                  {!isUser && msg.voiceScript && (
                    <button
                      onClick={() => {
                        if (isPlaying) stopSpeaking();
                        else speak(msg.voiceScript!, msg.id);
                      }}
                      className={`absolute -bottom-2 -right-2 p-1 rounded-full border transition ${
                        isPlaying
                          ? "bg-emerald-500 text-slate-950 border-emerald-400 animate-pulse"
                          : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800 opacity-0 group-hover:opacity-100 focus:opacity-100"
                      }`}
                      title={isPlaying ? "Mudar áudio" : "Ouvir conselho sintetizado"}
                    >
                      <Play className={`w-3 h-3 ${isPlaying ? "fill-current" : ""}`} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-start items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 font-mono text-xs font-bold flex-shrink-0">
              ...
            </div>
            <div className="bg-slate-900/40 border border-slate-900/60 px-4 py-3 rounded-xl rounded-tl-none flex items-center gap-2 text-xs text-slate-400">
              <Brain className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              <span className="font-mono">Mentor lendo as intenções...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts (Only if history is clean/short) */}
      {messages.length <= 2 && !loading && (
        <div className="px-4 py-2 bg-slate-900/10 border-t border-slate-900 space-y-1.5 z-10">
          <span className="text-[9px] font-mono text-slate-500 uppercase font-bold block">
            Ideias de Questionamento:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {QUICK_SUGGESTIONS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInput(item.text);
                  stopSpeaking();
                }}
                className="text-[10px] font-mono text-left p-1.5 rounded border border-slate-900 hover:border-slate-800 bg-slate-900/20 hover:bg-slate-900/40 text-slate-400 hover:text-slate-300 truncate"
              >
                {item.icon} {item.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input controls form */}
      <form 
        onSubmit={handleSendMessage} 
        className="bg-slate-900/40 border-t border-slate-800/80 p-3 flex flex-col gap-2 z-10"
      >
        {/* Active attachment panel */}
        {attachedFile && (
          <div className="flex items-center justify-between bg-emerald-950/20 border border-emerald-900/40 px-3 py-1.5 rounded-lg">
            <div className="flex items-center gap-2 text-xs min-w-0">
              {attachedFile.mimeType.startsWith("image/") ? (
                <ImageIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              )}
              <span className="text-slate-300 font-mono text-[11px] truncate">{attachedFile.name}</span>
            </div>
            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              className="p-1 hover:bg-emerald-900/30 text-emerald-400 hover:text-emerald-300 rounded transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Attachment Clickable Trigger */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition flex-shrink-0"
            title="Anexar foto ou documento (PDF, texto)"
            disabled={loading}
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,.pdf,text/*"
            className="hidden"
          />

          {/* Text Input area */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua dúvida ou desabafo..."
            className="flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-2.5 text-xs text-slate-200 placeholder-slate-500 outline-none transition"
            disabled={loading}
          />

          {/* Microfone recording */}
          <button
            type="button"
            onClick={handleToggleRecord}
            className={`p-2.5 rounded-lg border transition flex-shrink-0 ${
              recording
                ? "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse"
                : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800"
            }`}
            title={recording ? "Parar gravação" : "Falar com o mentor (Voz-para-Texto)"}
            disabled={loading}
          >
            {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || (!input.trim() && !attachedFile)}
            className="p-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-slate-950 font-bold rounded-lg hover:from-emerald-500 hover:to-teal-500 hover:scale-105 active:scale-95 transition disabled:opacity-30 disabled:scale-100 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
