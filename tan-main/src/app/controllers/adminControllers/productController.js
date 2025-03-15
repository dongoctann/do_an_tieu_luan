const connect = require('../../../config/db'); // Kết nối đến cơ sở dữ liệu MySQL
const moment = require('moment'); // Thư viện để xử lý định dạng ngày giờ

const helper = require('../../controllers/helper'); // Import helper (dùng để hỗ trợ, nhưng chưa rõ chức năng trong code này)

class productController {
    // Hàm hiển thị danh sách sản phẩm
    product(req, res) {
        let danhMucSql = "SELECT * FROM tbl_danh_muc"; // Truy vấn toàn bộ danh mục sản phẩm từ bảng 'tbl_danh_muc'

        connect.query(danhMucSql, (err, danhMucList) => { // Thực thi câu lệnh SQL lấy danh mục
            if (err) {
                console.error(err); // In lỗi ra console nếu xảy ra
                return res.status(500).send('Internal Server Error'); // Trả về mã lỗi 500 nếu truy vấn thất bại
            }

            let nhaSanXuatSql = "SELECT * FROM tbl_nha_san_xuat"; // Truy vấn toàn bộ nhà sản xuất từ bảng 'tbl_nha_san_xuat'

            connect.query(nhaSanXuatSql, (err, nhaSanXuatList) => { // Thực thi câu lệnh SQL lấy nhà sản xuất
                if (err) {
                    console.error(err); // In lỗi ra console nếu xảy ra
                    return res.status(500).send('Internal Server Error'); // Trả về mã lỗi 500 nếu truy vấn thất bại
                }

                let sql = `SELECT tbl_san_pham.id, tbl_san_pham.ten_san_pham, tbl_san_pham.hinh_anh, tbl_san_pham.trang_thai, tbl_danh_muc.ten_danh_muc, tbl_nha_san_xuat.ten_nha_san_xuat, tbl_san_pham.so_thang_bao_hanh, tbl_san_pham.mo_ta 
                           FROM tbl_san_pham 
                           JOIN tbl_danh_muc ON tbl_san_pham.danh_muc_id = tbl_danh_muc.id 
                           JOIN tbl_nha_san_xuat ON tbl_san_pham.nha_san_xuat_id = tbl_nha_san_xuat.id;`; // Truy vấn lấy danh sách sản phẩm kèm thông tin danh mục và nhà sản xuất

                connect.query(sql, (err, data) => { // Thực thi câu lệnh SQL lấy sản phẩm
                    if (err) {
                        console.error(err); // In lỗi ra console nếu xảy ra
                        return res.status(500).send('Internal Server Error'); // Trả về mã lỗi 500 nếu truy vấn thất bại
                    }

                    // Render giao diện 'product.ejs' và truyền dữ liệu lấy được vào
                    res.render('admin/product/product.ejs', {
                        data: data, // Dữ liệu danh sách sản phẩm
                        danhMucList: danhMucList, // Dữ liệu danh sách danh mục
                        nhaSanXuatList: nhaSanXuatList // Dữ liệu danh sách nhà sản xuất
                    });
                });
            });
        });
    }

    // Hàm tìm kiếm sản phẩm
    search_product(req, res) {
        const keyword = req.query.name; // Lấy từ khóa tìm kiếm từ query string
        const danhMucId = req.query.danh_muc_id; // Lấy ID danh mục từ query string
        const nhaSanXuatId = req.query.nha_san_xuat_id; // Lấy ID nhà sản xuất từ query string

        let danhMucSql = "SELECT * FROM tbl_danh_muc"; // Truy vấn toàn bộ danh mục sản phẩm

        connect.query(danhMucSql, (err, danhMucList) => { // Thực thi câu lệnh SQL lấy danh mục
            if (err) {
                console.error(err); // In lỗi ra console nếu xảy ra
                return res.status(500).send('Internal Server Error'); // Trả về mã lỗi 500 nếu truy vấn thất bại
            }

            let nhaSanXuatSql = "SELECT * FROM tbl_nha_san_xuat"; // Truy vấn toàn bộ nhà sản xuất

            connect.query(nhaSanXuatSql, (err, nhaSanXuatList) => { // Thực thi câu lệnh SQL lấy nhà sản xuất
                if (err) {
                    console.error(err); // In lỗi ra console nếu xảy ra
                    return res.status(500).send('Internal Server Error'); // Trả về mã lỗi 500 nếu truy vấn thất bại
                }

                let sql = `SELECT tbl_san_pham.id, tbl_san_pham.ten_san_pham, tbl_san_pham.hinh_anh, tbl_danh_muc.ten_danh_muc, tbl_nha_san_xuat.ten_nha_san_xuat, tbl_san_pham.so_thang_bao_hanh, tbl_san_pham.mo_ta 
                           FROM tbl_san_pham 
                           JOIN tbl_danh_muc ON tbl_san_pham.danh_muc_id = tbl_danh_muc.id 
                           JOIN tbl_nha_san_xuat ON tbl_san_pham.nha_san_xuat_id = tbl_nha_san_xuat.id 
                           WHERE 1 = 1`; // Truy vấn lấy danh sách sản phẩm với điều kiện động

                if (keyword) {
                    sql += " AND tbl_san_pham.ten_san_pham LIKE ?"; // Thêm điều kiện tìm kiếm theo từ khóa nếu có
                }

                if (danhMucId) {
                    sql += " AND tbl_san_pham.danh_muc_id = ?"; // Thêm điều kiện lọc theo danh mục nếu có
                }

                if (nhaSanXuatId) {
                    sql += " AND tbl_san_pham.nha_san_xuat_id = ?"; // Thêm điều kiện lọc theo nhà sản xuất nếu có
                }

                const queryParams = []; // Mảng tham số truyền vào câu truy vấn

                if (keyword) {
                    queryParams.push(`%${keyword}%`); // Thêm từ khóa vào mảng tham số
                }

                if (danhMucId) {
                    queryParams.push(danhMucId); // Thêm danh mục ID vào mảng tham số
                }

                if (nhaSanXuatId) {
                    queryParams.push(nhaSanXuatId); // Thêm nhà sản xuất ID vào mảng tham số
                }

                connect.query(sql, queryParams, (err, data) => { // Thực thi câu lệnh SQL với tham số
                    if (err) {
                        console.error(err); // In lỗi ra console nếu xảy ra
                        return res.status(500).send('Internal Server Error'); // Trả về mã lỗi 500 nếu truy vấn thất bại
                    }

                    // Render giao diện 'product.ejs' và truyền dữ liệu tìm kiếm vào
                    res.render('admin/product/product.ejs', {
                        data: data, // Dữ liệu danh sách sản phẩm tìm được
                        danhMucList: danhMucList, // Dữ liệu danh sách danh mục
                        nhaSanXuatList: nhaSanXuatList // Dữ liệu danh sách nhà sản xuất
                    });
                });
            });
        });
    }
    //them dòng san pham
    add_product(req, res) {
        const {
            danh_muc_id, // ID danh mục sản phẩm
            nha_san_xuat_id, // ID nhà sản xuất
            ten_san_pham, // Tên sản phẩm
            so_thang_bao_hanh, // Số tháng bảo hành của sản phẩm
            mo_ta, // Mô tả sản phẩm
            trang_thai, // Trạng thái của sản phẩm (có thể là ẩn/hiện)
        } = req.body;
    
        if (ten_san_pham && danh_muc_id && nha_san_xuat_id && so_thang_bao_hanh && mo_ta && trang_thai) {
            const ngay_tao = moment().format('YYYY-MM-DD HH:mm:ss'); // Lấy thời gian hiện tại và định dạng
    
            const newProduct = {
                danh_muc_id: danh_muc_id, // Gán giá trị ID danh mục sản phẩm
                hinh_anh: req.file.originalname, // Lấy tên file hình ảnh từ request
                nha_san_xuat_id: nha_san_xuat_id, // Gán giá trị ID nhà sản xuất
                ten_san_pham: ten_san_pham, // Gán giá trị tên sản phẩm
                so_thang_bao_hanh: so_thang_bao_hanh, // Gán số tháng bảo hành
                mo_ta: mo_ta, // Gán mô tả sản phẩm
                trang_thai: trang_thai, // Gán trạng thái của sản phẩm
                ngay_tao: ngay_tao // Gán thời gian tạo sản phẩm
            };
    
            const insertProductQuery = "INSERT INTO tbl_san_pham SET ?"; // Câu truy vấn thêm sản phẩm mới vào csdl
            connect.query(insertProductQuery, newProduct, (err, result) => {
                if (err) {
                    console.log("error: ", err); // Log lỗi nếu có
                    res.status(500).send("Internal Server Error"); // Trả về lỗi 500
                    return;
                }
                console.log("created product: ", { ...newProduct }); // Log sản phẩm vừa thêm thành công
                res.redirect('/admin/product'); // Chuyển hướng về trang danh sách sản phẩm
            });
        } else {
            const conflictError = 'Product information is required.'; // Thông báo lỗi nếu thông tin không đầy đủ
            res.redirect('/admin/product'); // Chuyển hướng về trang thêm sản phẩm
        }
    }

    // Hàm xử lý yêu cầu chỉnh dòng sửa sản phẩm
    edit_product(req, res) {
        let id = req.params.id; // Lấy ID của sản phẩm từ tham số trên URL
    
        // Truy vấn thông tin chi tiết của sản phẩm theo ID từ bảng tbl_san_pham
        connect.query(`SELECT tbl_san_pham.id, tbl_san_pham.danh_muc_id, tbl_san_pham.hinh_anh, tbl_san_pham.nha_san_xuat_id, tbl_san_pham.ten_san_pham, tbl_san_pham.trang_thai, tbl_danh_muc.ten_danh_muc, tbl_nha_san_xuat.ten_nha_san_xuat, tbl_san_pham.so_thang_bao_hanh, tbl_san_pham.mo_ta 
                       FROM tbl_san_pham 
                       JOIN tbl_danh_muc ON tbl_san_pham.danh_muc_id = tbl_danh_muc.id 
                       JOIN tbl_nha_san_xuat ON tbl_san_pham.nha_san_xuat_id = tbl_nha_san_xuat.id 
                       WHERE tbl_san_pham.id = ${id}`, (err, productData) => {
            if (err) {
                console.error(err); // Ghi log lỗi nếu có lỗi trong quá trình truy vấn
                return res.status(500).send('Internal Server Error'); // Trả về mã lỗi 500
            }
    
            // Truy vấn danh sách tất cả danh mục sản phẩm
            let danhMucSql = "SELECT * FROM tbl_danh_muc";
    
            connect.query(danhMucSql, (err, danhMucList) => {
                if (err) {
                    console.error(err); // Ghi log lỗi nếu có lỗi trong quá trình truy vấn
                    return res.status(500).send('Internal Server Error'); // Trả về mã lỗi 500
                }
    
                // Truy vấn danh sách tất cả nhà sản xuất
                let nhaSanXuatSql = "SELECT * FROM tbl_nha_san_xuat";
    
                connect.query(nhaSanXuatSql, (err, nhaSanXuatList) => {
                    if (err) {
                        console.error(err); // Ghi log lỗi nếu có lỗi trong quá trình truy vấn
                        return res.status(500).send('Internal Server Error'); // Trả về mã lỗi 500
                    }
    
                    // Render trang chỉnh sửa sản phẩm với dữ liệu đã truy vấn
                    res.render('admin/product/edit_product.ejs', {
                        data: productData[0], // Dữ liệu của sản phẩm được chọn
                        danhMucList: danhMucList, // Danh sách danh mục sản phẩm
                        nhaSanXuatList: nhaSanXuatList // Danh sách nhà sản xuất
                    });
                    console.log(productData[0]); // Ghi log dữ liệu của sản phẩm để kiểm tra
                });
            });
        });
    }
    // Hàm xử lý yêu cầu cập nhật thông tin sản phẩm
    update_product(req, res) {
        let id = req.params.id; // Lấy ID của sản phẩm từ tham số trên URL

        const { danh_muc_id, nha_san_xuat_id, ten_san_pham, so_thang_bao_hanh, mo_ta, trang_thai } = req.body; // Lấy thông tin sản phẩm từ form
        const hinh_anh = req.file ? req.file.originalname : req.body.hinh_anh; // Nếu có hình ảnh mới thì sử dụng, nếu không thì giữ hình ảnh cũ

        // Cập nhật thông tin sản phẩm trong cơ sở dữ liệu
        const insertUserQuery = "UPDATE tbl_san_pham SET ? where id = ?";
        connect.query(insertUserQuery, [{ danh_muc_id, hinh_anh, nha_san_xuat_id, ten_san_pham, so_thang_bao_hanh, mo_ta, trang_thai }, id], (err, result) => {
            if (err) {
                console.log("error: ", err); // Log lỗi nếu có
                res.status(500).send("Internal Server Error"); // Trả về lỗi server nếu có lỗi
                return;
            }
            res.redirect('/admin/product'); // Quay lại trang sản phẩm sau khi cập nhật
        });
    };

    // Hàm lấy tất cả sản phẩm và các thông tin chi tiết như màu sắc, dung lượng
    product_all(req, res) {
        let sql_san_pham = "SELECT * FROM tbl_san_pham;"; // Lấy tất cả sản phẩm

        connect.query(sql_san_pham, (err, product) => {
            if (err) {
                return res.status(500).send('Internal Server Error'); // Trả về lỗi nếu có lỗi
            }

            let sql_mau_sac = "SELECT * FROM tbl_mau_sac;"; // Lấy tất cả màu sắc

            connect.query(sql_mau_sac, (err, mau_sac) => {
                if (err) {
                    return res.status(500).send('Internal Server Error'); // Trả về lỗi nếu có lỗi
                }

                let sql_dung_luong = "SELECT * FROM tbl_dung_luong;"; // Lấy tất cả dung lượng

                connect.query(sql_dung_luong, (err, dung_luong) => {
                    if (err) {
                        return res.status(500).send('Internal Server Error'); // Trả về lỗi nếu có lỗi
                    }

                    let sql = "SELECT sp.ten_san_pham, ctsanpham.id, ctsanpham.hinh_anh AS hinh_anh_chi_tiet, mausac.ten_mau_sac, dungluong.ten_dung_luong, ctsanpham.gia_ban, ctsanpham.serial FROM tbl_san_pham sp JOIN tbl_chi_tiet_san_pham ctsanpham ON sp.id = ctsanpham.san_pham_id JOIN tbl_mau_sac mausac ON ctsanpham.mau_sac_id = mausac.id JOIN tbl_dung_luong dungluong ON ctsanpham.dung_luong_id = dungluong.id;"; // Lấy tất cả thông tin chi tiết sản phẩm

                    connect.query(sql, (err, product_all) => {
                        if (err) {
                            return res.status(500).send('Internal Server Error'); // Trả về lỗi nếu có lỗi
                        }

                        res.render('admin/product/product_all.ejs', {
                            product_all: product_all,
                            product: product,
                            mau_sac: mau_sac,
                            dung_luong: dung_luong
                        }); // Render trang hiển thị tất cả sản phẩm với thông tin chi tiết
                    });
                });
            });
        });
    };

    // Hàm thêm thông tin chi tiết sản phẩm như màu sắc, dung lượng, giá bán
    add_product_all(req, res) {
        const {
            san_pham_id,
            mau_sac_id,
            dung_luong_id,
            gia_ban,
            serial,
        } = req.body; // Lấy thông tin chi tiết sản phẩm từ form

        if (dung_luong_id && san_pham_id && mau_sac_id && gia_ban && serial) {
            const ngay_tao = moment().format('YYYY-MM-DD HH:mm:ss'); // Lấy ngày giờ tạo sản phẩm

            const newProduct = {
                hinh_anh: req.file.originalname, // Lưu tên hình ảnh
                san_pham_id: san_pham_id, // ID sản phẩm
                mau_sac_id: mau_sac_id, // ID màu sắc
                dung_luong_id: dung_luong_id, // ID dung lượng
                gia_ban: gia_ban, // Giá bán
                serial: serial, // Số serial
                ngay_tao: ngay_tao // Ngày tạo sản phẩm
            };

            const insertProductQuery = "INSERT INTO tbl_chi_tiet_san_pham SET ?"; // Câu truy vấn thêm chi tiết sản phẩm vào cơ sở dữ liệu
            connect.query(insertProductQuery, newProduct, (err, result) => {
                if (err) {
                    console.log("error: ", err); // Log lỗi nếu có
                    res.status(500).send("Internal Server Error"); // Trả về lỗi nếu có lỗi
                    return;
                }
                console.log("created product_all: ", { ...newProduct }); // Log thông tin chi tiết sản phẩm đã thêm
                res.redirect('/admin/product_all'); // Quay lại trang tất cả sản phẩm sau khi thêm
            });
        } else {
            const conflictError = 'Product_all information is required.'; // Thông báo lỗi nếu thiếu thông tin
            res.redirect('/admin/product_all'); // Quay lại trang tất cả sản phẩm nếu thiếu thông tin
        }
    }

    // Hàm tìm kiếm sản phẩm theo tên, màu sắc và dung lượng
    search_product_all(req, res) {
        const keyword = req.query.name; // Lấy từ khóa tìm kiếm tên sản phẩm từ query
        const mau_sac_id = req.query.mau_sac_id; // Lấy ID màu sắc từ query
        const dung_luong_id = req.query.dung_luong_id; // Lấy ID dung lượng từ query

        let mau_sac_sql = "SELECT * FROM tbl_mau_sac"; // Truy vấn danh sách màu sắc
        let dung_luong_sql = "SELECT * FROM tbl_dung_luong"; // Truy vấn danh sách dung lượng
        let sql_san_pham = "SELECT * FROM tbl_san_pham;"; // Truy vấn tất cả sản phẩm

        connect.query(mau_sac_sql, (err, mau_sac) => { // Truy vấn màu sắc
            if (err) {
                console.error(err); // Log lỗi nếu có
                return res.status(500).send('Internal Server Error'); // Trả về lỗi server nếu có
            }

            connect.query(dung_luong_sql, (err, dung_luong) => { // Truy vấn dung lượng
                if (err) {
                    console.error(err); // Log lỗi nếu có
                    return res.status(500).send('Internal Server Error'); // Trả về lỗi server nếu có
                }

                connect.query(sql_san_pham, (err, product) => { // Truy vấn tất cả sản phẩm
                    let sql = `
                        SELECT 
                            sp.ten_san_pham, 
                            ctsanpham.hinh_anh AS hinh_anh_chi_tiet, 
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

                    const queryParams = []; // Mảng để lưu tham số cho câu truy vấn

                    // Kiểm tra và thêm điều kiện tìm kiếm theo tên sản phẩm
                    if (keyword) {
                        sql += " AND sp.ten_san_pham LIKE ?"; 
                        queryParams.push(`%${keyword}%`);
                    }

                    // Kiểm tra và thêm điều kiện tìm kiếm theo màu sắc
                    if (mau_sac_id) {
                        sql += " AND ctsanpham.mau_sac_id = ?";
                        queryParams.push(mau_sac_id);
                    }

                    // Kiểm tra và thêm điều kiện tìm kiếm theo dung lượng
                    if (dung_luong_id) {
                        sql += " AND ctsanpham.dung_luong_id = ?";
                        queryParams.push(dung_luong_id);
                    }

                    // Thực thi câu truy vấn tìm kiếm sản phẩm
                    connect.query(sql, queryParams, (err, product_all) => {
                        if (err) {
                            console.error(err); // Log lỗi nếu có
                            return res.status(500).send('Internal Server Error'); // Trả về lỗi server nếu có
                        }

                        // Render trang sản phẩm với kết quả tìm kiếm
                        res.render('admin/product/product_all.ejs', {
                            product_all: product_all,
                            product: product,
                            mau_sac: mau_sac,
                            dung_luong: dung_luong
                        });
                    });
                });
            });
        });
    }

    // Hàm tìm kiếm sản phẩm theo khoảng giá
    searchPrice_product_all(req, res) {
        const min_price = req.query.min_price; // Lấy giá thấp nhất từ query
        const max_price = req.query.max_price; // Lấy giá cao nhất từ query

        let mau_sac_sql = "SELECT * FROM tbl_mau_sac"; // Truy vấn danh sách màu sắc
        let dung_luong_sql = "SELECT * FROM tbl_dung_luong"; // Truy vấn danh sách dung lượng
        let sql_san_pham = "SELECT * FROM tbl_san_pham;"; // Truy vấn tất cả sản phẩm

        connect.query(mau_sac_sql, (err, mau_sac) => { // Truy vấn màu sắc
            if (err) {
                console.error(err); // Log lỗi nếu có
                return res.status(500).send('Internal Server Error'); // Trả về lỗi server nếu có
            }

            connect.query(dung_luong_sql, (err, dung_luong) => { // Truy vấn dung lượng
                if (err) {
                    console.error(err); // Log lỗi nếu có
                    return res.status(500).send('Internal Server Error'); // Trả về lỗi server nếu có
                }

                connect.query(sql_san_pham, (err, product) => { // Truy vấn tất cả sản phẩm
                    let sql = `
                        SELECT 
                            sp.ten_san_pham, 
                            ctsanpham.hinh_anh AS hinh_anh_chi_tiet, 
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

                    const queryParams = []; // Mảng tham số cho câu truy vấn

                    // Kiểm tra và thêm điều kiện tìm kiếm theo giá
                    if (min_price && max_price) {
                        sql += " AND ctsanpham.gia_ban >= ? AND ctsanpham.gia_ban <= ?";
                        queryParams.push(min_price, max_price);
                    } else if (max_price) { // Nếu chỉ có giá cao nhất
                        sql += " AND ctsanpham.gia_ban <= ?";
                        queryParams.push(max_price);
                    }

                    // Thực thi câu truy vấn tìm kiếm theo giá
                    connect.query(sql, queryParams, (err, product_all) => {
                        if (err) {
                            console.error(err); // Log lỗi nếu có
                            return res.status(500).send('Internal Server Error'); // Trả về lỗi server nếu có
                        }

                        // Render trang sản phẩm với kết quả tìm kiếm theo giá
                        res.render('admin/product/product_all.ejs', {
                            product_all: product_all,
                            product: product,
                            mau_sac: mau_sac,
                            dung_luong: dung_luong
                        });
                    });
                });
            });
        });
    }

    // Hàm chỉnh sửa thông tin chi tiết sản phẩm
    edit_product_all(req, res) {
        let id = req.params.id; // Lấy ID sản phẩm từ tham số URL

        // Truy vấn thông tin sản phẩm chi tiết từ cơ sở dữ liệu
        connect.query(`
            SELECT 
                sp.ten_san_pham, 
                ctsanpham.id,
                ctsanpham.hinh_anh AS hinh_anh_chi_tiet, 
                mausac.ten_mau_sac, 
                dungluong.ten_dung_luong, 
                ctsanpham.mau_sac_id,
                ctsanpham.dung_luong_id,
                ctsanpham.gia_ban, 
                ctsanpham.serial 
            FROM 
                tbl_san_pham sp 
                JOIN tbl_chi_tiet_san_pham ctsanpham ON sp.id = ctsanpham.san_pham_id 
                JOIN tbl_mau_sac mausac ON ctsanpham.mau_sac_id = mausac.id 
                JOIN tbl_dung_luong dungluong ON ctsanpham.dung_luong_id = dungluong.id 
            WHERE ctsanpham.id = ${id}`, (err, productData) => {
            if (err) {
                console.error(err); // Log lỗi nếu có
                return res.status(500).send('Internal Server Error'); // Trả về lỗi server nếu có
            }

            // Truy vấn danh sách màu sắc
            let mau_sacSql = "SELECT * FROM tbl_mau_sac";
            connect.query(mau_sacSql, (err, mau_sac_List) => {
                if (err) {
                    console.error(err); // Log lỗi nếu có
                    return res.status(500).send('Internal Server Error'); // Trả về lỗi server nếu có
                }

                // Truy vấn danh sách dung lượng
                let dung_luongSql = "SELECT * FROM tbl_dung_luong";
                connect.query(dung_luongSql, (err, dung_luong_List) => {
                    if (err) {
                        console.error(err); // Log lỗi nếu có
                        return res.status(500).send('Internal Server Error'); // Trả về lỗi server nếu có
                    }

                    // Render trang chỉnh sửa sản phẩm với dữ liệu từ cơ sở dữ liệu
                    res.render('admin/product/edit_product_all.ejs', {
                        data: productData[0],
                        mau_sac_List: mau_sac_List,
                        dung_luong_List: dung_luong_List
                    });
                });
            });
        });
    }
// Hàm cập nhật thông tin chi tiết sản phẩm
    update_product_all(req, res) {
        let id = req.params.id;  // Lấy ID sản phẩm từ tham số URL
    
        // Giải cấu trúc các giá trị từ body request để lấy các thông tin cập nhật
        const { mau_sac_id, dung_luong_id, gia_ban, serial } = req.body;
        // Kiểm tra nếu có file hình ảnh mới được tải lên, nếu không thì sử dụng hình ảnh hiện tại
        const hinh_anh = req.file ? req.file.originalname : req.body.hinh_anh;
    
        // Câu truy vấn SQL để cập nhật chi tiết sản phẩm trong bảng tbl_chi_tiet_san_pham
        const insertUserQuery = "UPDATE tbl_chi_tiet_san_pham SET ? where id = ?";
        connect.query(insertUserQuery, [{ hinh_anh, mau_sac_id, dung_luong_id, gia_ban, serial }, id], (err, result) => {
    
            if (err) {
                console.log("error: ", err);  // Log lỗi nếu có
                res.status(500).send("Internal Server Error");  // Trả về lỗi server nếu có vấn đề
                return;
            }
    
            res.redirect('/admin/product_all');  // Sau khi cập nhật thành công, chuyển hướng về trang danh sách sản phẩm
        });
    };
    // Hàm xóa sản phẩm
    delete_product_all(req, res) {
        const tableName = 'tbl_chi_tiet_san_pham';  // Định nghĩa tên bảng
        const tableId = 'id';  // Định nghĩa tên cột ID
        const redirectPath = 'product_all';  // Định nghĩa đường dẫn chuyển hướng sau khi xóa
        helper.deleteRecord(tableName, tableId, redirectPath, req, res);  // Sử dụng hàm trợ giúp để xóa bản ghi và chuyển hướng
    }
    // Hàm hiển thị trang danh mục sản phẩm
    danhmuc(req, res) {
        let sql = "select * from tbl_danh_muc; ";  // Câu truy vấn SQL để lấy danh sách các danh mục từ bảng tbl_danh_muc
    
        connect.query(sql, (err, data) => {
            res.render('admin/product/danhmucsp.ejs', {  // Render trang danh mục sản phẩm và truyền dữ liệu vào
                data: data
            });
        });
    }
    // Hàm hiển thị trang màu sắc
    mau_sac(req, res) {
        let sql = "SELECT * FROM tbl_mau_sac;";  // Câu truy vấn SQL để lấy danh sách màu sắc từ bảng tbl_mau_sac
        connect.query(sql, (err, data) => {
            res.render('admin/product/mau_sac.ejs', {  // Render trang màu sắc và truyền dữ liệu vào
                data: data
            });
        });
    }
    // Hàm hiển thị trang dung lượng
    dung_luong(req, res) {
        let sql = "SELECT * FROM tbl_dung_luong;";  // Câu truy vấn SQL để lấy danh sách dung lượng từ bảng tbl_dung_luong
        connect.query(sql, (err, data) => {
            res.render('admin/product/dung_luong.ejs', {  // Render trang dung lượng và truyền dữ liệu vào
                data: data
            });
        });
    }
    // Hàm thêm danh mục
    add_danh_muc(req, res) {
        const { ten_danh_muc } = req.body;  // Lấy tên danh mục từ body request
        const ngay_tao = moment().format('YYYY-MM-DD HH:mm:ss');  // Lấy thời gian tạo danh mục
        const tableName = 'tbl_danh_muc';  // Định nghĩa tên bảng
        const checkColumn = 'ten_danh_muc';  // Cột để kiểm tra sự tồn tại của danh mục
        const redirectPath = '/admin/danhmuc';  // Đường dẫn chuyển hướng sau khi thêm
    
        // Sử dụng hàm trợ giúp để kiểm tra và thêm danh mục mới vào bảng
        helper.checkAndInsertRecord(tableName, { ten_danh_muc: ten_danh_muc, ngay_tao: ngay_tao }, checkColumn, redirectPath, req, res);
    }
    // Hàm thêm màu sắc
    add_mau_sac(req, res) {
        const tableName = 'tbl_mau_sac';  // Định nghĩa tên bảng màu sắc
        const tenFieldName = 'ten_mau_sac';  // Cột tên màu sắc
        const redirectPath = 'mau_sac';  // Đường dẫn chuyển hướng sau khi thêm
    
        // Sử dụng hàm trợ giúp để thêm màu sắc mới vào bảng
        helper.addDanhMuc(tableName, tenFieldName, redirectPath, req, res);
    }
    // Hàm thêm dung lượng
    add_dung_luong(req, res) {
        const tableName = 'tbl_dung_luong';  // Định nghĩa tên bảng dung lượng
        const tenFieldName = 'ten_dung_luong';  // Cột tên dung lượng
        const redirectPath = 'dung_luong';  // Đường dẫn chuyển hướng sau khi thêm
    
        // Sử dụng hàm trợ giúp để thêm dung lượng mới vào bảng
        helper.addDanhMuc(tableName, tenFieldName, redirectPath, req, res);
    }
    // Hàm xóa màu sắc
    delete_mau_sac(req, res) {
        const tableName = 'tbl_mau_sac';  // Định nghĩa tên bảng màu sắc
        const tableId = 'id';  // Định nghĩa cột ID
        const redirectPath = 'mau_sac';  // Đường dẫn chuyển hướng sau khi xóa
    
        // Sử dụng hàm trợ giúp để xóa màu sắc từ bảng
        helper.deleteRecord(tableName, tableId, redirectPath, req, res);
    }
    // Hàm xóa danh mục
    delete_danh_muc(req, res) {
        const tableName = 'tbl_danh_muc';  // Định nghĩa tên bảng danh mục
        const tableId = 'id';  // Định nghĩa cột ID
        const redirectPath = 'danhmuc';  // Đường dẫn chuyển hướng sau khi xóa
    
        // Sử dụng hàm trợ giúp để xóa danh mục từ bảng
        helper.deleteRecord(tableName, tableId, redirectPath, req, res);
    }
    //hàm xóa dung lượng
    delete_dung_luong(req, res) {
        const tableName = 'tbl_dung_luong';  // Định nghĩa tên bảng dung lượng
        const tableId = 'id';  // Định nghĩa cột ID
        const redirectPath = 'dung_luong';  // Đường dẫn chuyển hướng sau khi xóa
    
        // Sử dụng hàm trợ giúp để xóa dung lượng từ bảng
        helper.deleteRecord(tableName, tableId, redirectPath, req, res);
    }
    //Hàm tìm kiếm danh mục
    search_danh_muc(req, res) {
        const tableName = 'tbl_danh_muc';  // Định nghĩa tên bảng danh mục
        const searchField = 'ten_danh_muc';  // Cột để tìm kiếm danh mục
        const redirectPath1 = 'product';  // Đường dẫn chuyển hướng trong trường hợp tìm kiếm từ sản phẩm
        const redirectPath2 = 'danhmucsp';  // Đường dẫn chuyển hướng trong trường hợp tìm kiếm từ danh mục sản phẩm
        const queryParams = req.query.name;  // Lấy giá trị tìm kiếm từ query
    
        // Sử dụng hàm trợ giúp để thực hiện tìm kiếm trong bảng
        helper.searchInTable(req, res, tableName, searchField, redirectPath1, redirectPath2, queryParams);
    }
    //Hàm tìm kiếm màu sắc
    search_mau_sac(req, res) {
        const tableName = 'tbl_mau_sac';  // Định nghĩa tên bảng màu sắc
        const searchField = 'ten_mau_sac';  // Cột để tìm kiếm màu sắc
        const redirectPath1 = 'product';  // Đường dẫn chuyển hướng trong trường hợp tìm kiếm từ sản phẩm
        const redirectPath2 = 'mau_sac';  // Đường dẫn chuyển hướng trong trường hợp tìm kiếm từ màu sắc
        const queryParams = req.query.name;  // Lấy giá trị tìm kiếm từ query
    
        // Sử dụng hàm trợ giúp để thực hiện tìm kiếm trong bảng
        helper.searchInTable(req, res, tableName, searchField, redirectPath1, redirectPath2, queryParams);
    }
    //Hàm tìm kiếm dung lượng
    search_dung_luong(req, res) {
        const tableName = 'tbl_dung_luong';  // Định nghĩa tên bảng dung lượng
        const searchField = 'ten_dung_luong';  // Cột để tìm kiếm dung lượng
        const redirectPath1 = 'product';  // Đường dẫn chuyển hướng trong trường hợp tìm kiếm từ sản phẩm
        const redirectPath2 = 'dung_luong';  // Đường dẫn chuyển hướng trong trường hợp tìm kiếm từ dung lượng
        const queryParams = req.query.name;  // Lấy giá trị tìm kiếm từ query
    
        // Sử dụng hàm trợ giúp để thực hiện tìm kiếm trong bảng
        helper.searchInTable(req, res, tableName, searchField, redirectPath1, redirectPath2, queryParams);
    }
    
}

module.exports = new productController;