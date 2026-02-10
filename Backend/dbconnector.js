const mariadb = require('mariadb');

const pool = mariadb.createPool({
     host: 'mlocalhost', 
     user:'kritikavashishth', 
     password: 'D4echw!ta@0#',
     connectionLimit: 5
});
async function asyncFunction() {
  let conn;
  try {
	conn = await pool.getConnection();
	const rows = await conn.query("SELECT 1 as val");
	console.log(rows); //[ {val: 1}, meta: ... ]
	const res = await conn.query("show databases"); //Endre kommandoer her for å fortelle hva du vil gjøre med databsed
	console.log(res); // { affectedRows: 1, insertId: 1, warningStatus: 0 }

  } catch (err) {
	throw err;
  } finally {
	if (conn) conn.end();
  }
}
asyncFunction().then(() => {
  pool.end(); 
});