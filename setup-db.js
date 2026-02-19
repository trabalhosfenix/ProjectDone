const { Client } = require('pg');

async function setup() {
  // Conecta no postgres padrão
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'postgres',
    port: 5432,
  });

  try {
    await client.connect();
    
    // Verifica se o banco já existe
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname='projectdone'");
    
    if (res.rows.length === 0) {
      await client.query('CREATE DATABASE projectdone');
      console.log('✅ Banco de dados "projectdone" criado!');
    } else {
      console.log('✅ Banco de dados "projectdone" já existe!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

setup();
