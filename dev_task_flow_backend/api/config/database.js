const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'dev_task_manager',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// check if connection is supported and successful

pool.getConnection((err, connection) => {
    if (err) {
        console.error(`Error connecting to MySQL: ${err.stack}`);
        return;
    }
    console.log('Connected to MySQL as id ' + connection.threadId);
    connection.release();
});

module.exports = pool.promise();