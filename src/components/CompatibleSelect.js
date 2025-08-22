import React, { useState, useEffect } from 'react';
import CustomSelect from './CustomSelect';
import FallbackSelect from './FallbackSelect';

/**
 * Componente que detecta automaticamente a compatibilidade do navegador
 * e usa o componente de select apropriado
 */
const CompatibleSelect = (props) => {
  const [isCustomSelectSupported, setIsCustomSelectSupported] = useState(true);

  useEffect(() => {
    // Detectar compatibilidade do navegador
    const detectBrowserSupport = () => {
      // Verificar se o navegador suporta CSS Grid (indicador de navegador moderno)
      const supportsGrid = CSS.supports('display', 'grid');
      
      // Verificar se suporta CSS custom properties
      const supportsCustomProperties = CSS.supports('--custom-property', 'value');
      
      // Verificar se suporta backdrop-filter
      const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(10px)');
      
      // Verificar se é um navegador móvel antigo
      const isOldMobile = /Android [1-4]|iPhone OS [1-7]|iPad OS [1-7]/.test(navigator.userAgent);
      
      // Verificar se é IE ou Edge antigo
      const isOldIE = /MSIE|Trident/.test(navigator.userAgent);
      
      // Verificar se é Safari antigo
      const isOldSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent) && 
                         parseInt(navigator.userAgent.match(/Version\/(\d+)/)?.[1] || '0') < 12;
      
      // Verificar se é Firefox antigo
      const isOldFirefox = /Firefox/.test(navigator.userAgent) && 
                          parseInt(navigator.userAgent.match(/Firefox\/(\d+)/)?.[1] || '0') < 60;
      
      // Se qualquer uma das condições de navegador antigo for verdadeira, usar fallback
      const shouldUseFallback = isOldMobile || isOldIE || isOldSafari || isOldFirefox || 
                               !supportsGrid || !supportsCustomProperties;
      
      setIsCustomSelectSupported(!shouldUseFallback);
      
      // Log para debug
      console.log('🔍 CompatibleSelect: Detecção de navegador:', {
        userAgent: navigator.userAgent,
        supportsGrid,
        supportsCustomProperties,
        supportsBackdropFilter,
        isOldMobile,
        isOldIE,
        isOldSafari,
        isOldFirefox,
        shouldUseFallback,
        usingCustomSelect: !shouldUseFallback
      });
    };

    detectBrowserSupport();
  }, []);

  // Se o navegador não suporta o CustomSelect, usar o FallbackSelect
  if (!isCustomSelectSupported) {
    console.log('⚠️ CompatibleSelect: Usando FallbackSelect para compatibilidade');
    return <FallbackSelect {...props} />;
  }

  // Caso contrário, usar o CustomSelect
  console.log('✅ CompatibleSelect: Usando CustomSelect');
  return <CustomSelect {...props} />;
};

export default CompatibleSelect;
