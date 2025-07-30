const bcrypt = require('bcrypt');

async function generateHash() {
    const password = 'admin123';
    const saltRounds = 10;
    
    try {
        const hash = await bcrypt.hash(password, saltRounds);
        console.log('Hash gerado:', hash);
        
        // Verificar se o hash funciona
        const match = await bcrypt.compare(password, hash);
        console.log('Hash verificado:', match);
    } catch (error) {
        console.error('Erro:', error);
    }
}

generateHash(); 