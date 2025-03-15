// Import các thư viện cần thiết
const express = require('express');
const router = express.Router();
const authMiddleware = require('../app/middlewares/authMiddlewares');
const homeUserController = require('../app/controllers/userControllers/homeUserController');

// Định nghĩa các route cho người dùng

// Route để hiển thị trang chủ
router.get('/', homeUserController.index);

// Route để hiển thị chi tiết sản phẩm
router.get('/chi_tiet_sp/:id', homeUserController.chi_tiet_sp);

// Route để hiển thị giỏ hàng, yêu cầu người dùng phải đăng nhập
router.get('/cart', authMiddleware.loggedinUser, homeUserController.cart);

// Route để thêm sản phẩm vào giỏ hàng, yêu cầu người dùng phải đăng nhập
router.get('/add_to_cart/:id', authMiddleware.loggedinUser, homeUserController.add_to_cart);

// Route để cập nhật số lượng sản phẩm trong giỏ hàng, yêu cầu người dùng phải đăng nhập
router.post('/updateQuantity', authMiddleware.loggedinUser, homeUserController.updateQuantity);

// Route để đặt hàng từ giỏ hàng, yêu cầu người dùng phải đăng nhập
router.post('/dat_hang_cart_hd', authMiddleware.loggedinUser, homeUserController.dat_hang_cart_hd);

// Route để xóa sản phẩm khỏi giỏ hàng, yêu cầu người dùng phải đăng nhập
router.get('/delete_cart/:id', authMiddleware.loggedinUser, homeUserController.delete_cart);

// Route để đặt hàng trực tiếp từ chi tiết sản phẩm, yêu cầu người dùng phải đăng nhập
router.get('/dat_hang/:id', authMiddleware.loggedinUser, homeUserController.dat_hang);

// Route để xử lý đặt hàng, yêu cầu người dùng phải đăng nhập
router.post('/dat_hang2', authMiddleware.loggedinUser, homeUserController.dat_hang2);
router.post('/dat_hang_cart', authMiddleware.loggedinUser, homeUserController.dat_hang_cart);

// Route để hiển thị đơn hàng của người dùng, yêu cầu người dùng phải đăng nhập
router.get('/order', authMiddleware.loggedinUser, homeUserController.order);

// Route để hủy đơn hàng, yêu cầu người dùng phải đăng nhập
router.get('/order_huy/:id', authMiddleware.loggedinUser, homeUserController.order_huy);

// Route để xác nhận đã nhận hàng, yêu cầu người dùng phải đăng nhập
router.get('/da_nhan_hang/:id', authMiddleware.loggedinUser, homeUserController.da_nhan_hang);

// Route để hiển thị tất cả sản phẩm
router.get('/all_product', homeUserController.all_product);

// Route để tìm kiếm sản phẩm
router.get('/search_product_all_user', homeUserController.search_product_all_user);
router.get('/searchPrice_product_all_user', homeUserController.searchPrice_product_all_user);

// Route để hiển thị lịch sử mua hàng của người dùng, yêu cầu người dùng phải đăng nhập
router.get('/lich_su_mua_hang', authMiddleware.loggedinUser, homeUserController.lich_su_mua_hang);

// Route để mua lại sản phẩm từ lịch sử mua hàng, yêu cầu người dùng phải đăng nhập
router.get('/mua_lai_hang/:id', authMiddleware.loggedinUser, homeUserController.select_mua_lai_hang);
router.post('/updateQuantity_mua_lai', authMiddleware.loggedinUser, homeUserController.updateQuantity_mua_lai);
router.post('/placeOrder/:id', authMiddleware.loggedinUser, homeUserController.xac_nhan_mua_lai_hang);

// Route để hiển thị và cập nhật thông tin tài khoản, yêu cầu người dùng phải đăng nhập
router.get('/tai_khoan', authMiddleware.loggedinUser, homeUserController.tai_khoan);
router.get('/getHuyenByHuyen/:id', homeUserController.getHuyenByHuyen);
router.get('/getXaByXa/:id', homeUserController.getXaByXa);
router.post('/update_user', authMiddleware.loggedinUser, homeUserController.update_user);
router.post('/doi_mk', authMiddleware.loggedinUser, homeUserController.doi_mk);

// // Route để quản lý bảo hành, yêu cầu người dùng phải đăng nhập
// router.get('/bao_hanh', authMiddleware.loggedinUser, homeUserController.bao_hanh);
// router.post('/luu_phieu_bao_hanh', authMiddleware.loggedinUser, homeUserController.luu_phieu_bao_hanh);
// router.get('/baohanh_huy/:id', authMiddleware.loggedinUser, homeUserController.baohanh_huy);

// Route để hiển thị trang giới thiệu
router.get('/gioi_thieu', homeUserController.gioi_thieu);

 // Route để hiển thị trang liên hệ
router.get('/lien_he', homeUserController.lien_he);




// Xuất module router
module.exports = router;
