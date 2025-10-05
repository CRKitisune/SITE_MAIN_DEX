const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const dbPath = path.join(__dirname, 'barbearia_nativa.db');
      
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('❌ Erro ao conectar com o banco de dados:', err.message);
          reject(err);
          return;
        }
        
        console.log('✅ Conectado ao banco de dados SQLite.');
        this.createTables()
          .then(() => this.seedData())
          .then(() => {
            console.log('🎉 Banco de dados inicializado com sucesso!');
            resolve(this);
          })
          .catch(reject);
      });
    });
  }

  async createTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS servicos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome VARCHAR(100) NOT NULL,
        descricao TEXT,
        preco DECIMAL(10,2) NOT NULL,
        duracao INTEGER NOT NULL,
        ativo BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS agendamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_nome VARCHAR(100) NOT NULL,
        cliente_email VARCHAR(100),
        cliente_telefone VARCHAR(20),
        servico_id INTEGER NOT NULL,
        data_agendamento DATE NOT NULL,
        hora_agendamento TIME NOT NULL,
        observacoes TEXT,
        status VARCHAR(20) DEFAULT 'confirmado',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (servico_id) REFERENCES servicos (id)
      )`,

      `CREATE TABLE IF NOT EXISTS horarios_funcionamento (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dia_semana INTEGER NOT NULL,
        abre TIME NOT NULL,
        fecha TIME NOT NULL,
        ativo BOOLEAN DEFAULT 1
      )`
    ];

    for (let i = 0; i < tables.length; i++) {
      await this.run(tables[i]);
    }
    console.log('✅ Todas as tabelas foram criadas/verificadas.');
  }

  async seedData() {
    // Verificar se já existem serviços
    const result = await this.get("SELECT COUNT(*) as count FROM servicos");
    
    if (result.count > 0) {
      console.log('📊 Dados já existem no banco.');
      return;
    }

    console.log('🌱 Inserindo dados iniciais...');

    const servicos = [
      { nome: "Corte de Cabelo", descricao: "Corte profissional com técnicas tradicionais e modernas", preco: 50.00, duracao: 30 },
      { nome: "Barba Completa", descricao: "Modelagem e acabamento perfeito para sua barba", preco: 40.00, duracao: 20 },
      { nome: "Pacote Completo", descricao: "Corte de cabelo + barba + tratamento capilar", preco: 80.00, duracao: 60 },
      { nome: "Coloração", descricao: "Coloração profissional para barba e cabelo", preco: 70.00, duracao: 45 },
      { nome: "Hidratação Capilar", descricao: "Tratamento intensivo para cabelo e barba", preco: 60.00, duracao: 25 },
      { nome: "Massagem Relaxante", descricao: "Massagem terapêutica para aliviar o estresse", preco: 45.00, duracao: 15 }
    ];

    const horarios = [
      { dia_semana: 1, abre: '09:00', fecha: '19:00' },
      { dia_semana: 2, abre: '09:00', fecha: '19:00' },
      { dia_semana: 3, abre: '09:00', fecha: '19:00' },
      { dia_semana: 4, abre: '09:00', fecha: '19:00' },
      { dia_semana: 5, abre: '09:00', fecha: '19:00' },
      { dia_semana: 6, abre: '09:00', fecha: '17:00' },
      { dia_semana: 0, abre: '00:00', fecha: '00:00', ativo: 0 }
    ];

    // Inserir serviços
    for (const servico of servicos) {
      await this.run(
        "INSERT INTO servicos (nome, descricao, preco, duracao) VALUES (?, ?, ?, ?)",
        [servico.nome, servico.descricao, servico.preco, servico.duracao]
      );
    }

    // Inserir horários
    for (const horario of horarios) {
      await this.run(
        "INSERT INTO horarios_funcionamento (dia_semana, abre, fecha, ativo) VALUES (?, ?, ?, ?)",
        [horario.dia_semana, horario.abre, horario.fecha, horario.ativo || 1]
      );
    }

    console.log('✅ Dados iniciais inseridos com sucesso!');
  }

  // Métodos utilitários
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else {
          console.log('✅ Conexão com banco fechada.');
          resolve();
        }
      });
    });
  }
}

// Exportar uma instância única
module.exports = new Database();