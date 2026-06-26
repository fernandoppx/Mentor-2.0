export type SituationType = "conflito" | "decisao" | "oportunidade" | "pressao" | "negociacao" | "risco_emocional";

export interface UserProfile {
  nivel: number; // 1 to 5
  progressToNextLevel: number; // 0 to 100
  racionalidade: number; // 0 to 100
  impulsividade: number; // 0 to 100
  comunicacaoStyle: string; // ex: "Direto", "Evitativo", "Analítico", "Agressivo"
  padrõesErro: string[]; // List of recurring errors
  pontosFortes: string[]; // List of strategic strengths
}

export interface StrategicAnalysis {
  id: string;
  timestamp: string;
  scenario: string;
  classification: SituationType;
  leituraCenario: string;
  padraoEstrategico: string;
  leituraEvolutiva: string;
  direcaoAcao: string[];
  erroCritico: string;
  voiceScript: string;
  profileAfter: UserProfile;
}

export interface HistoricalQuote {
  id: string;
  text: string;
  author: "Baltasar Gracián" | "Sun Tzu" | "Nicolau Maquiavel" | "Robert Greene";
  source: string;
}
