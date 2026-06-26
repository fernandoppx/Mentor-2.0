import React, { useState, useEffect } from "react";
import { Shield, Brain, RefreshCw, Upload, Download, Clock } from "lucide-react";
import { UserProfile, StrategicAnalysis } from "../types";

interface HeaderProps {
  onReset: () => void;
  onImport: (profile: UserProfile, history: StrategicAnalysis[]) => void;
  profile: UserProfile;
  history: StrategicAnalysis[];
}

export default function Header({ onReset, onImport, profile, history }: HeaderProps) {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleExport = () => {
    const dataStr = JSON.stringify({ profile, history }, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `mentor_mente_nivel_${profile.nivel}_${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.profile && parsed.history) {
            onImport(parsed.profile, parsed.history);
          } else {
            alert("Formato de arquivo inválido. O arquivo deve conter os campos 'profile' e 'history'.");
          }
        } catch (err) {
          alert("Erro ao ler o arquivo de mente. Verifique se é um arquivo JSON válido.");
        }
      };
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-4 sticky top-0 z-50 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg text-slate-950 shadow-lg shadow-emerald-500/10">
          <Brain className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-sans flex items-center gap-2">
            MENTOR ESTRATÉGICO
            <span className="text-[10px] font-mono tracking-widest uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
              v2.5 Pro
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-mono flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            Memória Evolutiva Ativa • Criptografado Localmente
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
        {/* Clock Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-300">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{time}</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Export button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition"
            title="Exportar dados de evolução"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Mente</span>
          </button>

          {/* Import file input label */}
          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Importar Mente</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          {/* Reset button */}
          <button
            onClick={() => {
              if (window.confirm("Deseja realmente apagar toda a sua jornada evolutiva e reiniciar o mentor?")) {
                onReset();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 hover:border-red-900/50 text-red-400 hover:text-red-300 rounded-lg text-xs font-medium transition"
            title="Resetar Memória"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reiniciar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
