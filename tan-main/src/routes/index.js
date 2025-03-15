// Import các route cần thiết
const homeUserRoute = require('./homeuser');
const authRoute = require('./auth');
const adminRoute = require('./admin');

// Định nghĩa hàm route để khởi tạo các route cho ứng dụng
function route(app) {
    // Sử dụng route cho các chức năng xác thực
    app.use('/auth', authRoute);

    // Sử dụng route cho các chức năng quản trị
    app.use('/admin', adminRoute);

    // Sử dụng route cho các chức năng của người dùng
    app.use('/', homeUserRoute);
}

// Xuất module route
module.exports = route;