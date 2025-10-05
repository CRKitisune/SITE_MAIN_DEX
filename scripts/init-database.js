const db = require('../database/database');

async function initializeAndCheck() {
  console.log('🚀 Inicializando banco de dados da Barbearia Nativa...');
  
  try {
    // Inicializar banco
    await db.init();
    
    // Verificar e mostrar serviços
    const servicos = await db.all("SELECT * FROM servicos WHERE ativo = 1 ORDER BY nome");
    
    console.log(`\n📊 ${servicos.length} serviços cadastrados:`);
    servicos.forEach(service => {
      console.log(`  • ${service.nome} - R$ ${service.preco.toFixed(2)} (${service.duracao}min)`);
    });

    // Verificar agendamentos
    const agendamentosCount = await db.get("SELECT COUNT(*) as count FROM agendamentos");
    console.log(`\n📅 ${agendamentosCount.count} agendamentos no sistema`);

    console.log('\n🎉 Sistema pronto!');
    console.log('🌐 Acesse: http://localhost:3000');
    
  } catch (error) {
    console.error('❌ Erro durante a inicialização:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initializeAndCheck();
}

module.exports = initializeAndCheck;