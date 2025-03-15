// Import các thư viện cần thiết
const express = require('express');
const path = require('path');
const handlebars = require('express-handlebars');
const ejs = require('ejs');
const app = express();
const port = 3000;
const connect = require('./config/db');
const bodyParser = require('body-parser');
const route = require('./routes');
const session = require('express-session');

// Sử dụng middleware để parse JSON
app.use(express.json());

// Cấu hình session
app.use(session({
    secret: 'keyboard cat', // Khóa bí mật để mã hóa session
    resave: true, // Lưu lại session mỗi khi có request
    saveUninitialized: true // Lưu lại session ngay cả khi nó chưa được khởi tạo
}));

// Sử dụng body-parser để parse các request có dạng urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Cấu hình thư mục tĩnh để phục vụ các file tĩnh như hình ảnh, CSS, JavaScript
app.use(express.static(path.join(__dirname, 'public')));

// Cấu hình template engine
app.engine('hbs', handlebars.engine({
    extname: '.hbs', // Định dạng file template là .hbs
}));
app.engine('ejs', ejs.renderFile); // Cấu hình ejs làm template engine
app.set('view engine', 'hbs'); // Sử dụng handlebars làm view engine mặc định
app.set('views', path.join(__dirname, 'resources/views')); // Đường dẫn tới thư mục chứa các file view

// Khởi tạo các route
route(app);

// Lắng nghe kết nối tại cổng 3000
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});