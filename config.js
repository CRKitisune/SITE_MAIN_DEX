module.exports = {
    // Configurações do servidor
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || 'localhost'
    },
    
    // Configurações do banco de dados
    database: {
        path: process.env.DB_PATH || './database/barbearia.db'
    },
    
    // Configurações de horário de funcionamento
    business: {
        openingTime: '09:00',
        closingTime: '19:00',
        appointmentInterval: 30, // minutos
        workingDays: [1, 2, 3, 4, 5, 6], // 1=segunda, 7=domingo
        closedDays: [7] // domingo
    },
    
    // Configurações de email (para futuras implementações)
    email: {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER || '',
            pass: process.env.EMAIL_PASS || ''
        }
    },
    
    // Configurações de CORS
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true
    },
    
    // Configurações de validação
    validation: {
        maxNameLength: 100,
        maxMessageLength: 1000,
        maxObservationsLength: 500
    }
};
