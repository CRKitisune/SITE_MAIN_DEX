# 🚀 Barbearia Nativa - Sistema de Agendamentos

Sistema completo de agendamentos para barbearia com frontend responsivo e backend robusto.

## ✨ Funcionalidades

### Frontend
- 🎨 Design responsivo e moderno
- 📱 Interface mobile-friendly
- 📅 Sistema de agendamento online
- 📧 Formulário de contato funcional
- 🖼️ Galeria de trabalhos
- ⚡ Notificações em tempo real

### Backend
- 🔧 API REST completa
- 🗄️ Banco de dados SQLite
- 📊 CRUD para agendamentos, serviços e contatos
- ✅ Validação de dados
- 🕐 Verificação de horários disponíveis
- 📈 Estatísticas e relatórios

## 🛠️ Tecnologias Utilizadas

### Frontend
- HTML5 + CSS3 + JavaScript Vanilla
- Font Awesome (ícones)
- Google Fonts (Roboto)
- Unsplash (imagens)

### Backend
- Node.js
- Express.js
- SQLite3
- Express Validator
- CORS
- Moment.js

## 📦 Instalação

### Pré-requisitos
- Node.js (versão 14 ou superior)
- npm ou yarn

### Passos para instalação

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd barbearia-backend
```

2. **Instale as dependências**
```bash
npm install
```

3. **Inicialize o banco de dados**
```bash
npm run init-db
```

4. **Inicie o servidor**
```bash
# Desenvolvimento (com nodemon)
npm run dev

# Produção
npm start
```

5. **Acesse o sistema**
- Frontend: http://localhost:3000
- API: http://localhost:3000/api

## 🔌 Endpoints da API

### Agendamentos
- `GET /api/agendamentos` - Listar agendamentos
- `GET /api/agendamentos/:id` - Buscar agendamento específico
- `POST /api/agendamentos` - Criar novo agendamento
- `PUT /api/agendamentos/:id` - Atualizar agendamento
- `DELETE /api/agendamentos/:id` - Cancelar agendamento
- `GET /api/agendamentos/disponibilidade/:data` - Horários disponíveis

### Serviços
- `GET /api/servicos` - Listar serviços
- `GET /api/servicos/:id` - Buscar serviço específico
- `POST /api/servicos` - Criar novo serviço
- `PUT /api/servicos/:id` - Atualizar serviço
- `DELETE /api/servicos/:id` - Desativar serviço

### Contatos
- `GET /api/contatos` - Listar contatos
- `GET /api/contatos/:id` - Buscar contato específico
- `POST /api/contatos` - Criar novo contato
- `PUT /api/contatos/:id` - Marcar como lido/não lido
- `DELETE /api/contatos/:id` - Deletar contato

## 📊 Estrutura do Banco de Dados

### Tabela: servicos
- `id` (INTEGER, PRIMARY KEY)
- `nome` (TEXT, NOT NULL)
- `descricao` (TEXT)
- `preco` (REAL, NOT NULL)
- `duracao` (INTEGER, DEFAULT 60)
- `ativo` (BOOLEAN, DEFAULT 1)
- `created_at` (DATETIME)

### Tabela: agendamentos
- `id` (INTEGER, PRIMARY KEY)
- `nome` (TEXT, NOT NULL)
- `email` (TEXT, NOT NULL)
- `telefone` (TEXT)
- `servico_id` (INTEGER, FOREIGN KEY)
- `data_agendamento` (DATE, NOT NULL)
- `hora_agendamento` (TIME, NOT NULL)
- `observacoes` (TEXT)
- `status` (TEXT, DEFAULT 'pendente')
- `created_at` (DATETIME)

### Tabela: contatos
- `id` (INTEGER, PRIMARY KEY)
- `nome` (TEXT, NOT NULL)
- `email` (TEXT, NOT NULL)
- `telefone` (TEXT)
- `mensagem` (TEXT, NOT NULL)
- `lido` (BOOLEAN, DEFAULT 0)
- `created_at` (DATETIME)

## 🎯 Como Usar

### Para Clientes
1. Acesse o site em http://localhost:3000
2. Navegue pelos serviços disponíveis
3. Clique em "Agendar Horário" para fazer um agendamento
4. Preencha o formulário com seus dados
5. Selecione o serviço, data e horário desejados
6. Confirme o agendamento

### Para Administradores
1. Use as rotas da API para gerenciar:
   - Serviços (adicionar, editar, desativar)
   - Agendamentos (visualizar, confirmar, cancelar)
   - Contatos (ler mensagens, responder)

## 🔧 Scripts Disponíveis

```bash
npm start          # Inicia o servidor em produção
npm run dev        # Inicia o servidor em desenvolvimento (nodemon)
npm run init-db    # Inicializa o banco de dados
```

## 📝 Exemplo de Uso da API

### Criar um agendamento
```bash
curl -X POST http://localhost:3000/api/agendamentos \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "(11) 99999-9999",
    "servico_id": 1,
    "data_agendamento": "2024-01-15",
    "hora_agendamento": "14:30",
    "observacoes": "Corte mais curto nas laterais"
  }'
```

### Listar agendamentos do dia
```bash
curl "http://localhost:3000/api/agendamentos?data=2024-01-15"
```

## 🚀 Deploy

Para fazer deploy em produção:

1. Configure as variáveis de ambiente
2. Use um banco de dados mais robusto (PostgreSQL, MySQL)
3. Configure um servidor web (Nginx)
4. Use PM2 para gerenciar processos
5. Configure SSL/HTTPS

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato:
- Email: contato@barbearianativa.com.br
- WhatsApp: (11) 99999-9999

---

Desenvolvido com ❤️ para a Barbearia Nativa

