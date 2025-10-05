const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Importar rotas
const agendamentosRoutes = require('./routes/agendamentos');
const servicosRoutes = require('./routes/servicos');
const contatosRoutes = require('./routes/contatos');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir arquivos estáticos (frontend)
app.use(express.static(path.join(__dirname)));

// Rotas da API
app.use('/api/agendamentos', agendamentosRoutes);
app.use('/api/servicos', servicosRoutes);
app.use('/api/contatos', contatosRoutes);

// Rota para servir o frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota de teste
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Backend da Barbearia Nativa funcionando! 🚀',
        timestamp: new Date().toISOString()
    });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Algo deu errado! 😅',
        message: err.message 
    });
});

// Rota 404
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Rota não encontrada! 🤷‍♂️',
        path: req.originalUrl 
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`📱 Frontend (Rede): http://[SEU_IP]:${PORT}`);
    console.log(`🔧 API: http://localhost:${PORT}/api`);
    console.log(`🔧 API (Rede): http://[SEU_IP]:${PORT}/api`);
});
