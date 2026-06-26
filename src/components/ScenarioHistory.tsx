import React, { useState } from "react";
import { StrategicAnalysis, SituationType } from "../types";
import { 
  FileText, 
  MessageSquare, 
  Play, 
  Volume2, 
  VolumeX, 
  Trash2, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp,
  AlertTriangle,
  Lightbulb,
  CornerDownRight,
  ShieldAlert
} from "lucide-react";

interface ScenarioHistoryProps {
  history: StrategicAnalysis[];
  onDeleteLog: (id: string) => void;
  onPlayVoice: (script: string, id: string) => void;
  onStopVoice: () => void;
  activePlayingId: string | null;
  isVoiceMuted: boolean;
}

const CLASSIFICATION_LABELS: Record<SituationType, { text: string; color: string; border: string }> = {
  conflito: { text: "Conflito", color: "bg-red-500/10 text-red-400", border: "border-red-500/20" },
  decisao: { text: "Decisão Crítica", color: "bg-indigo-500/10 text-indigo-400", border: "border-indigo-500/20" },
  oportunidade: { text: "Oportunidade", color: "bg-emerald-500/10 text-emerald-400", border: "border-emerald-500/20" },
  pressao: { text: "Pressão Social", color: "bg-amber-500/10 text-amber-400", border: "border-amber-500/20" },
  negociacao: { text: "Negociação", color: "bg-blue-500/10 text-blue-400", border: "border-blue-500/20" },
  risco_emocional: { text: "Risco Emocional", color: "bg-rose-500/10 text-rose-400", border: "border-rose-500/20" }
};

export default function ScenarioHistory({
  history,
  onDeleteLog,
  onPlayVoice,
  onStopVoice,
  activePlayingId,
  isVoiceMuted
}: ScenarioHistoryProps) {
  const [filterClass, setFilterClass] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredHistory = filterClass === "all"
    ? history
    : history.filter(item => item.classification === filterClass);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-emerald-400" />
          Registros de Evolução Mapeados
        </h3>

        {/* Filter categories dropdown/tabs */}
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="text-xs font-mono bg-slate-900 border border-slate-800 text-slate-300 rounded px-2 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer"
        >
          <option value="all">Todas Situações</option>
          <option value="conflito">Conflito</option>
          <option value="decisao">Decisão Crítica</option>
          <option value="oportunidade">Oportunidade</option>
          <option value="pressao">Pressão Social</option>
          <option value="negociacao">Negociação</option>
          <option value="risco_emocional">Risco Emocional</option>
        </select>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="text-center py-8 bg-slate-900/10 border border-dashed border-slate-900 rounded-lg">
          <MessageSquare className="w-8 h-8 text-slate-700 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Nenhum cenário registrado nesta categoria.</p>
          <p className="text-[10px] text-slate-600 mt-1">Insira e analise uma situação acima para começar.</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto max-h-[400px] pr-1">
          {filteredHistory.map((item) => {
            const isExpanded = expandedId === item.id;
            const isPlaying = activePlayingId === item.id;
            const label = CLASSIFICATION_LABELS[item.classification] || { text: "Geral", color: "bg-slate-800 text-slate-300", border: "border-slate-700" };

            return (
              <div 
                key={item.id} 
                className={`border rounded-lg bg-slate-900/20 hover:bg-slate-900/40 transition-colors ${
                  isExpanded ? "border-slate-700 bg-slate-900/40" : "border-slate-800"
                }`}
              >
                {/* Collapsed Header */}
                <div 
                  onClick={() => toggleExpand(item.id)}
                  className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[9px] font-mono font-bold tracking-wider uppercase border px-1.5 py-0.5 rounded ${label.color} ${label.border}`}>
                        {label.text}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(item.timestamp).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/5 px-1.5 rounded border border-emerald-500/10">
                        Nível {item.profileAfter.nivel}
                      </span>
                    </div>
                    <p className="text-xs font-sans text-slate-300 font-medium truncate max-w-xl pr-2">
                      {item.scenario}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Audio play button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isPlaying) {
                          onStopVoice();
                        } else {
                          onPlayVoice(item.voiceScript, item.id);
                        }
                      }}
                      className={`p-1.5 rounded transition ${
                        isPlaying 
                          ? "bg-emerald-500/20 text-emerald-400 animate-pulse border border-emerald-500/30" 
                          : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
                      }`}
                      title={isPlaying ? "Parar mentor" : "Ouvir conselho do mentor"}
                    >
                      {isPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    </button>

                    {/* Delete log button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm("Deseja deletar este registro de conselho de forma permanente?")) {
                          onDeleteLog(item.id);
                        }
                      }}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-500 hover:text-red-400 rounded transition"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="border-t border-slate-800/80 p-4 space-y-4 text-xs font-sans">
                    {/* Relato original */}
                    <div>
                      <h4 className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">Seu Relato:</h4>
                      <p className="text-slate-300 italic pl-3 border-l-2 border-slate-800 leading-relaxed">
                        "{item.scenario}"
                      </p>
                    </div>

                    {/* Leitura do cenário */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <h4 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                          Leitura Fria do Cenário
                        </h4>
                        <p className="text-slate-300 bg-slate-950/40 p-3 rounded border border-slate-900 leading-relaxed">
                          {item.leituraCenario}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <h4 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                          Dinâmica de Poder Identificada
                        </h4>
                        <p className="text-slate-300 bg-slate-950/40 p-3 rounded border border-slate-900 leading-relaxed">
                          {item.padraoEstrategico}
                        </p>
                      </div>
                    </div>

                    {/* Leitura evolutiva */}
                    <div className="bg-emerald-500/5 p-3 rounded border border-emerald-500/10 space-y-1">
                      <h4 className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1 font-bold">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Avaliação da sua Evolução Comportamental
                      </h4>
                      <p className="text-slate-200 leading-relaxed">
                        {item.leituraEvolutiva}
                      </p>
                    </div>

                    {/* Direções de ação */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
                        Diretrizes de Ação Imediata (Passo a Passo)
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {item.direcaoAcao.map((passo, idx) => (
                          <div key={idx} className="flex items-start gap-2 bg-slate-950/20 p-2.5 rounded border border-slate-900">
                            <CornerDownRight className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span className="text-slate-300 text-xs leading-relaxed">{passo}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Erro Crítico */}
                    <div className="bg-red-500/5 p-3 rounded border border-red-500/10 space-y-1">
                      <h4 className="text-[10px] font-mono uppercase tracking-wider text-red-400 flex items-center gap-1 font-bold">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Aviso de Erro Crítico (Risco)
                      </h4>
                      <p className="text-slate-200 leading-relaxed font-medium">
                        {item.erroCritico}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
