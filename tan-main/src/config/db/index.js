var mysql = require('mysql');

var con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db2'
});

con.connect((err) => {
    if (err) {
        console.error('Kết nối thất bại:', err);
    } else {
        console.log('Kết nối thành công');
    }
});

module.exports = con;
