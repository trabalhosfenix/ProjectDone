const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function createAdmin() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'projectdone',
    password: 'postgres',
    port: 5432,
  });

  try {
    await client.connect();
    
    // Verifica se admin já existe
    const check = await client.query("SELECT * FROM \"User\" WHERE email = 'admin@empresa.com'");
    
    if (check.rows.length > 0) {
      console.log('✅ Admin já existe!');
      console.log('Email:', check.rows[0].email);
      return;
    }

    // Cria hash da senha
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Insere admin
    await client.query(
      `INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt") 
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())`,
      ['admin@empresa.com', hashedPassword, 'Administrador', 'ADMIN']
    );

    console.log('✅ Admin criado com sucesso!');
    console.log('Email: admin@empresa.com');
    console.log('Senha: admin123');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

createAdmin();
