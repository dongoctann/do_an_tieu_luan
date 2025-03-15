const connect = require('../../../config/db');
const moment = require('moment');

const helper = require('../../controllers/helper');
const paginate = require('express-paginate');

class homeUserController {
    
    gioi_thieu(req, res) {
        // Dữ liệu tĩnh cho giới thiệu
        const gioi_thieu = {
            title: "Chào mừng đến với TẤNShop- Hệ thống bán lẻ laptop uy tín hàng đầu!",
            content: "Tại TẤNShop, chúng tôi tự hào là một trong những địa chỉ đáng tin cậy nhất dành cho những khách hàng đang tìm kiếm các sản phẩm laptop chất lượng cao, chính hãng, và giá cả hợp lý. Với sứ mệnh Đưa công nghệ đến gần hơn với mọi người, chúng tôi cam kết mang đến cho bạn những trải nghiệm mua sắm tuyệt vời nhất.."
        };
    
        // Truyền biến `gioi_thieu` vào view
        res.render('user/gioi_thieu.ejs', {
            user: req.session.user,
            gioi_thieu: gioi_thieu
        });
    }
    lien_he(req, res) {
        // Dữ liệu tĩnh cho liên hệ
        const lien_he = {
            title: "Liên hệ với chúng tôi",
            content: "Chúng tôi luôn sẵn sàng hỗ trợ bạn. Nếu bạn có bất kỳ câu hỏi, phản hồi, hoặc cần tư vấn, vui lòng liên hệ qua các thông tin bên dưới hoặc sử dụng biểu mẫu liên hệ.",
            contactInfo: {
                address: " Khu 2, Đ. 3/2, P. Xuân Khánh, Q. Ninh Kiều, TP. CT",
                hotline: "1900 9999",
                email: "support@TẤNshop.com",
            }
        };
    
        // Truyền biến `lien_he` vào view
        res.render('user/lien_he.ejs', {
            user: req.session.user,
            lien_he: lien_he
        });
    }
    

    index(req, res) {
        let sql = "CALL GetProductDetails();";
        connect.query(sql, (err, data) => {
            res.render('user/home.ejs', {
                data: data[0],
                user: req.session.user
            });
            console.log(data);

        });
    }

    chi_tiet_sp(req, res) {
        let id = req.params.id;
        let sql = "CALL GetProductDetailsAndRelated(?)";

        connect.query(sql, [id], (err, results) => {
            if (err) throw err;

            // Kết quả trả về từ stored procedure
            let productDetail = results[0][0]; // Lấy thông tin chi tiết sản phẩm cụ thể
            let relatedDetails = results[1];   // Lấy danh sách chi tiết sản phẩm khác có cùng sản phẩm ID

            res.render('user/chi_tiet_sp.ejs', {
                user: req.session.user,
                productDetail: productDetail,
                relatedDetails: relatedDetails
            });
            console.log('p', productDetail);
            console.log(relatedDetails);
        });
        console.log('id', id);
    }

    cart(req, res) {
        let khach_hang_id = req.session.user.id;

        const query = `
        SELECT 
            sp.ten_san_pham AS ten_san_pham,
            ms.ten_mau_sac AS mau_sac,
            dl.ten_dung_luong AS dung_luong,
            cts.hinh_anh AS hinh_anh,
            cts.id AS chi_tiet_san_pham_id,
            cts.gia_ban,
            gh.so_luong,
            pnk.so_luong_nhap,
            dmh.so_luong_ban,
            (COALESCE(pnk.so_luong_nhap, 0) - COALESCE(dmh.so_luong_ban, 0)) AS so_luong_con_lai,
            gh.id
        FROM 
            tbl_gio_hang gh
        JOIN 
            tbl_chi_tiet_san_pham cts ON gh.chi_tiet_san_pham_id = cts.id
        JOIN 
            tbl_san_pham sp ON cts.san_pham_id = sp.id
        JOIN 
            tbl_mau_sac ms ON cts.mau_sac_id = ms.id
        JOIN 
            tbl_dung_luong dl ON cts.dung_luong_id = dl.id
        LEFT JOIN (
            SELECT 
                san_pham_chi_tiet_id,
                SUM(so_luong) AS so_luong_nhap
            FROM 
                tbl_chi_tiet_phieu_nhap_kho
            GROUP BY 
                san_pham_chi_tiet_id
        ) AS pnk ON cts.id = pnk.san_pham_chi_tiet_id
        LEFT JOIN (
            SELECT 
                chi_tiet_san_pham_id,
                SUM(so_luong) AS so_luong_ban
            FROM 
                tbl_chi_tiet_don_mua_hang
            JOIN 
                tbl_don_mua_hang AS dmh ON tbl_chi_tiet_don_mua_hang.don_mua_hang_id = dmh.id
            WHERE 
                dmh.trang_thai != 5
            GROUP BY 
                chi_tiet_san_pham_id
        ) AS dmh ON cts.id = dmh.chi_tiet_san_pham_id
        WHERE 
            gh.khach_hang_id = ?;
        `;

        connect.query(query, [khach_hang_id], (err, results) => {
            if (err) {
                console.error('Error retrieving cart items: ' + err.message);
                res.status(500).json({ error: 'Error retrieving cart items' });
                return;
            }
            res.render('user/cart.ejs', {
                user: req.session.user,
                cartItems: results
            });
            console.log(results);
        });
    }


    add_to_cart(req, res) {
        let chi_tiet_san_pham_id = req.params.id;
        let khach_hang_id = req.session.user.id;

        // Kiểm tra nếu sản phẩm đã tồn tại trong giỏ hàng
        const selectQuery = `SELECT * FROM tbl_gio_hang WHERE khach_hang_id = ? AND chi_tiet_san_pham_id = ?`;
        connect.query(selectQuery, [khach_hang_id, chi_tiet_san_pham_id], (err, results) => {
            if (err) {
                console.error('Error checking item in cart: ' + err.message);
                res.status(500).json({ error: 'Error checking item in cart' });
                return;
            }

            if (results.length > 0) {
                // Nếu sản phẩm đã tồn tại, thực hiện truy vấn UPDATE để tăng số lượng lên 1
                const updateQuery = `UPDATE tbl_gio_hang SET so_luong = so_luong + 1, ngay_cap_nhat = NOW() WHERE khach_hang_id = ? AND chi_tiet_san_pham_id = ?`;
                connect.query(updateQuery, [khach_hang_id, chi_tiet_san_pham_id], (err, results) => {
                    if (err) {
                        console.error('Error updating item in cart: ' + err.message);
                        res.status(500).json({ error: 'Error updating item in cart' });
                        return;
                    }
                    console.log('Item quantity updated in cart successfully');
                    res.redirect('/cart');
                });
            } else {
                // Nếu sản phẩm chưa tồn tại, thực hiện truy vấn INSERT để thêm mục mới vào giỏ hàng
                const insertQuery = `INSERT INTO tbl_gio_hang (khach_hang_id, chi_tiet_san_pham_id, so_luong, ngay_tao) VALUES (?, ?, ?, NOW())`;
                connect.query(insertQuery, [khach_hang_id, chi_tiet_san_pham_id, 1], (err, results) => {
                    if (err) {
                        console.error('Error adding item to cart: ' + err.message);
                        res.status(500).json({ error: 'Error adding item to cart' });
                        return;
                    }
                    console.log('Item added to cart successfully');
                    res.redirect('/cart');
                });
            }
        });
    }

    delete_cart(req, res) {
        const tableName = 'tbl_gio_hang';
        const tableId = 'id';
        const redirectPath = 'cart';
        helper.deleteRecord_user(tableName, tableId, redirectPath, req, res);
    }
    updateQuantity(req, res) {
        const { itemId, newQuantity, chiTietSanPhamId } = req.body;
        const sqlCheckStock = `
        SELECT 
        COALESCE(pnk.so_luong_nhap, 0) - COALESCE(dmh.so_luong_ban, 0) AS so_luong_con_lai
    FROM 
        tbl_chi_tiet_san_pham AS cts
    LEFT JOIN (
        SELECT 
            san_pham_chi_tiet_id,
            SUM(so_luong) AS so_luong_nhap
        FROM 
            tbl_chi_tiet_phieu_nhap_kho
        GROUP BY 
            san_pham_chi_tiet_id
    ) AS pnk ON cts.id = pnk.san_pham_chi_tiet_id
    LEFT JOIN (
        SELECT 
            chi_tiet_san_pham_id,
            SUM(so_luong) AS so_luong_ban
        FROM 
            tbl_chi_tiet_don_mua_hang
        JOIN 
            tbl_don_mua_hang AS dmh ON tbl_chi_tiet_don_mua_hang.don_mua_hang_id = dmh.id
        WHERE 
            dmh.trang_thai != 5
        GROUP BY 
            chi_tiet_san_pham_id
    ) AS dmh ON cts.id = dmh.chi_tiet_san_pham_id
    WHERE 
        cts.id = ?;
    
        `;

        connect.query(sqlCheckStock, [chiTietSanPhamId], (error, results, fields) => {
            if (error) {
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            const remainingStock = results[0].so_luong_con_lai;
            console.log(remainingStock, newQuantity);
            // if (newQuantity > remainingStock) {
            //     res.status(400).json({ error: 'Not enough stock' });
            //     return;
            // }

            const sqlUpdateQuantity = 'UPDATE tbl_gio_hang SET so_luong = ? WHERE id = ?';

            connect.query(sqlUpdateQuantity, [newQuantity, itemId], (error, results, fields) => {
                if (error) {
                    res.status(500).json({ error: 'Internal Server Error' });
                } else {
                    res.status(200).send('Update successful');
                }
            });
        });
    }


    dat_hang(req, res) {
        let id = req.params.id;

        // Gọi stored procedure GetProductDetails với tham số là id
        let sql = "CALL GetProduct_datHang(?)";
        let so_luong = 0;
        connect.query(sql, [id], (err, results) => {
            if (err) throw err;

            // Kết quả trả về từ stored procedure
            let product_datHang = results[0][0]; // Lấy thông tin chi tiết sản phẩm cụ thể

            res.render('user/dat_hang.ejs', {
                user: req.session.user,
                product_datHang: product_datHang,
                so_luong: so_luong + 1
            });
            console.log('p', product_datHang);
        });
        console.log('id', id);
    }

    dat_hang2(req, res) {
        const { hoTen, soDienThoai, diaChi, ghiChu, hinhThucThanhToan, soLuong, giaBan, tongGia, tong_tien_thanh_toan, san_pham_id } = req.body;
        const userId = req.session.user.id;
        // Thực hiện chèn dữ liệu vào bảng "tbl_don_mua_hang"
        const donHangQuery = `INSERT INTO tbl_don_mua_hang (khach_hang_id, ten_nguoi_mua, so_dien_thoai, dia_chi_mua_hang, ghi_chu, tong_tien, tong_tien_thanh_toan, hinh_thuc_thanh_toan, trang_thai, ngay_tao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
        const donHangValues = [userId, hoTen, soDienThoai, diaChi, ghiChu, tongGia, tong_tien_thanh_toan, hinhThucThanhToan, 1];

        connect.query(donHangQuery, donHangValues, (error, results, fields) => {
            if (error) {
                console.error('Lỗi khi thêm đơn hàng: ' + error);
                res.status(500).json({ message: 'Đã xảy ra lỗi khi đặt hàng.' });
                return;
            }

            const donMuaHangId = results.insertId;

            // Thực hiện chèn dữ liệu vào bảng "tbl_chi_tiet_don_mua_hang"
            const chiTietQuery = `INSERT INTO tbl_chi_tiet_don_mua_hang (don_mua_hang_id, chi_tiet_san_pham_id, so_luong, gia, ngay_tao) VALUES (?, ?, ?, ?, NOW())`;
            const chiTietValues = [donMuaHangId, san_pham_id, soLuong, giaBan];

            connect.query(chiTietQuery, chiTietValues, (error, results, fields) => {
                if (error) {
                    console.error('Lỗi khi thêm chi tiết đơn hàng: ' + error);
                    res.status(500).json({ message: 'Đã xảy ra lỗi khi đặt hàng.' });
                    return;
                }

                res.json({ message: 'Đặt hàng thành công.' });
            });
        });

    }
    dat_hang_cart(req, res) {
        let selectedProducts = req.body.selectedProducts;
        let selectedProductIds = selectedProducts.split(',').map(Number);

        let sql = "CALL GetProducts2_datHang(?)";
        let thanhPhoList = "SELECT * FROM tbl_thanh_pho";

        connect.query(thanhPhoList, (err, thanhPhoList) => {
            if (err) {
                return res.status(500).send('Internal Server Error');
            }

            connect.query(sql, [selectedProductIds.join(',')], (err, results) => {
                if (err) throw err;

                let products_datHang = results[0];

                console.log(products_datHang);

                res.render('user/dat_hang_cart.ejs', {
                    user: req.session.user,
                    products_datHang: products_datHang,
                    thanhPhoList: thanhPhoList,
                });
            });
        });


    }

    dat_hang_cart_hd(req, res) {
        const { hoTen, soDienThoai, diaChi, ghiChu, hinhThucThanhToan, tongGia, tong_tien_thanh_toan, sanPhamArray } = req.body;
        const userId = req.session.user.id;

        // Thực hiện chèn dữ liệu vào bảng "tbl_don_mua_hang"
        const donHangQuery = `
            INSERT INTO tbl_don_mua_hang 
            (khach_hang_id, ten_nguoi_mua, so_dien_thoai, dia_chi_mua_hang, ghi_chu, tong_tien, tong_tien_thanh_toan, hinh_thuc_thanh_toan, trang_thai, ngay_tao) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
        const donHangValues = [userId, hoTen, soDienThoai, diaChi, ghiChu, tongGia, tong_tien_thanh_toan, hinhThucThanhToan, 1];

        connect.query(donHangQuery, donHangValues, (error, results, fields) => {
            if (error) {
                console.error('Lỗi khi thêm đơn hàng: ' + error);
                res.status(500).json({ message: 'Đã xảy ra lỗi khi đặt hàng.' });
                return;
            }

            const donMuaHangId = results.insertId;

            // Duyệt qua mảng sản phẩm và thêm từng sản phẩm vào bảng "tbl_chi_tiet_don_mua_hang"
            sanPhamArray.forEach((sanPham) => {
                const { chiTietId, soLuong, giaBan } = sanPham;
                const chiTietQuery = `
                    INSERT INTO tbl_chi_tiet_don_mua_hang 
                    (don_mua_hang_id, chi_tiet_san_pham_id, so_luong, gia, ngay_tao) 
                    VALUES (?, ?, ?, ?, NOW())`;
                const chiTietValues = [donMuaHangId, chiTietId, soLuong, giaBan];

                connect.query(chiTietQuery, chiTietValues, (error, results, fields) => {
                    if (error) {
                        console.error('Lỗi khi thêm chi tiết đơn hàng: ' + error);
                        res.status(500).json({ message: 'Đã xảy ra lỗi khi đặt hàng.' });
                        return;
                    }
                });

                const xoaSanPhamQuery = `DELETE FROM tbl_gio_hang WHERE chi_tiet_san_pham_id = ? AND khach_hang_id = ?`;
                const xoaSanPhamValues = [chiTietId, userId];
                connect.query(xoaSanPhamQuery, xoaSanPhamValues, (error, results, fields) => {
                    if (error) {
                        console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng: ' + error);
                        return;
                    }
                });
            });

            res.json({ message: 'Đặt hàng thành công.' });
        });
    }


    order(req, res) {
        let sql_hd = 'SELECT * FROM tbl_don_mua_hang';
        connect.query(sql_hd, (err, don_mua_hang) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Internal Server Error');
            }
            let sql_bh = 'SELECT * FROM tbl_phieu_bao_hanh';
            connect.query(sql_bh, (err, phieu_bao_hanh) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Internal Server Error');
                }

                let sql = `SELECT 
        tbl_chi_tiet_don_mua_hang.id AS id,
        tbl_chi_tiet_don_mua_hang.so_luong AS so_luong,
        tbl_chi_tiet_don_mua_hang.don_mua_hang_id AS don_mua_hang_id,
        tbl_chi_tiet_san_pham.hinh_anh AS hinh_anh,
        tbl_san_pham.ten_san_pham AS ten_san_pham,
        tbl_dung_luong.ten_dung_luong AS dung_luong,
        tbl_mau_sac.ten_mau_sac AS mau_sac,
        tbl_chi_tiet_san_pham.gia_ban AS gia_ban,
        tbl_don_mua_hang.tong_tien AS tong_tien,
        tbl_don_mua_hang.trang_thai AS trang_thai,
        tbl_don_mua_hang.khach_hang_id AS khach_hang_id
    FROM 
        tbl_chi_tiet_don_mua_hang
    JOIN tbl_don_mua_hang ON tbl_chi_tiet_don_mua_hang.don_mua_hang_id = tbl_don_mua_hang.id
    JOIN tbl_chi_tiet_san_pham ON tbl_chi_tiet_don_mua_hang.chi_tiet_san_pham_id = tbl_chi_tiet_san_pham.id
    JOIN tbl_san_pham ON tbl_chi_tiet_san_pham.san_pham_id = tbl_san_pham.id
    JOIN tbl_mau_sac ON tbl_chi_tiet_san_pham.mau_sac_id = tbl_mau_sac.id
    JOIN tbl_dung_luong ON tbl_chi_tiet_san_pham.dung_luong_id = tbl_dung_luong.id;
    `;

                connect.query(sql, (err, data) => {
                    res.render('user/order.ejs', {
                        data: data,
                        phieu_bao_hanh: phieu_bao_hanh,
                        don_mua_hang: don_mua_hang,
                        user: req.session.user
                    });
                    console.log(data);
                });
            });
        });

    }

    async order_huy(req, res) {
        try {
            // Lấy id của đơn hàng từ request
            const orderId = req.params.id;

            // Truy vấn trạng thái hiện tại của đơn hàng từ cơ sở dữ liệu
            const data = await new Promise((resolve, reject) => {
                connect.query(`SELECT * FROM tbl_don_mua_hang WHERE id = ${orderId}`, (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                });
            });

            if (data.length === 0) {
                console.log('Không tìm thấy đơn hàng.');
                res.status(404).send('Không tìm thấy đơn hàng.');
                return;
            }

            const currentStatus = data[0].trang_thai;

            // Xác định trạng thái mới
            let newStatus;
            if (currentStatus === 1) {
                newStatus = 5;
            } else if (currentStatus === 2) {
                newStatus = 5;
            }
            else {
                console.log('Không có trạng thái nào phù hợp để cập nhật.');
                res.status(400).send('Không có trạng thái nào phù hợp để cập nhật.');
                return;
            }

            // Cập nhật trạng thái mới vào cơ sở dữ liệu
            await new Promise((resolve, reject) => {
                connect.query('UPDATE tbl_don_mua_hang SET trang_thai = ? WHERE id = ?', [newStatus, orderId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            console.log(`Cập nhật trạng thái thành công: ${newStatus} cho đơn hàng có id ${orderId}`);
            res.redirect('/order');
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái:', error);
            res.status(500).send('Lỗi khi cập nhật trạng thái.');
        }
    }

    // async baohanh_huy(req, res) {
    //     try {
    //         const orderId = req.params.id;

    //         // Xác định trạng thái mới
    //         let newStatus = 5;

    //         await new Promise((resolve, reject) => {
    //             connect.query('UPDATE tbl_phieu_bao_hanh SET trang_thai = ? WHERE id = ?', [newStatus, orderId], (err) => {
    //                 if (err) reject(err);
    //                 else resolve();
    //             });
    //         });

    //         console.log(`Cập nhật trạng thái thành công: ${newStatus} cho đơn hàng có id ${orderId}`);
    //         res.redirect('/bao_hanh');
    //     } catch (error) {
    //         console.error('Lỗi khi cập nhật trạng thái:', error);
    //         res.status(500).send('Lỗi khi cập nhật trạng thái.');
    //     }
    // }

    all_product(req, res) {
        const perPage = 10; // Số lượng mục trên mỗi trang
        let page = parseInt(req.query.page) || 1; // Trang hiện tại, mặc định là 1 nếu không có yêu cầu

        // Đảm bảo trang không nhỏ hơn 1
        if (page < 1) {
            page = 1;
        }

        // Tính offset để lấy dữ liệu từ cơ sở dữ liệu
        const offset = (page - 1) * perPage;

        // Truy vấn để lấy số lượng tổng cộng của mục
        const countQuery = `
            SELECT COUNT(*) AS totalCount 
            FROM tbl_san_pham sp 
            JOIN tbl_chi_tiet_san_pham ctsanpham ON sp.id = ctsanpham.san_pham_id`;

        connect.query(countQuery, (err, countResult) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Internal Server Error');
            }
            const totalCount = countResult[0].totalCount;

            // Tính tổng số trang
            const totalPages = Math.ceil(totalCount / perPage);

            // Đảm bảo trang không lớn hơn tổng số trang
            if (page > totalPages) {
                page = totalPages;
            }

            // Truy vấn để lấy dữ liệu cho trang hiện tại
            const sql = `
                SELECT 
                    sp.ten_san_pham, 
                    ctsanpham.hinh_anh AS hinh_anh_chi_tiet, 
                    ctsanpham.id AS chi_tiet_id,
                    mausac.ten_mau_sac, 
                    dungluong.ten_dung_luong, 
                    ctsanpham.gia_ban, 
                    ctsanpham.serial,
                    ctsanpham.hinh_anh
                FROM 
                    tbl_san_pham sp 
                    JOIN tbl_chi_tiet_san_pham ctsanpham ON sp.id = ctsanpham.san_pham_id 
                    JOIN tbl_mau_sac mausac ON ctsanpham.mau_sac_id = mausac.id 
                    JOIN tbl_dung_luong dungluong ON ctsanpham.dung_luong_id = dungluong.id 
                LIMIT ${perPage} OFFSET ${offset}`;

            connect.query(sql, (err, data) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Internal Server Error');
                }

                // Truy vấn để lấy danh sách nhà sản xuất
                let nhaSanXuatSql = "SELECT * FROM tbl_nha_san_xuat";

                connect.query(nhaSanXuatSql, (err, nhaSanXuatList) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send('Internal Server Error');
                    }

                    // Render template với dữ liệu và thông tin phân trang
                    res.render('user/all_product.ejs', {
                        data: data,
                        user: req.session.user,
                        nhaSanXuatList: nhaSanXuatList,
                        pageCount: totalPages,
                        itemCount: totalCount,
                        currentPage: page, // Thêm currentPage vào để biết trang hiện tại
                        pages: paginate.getArrayPages(req)(3, totalPages, page)
                    });
                });
            });
        });
    }


    search_product_all_user(req, res) {
        const keyword = req.query.name;
        const mau_sac_name = req.query.mau_sac_name;
        const nha_san_xuat_name = req.query.nha_san_xuat_name;
        const min_price = req.query.min_price;
        const max_price = req.query.max_price;
        let page = parseInt(req.query.page) || 1; // Trang mặc định là 1
        const limit = 20; // Số lượng kết quả trên mỗi trang
        const offset = (page - 1) * limit; // Định vị bắt đầu của các kết quả

        let mau_sac_sql = "SELECT * FROM tbl_mau_sac";
        let nha_san_xuat_sql = "SELECT * FROM tbl_nha_san_xuat";
        let sql_san_pham = "SELECT * FROM tbl_san_pham;";

        connect.query(mau_sac_sql, (err, mau_sac) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Internal Server Error');
            }

            connect.query(nha_san_xuat_sql, (err, nhaSanXuatList) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Internal Server Error');
                }

                let sql = `
                    SELECT 
                        sp.ten_san_pham, 
                        ctsanpham.hinh_anh AS hinh_anh, 
                        mausac.ten_mau_sac, 
                        nsx.ten_nha_san_xuat, 
                        ctsanpham.gia_ban, 
                        ctsanpham.serial 
                    FROM 
                        tbl_san_pham sp 
                        JOIN tbl_chi_tiet_san_pham ctsanpham ON sp.id = ctsanpham.san_pham_id 
                        JOIN tbl_mau_sac mausac ON ctsanpham.mau_sac_id = mausac.id 
                        JOIN tbl_nha_san_xuat nsx ON sp.nha_san_xuat_id = nsx.id 
                    WHERE 1 = 1
                `;

                const queryParams = [];

                if (keyword) {
                    sql += " AND sp.ten_san_pham LIKE ?";
                    queryParams.push(`%${keyword}%`);
                }

                if (mau_sac_name) {
                    sql += " AND mausac.ten_mau_sac LIKE ?";
                    queryParams.push(`%${mau_sac_name}%`);
                }

                if (nha_san_xuat_name) {
                    sql += " AND nsx.ten_nha_san_xuat LIKE ?";
                    queryParams.push(`%${nha_san_xuat_name}%`);
                }

                if (min_price && max_price) {
                    sql += " AND ctsanpham.gia_ban BETWEEN ? AND ?";
                    queryParams.push(min_price, max_price);
                } else if (min_price) {
                    sql += " AND ctsanpham.gia_ban >= ?";
                    queryParams.push(min_price);
                } else if (max_price) {
                    sql += " AND ctsanpham.gia_ban <= ?";
                    queryParams.push(max_price);
                }

                // Truy vấn để lấy số lượng tổng cộng của mục
                const countQuery = `
                    SELECT COUNT(*) AS totalCount 
                    FROM tbl_san_pham sp 
                    JOIN tbl_chi_tiet_san_pham ctsanpham ON sp.id = ctsanpham.san_pham_id 
                    WHERE 1 = 1
                `;

                connect.query(countQuery, queryParams, (err, countResult) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send('Internal Server Error');
                    }
                    const totalCount = countResult[0].totalCount;

                    // Tính tổng số trang
                    const pageCount = Math.ceil(totalCount / limit);

                    // Đảm bảo trang không lớn hơn tổng số trang
                    if (page > pageCount) {
                        page = pageCount;
                    }

                    sql += " LIMIT ? OFFSET ?";
                    queryParams.push(limit, offset);

                    connect.query(sql, queryParams, (err, data) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).send('Internal Server Error');
                        }

                        // Truy vấn để lấy danh sách nhà sản xuất
                        let nhaSanXuatSql = "SELECT * FROM tbl_nha_san_xuat";

                        connect.query(nhaSanXuatSql, (err, nhaSanXuatList) => {
                            if (err) {
                                console.error(err);
                                return res.status(500).send('Internal Server Error');
                            }

                            // Render template với dữ liệu và thông tin phân trang
                            res.render('user/all_product.ejs', {
                                data: data,
                                mau_sac: mau_sac,
                                nhaSanXuatList: nhaSanXuatList,
                                user: req.session.user,
                                currentPage: page, // Thêm currentPage vào để biết trang hiện tại
                                pageCount: pageCount, // Thêm pageCount vào để biết tổng số trang
                                pages: paginate.getArrayPages(req)(3, pageCount, page)
                            });
                        });
                    });
                });
            });
        });
    }


    searchPrice_product_all_user(req, res) {
        const min_price = req.query.min_price;
        const max_price = req.query.max_price;

        let nha_san_xuat_sql = "SELECT * FROM tbl_nha_san_xuat";

        connect.query(nha_san_xuat_sql, (err, nhaSanXuatList) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Internal Server Error');
            }
            let sql = `
            SELECT 
                sp.ten_san_pham, 
                ctsanpham.hinh_anh AS hinh_anh, 
                mausac.ten_mau_sac, 
                dungluong.ten_dung_luong, 
                ctsanpham.gia_ban, 
                ctsanpham.serial 
            FROM 
                tbl_san_pham sp 
                JOIN tbl_chi_tiet_san_pham ctsanpham ON sp.id = ctsanpham.san_pham_id 
                JOIN tbl_mau_sac mausac ON ctsanpham.mau_sac_id = mausac.id 
                JOIN tbl_dung_luong dungluong ON ctsanpham.dung_luong_id = dungluong.id 
            WHERE 1 = 1
        `;

            const queryParams = [];

            // Kiểm tra và thêm điều kiện tìm kiếm giá
            if (min_price && max_price) {
                sql += " AND ctsanpham.gia_ban BETWEEN ? AND ?";
                queryParams.push(min_price, max_price);
            } else if (min_price) { // Nếu chỉ có min_price
                sql += " AND ctsanpham.gia_ban >= ?";
                queryParams.push(min_price);
            } else if (max_price) { // Nếu chỉ có max_price
                sql += " AND ctsanpham.gia_ban <= ?";
                queryParams.push(max_price);
            }

            connect.query(sql, queryParams, (err, data) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Internal Server Error');
                }

                res.render('user/all_product.ejs', {
                    data: data,
                    user: req.session.user,
                    nhaSanXuatList: nhaSanXuatList
                });
            });
        });
    }

    async da_nhan_hang(req, res) {
        try {
            // Lấy id của đơn hàng từ request
            const orderId = req.params.id;

            // Truy vấn trạng thái hiện tại của đơn hàng từ cơ sở dữ liệu
            const data = await new Promise((resolve, reject) => {
                connect.query(`SELECT * FROM tbl_don_mua_hang WHERE id = ${orderId}`, (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                });
            });

            if (data.length === 0) {
                console.log('Không tìm thấy đơn hàng.');
                res.status(404).send('Không tìm thấy đơn hàng.');
                return;
            }

            const currentStatus = data[0].trang_thai;

            // Xác định trạng thái mới
            let newStatus;
            if (currentStatus === 4) {
                newStatus = 6;
            }
            else {
                console.log('Không có trạng thái nào phù hợp để cập nhật.');
                res.status(400).send('Không có trạng thái nào phù hợp để cập nhật.');
                return;
            }

            // Cập nhật trạng thái mới vào cơ sở dữ liệu
            await new Promise((resolve, reject) => {
                connect.query('UPDATE tbl_don_mua_hang SET trang_thai = ? WHERE id = ?', [newStatus, orderId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            console.log(`Cập nhật trạng thái thành công: ${newStatus} cho đơn hàng có id ${orderId}`);
            res.redirect('/lich_su_mua_hang');
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái:', error);
            res.status(500).send('Lỗi khi cập nhật trạng thái.');
        }
    }

    lich_su_mua_hang(req, res) {
        let sql_hd = 'SELECT * FROM tbl_don_mua_hang';
        connect.query(sql_hd, (err, don_mua_hang) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Internal Server Error');
            }
            let sql = `SELECT 
        tbl_chi_tiet_don_mua_hang.so_luong AS so_luong,
        tbl_chi_tiet_don_mua_hang.don_mua_hang_id AS don_mua_hang_id,
        tbl_chi_tiet_san_pham.hinh_anh AS hinh_anh,
        tbl_san_pham.ten_san_pham AS ten_san_pham,
        tbl_dung_luong.ten_dung_luong AS dung_luong,
        tbl_mau_sac.ten_mau_sac AS mau_sac,
        tbl_chi_tiet_san_pham.gia_ban AS gia_ban,
        tbl_don_mua_hang.tong_tien AS tong_tien,
        tbl_don_mua_hang.trang_thai AS trang_thai,
        tbl_don_mua_hang.khach_hang_id AS khach_hang_id
    FROM 
        tbl_chi_tiet_don_mua_hang
    JOIN tbl_don_mua_hang ON tbl_chi_tiet_don_mua_hang.don_mua_hang_id = tbl_don_mua_hang.id
    JOIN tbl_chi_tiet_san_pham ON tbl_chi_tiet_don_mua_hang.chi_tiet_san_pham_id = tbl_chi_tiet_san_pham.id
    JOIN tbl_san_pham ON tbl_chi_tiet_san_pham.san_pham_id = tbl_san_pham.id
    JOIN tbl_mau_sac ON tbl_chi_tiet_san_pham.mau_sac_id = tbl_mau_sac.id
    JOIN tbl_dung_luong ON tbl_chi_tiet_san_pham.dung_luong_id = tbl_dung_luong.id;
    `;

            connect.query(sql, (err, data) => {
                res.render('user/lich_su_mua_hang.ejs', {
                    data: data,
                    don_mua_hang: don_mua_hang,
                    user: req.session.user
                });
                console.log(data);

            });
        });
    }

    select_mua_lai_hang(req, res) {
        const orderId = req.params.id;

        let sql_hd = 'SELECT * FROM tbl_don_mua_hang';
        connect.query(sql_hd, (err, don_mua_hang) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Internal Server Error');
            }
            let sql = `SELECT 
        tbl_chi_tiet_don_mua_hang.so_luong AS so_luong,
        tbl_chi_tiet_don_mua_hang.id as id,
        tbl_chi_tiet_don_mua_hang.don_mua_hang_id AS don_mua_hang_id,
        tbl_chi_tiet_san_pham.hinh_anh AS hinh_anh,
        tbl_san_pham.ten_san_pham AS ten_san_pham,
        tbl_dung_luong.ten_dung_luong AS dung_luong,
        tbl_mau_sac.ten_mau_sac AS mau_sac,
        tbl_chi_tiet_san_pham.gia_ban AS gia_ban,
        tbl_don_mua_hang.tong_tien AS tong_tien,
        tbl_don_mua_hang.trang_thai AS trang_thai,
        tbl_don_mua_hang.khach_hang_id AS khach_hang_id
    FROM 
        tbl_chi_tiet_don_mua_hang
    JOIN tbl_don_mua_hang ON tbl_chi_tiet_don_mua_hang.don_mua_hang_id = tbl_don_mua_hang.id
    JOIN tbl_chi_tiet_san_pham ON tbl_chi_tiet_don_mua_hang.chi_tiet_san_pham_id = tbl_chi_tiet_san_pham.id
    JOIN tbl_san_pham ON tbl_chi_tiet_san_pham.san_pham_id = tbl_san_pham.id
    JOIN tbl_mau_sac ON tbl_chi_tiet_san_pham.mau_sac_id = tbl_mau_sac.id
    JOIN tbl_dung_luong ON tbl_chi_tiet_san_pham.dung_luong_id = tbl_dung_luong.id WHERE tbl_don_mua_hang.id = ${orderId};
    `;

            connect.query(sql, (err, data) => {
                res.render('user/mau_lai_hang.ejs', {
                    data: data,
                    don_mua_hang: don_mua_hang,
                    user: req.session.user
                });
                console.log(data);

            });
        });
    }
    updateQuantity_mua_lai(req, res) {
        const { itemId, newQuantity } = req.body;
        const sql = 'UPDATE tbl_chi_tiet_don_mua_hang SET so_luong = ? WHERE id = ?';

        connect.query(sql, [newQuantity, itemId], (error, results, fields) => {
            if (error) {
                res.status(500).json({ error: 'Internal Server Error' });
            } else {
                res.status(200).send('Update successful');
            }
        });
    }

    xac_nhan_mua_lai_hang(req, res) {
        const { totalPrice, donMuaHangId } = req.body;
        console.log(totalPrice, donMuaHangId);
        const sql = 'UPDATE tbl_don_mua_hang SET tong_tien_thanh_toan = ?, trang_thai = 1, ngay_tao = now() WHERE id = ?';

        connect.query(sql, [totalPrice, donMuaHangId], (err, result) => {
            if (err) {
                res.status(500).json({ message: 'Error updating order', error: err });
                return;
            }

            res.status(200).json({ message: 'Order updated successfully', result: result });
        });
    }

    // tai_khoan
    tai_khoan(req, res) {

        let sql = "SELECT * FROM tbl_khach_hang WHERE id = ?";

        connect.query(sql, [req.session.user.id], (err, khach_hang) => {
            let thanhPhoSql = "SELECT * FROM tbl_thanh_pho";
            if (err) {
                return res.status(500).send('Internal Server Error');
            }
            connect.query(thanhPhoSql, (err, thanhPhoList) => {
                if (err) {
                    return res.status(500).send('Internal Server Error');
                }
                res.render('user/tai_khoan.ejs', {
                    user: req.session.user,
                    thanhPhoList: thanhPhoList,
                    khach_hang: khach_hang[0]
                });
            });

        })
    }

    getHuyenByHuyen(req, res) {
        let huyenSql = "SELECT * FROM tbl_huyen WHERE thanh_pho_id = ?";
        connect.query(huyenSql, [req.params.id], (err, huyenList) => {
            if (err) {
                return res.status(500).send('Internal Server Error');
            }
            res.json(huyenList);
        });
    }

    getXaByXa(req, res) {
        let xaSql = "SELECT * FROM tbl_xa WHERE huyen_id = ?";
        connect.query(xaSql, [req.params.id], (err, xaList) => {
            if (err) {
                return res.status(500).send('Internal Server Error');
            }
            res.json(xaList);
        });
    }

    update_user(req, res) {
        let id = req.session.user.id;

        console.log("Request body: ", req.body);
        const { ho_ten, email, ngay_sinh, gioi_tinh, so_dien_thoai, dia_chi } = req.body;

        const insertUserQuery = "UPDATE tbl_khach_hang SET ? where id = ?";
        connect.query(insertUserQuery, [{ ho_ten, email, ngay_sinh, gioi_tinh, so_dien_thoai, dia_chi }, id], (err, result) => {

            if (err) {
                console.log("error: ", err);
                res.status(500).send("Internal Server Error");
                return;
            }
            res.redirect('/tai_khoan');
        });
    }

    doi_mk(req, res) {
        const { mat_khau_cu, mat_khau_moi } = req.body;

        console.log(req.body)
        // Lấy thông tin người dùng từ cơ sở dữ liệu
        connect.query('SELECT * FROM tbl_khach_hang WHERE id = ?', [req.session.user.id], (error, results) => {
            if (error) {
                console.error('Lỗi truy vấn:', error);
                return res.json({ success: false, message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' });
            }
            console.log(results[0])
            // Kiểm tra mật khẩu cũ
            if (mat_khau_cu !== results[0].mat_khau) {
                return res.json({ success: false, message: 'Mật khẩu cũ không chính xác.' });
            }

            // Cập nhật mật khẩu mới vào cơ sở dữ liệu
            connect.query('UPDATE tbl_khach_hang SET mat_khau = ?, ngay_cap_nhat = NOW() WHERE id = ?', [mat_khau_moi, req.session.user.id], (error, results) => {
                if (error) {
                    console.error('Lỗi cập nhật:', error);
                    return res.json({ success: false, message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' });
                }

                return res.json({ success: true, message: 'Đổi mật khẩu thành công.' });
            });
        });
    }


    //bao_hanh

    bao_hanh(req, res) {
        const sql = `
        SELECT 
        pbh.*, 
        sp.ten_san_pham, 
        ctsan.hinh_anh AS hinh_anh_chi_tiet, 
        ms.ten_mau_sac, 
        dl.ten_dung_luong,
        nv.ten_nhan_vien,
        dmh.khach_hang_id
    FROM tbl_phieu_bao_hanh AS pbh
    LEFT JOIN tbl_chi_tiet_don_mua_hang AS ctdmh ON pbh.chi_tiet_don_mua_hang_id = ctdmh.id
    LEFT JOIN tbl_don_mua_hang AS dmh ON ctdmh.don_mua_hang_id = dmh.id
    LEFT JOIN tbl_chi_tiet_san_pham AS ctsan ON ctdmh.chi_tiet_san_pham_id = ctsan.id
    LEFT JOIN tbl_san_pham AS sp ON ctsan.san_pham_id = sp.id
    LEFT JOIN tbl_mau_sac AS ms ON ctsan.mau_sac_id = ms.id
    LEFT JOIN tbl_dung_luong AS dl ON ctsan.dung_luong_id = dl.id
    LEFT JOIN tbl_nhan_vien AS nv ON pbh.nhan_vien_id = nv.id
        `;

        connect.query(sql, (err, data) => {
            res.render('user/bao_hanh.ejs', {
                user: req.session.user,
                data: data,
            });
            console.log(data);
        });
    }

    luu_phieu_bao_hanh(req, res) {
        const { orderId, ghiChu } = req.body;
        console.log(orderId, ghiChu);
        const query = `
    INSERT INTO tbl_phieu_bao_hanh (chi_tiet_don_mua_hang_id, ghi_chu, ngay_tao, trang_thai)
    VALUES (?, ?, NOW(), 1)
  `;

        connect.query(query, [orderId, ghiChu], (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ message: 'Lỗi khi lưu dữ liệu' });
            }

            return res.status(200).json({ message: 'Đã lưu dữ liệu thành công' });
        });
    }
}




module.exports = new homeUserController(); 