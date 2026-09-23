const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

// Inicializa a tabela de usuários
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      telegram_id INTEGER PRIMARY KEY,
      is_premium INTEGER DEFAULT 0,
      premium_until DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Busca ou cria o usuário no banco
function getUser(telegramId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE telegram_id = ?', [telegramId], (err, row) => {
      if (err) return reject(err);
      if (!row) {
        db.run('INSERT INTO users (telegram_id) VALUES (?)', [telegramId], function (insertErr) {
          if (insertErr) return reject(insertErr);
          // Retorna o formato compatível com o seu index.js original
          resolve({ 
            telegram_id: telegramId, 
            is_premium: 0, 
            premium_until: null,
            status: '👤 Plano Gratuito'
          });
        });
      } else {
        // Verifica se o premium expirou
        const now = new Date();
        const premiumUntil = row.premium_until ? new Date(row.premium_until) : null;
        const isStillValid = row.is_premium && premiumUntil && premiumUntil > now;

        const validStatus = isStillValid ? 1 : 0;

        resolve({
          ...row,
          is_premium: validStatus,
          // Cria a string de status dinamicamente para o index.js original ler sem erros
          status: validStatus ? '🌟 Usuário VIP / Premium' : '👤 Plano Gratuito'
        });
      }
    });
  });
}

// Ativa o plano Premium por 30 dias
function setPremium(telegramId, days = 30) {
  return new Promise((resolve, reject) => {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);

    db.run(
      'UPDATE users SET is_premium = 1, premium_until = ? WHERE telegram_id = ?',
      [expirationDate.toISOString(), telegramId],
      function (err) {
        if (err) return reject(err);
        resolve(true);
      }
    );
  });
}

module.exports = { getUser, setPremium };
