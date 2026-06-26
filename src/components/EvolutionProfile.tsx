import React, { useState } from "react";
import { 
  Trophy, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  User, 
  ChevronRight, 
  Zap, 
  Activity,
  Award,
  HelpCircle
} from "lucide-react";
import { UserProfile, StrategicAnalysis } from "../types";
import { motion } from "motion/react";

interface EvolutionProfileProps {
  profile: UserProfile;
  history: StrategicAnalysis[];
}

const LEVEL_DETAILS = [
  {
    level: 1,
    title: "Reativo",
    description: "Altamente influenciado por emoções de curto prazo. Reage impulsivamente antes de analisar as forças em jogo.",
    color: "from-red-500 to-amber-500"
  },
  {
    level: 2,
    title: "Consciente",
    description: "Percebe os padrões de erro e as armadilhas emocionais após cometê-los, mas ainda falha sob forte estresse.",
    color: "from-amber-500 to-yellow-500"
  },
  {
    level: 3,
    title: "Estratégico",
    description: "Planeja movimentos, oculta intenções e lê o cenário social antes de agir. Age sob frieza analítica.",
    color: "from-emerald-500 to-teal-500"
  },
  {
    level: 4,
    title: "Consistente",
    description: "Aplica táticas com disciplina e controle emocional regular. Quase imune a provocações e focado em objetivos de longo prazo.",
    color: "from-blue-500 to-indigo-500"
  },
  {
    level: 5,
    title: "Estável sob Pressão",
    description: "Domínio de cenários complexos de poder. Transforma crises em vantagens competitivas com precisão cirúrgica.",
    color: "from-purple-500 to-fuchsia-500"
  }
];

export default function EvolutionProfile({ profile, history }: EvolutionProfileProps) {
  const [activeTab, setActiveTab] = useState<"dados" | "grafico">("dados");
  const currentLevelInfo = LEVEL_DETAILS.find(l => l.level === profile.nivel) || LEVEL_DETAILS[0];

  // Prepare SVG Sparkline / Chart coordinates
  const lastInteractions = [...history].reverse().slice(-10); // last 10 items chronologically
  const chartPoints = lastInteractions.map((item, idx) => {
    return {
      x: lastInteractions.length > 1 ? (idx / (lastInteractions.length - 1)) * 100 : 50,
      racionalidade: item.profileAfter.racionalidade,
      impulsividade: item.profileAfter.impulsividade,
      date: new Date(item.timestamp).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })
    };
  });

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full shadow-2xl">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-800 bg-slate-900/40">
        <button
          onClick={() => setActiveTab("dados")}
          className={`flex-1 py-3 text-xs font-mono font-medium tracking-wider uppercase transition flex items-center justify-center gap-2 border-b-2 ${
            activeTab === "dados"
              ? "border-emerald-500 text-white bg-slate-900/60"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <User className="w-4 h-4" />
          Perfil Tático
        </button>
        <button
          onClick={() => setActiveTab("grafico")}
          className={`flex-1 py-3 text-xs font-mono font-medium tracking-wider uppercase transition flex items-center justify-center gap-2 border-b-2 ${
            activeTab === "grafico"
              ? "border-emerald-500 text-white bg-slate-900/60"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Activity className="w-4 h-4" />
          Tendência
        </button>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-5 overflow-y-auto">
        {activeTab === "dados" ? (
          <>
            {/* Level Section */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-900/50 border border-slate-800">
              <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                {/* SVG circular progress */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="2.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <motion.path
                    className="text-emerald-500"
                    strokeWidth="2.5"
                    strokeDasharray={`${profile.progressToNextLevel}, 100`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-mono font-bold text-slate-400 leading-none">NÍVEL</span>
                  <span className="text-xl font-bold text-white leading-none font-mono">{profile.nivel}</span>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span className={`font-bold text-sm bg-gradient-to-r ${currentLevelInfo.color} bg-clip-text text-transparent`}>
                    Nível {profile.nivel}: {currentLevelInfo.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {currentLevelInfo.description}
                </p>
                {profile.nivel < 5 && (
                  <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Progresso para Nível {profile.nivel + 1}</span>
                    <span className="text-emerald-400">{profile.progressToNextLevel}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Core Metrics: Rationality vs Impulsivity */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-slate-500" />
                Métricas de Comportamento
              </h3>

              {/* Rationality */}
              <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-900 space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Racionalidade
                  </span>
                  <span className="text-emerald-400 font-bold">{profile.racionalidade}%</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 rounded-full transition-all duration-1000"
                    style={{ width: `${profile.racionalidade}%` }}
                  />
                </div>
              </div>

              {/* Impulsivity */}
              <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-900 space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Impulsividade
                  </span>
                  <span className="text-amber-400 font-bold">{profile.impulsividade}%</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-orange-500 rounded-full transition-all duration-1000"
                    style={{ width: `${profile.impulsividade}%` }}
                  />
                </div>
              </div>

              {/* Communication Style */}
              <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-900 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-slate-400" /> Estilo de Comunicação:
                </span>
                <span className="text-xs font-mono font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                  {profile.comunicacaoStyle}
                </span>
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="space-y-4 flex-1">
              {/* Strengths */}
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Pontos Fortes Identificados
                </h3>
                {profile.pontosFortes.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">Nenhum ponto forte mapeado ainda. Relate cenários para treinar seu perfil.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {profile.pontosFortes.map((ponto, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-900/20 p-2 rounded border border-slate-900/40">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{ponto}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Error Patterns */}
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Gargalos / Padrões de Erro
                </h3>
                {profile.padrõesErro.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">Nenhum padrão de erro recorrente identificado até o momento.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {profile.padrõesErro.map((erro, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-900/20 p-2 rounded border border-slate-900/40">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>{erro}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Custom SVG Line Chart for Evolution Metrics over interactions */
          <div className="flex flex-col h-full gap-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              Histórico de Evolução comportamental
            </h3>
            
            {chartPoints.length < 2 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-900/20 border border-dashed border-slate-800 rounded-lg">
                <TrendingUp className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs text-slate-400">
                  Dados insuficientes para gerar gráficos.
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Registre pelo menos 2 interações para rastrear as flutuações das suas tomadas de decisão.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-4">
                <div className="relative bg-slate-900/40 border border-slate-900 p-4 rounded-lg flex-1 min-h-[180px]">
                  {/* Legend */}
                  <div className="flex items-center gap-4 text-[10px] font-mono mb-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-1 bg-emerald-500 rounded" />
                      <span className="text-slate-300">Racionalidade</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-1 bg-amber-500 rounded" />
                      <span className="text-slate-300">Impulsividade</span>
                    </div>
                  </div>

                  {/* SVG Chart Render */}
                  <div className="w-full h-32 relative">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                      {/* Grid Lines */}
                      <line x1="0" y1="25" x2="100" y2="25" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2" />
                      <line x1="0" y1="50" x2="100" y2="50" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2" />
                      <line x1="0" y1="75" x2="100" y2="75" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2" />

                      {/* Rationality Path */}
                      <path
                        d={chartPoints.reduce((acc, p, idx) => {
                          const y = 100 - p.racionalidade;
                          return acc + `${idx === 0 ? 'M' : 'L'} ${p.x} ${y}`;
                        }, "")}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="1.5"
                      />
                      
                      {/* Impulsivity Path */}
                      <path
                        d={chartPoints.reduce((acc, p, idx) => {
                          const y = 100 - p.impulsividade;
                          return acc + `${idx === 0 ? 'M' : 'L'} ${p.x} ${y}`;
                        }, "")}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="1.5"
                      />

                      {/* Data Dots */}
                      {chartPoints.map((p, idx) => (
                        <g key={idx}>
                          <circle cx={p.x} cy={100 - p.racionalidade} r="1.5" fill="#10b981" />
                          <circle cx={p.x} cy={100 - p.impulsividade} r="1.5" fill="#f59e0b" />
                        </g>
                      ))}
                    </svg>
                  </div>

                  {/* X-Axis labels */}
                  <div className="flex justify-between text-[8px] font-mono text-slate-500 mt-2">
                    {chartPoints.map((p, i) => (
                      <span key={i} className="truncate max-w-[28px]">{p.date}</span>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-slate-400 bg-slate-900/30 border border-slate-900 p-3 rounded-lg leading-relaxed">
                  <div className="font-mono text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                    Diagnóstico de Rota
                  </div>
                  {profile.racionalidade > profile.impulsividade ? (
                    <p>Você está consolidando sua posição estratégica. Sua tomada de decisão atual prioriza a contenção e a análise fria antes da reação. Continue cultivando a prudência de Gracián.</p>
                  ) : (
                    <p>O gráfico aponta desequilíbrios impulsivos recentes. Seus erros decorrem de reações no calor do momento. Lembre-se da lei de Greene: "Diga sempre menos do que o necessário" para não expor fraqueza.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
