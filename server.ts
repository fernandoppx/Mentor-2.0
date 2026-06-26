import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("A chave GEMINI_API_KEY não foi encontrada nas variáveis de ambiente. Configure-a no painel 'Secrets' do Google AI Studio.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// Helper to safely execute generateContent with fallback models to prevent 503 unavailability issues
async function generateContentWithFallback(ai: GoogleGenAI, params: {
  contents: any;
  config: any;
}) {
  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-3.5-flash"
  ];
  
  let lastError: any = null;
  for (const model of modelsToTry) {
    try {
      console.log(`Tentando gerar conteúdo com o modelo: ${model}...`);
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (error: any) {
      console.warn(`Erro com o modelo ${model}:`, error.message || error);
      lastError = error;
    }
  }
  throw lastError || new Error("Todos os modelos de inteligência artificial falharam ou estão indisponíveis no momento.");
}

// 1. Definition of the output JSON Schema
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    leituraCenario: {
      type: Type.STRING,
      description: "Leitura analítica, direta e realista do cenário sob a ótica do poder, estratégia e prudência social."
    },
    padraoEstrategico: {
      type: Type.STRING,
      description: "Identificação da dinâmica ativa (poder, influência, risco, oportunidade, decisão, conflito) referenciando conceitos clássicos de Baltasar Gracián, Maquiavel ou Sun Tzu."
    },
    leituraEvolutiva: {
      type: Type.STRING,
      description: "Comparação do comportamento do usuário nesta situação com seus padrões históricos. Deve soar natural (ex: 'Isso aqui se aproxima daquele padrão que observamos antes...' ou 'Desta vez, você demonstrou evolução ao conter a reação inicial...')."
    },
    direcaoAcao: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Passos táticos claros, realistas e sequenciais para o usuário executar imediatamente."
    },
    erroCritico: {
      type: Type.STRING,
      description: "O perigo mais iminente se o usuário agir por impulso ou cometer um deslize emocional/tático."
    },
    voiceScript: {
      type: Type.STRING,
      description: "Roteiro de voz extremamente conciso (3 a 4 frases curtas), no tom direto de mentor, em português, pronto para leitura via Text-to-Speech."
    },
    profileUpdates: {
      type: Type.OBJECT,
      description: "Novos valores calculados para o perfil evolutivo do usuário com base nesta nova interação.",
      properties: {
        nivel: {
          type: Type.INTEGER,
          description: "Nível atual recalculado do usuário (1 a 5)."
        },
        progressToNextLevel: {
          type: Type.INTEGER,
          description: "Progresso para o próximo nível (0 a 100)."
        },
        racionalidade: {
          type: Type.INTEGER,
          description: "Pontuação de racionalidade (0 a 100) baseada nesta decisão."
        },
        impulsividade: {
          type: Type.INTEGER,
          description: "Pontuação de impulsividade (0 a 100) baseada nesta decisão."
        },
        comunicacaoStyle: {
          type: Type.STRING,
          description: "Estilo de comunicação identificado nesta interação (ex: Direto, Evitativo, Agressivo, Analítico)."
        },
        padrõesErro: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Padrões de erro recorrentes identificados (máximo de 3)."
        },
        pontosFortes: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Pontos fortes estratégicos do usuário demonstrados (máximo de 3)."
        }
      },
      required: ["nivel", "progressToNextLevel", "racionalidade", "impulsividade", "comunicacaoStyle", "padrõesErro", "pontosFortes"]
    }
  },
  required: ["leituraCenario", "padraoEstrategico", "leituraEvolutiva", "direcaoAcao", "erroCritico", "voiceScript", "profileUpdates"]
};

// 2. Mentorship System Prompt Setup
const SYSTEM_INSTRUCTION = `Você é um mentor pessoal estratégico de alta performance com interação por voz e texto, especializado em leitura de cenários humanos, tomada de decisão e evolução comportamental contínua.
Você atua como uma inteligência filosófica aplicada baseada em:
- Baltasar Gracián (prudência, leitura social, sutileza estratégica)
- The 48 Laws of Power de Robert Greene (dinâmica de poder e percepção social)
- The Art of War de Sun Tzu (estratégia, timing e vantagem competitiva)
- The Prince de Maquiavel (realidade política e poder estrutural)

Seu objetivo é evoluir o usuário continuamente em clareza de decisão sob pressão, inteligência social, leitura de cenários e postura estratégica. Você não motiva com chavões ou emoções. Você estrutura o pensamento e a ação.

REGRAS CRÍTICAS DE INTERAÇÃO E MEMÓRIA:
1. Você mantém e atualiza um perfil tático e evolutivo do usuário.
2. Com base no relato atual, na classificação e no histórico/perfil fornecido, você deve analisar o cenário friamente e reavaliar os parâmetros do usuário (Nível 1 a 5, racionalidade, impulsividade, estilo de comunicação, pontos fortes e erros recorrentes).
3. Não revele os dados brutos da memória do usuário. Incorpore-os de forma orgânica e sutil em "leituraEvolutiva" (ex: "Isso se alinha ao seu padrão anterior de recuar sob pressão...").
4. No campo "voiceScript", use uma linguagem falada, natural, frases curtas, tom neutro e analítico, sem floreios acadêmicos ou jargões vazios. O ritmo deve ser o de um mentor de bolso falando em tempo real. Exemplo: "O ponto central aqui é o seguinte. O que você enfrenta é um padrão, não um fato isolado. O próximo passo exige precisão..."

NÍVEIS DE EVOLUÇÃO COMPORTAMENTAL:
- Nível 1: Reativo (emocional, impulsivo, age sem calcular)
- Nível 2: Consciente (já percebe padrões e erros, mas ainda falha sob pressão)
- Nível 3: Estratégico (planeja os movimentos antes de agir, usa inteligência social)
- Nível 4: Consistente (executa táticas com controle emocional e regularidade)
- Nível 5: Estável sob Pressão (alta performance, domina cenários complexos com frieza)`;

// API Endpoints
app.post("/api/chat", async (req, res) => {
  try {
    const { message, chatHistory, profile, file } = req.body;

    if (!message && !file) {
      return res.status(400).json({ error: "Mensagem ou arquivo é obrigatório." });
    }

    const ai = getGeminiClient();

    // System instructions specifically designed to maintain conversational fluidity
    // while evaluating emotional/strategic content and updating the evolution metrics
    const chatSystemInstruction = `Você é o Mentor Estratégico do usuário, atendendo em uma interface de chat dinâmico (estilo bate-papo).
Você é uma inteligência tática, realista e sutil baseada em:
- Baltasar Gracián (prudência extrema, leitura de segredos alheios)
- Nicolau Maquiavel (posicionamento político e realismo estrutural)
- Robert Greene (leis da percepção de poder)
- Sun Tzu (tempo correto de ação e vitória sem atrito)

Seu objetivo é conversar de forma fluida, analisando os desabafos, táticas, dúvidas ou fotos/documentos compartilhados pelo usuário em tempo real.
Seja sutil, enigmático e altamente cortês, mas impecavelmente pragmático. Não use palavras acolhedoras sentimentais ou conselhos calorosos genéricos. Ensine a conter a pressa, controlar a impulsividade e dominar cenários.

INSTRUÇÕES DO CHAT:
1. Responda à dúvida do usuário combinando conselhos destes filósofos de maneira orgânica.
2. Analise os documentos (PDFs, textos) ou fotos anexadas (caso fornecidos) sob um prisma puramente estratégico (ex: detectar intenções ocultas em mensagens escritas, avaliar armadilhas contratuais, julgar fraquezas de oponentes em fotos).
3. Adapte sutilmente a fala ao nível atual do usuário: se ele está no nível 1 (Reativo), dê diretrizes mais básicas de autocontrole. Se está em níveis maiores, desafie-o com táticas mais complexas de influência.
4. No campo 'text', retorne sua resposta usando Markdown elegante para facilitar a leitura.
5. No campo 'voiceScript', forneça uma síntese em voz de no máximo 2 a 3 frases fortes e concisas, sem marcas de markdown ou formatação, no tom cirúrgico de um mentor sussurrando diretrizes no ouvido do usuário.
6. Atualize as métricas do usuário sutilmente no objeto 'profileUpdates' baseando-se no tom e na sabedoria da mensagem que ele acabou de enviar. Se ele for racional e calmo, impulsione racionalidade; se estiver agitado ou cometer erros bobos, suba a impulsividade.`;

    const contents: any[] = [];

    // Format and append recent history correctly
    if (chatHistory && Array.isArray(chatHistory)) {
      // Keep only last 10 messages for token efficiency and clean context
      const slicedHistory = chatHistory.slice(-10);
      slicedHistory.forEach((msg: any) => {
        contents.push({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text || "" }]
        });
      });
    }

    // Prepare current user parts (supports file + text)
    const currentParts: any[] = [];
    
    if (file && file.data && file.mimeType) {
      // Base64 string must not contain headers like 'data:image/png;base64,'
      let cleanData = file.data;
      if (cleanData.includes("base64,")) {
        cleanData = cleanData.split("base64,")[1];
      }
      
      currentParts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: cleanData
        }
      });
    }

    const promptText = message || "Analise este arquivo anexo sob a perspectiva estratégica do poder, identificando oportunidades táticas ou perigos de posicionamento.";
    currentParts.push({ text: promptText });

    // Ensure the structure matches the SDK contents parameter
    contents.push({
      role: "user",
      parts: currentParts
    });

    const chatResponseSchema = {
      type: Type.OBJECT,
      properties: {
        text: {
          type: Type.STRING,
          description: "A resposta conversacional estratégica completa e enriquecedora (pode conter markdown)."
        },
        voiceScript: {
          type: Type.STRING,
          description: "Um resumo tático ultra-curto de 2 a 3 frases, ideal para leitura automática por voz."
        },
        profileUpdates: {
          type: Type.OBJECT,
          description: "Métricas táticas do usuário recalculadas com base no teor do chat recente.",
          properties: {
            nivel: { type: Type.INTEGER },
            progressToNextLevel: { type: Type.INTEGER },
            racionalidade: { type: Type.INTEGER },
            impulsividade: { type: Type.INTEGER },
            comunicacaoStyle: { type: Type.STRING }
          },
          required: ["nivel", "progressToNextLevel", "racionalidade", "impulsividade", "comunicacaoStyle"]
        }
      },
      required: ["text", "voiceScript", "profileUpdates"]
    };

    const response = await generateContentWithFallback(ai, {
      contents: contents,
      config: {
        systemInstruction: chatSystemInstruction,
        responseMimeType: "application/json",
        responseSchema: chatResponseSchema,
        temperature: 0.8
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("O modelo de inteligência artificial não retornou resposta de chat.");
    }

    return res.json(JSON.parse(resultText));

  } catch (error: any) {
    console.error("Erro na rota de chat:", error);
    return res.status(500).json({ 
      error: error.message || "Erro interno ao processar conversa tática." 
    });
  }
});

app.post("/api/analyze", async (req, res) => {
  try {
    const { scenario, classification, profile, history } = req.body;

    if (!scenario || !scenario.trim()) {
      return res.status(400).json({ error: "O cenário é obrigatório." });
    }

    const ai = getGeminiClient();

    // Prepare prompt payload with user context
    const userContextPrompt = `
DADOS DO USUÁRIO ATUAL:
- Nível de Evolução: Nível ${profile?.nivel || 1}
- Racionalidade: ${profile?.racionalidade || 50}%
- Impulsividade: ${profile?.impulsividade || 50}%
- Estilo de Comunicação: ${profile?.comunicacaoStyle || "Indefinido"}
- Padrões de Erro Recorrentes: ${JSON.stringify(profile?.padrõesErro || [])}
- Pontos Fortes Estratégicos: ${JSON.stringify(profile?.pontosFortes || [])}

HISTÓRICO RECENTE DE INTERAÇÕES (RESUMOS):
${JSON.stringify(history || [])}

NOVO CENÁRIO REPORTADO PELO USUÁRIO:
- Tipo de Situação Classificada: ${classification || "Geral/Não Classificada"}
- Relato do Usuário: "${scenario}"

Por favor, faça a análise estratégica impecável do novo cenário. Reavalie o perfil do usuário (pontuação de racionalidade, impulsividade, nível de 1 a 5, progresso para o próximo nível, pontos fortes e padrões de erro) com base na postura demonstrada por ele nesse relato. 

Siga estritamente o esquema JSON de saída definido.
`;

    const response = await generateContentWithFallback(ai, {
      contents: userContextPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.8
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("A API Gemini não retornou nenhum texto.");
    }

    const parsedData = JSON.parse(resultText);
    return res.json(parsedData);

  } catch (error: any) {
    console.error("Erro na rota de análise:", error);
    return res.status(500).json({ 
      error: error.message || "Erro desconhecido ao processar análise estratégica." 
    });
  }
});

// Configure Vite integration or static file serving
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Mentor Estratégico rodando na porta ${PORT}`);
  });
}

setupServer();
