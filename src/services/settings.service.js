const db = require('./db.service');

// Configurações padrão do sistema
const DEFAULT_SETTINGS = {
  newUserNotifications: true,
  requireEmailVerification: false,
  minPasswordLength: 8,
  defaultCredits: 100,
  maintenanceMode: false,
  backupFrequency: 'daily',
  dataPurgePolicy: '90days',
  auditLogs: true,
  loginAttempts: 5,
  sessionTimeout: 30
};

// Obter todas as configurações
async function getAllSettings() {
  try {
    const query = 'SELECT setting_key, setting_value, setting_type FROM system_settings';
    const results = await db.executeQuery(query);
    
    const settings = { ...DEFAULT_SETTINGS };
    
    results.forEach(row => {
      let value = row.setting_value;
      
      // Converter valores baseado no tipo
      switch (row.setting_type) {
        case 'boolean':
          value = value === 'true' || value === '1';
          break;
        case 'number':
          value = parseInt(value);
          break;
        case 'json':
          try {
            value = JSON.parse(value);
          } catch (e) {
            console.error('Error parsing JSON setting:', e);
          }
          break;
        default:
          // string - manter como está
          break;
      }
      
      settings[row.setting_key] = value;
    });
    
    return settings;
  } catch (error) {
    console.error('Error getting settings:', error);
    return DEFAULT_SETTINGS;
  }
}

// Obter uma configuração específica
async function getSetting(key) {
  try {
    const query = 'SELECT setting_value, setting_type FROM system_settings WHERE setting_key = ?';
    const results = await db.executeQuery(query, [key]);
    
    if (results.length === 0) {
      return DEFAULT_SETTINGS[key];
    }
    
    const row = results[0];
    let value = row.setting_value;
    
    // Converter valor baseado no tipo
    switch (row.setting_type) {
      case 'boolean':
        value = value === 'true' || value === '1';
        break;
      case 'number':
        value = parseInt(value);
        break;
      case 'json':
        try {
          value = JSON.parse(value);
        } catch (e) {
          console.error('Error parsing JSON setting:', e);
        }
        break;
      default:
        // string - manter como está
        break;
    }
    
    return value;
  } catch (error) {
    console.error('Error getting setting:', error);
    return DEFAULT_SETTINGS[key];
  }
}

// Salvar uma configuração
async function saveSetting(key, value) {
  try {
    // Determinar o tipo da configuração
    let settingType = 'string';
    let settingValue = value;
    
    if (typeof value === 'boolean') {
      settingType = 'boolean';
      settingValue = value ? 'true' : 'false';
    } else if (typeof value === 'number') {
      settingType = 'number';
      settingValue = value.toString();
    } else if (typeof value === 'object') {
      settingType = 'json';
      settingValue = JSON.stringify(value);
    }
    
    // Verificar se a configuração já existe
    const checkQuery = 'SELECT setting_key FROM system_settings WHERE setting_key = ?';
    const existing = await db.executeQuery(checkQuery, [key]);
    
    if (existing.length > 0) {
      // Atualizar configuração existente
      const updateQuery = 'UPDATE system_settings SET setting_value = ?, setting_type = ?, updated_at = NOW() WHERE setting_key = ?';
      await db.executeQuery(updateQuery, [settingValue, settingType, key]);
    } else {
      // Inserir nova configuração
      const insertQuery = 'INSERT INTO system_settings (setting_key, setting_value, setting_type, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())';
      await db.executeQuery(insertQuery, [key, settingValue, settingType]);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error saving setting:', error);
    return { success: false, error: error.message };
  }
}

// Salvar múltiplas configurações
async function saveSettings(settings) {
  try {
    const results = [];
    
    for (const [key, value] of Object.entries(settings)) {
      const result = await saveSetting(key, value);
      results.push({ key, ...result });
    }
    
    return { success: true, results };
  } catch (error) {
    console.error('Error saving settings:', error);
    return { success: false, error: error.message };
  }
}

// Resetar configurações para padrão
async function resetSettings() {
  try {
    const deleteQuery = 'DELETE FROM system_settings';
    await db.executeQuery(deleteQuery);
    
    return { success: true };
  } catch (error) {
    console.error('Error resetting settings:', error);
    return { success: false, error: error.message };
  }
}

// Obter histórico de mudanças de configurações
async function getSettingsHistory() {
  try {
    const query = `
      SELECT 
        setting_key,
        setting_value,
        setting_type,
        created_at,
        updated_at
      FROM system_settings 
      ORDER BY updated_at DESC
    `;
    
    const results = await db.executeQuery(query);
    return results;
  } catch (error) {
    console.error('Error getting settings history:', error);
    return [];
  }
}

module.exports = {
  getAllSettings,
  getSetting,
  saveSetting,
  saveSettings,
  resetSettings,
  getSettingsHistory,
  DEFAULT_SETTINGS
}; 