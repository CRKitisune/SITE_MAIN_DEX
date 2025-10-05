const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/database');

const router = express.Router();

// Validações para serviço
const servicoValidation = [
    body('nome').notEmpty().withMessage('Nome é obrigatório'),
    body('descricao').optional().isString(),
    body('preco').isFloat({ min: 0 }).withMessage('Preço deve ser um número positivo'),
    body('duracao').optional().isInt({ min: 15 }).withMessage('Duração deve ser pelo menos 15 minutos'),
    body('ativo').optional().isBoolean()
];

// GET /api/servicos - Listar todos os serviços
router.get('/', (req, res) => {
    const { ativo } = req.query;
    let query = 'SELECT * FROM servicos';
    const params = [];

    if (ativo !== undefined) {
        query += ' WHERE ativo = ?';
        params.push(ativo === 'true' ? 1 : 0);
    }

    query += ' ORDER BY nome ASC';

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Erro ao buscar serviços:', err);
            return res.status(500).json({ 
                error: 'Erro interno do servidor',
                message: err.message 
            });
        }
        res.json(rows);
    });
});

// GET /api/servicos/:id - Buscar serviço específico
router.get('/:id', (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT * FROM servicos WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Erro ao buscar serviço:', err);
            return res.status(500).json({ 
                error: 'Erro interno do servidor',
                message: err.message 
            });
        }
        
        if (!row) {
            return res.status(404).json({ 
                error: 'Serviço não encontrado' 
            });
        }
        
        res.json(row);
    });
});

// POST /api/servicos - Criar novo serviço
router.post('/', servicoValidation, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Dados inválidos',
            details: errors.array() 
        });
    }

    const { nome, descricao, preco, duracao = 60, ativo = true } = req.body;

    // Verificar se já existe serviço com o mesmo nome
    db.get('SELECT id FROM servicos WHERE nome = ?', [nome], (err, existente) => {
        if (err) {
            console.error('Erro ao verificar serviço existente:', err);
            return res.status(500).json({ 
                error: 'Erro interno do servidor',
                message: err.message 
            });
        }

        if (existente) {
            return res.status(400).json({ 
                error: 'Já existe um serviço com este nome' 
            });
        }

        // Criar serviço
        db.run(`
            INSERT INTO servicos (nome, descricao, preco, duracao, ativo)
            VALUES (?, ?, ?, ?, ?)
        `, [nome, descricao, preco, duracao, ativo ? 1 : 0], function(err) {
            if (err) {
                console.error('Erro ao criar serviço:', err);
                return res.status(500).json({ 
                    error: 'Erro interno do servidor',
                    message: err.message 
                });
            }

            res.status(201).json({
                message: 'Serviço criado com sucesso! 🎉',
                id: this.lastID,
                servico: {
                    id: this.lastID,
                    nome,
                    descricao,
                    preco,
                    duracao,
                    ativo
                }
            });
        });
    });
});

// PUT /api/servicos/:id - Atualizar serviço
router.put('/:id', servicoValidation, (req, res) => {
    const { id } = req.params;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Dados inválidos',
            details: errors.array() 
        });
    }

    const { nome, descricao, preco, duracao, ativo } = req.body;

    // Verificar se o serviço existe
    db.get('SELECT * FROM servicos WHERE id = ?', [id], (err, servico) => {
        if (err) {
            console.error('Erro ao verificar serviço:', err);
            return res.status(500).json({ 
                error: 'Erro interno do servidor',
                message: err.message 
            });
        }

        if (!servico) {
            return res.status(404).json({ 
                error: 'Serviço não encontrado' 
            });
        }

        // Verificar se nome já existe em outro serviço
        if (nome !== servico.nome) {
            db.get('SELECT id FROM servicos WHERE nome = ? AND id != ?', [nome, id], (err, existente) => {
                if (err) {
                    console.error('Erro ao verificar nome duplicado:', err);
                    return res.status(500).json({ 
                        error: 'Erro interno do servidor',
                        message: err.message 
                    });
                }

                if (existente) {
                    return res.status(400).json({ 
                        error: 'Já existe um serviço com este nome' 
                    });
                }

                // Atualizar serviço
                atualizarServico();
            });
        } else {
            atualizarServico();
        }
    });

    function atualizarServico() {
        db.run(`
            UPDATE servicos 
            SET nome = ?, descricao = ?, preco = ?, duracao = ?, ativo = ?
            WHERE id = ?
        `, [nome, descricao, preco, duracao, ativo ? 1 : 0, id], function(err) {
            if (err) {
                console.error('Erro ao atualizar serviço:', err);
                return res.status(500).json({ 
                    error: 'Erro interno do servidor',
                    message: err.message 
                });
            }

            res.json({
                message: 'Serviço atualizado com sucesso! ✅',
                changes: this.changes
            });
        });
    }
});

// DELETE /api/servicos/:id - Desativar serviço (soft delete)
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    // Verificar se há agendamentos ativos para este serviço
    db.get(`
        SELECT COUNT(*) as count FROM agendamentos 
        WHERE servico_id = ? AND status IN ('pendente', 'confirmado')
    `, [id], (err, result) => {
        if (err) {
            console.error('Erro ao verificar agendamentos:', err);
            return res.status(500).json({ 
                error: 'Erro interno do servidor',
                message: err.message 
            });
        }

        if (result.count > 0) {
            return res.status(400).json({ 
                error: 'Não é possível desativar serviço com agendamentos ativos',
                agendamentos_ativos: result.count
            });
        }

        // Desativar serviço
        db.run('UPDATE servicos SET ativo = 0 WHERE id = ?', [id], function(err) {
            if (err) {
                console.error('Erro ao desativar serviço:', err);
                return res.status(500).json({ 
                    error: 'Erro interno do servidor',
                    message: err.message 
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({ 
                    error: 'Serviço não encontrado' 
                });
            }

            res.json({
                message: 'Serviço desativado com sucesso! ❌',
                changes: this.changes
            });
        });
    });
});

// GET /api/servicos/:id/agendamentos - Listar agendamentos de um serviço
router.get('/:id/agendamentos', (req, res) => {
    const { id } = req.params;
    const { data, status } = req.query;
    
    let query = `
        SELECT a.*, s.nome as servico_nome, s.preco as servico_preco 
        FROM agendamentos a 
        LEFT JOIN servicos s ON a.servico_id = s.id 
        WHERE a.servico_id = ?
    `;
    const params = [id];

    if (data) {
        query += ' AND DATE(a.data_agendamento) = ?';
        params.push(data);
    }

    if (status) {
        query += ' AND a.status = ?';
        params.push(status);
    }

    query += ' ORDER BY a.data_agendamento DESC, a.hora_agendamento DESC';

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Erro ao buscar agendamentos do serviço:', err);
            return res.status(500).json({ 
                error: 'Erro interno do servidor',
                message: err.message 
            });
        }
        res.json(rows);
    });
});

module.exports = router;
