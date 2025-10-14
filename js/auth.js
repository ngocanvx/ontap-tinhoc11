document.addEventListener('DOMContentLoaded', () => {
    // --- CẤU HÌNH FIREBASE ---
    // TODO: Thay thế bằng thông tin cấu hình Firebase của bạn
    // Your web app's Firebase configuration
    // For Firebase JS SDK v7.20.0 and later, measurementId is optional
    const firebaseConfig = {
        apiKey: "AIzaSyC-o2D2P_CE0B9p5NB7-4qit_ghOtdsk3w",
        authDomain: "user-gv-thptvx.firebaseapp.com",
        projectId: "user-gv-thptvx",
        storageBucket: "user-gv-thptvx.firebasestorage.app",
        messagingSenderId: "1077037934707",
        appId: "1:1077037934707:web:8e02d07ad48adbdb5e2206",
        measurementId: "G-864PFSBYF3"
    };

    // Khởi tạo Firebase
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();

    // --- DOM Elements ---
    // Các phần tử này chỉ tồn tại trên trang login.html
    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');

    // Các phần tử này có thể tồn tại trên các trang khác (ontap.html, kiemtra.html)
    const userStatus = document.getElementById('user-status');

    // Form đăng nhập
    const loginForm = document.getElementById('login-form');
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const loginButton = document.getElementById('login-button');
    const authErrorLogin = document.getElementById('auth-error-login');

    // Form đăng ký
    const signupForm = document.getElementById('signup-form');
    const signupEmail = document.getElementById('signup-email');
    const signupPassword = document.getElementById('signup-password');
    const signupButton = document.getElementById('signup-button');
    const authErrorSignup = document.getElementById('auth-error-signup');

    // --- Chuyển đổi giữa form Đăng nhập và Đăng ký ---
    // Chỉ chạy nếu các nút này tồn tại (trên trang login.html)
    if (showSignup && showLogin) {
        showSignup.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.style.display = 'none';
            signupForm.style.display = 'block';
        });

        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            signupForm.style.display = 'none';
            loginForm.style.display = 'block';
        });
    }

    // --- Xử lý sự kiện ---

    // Đăng ký
    signupButton.addEventListener('click', () => {
        const email = signupEmail.value;
        const password = signupPassword.value;

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Đăng ký thành công, người dùng sẽ tự động đăng nhập
                console.log('Đăng ký và đăng nhập thành công:', userCredential.user);
                // Chuyển hướng về trang chủ
                window.location.href = 'index.html';
            })
            .catch((error) => {
                authErrorSignup.textContent = error.message;
            });
    });

    // Đăng nhập
    loginButton.addEventListener('click', () => {
        const email = loginEmail.value;
        const password = loginPassword.value;

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                console.log('Đăng nhập thành công:', userCredential.user);
                // Chuyển hướng về trang chủ
                window.location.href = 'index.html';
            })
            .catch((error) => {
                authErrorLogin.textContent = error.message;
            });
    });

    // --- Lắng nghe trạng thái xác thực ---
    // Hàm này sẽ chạy trên tất cả các trang có nhúng auth.js
    auth.onAuthStateChanged(user => {
        // Chỉ thực hiện nếu có phần tử user-status trên trang
        if (userStatus) {
            if (user) {
                // Người dùng đã đăng nhập
                userStatus.innerHTML = `
                    <span>Chào, ${user.email}</span>
                    <button id="logout-button" class="auth-button">Đăng Xuất</button>
                `;
                // Gán sự kiện cho nút đăng xuất vừa được tạo
                const logoutButton = document.getElementById('logout-button');
                if (logoutButton) {
                    logoutButton.addEventListener('click', () => {
                        auth.signOut().then(() => {
                            console.log('Đăng xuất thành công.');
                            // Tải lại trang để cập nhật UI
                            window.location.reload();
                        }).catch((error) => {
                            console.error('Lỗi đăng xuất:', error);
                        });
                    });
                }
            } else {
                // Người dùng đã đăng xuất hoặc chưa đăng nhập
                userStatus.innerHTML = `
                    <a href="login.html"><button class="auth-button">Đăng Nhập</button></a>
                `;
            }
        }
    });
});
