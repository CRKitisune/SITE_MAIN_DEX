const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/database');
const moment = require('moment');

const router = express.Router();

// Validações para agendamento
const agendamentoValidation = [
    body('nome').notEmpty().withMessage('Nome é obrigatório'),
    body('email').isEmail().withMessage('Email inválido'),
    body('telefone').optional().isMobilePhone('pt-BR').withMessage('Telefone inválido'),
    body('servico_id').isInt().withMessage('ID do serviço deve ser um número'),
    body('data_agendamento').isISO8601().withMessage('Data inválida'),
    body('hora_agendamento').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Hora inválida'),
    body('observacoes').optional().isString()
];

// GET /api/agendamentos - Listar todos os agendamentos
router.get('/', (req, res) => {
    const { data, status } = req.query;
    let query = `
        SELECT a.*, s.nome as servico_nome, s.preco as servico_preco 
        FROM agendamentos a 
        LEFT JOIN servicos s ON a.servico_id = s.id
    `;
    const params = [];

    if (data) {
        query += ' WHERE DATE(a.data_agendamento) = ?';
        params.push(data);
    }

    if (status) {
        query += data ? ' AND a.status = ?' : ' WHERE a.status = ?';
        params.push(status);
    }

    query += ' ORDER BY a.data_agendamento DESC, a.hora_agendamento DESC';

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Erro ao buscar agendamentos:', err);
            return res.status(500).json({ 
                error: 'Erro interno do servidor',
                message: err.message 
            });
        }
        res.json(rows);
    });
});

// GET /api/agendamentos/:id - Buscar agendamento específico
router.get('/:id', (req, res) => {
    const { id } = req.params;
    
    db.get(`
        SELECT a.*, s.nome as servico_nome, s.preco as servico_preco 
        FROM agendamentos a 
        LEFT JOIN servicos s ON a.servico_id = s.id 
        WHERE a.id = ?
    `, [id], (err, row) => {
        if (err) {
            console.error('Erro ao buscar agendamento:', err);
            return res.status(500).json({ 
                error: 'Erro interno do servidor',
                message: err.message 
            });
        }
        
        if (!row) {
            return res.status(404).json({ 
                error: 'Agendamento não encontrado' 
            });
        }
        
        res.json(row);
    });
});

// POST /api/agendamentos - Criar novo agendamento
router.post('/', agendamentoValidation, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Dados inválidos',
            details: errors.array() 
        });
    }

    const { nome, email, telefone, servico_id, data_agendamento, hora_agendamento, observacoes } = req.body;

    // Verificar se o serviço existe
    db.get('SELECT * FROM servicos WHERE id = ? AND ativo = 1', [servico_id], (err, servico) => {
        if (err) {
            console.error('Erro ao verificar serviço:', err);
            return res.status(500).json({ 
                error: 'Erro interno do servidor',
                message: err.message 
            });
        }

        if (!servico) {
            return res.status(400).json({ 
                error: 'Serviço não encontrado ou inativo' 
            });
        }

        // Verificar se já existe agendamento no mesmo horário
        db.get(`
            SELECT id FROM agendamentos 
            WHERE data_agendamento = ? AND hora_agendamento = ? AND status != 'cancelado'
        `, [data_agendamento, hora_agendamento], (err, conflito) => {
            if (err) {
                console.error('Erro ao verificar conflito:', err);
                return res.status(500).json({ 
                    error: 'Erro interno do servidor',
                    message: err.message 
                });
            }

            if (conflito) {
                return res.status(400).json({ 
                    error: 'Já existe um agendamento neste horário' 
                });
            }

            // Criar agendamento
            db.run(`
                INSERT INTO agendamentos (nome, email, telefone, servico_id, data_agendamento, hora_agendamento, observacoes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [nome, email, telefone, servico_id, data_agendamento, hora_agendamento, observacoes], function(err) {
                if (err) {
                    console.error('Erro ao criar agendamento:', err);
                    return res.status(500).json({ 
                        error: 'Erro interno do servidor',
                        message: err.message 
                    });
                }

                res.status(201).json({
                    message: 'Agendamento criado com sucesso! 🎉',
                    id: this.lastID,
                    agendamento: {
                        id: this.lastID,
                        nome,
                        email,
                        telefone,
                        servico_id,
                        data_agendamento,
                        hora_agendamento,
                        observacoes,
                        status: 'pendente'
                    }
                });
            });
        });
    });
});

// PUT /api/agendamentos/:id - Atualizar agendamento
router.put('/:id', agendamentoValidation, (req, res) => {
    const { id } = req.params;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Dados inválidos',
            details: errors.array() 
        });
    }

    const { nome, email, telefone, servico_id, data_agendamento, hora_agendamento, observacoes, status } = req.body;

    db.run(`
        UPDATE agendamentos 
        SET nome = ?, email = ?, telefone = ?, servico_id = ?, 
            data_agendamento = ?, hora_agendamento = ?, observacoes = ?, status = ?
        WHERE id = ?
    `, [nome, email, telefone, servico_id, data_agendamento, hora_agendamento, observacoes, status, id], function(err) {
        if (err) {
            console.error('Erro ao atualizar agendamento:', err);
            return res.status(500).json({ 
                error: 'Erro interno do servidor',
                message: err.message 
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({ 
                error: 'Agendamento não encontrado' 
            });
        }

        res.json({
            message: 'Agendamento atualizado com sucesso! ✅',
            changes: this.changes
        });
    });
});

// DELETE /api/agendamentos/:id - Cancelar agendamento
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    db.run('UPDATE agendamentos SET status = "cancelado" WHERE id = ?', [id], function(err) {
        if (err) {
            console.error('Erro ao cancelar agendamento:', err);
            return res.status(500).json({ 
                error: 'Erro interno do servidor',
                message: err.message 
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({ 
                error: 'Agendamento não encontrado' 
            });
        }

        res.json({
            message: 'Agendamento cancelado com sucesso! ❌',
            changes: this.changes
        });
    });
});

// GET /api/agendamentos/disponibilidade/:data - Verificar horários disponíveis
router.get('/disponibilidade/:data', (req, res) => {
    const { data } = req.params;
    
    // Horários de funcionamento (9h às 19h)
    const horarios = [];
    for (let hora = 9; hora < 19; hora++) {
        for (let minuto = 0; minuto < 60; minuto += 30) {
            const timeString = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
            horarios.push(timeString);
        }
    }

    // Buscar horários ocupados
    db.all(`
        SELECT hora_agendamento FROM agendamentos 
        WHERE data_agendamento = ? AND status != 'cancelado'
    `, [data], (err, ocupados) => {
        if (err) {
            console.error('Erro ao buscar horários ocupados:', err);
            return res.status(500).json({ 
                error: 'Erro interno do servidor',
                message: err.message 
            });
        }

        const horariosOcupados = ocupados.map(row => row.hora_agendamento);
        const horariosDisponiveis = horarios.filter(horario => !horariosOcupados.includes(horario));

        res.json({
            data,
            horarios_disponiveis: horariosDisponiveis,
            total_disponivel: horariosDisponiveis.length
        });
    });
});

module.exports = router;
