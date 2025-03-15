// Import các thư viện cần thiết
const express = require('express');
const router = express.Router();

// Import controller cho các chức năng xác thực
const authController = require('../app/controllers/authController/loginController');

// Định nghĩa các route cho trang đăng nhập và đăng ký

// Route để hiển thị trang đăng nhập cho admin
router.get('/loginAdmin', (req, res) => {
    res.render('auth/loginAdmin.ejs');
});

// Route để hiển thị trang đăng nhập cho người dùng
router.get('/loginUser', (req, res) => {
    res.render('auth/loginUser.ejs');
});

// Route để hiển thị trang đăng ký người dùng
router.get('/register', (req, res) => {
    res.render('auth/registerUser.ejs');
});

// Route để xử lý đăng nhập admin
router.post('/loginAdmin', authController.loginAdmin);

// Route để xử lý đăng nhập người dùng
router.post('/loginUser', authController.loginUser);

// Route để xử lý đăng xuất admin
router.get('/logoutAdmin', authController.logoutAdmin);

// Route để xử lý đăng xuất người dùng
router.get('/logoutUser', authController.logoutUser);

// Route để xử lý đăng ký người dùng
router.post('/registeruser', authController.register);

// Xuất module router
module.exports = router;