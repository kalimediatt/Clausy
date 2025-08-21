// Função para limpar respostas da IA que contêm conteúdo de arquivo
const cleanAIResponse = (response) => {
  if (!response || typeof response !== 'string') {
    return response;
  }

  let cleanedResponse = response;

  // Padrões para identificar conteúdo de arquivo ou instruções da IA
  const patterns = [
    // Padrões de instruções da IA sobre arquivos
    /--- DOCUMENTO ANEXADO:.*?---\s*\n.*?--- FIM DO DOCUMENTO ---/gs,
    /Por favor, analise o documento anexado abaixo.*?Base sua resposta no documento acima\./gs,
    /NÃO reproduza o conteúdo completo do documento na resposta.*?apenas extraia as informações relevantes/gs,
    
    // Padrões de conteúdo de arquivo
    /Conteúdo do arquivo.*?:\s*\n/gi,
    /Arquivo enviado.*?:\s*\n/gi,
    /Documento anexado.*?:\s*\n/gi,
    
    // Padrões de repetição de texto (indicam conteúdo de arquivo)
    /(.{50,})\1{2,}/gs, // Texto repetido 3+ vezes
    
    // Padrões de formatação de documento
    /^\s*Página \d+\s*$/gm,
    /^\s*\d+\s*$/gm, // Linhas apenas com números
    /^\s*[A-Z\s]+\s*$/gm, // Linhas apenas com maiúsculas
    
    // Padrões de cabeçalho/rodapé de documento
    /^\s*.*?\s*\|\s*Página \d+\s*$/gm,
    /^\s*.*?\s*\|\s*\d+\s*$/gm,
    
    // Padrões de tabela sem contexto
    /^\s*\|.*\|.*\|.*\|\s*$/gm,
    /^\s*[-=]{3,}\s*$/gm,
  ];

  // Aplicar cada padrão
  patterns.forEach(pattern => {
    cleanedResponse = cleanedResponse.replace(pattern, '');
  });

  // Remover linhas vazias excessivas
  cleanedResponse = cleanedResponse.replace(/\n{3,}/g, '\n\n');
  
  // Remover espaços em branco no início e fim
  cleanedResponse = cleanedResponse.trim();

  // Se a resposta ficou muito curta após a limpeza, tentar extrair a parte relevante
  if (cleanedResponse.length < 50 && response.length > 200) {
    // Tentar encontrar a última parte da resposta (geralmente a mais relevante)
    const lines = response.split('\n').filter(line => line.trim().length > 0);
    const lastLines = lines.slice(-3); // Últimas 3 linhas não vazias
    cleanedResponse = lastLines.join('\n');
  }

  return cleanedResponse;
};

// Função para detectar se uma resposta contém conteúdo de arquivo
const hasFileContent = (response) => {
  if (!response || typeof response !== 'string') {
    return false;
  }

  const indicators = [
    // Padrões que indicam conteúdo de arquivo
    /--- DOCUMENTO ANEXADO:/i,
    /Conteúdo do arquivo/i,
    /Arquivo enviado:/i,
    /Documento anexado:/i,
    /Por favor, analise o documento/i,
    /NÃO reproduza o conteúdo completo/i,
    
    // Texto muito longo e repetitivo
    /(.{100,})\1{2,}/s,
    
    // Muitas linhas com números apenas
    /^\s*\d+\s*$/gm,
    
    // Formatação de tabela sem contexto
    /^\s*\|.*\|.*\|.*\|\s*$/gm,
  ];

  return indicators.some(pattern => pattern.test(response));
};

// Função para limpar mensagem antes de salvar no histórico
const cleanMessageForHistory = (message) => {
  if (!message || typeof message !== 'object') {
    return message;
  }

  // Se for uma mensagem do assistente e contiver conteúdo de arquivo
  if (message.role === 'assistant' && message.content && hasFileContent(message.content)) {
    const cleanedContent = cleanAIResponse(message.content);
    
    return {
      ...message,
      content: cleanedContent,
      wasCleaned: true // Flag para indicar que foi limpa
    };
  }

  return message;
};

// Função para validar se uma resposta é válida após limpeza
const isValidResponse = (response) => {
  if (!response || typeof response !== 'string') {
    return false;
  }

  const cleaned = cleanAIResponse(response);
  
  // Verificar se a resposta limpa ainda tem conteúdo significativo
  return cleaned.length >= 20 && 
         !cleaned.match(/^\s*$/g) && // Não é apenas espaços em branco
         cleaned.split(' ').length >= 3; // Pelo menos 3 palavras
};

module.exports = {
  cleanAIResponse,
  hasFileContent,
  cleanMessageForHistory,
  isValidResponse
};

