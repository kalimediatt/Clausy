const mysql = require('mysql2/promise');
async function run() {
  try {
    const connection = await mysql.createConnection({
      host: '138.197.27.151',
      user: 'clausy_root',
      password: '@N4td55k7%+[',
      database: 'clausy'
    });
    const [rows] = await connection.execute('SELECT email, role FROM users LIMIT 10');
    console.log("Usuarios no banco:");
    console.log(JSON.stringify(rows, null, 2));
    await connection.end();
  } catch(e) { console.error(e.message); }
}
run();
