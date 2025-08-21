const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');

// Função para extrair texto de diferentes tipos de arquivo
const extractTextFromFile = async (buffer, fileName) => {
  const fileExt = path.extname(fileName).toLowerCase();
  
  try {
    switch (fileExt) {
      case '.pdf':
        const pdfData = await pdf(buffer);
        return pdfData.text;
        
      case '.docx':
        const docxResult = await mammoth.extractRawText({ buffer });
        return docxResult.value;
        
      case '.doc':
        const docResult = await mammoth.extractRawText({ buffer });
        return docResult.value;
        
      case '.txt':
        return buffer.toString('utf-8');
        
      default:
        throw new Error(`Tipo de arquivo não suportado: ${fileExt}`);
    }
  } catch (error) {
    console.error('Erro ao extrair texto do arquivo:', error);
    throw new Error(`Erro ao processar arquivo ${fileName}: ${error.message}`);
  }
};

// Função para criar resumo do conteúdo
const createContentSummary = (text, maxLength = 500) => {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  // Dividir em parágrafos
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  
  // Pegar os primeiros parágrafos até atingir o limite
  let summary = '';
  for (const paragraph of paragraphs) {
    if ((summary + paragraph).length > maxLength) {
      break;
    }
    summary += (summary ? '\n\n' : '') + paragraph;
  }
  
  // Se ainda estiver muito longo, truncar
  if (summary.length > maxLength) {
    summary = summary.substring(0, maxLength - 3) + '...';
  }
  
  return summary;
};

// Função para extrair pontos-chave do texto
const extractKeyPoints = (text, maxPoints = 5) => {
  if (!text) return [];
  
  // Dividir em frases
  const sentences = text
    .replace(/\n/g, ' ')
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 200);
  
  // Selecionar frases mais relevantes (que contêm números, datas, etc.)
  const relevantSentences = sentences
    .filter(s => 
      /\d/.test(s) || // Contém números
      /\b(importante|principal|chave|destaque|resultado|aumento|diminuição|crescimento)\b/i.test(s) || // Palavras-chave
      /\b(202[0-9]|202[0-9]|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\b/i.test(s) // Datas
    )
    .slice(0, maxPoints);
  
  return relevantSentences;
};

// Função para determinar o tipo de documento
const detectDocumentType = (text, fileName) => {
  const lowerText = text.toLowerCase();
  const lowerFileName = fileName.toLowerCase();
  
  if (lowerText.includes('relatório') || lowerText.includes('report')) {
    return 'relatório';
  }
  if (lowerText.includes('contrato') || lowerText.includes('contract')) {
    return 'contrato';
  }
  if (lowerText.includes('proposta') || lowerText.includes('proposal')) {
    return 'proposta';
  }
  if (lowerText.includes('manual') || lowerText.includes('instrução')) {
    return 'manual';
  }
  if (lowerText.includes('análise') || lowerText.includes('analysis')) {
    return 'análise';
  }
  if (lowerText.includes('planilha') || lowerText.includes('spreadsheet') || lowerFileName.includes('xls')) {
    return 'planilha';
  }
  
  return 'documento';
};

// Função principal para processar arquivo e criar contexto
const processFileForContext = async (buffer, fileName) => {
  try {
    console.log(`Processando arquivo para contexto: ${fileName}`);
    
    // Extrair texto do arquivo
    const fullText = await extractTextFromFile(buffer, fileName);
    
    if (!fullText || fullText.trim().length === 0) {
      throw new Error('Não foi possível extrair texto do arquivo');
    }
    
    // Criar resumo
    const summary = createContentSummary(fullText);
    
    // Extrair pontos-chave
    const keyPoints = extractKeyPoints(fullText);
    
    // Detectar tipo de documento
    const documentType = detectDocumentType(fullText, fileName);
    
    // Calcular estatísticas
    const stats = {
      totalWords: fullText.split(/\s+/).length,
      totalCharacters: fullText.length,
      paragraphs: fullText.split('\n\n').filter(p => p.trim().length > 0).length,
      sentences: fullText.split(/[.!?]+/).filter(s => s.trim().length > 0).length
    };
    
    // Criar contexto estruturado
    const context = {
      fileName: fileName,
      fileType: path.extname(fileName).toLowerCase(),
      fileSize: buffer.length,
      documentType: documentType,
      summary: summary,
      keyPoints: keyPoints,
      statistics: stats,
      processingTimestamp: new Date().toISOString()
    };
    
    console.log(`Contexto criado para ${fileName}:`, {
      documentType,
      summaryLength: summary.length,
      keyPointsCount: keyPoints.length,
      totalWords: stats.totalWords
    });
    
    return context;
    
  } catch (error) {
    console.error(`Erro ao processar arquivo ${fileName}:`, error);
    throw error;
  }
};

// Função para criar prompt baseado no contexto
const createContextualPrompt = (userPrompt, fileContext) => {
  const prompt = `
${userPrompt || 'Analise este documento'}

**CONTEXTO DO ARQUIVO:**
- Nome: ${fileContext.fileName}
- Tipo: ${fileContext.documentType}
- Tamanho: ${(fileContext.fileSize / 1024 / 1024).toFixed(2)} MB
- Palavras: ${fileContext.statistics.totalWords}
- Parágrafos: ${fileContext.statistics.paragraphs}

**RESUMO:**
${fileContext.summary}

**PONTOS-CHAVE:**
${fileContext.keyPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}

**INSTRUÇÕES:**
Base sua análise no contexto fornecido acima. Se precisar de informações específicas que não estão no resumo, peça ao usuário para fornecer mais detalhes sobre a seção específica do documento.
`;

  return prompt.trim();
};

// Função para validar se o arquivo pode ser processado
const canProcessFile = (fileName) => {
  const supportedExtensions = ['.pdf', '.docx', '.doc', '.txt'];
  const fileExt = path.extname(fileName).toLowerCase();
  return supportedExtensions.includes(fileExt);
};

// Função para estimar tokens do contexto
const estimateContextTokens = (context) => {
  const contextText = JSON.stringify(context);
  return Math.ceil(contextText.length / 4); // Estimativa conservadora
};

module.exports = {
  processFileForContext,
  createContextualPrompt,
  canProcessFile,
  estimateContextTokens,
  extractTextFromFile,
  createContentSummary,
  extractKeyPoints,
  detectDocumentType
}; 