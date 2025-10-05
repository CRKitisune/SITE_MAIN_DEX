const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/database');

const router = express.Router();

// Validações para contato
const contatoValidation = [
    body('nome').notEmpty().withMessage('Nome é obrigatório'),
    body('email').isEmail().withMessage('Email inválido'),
    body('telefone').optional().isMobilePhone('pt-BR').withMessage('Telefone inválido'),
    body('mensagem').notEmpty().withMessage('Mensagem é obrigatória')
];

// GET /api/contatos - Listar todos os contatos
router.get('/', (req, res) => {
    const { lido, limit = 50, offset = 0 } = req.query;
    let query = 'SELECT * FROM contatos';
    const params = [];

    if (lido !== undefined) {
        query += ' WHERE lido = ?';
        params.push(lido === 'true' ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Erro ao buscar contatos:', err);
            return res.status(500).json({ 
                error: 'Erro interno do servidor',
                message: err.message 
            });
        }
        res.json(rows);
    });
});

// GET /api/contatos/:id - Buscar contato específico
router.get('/:id', (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT * FROM contatos WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Erro ao buscar contato:', err);
            return res.status(500).json({ 
                error: 'Erro interno do servidor',
                message: err.message 
            });
        }
        
        if (!row) {
            return res.status(404).json({ 
                error: 'Contato não encontrado' 
            });
        }
        
        res.json(row);
    });
});

// POST /api/contatos - Criar novo contato
router.post('/', contatoValidation, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Dados inválidos',
            details: errors.array() 
        });
    }

    const { nome, email, telefone, mensagem } = req.body;

    // Criar contato
    db.run(`
        INSERT INTO contatos (nome, email, telefone, mensagem)
        VALUES (?, ?, ?, ?)
    `, [nome, email, telefone, mensagem], function(err) {
        if (err) {
            console.error('Erro ao criar contato:', err);
            return res.status(500).json({ 
                error: 'Erro interno do servidor',
                message: err.message 
            });
        }

        res.status(201).json({
            message: 'Mensagem enviada com sucesso! 📧',
            id: this.lastID,
            contato: {
                id: this.lastID,
                nome,
                email,
                telefone,
                mensagem,
                lido: false
            }
        });
    });
});

// PUT /api/contatos/:id - Marcar como lido/não lido
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { lido } = req.body;

    if (typeof lido !== 'boolean') {
        return res.status(400).json({ 
            error: 'Campo "lido" deve ser um booleano' 
        });
    }

    db.run('UPDATE contatos SET lido = ? WHERE id = ?', [lido ? 1 : 0, id], function(err) {
        if (err) {
            console.error('Erro ao atualizar contato:', err);
            return res.status(500).json({ 
                error: 'Erro interno do servidor',
                message: err.message 
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({ 
                error: 'Contato não encontrado' 
            });
        }

        res.json({
            message: `Contato marcado como ${lido ? 'lido' : 'não lido'}! ✅`,
            changes: this.changes
        });
    });
});

// DELETE /api/contatos/:id - Deletar contato
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM contatos WHERE id = ?', [id], function(err) {
        if (err) {
            console.error('Erro ao deletar contato:', err);
            return res.status(500).json({ 
                error: 'Erro interno do servidor',
                message: err.message 
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({ 
                error: 'Contato não encontrado' 
            });
        }

        res.json({
            message: 'Contato deletado com sucesso! 🗑️',
            changes: this.changes
        });
    });
});

// GET /api/contatos/stats - Estatísticas dos contatos
router.get('/stats/overview', (req, res) => {
    const queries = [
        'SELECT COUNT(*) as total FROM contatos',
        'SELECT COUNT(*) as nao_lidos FROM contatos WHERE lido = 0',
        'SELECT COUNT(*) as hoje FROM contatos WHERE DATE(created_at) = DATE("now")',
        'SELECT COUNT(*) as esta_semana FROM contatos WHERE DATE(created_at) >= DATE("now", "-7 days")'
    ];

    Promise.all(queries.map(query => 
        new Promise((resolve, reject) => {
            db.get(query, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        })
    )).then(results => {
        const [total, nao_lidos, hoje, esta_semana] = results;
        
        res.json({
            total: total.total,
            nao_lidos: nao_lidos.nao_lidos,
            hoje: hoje.hoje,
            esta_semana: esta_semana.esta_semana,
            lidos: total.total - nao_lidos.nao_lidos
        });
    }).catch(err => {
        console.error('Erro ao buscar estatísticas:', err);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            message: err.message 
        });
    });
});

// GET /api/contatos/recent - Contatos recentes
router.get('/recent/:limit?', (req, res) => {
    const limit = parseInt(req.params.limit) || 10;
    
    db.all(`
        SELECT * FROM contatos 
        ORDER BY created_at DESC 
        LIMIT ?
    `, [limit], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar contatos recentes:', err);
            return res.status(500).json({ 
                error: 'Erro interno do servidor',
                message: err.message 
            });
        }
        res.json(rows);
    });
});

module.exports = router;

