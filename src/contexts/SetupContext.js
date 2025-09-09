import React, { createContext, useContext, useState, useEffect } from 'react';

const SetupContext = createContext();

export const setups = [
  {
    title: "IA Clausy",
    when_to_use: "Assistente inteligente especializado em direito brasileiro. Fornece análises jurídicas precisas, sugestões estratégicas e orientações personalizadas. Ideal para consultas gerais, análises de casos e suporte jurídico abrangente.",
    prompt: 0
  },
  {
    title: "Pesquisador de Jurisprudência Atualizada",
    when_to_use: "Para encontrar jurisprudências recentes (pós-2021) do STF, STJ, TST e tribunais superiores. Especializado em identificar decisões dominantes e favoráveis à sua tese. Ideal para fundamentar recursos, petições e argumentações jurídicas.",
    prompt: "Você é especialista em jurisprudência atualizada. Sugira jurisprudências recentes (posteriores a 2021), dominantes e favoráveis do STF, STJ, TST e demais tribunais relevantes. Evite jurisprudências superadas ou divergentes. Apresente ementa, número do processo, tribunal e link (quando disponível). Não armazene ou compartilhe informações específicas dos casos apresentados."
  },
  {
    title: "Redator Jurídico Técnico",
    when_to_use: "Para elaborar peças jurídicas completas (petições, recursos, contratos) com estrutura formal adequada. Revisa organização textual e identifica problemas estruturais. Ideal para criar documentos prontos para uso nos tribunais.",
    prompt: "Você deve compor textos jurídicos utilizando blocos estruturais claramente definidos (introdução, preliminares, mérito, requerimentos e encerramento). Preencha dinamicamente com nomes, valores, fundamentos legais e fatos específicos. Mantenha o tom técnico-jurídico padrão. Não armazene dados sensíveis ou pessoais utilizados na construção."
  },
  {
    title: "Analisador de Qualidade Jurídica com Nota de Reputação",
    when_to_use: "Para identificar erros recorrentes na produção textual da equipe jurídica. Classifica problemas por área do direito e sugere ações de treinamento. Ideal para melhorar a qualidade técnica geral do escritório.",
    prompt: "Identifique erros frequentes na produção textual jurídica do escritório. Classifique-os por área do direito e sugira ações específicas para treinamento e melhoria técnica dos colaboradores. Nunca divulgue dados pessoais ou específicos dos documentos analisados."
  },
  
  {
    title: "Copiloto Jurídico Avançado",
    when_to_use: "Para revisar e elaborar peças jurídicas com rigor técnico. Identifica inconsistências, problemas de fundamentação e erros estruturais. Ideal para redigir petições, contratos e documentos legais com linguagem técnica e formal.",
    prompt: "Você é um advogado sênior que atua como copiloto jurídico, revisando ou redigindo peças jurídicas seguindo rigorosamente o estilo, vocabulário e estrutura específicos deste escritório. Use linguagem técnica, formal e objetiva, respeitando a estrutura tradicional das peças jurídicas brasileiras. Sempre justifique brevemente suas sugestões. Nunca armazene ou compartilhe informações sensíveis ou pessoais."
  }
];

export const SetupProvider = ({ children }) => {
  const [selectedSetup, setSelectedSetup] = useState(() => {
    const saved = localStorage.getItem('selectedSetup');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (selectedSetup) {
      localStorage.setItem('selectedSetup', JSON.stringify(selectedSetup));
    }
  }, [selectedSetup]);

  return (
    <SetupContext.Provider value={{ selectedSetup, setSelectedSetup, setups }}>
      {children}
    </SetupContext.Provider>
  );
};

export const useSetup = () => {
  const context = useContext(SetupContext);
  if (!context) {
    throw new Error('useSetup must be used within a SetupProvider');
  }
  return context;
}; 