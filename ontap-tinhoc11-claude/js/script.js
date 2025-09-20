// Dữ liệu sẽ được tải từ file
let lessonData = null;
let questionData = {};

// Hàm đọc file JSON
async function loadJSON(filename) {
    try {
        const response = await fetch(filename);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading JSON file:', error);
        return null;
    }
}

// Hàm tải danh sách bài học từ file
async function loadLessonData() {
    lessonData = await loadJSON('./json/baihoc.json');
    if (!lessonData) {
        // Fallback data nếu không tải được file
        lessonData = {
            "lessons": [
                {
                    "name": "Bài 1. Hệ điều hành",
                    "file": "bai_01_questions.json"
                },
                {
                    "name": "Bài 2. Thực hành sử dụng hệ điều hành",
                    "file": "bai_02_questions.json"
                }
            ]
        };
    }
}

// Hàm tải câu hỏi từ file
async function loadQuestionData(filename) {
    if (!questionData[filename]) {
        questionData[filename] = await loadJSON(filename);

        // Fallback data nếu không tải được file
        if (!questionData[filename]) {
            questionData[filename] = getFallbackQuestions(filename);
        }
    }
    return questionData[filename];
}

// Dữ liệu dự phòng nếu không đọc được file
function getFallbackQuestions(filename) {
    const fallbackData = {
        "bai_01_questions.json": {
            "questions": [
                {
                    "question": "Thành phần nào sau đây KHÔNG thuộc phần cứng của máy tính?",
                    "answers": ["CPU", "RAM", "Windows", "Ổ cứng"],
                    "correct": 2
                },
                {
                    "question": "RAM viết tắt của từ gì?",
                    "answers": ["Random Access Memory", "Read Access Memory", "Real Access Memory", "Rapid Access Memory"],
                    "correct": 0
                },
                {
                    "question": "Đơn vị đo dung lượng bộ nhớ lớn nhất là?",
                    "answers": ["MB", "GB", "TB", "KB"],
                    "correct": 2
                },
                {
                    "question": "CPU có chức năng chính là gì?",
                    "answers": ["Lưu trữ dữ liệu", "Xử lý thông tin", "Hiển thị hình ảnh", "Nhập dữ liệu"],
                    "correct": 1
                },
                {
                    "question": "Thiết bị nào sau đây là thiết bị xuất?",
                    "answers": ["Bàn phím", "Chuột", "Màn hình", "Micro"],
                    "correct": 2
                }
            ]
        },
        "bai_05_questions.json": {
            "questions": [
                {
                    "question": "Câu lệnh SQL nào được sử dụng để tạo bảng mới?\n```sql\nCREATE TABLE students (\n    id INT PRIMARY KEY,\n    name VARCHAR(50)\n);\n```",
                    "answers": ["CREATE", "INSERT", "SELECT", "UPDATE"],
                    "correct": 0
                },
                {
                    "question": "Trong câu lệnh sau, từ khóa nào được sử dụng để lọc dữ liệu?\n```sql\nSELECT * FROM users WHERE age > 18;\n```",
                    "answers": ["SELECT", "FROM", "WHERE", "age"],
                    "correct": 2
                },
                {
                    "question": "Câu lệnh nào được sử dụng để thêm dữ liệu vào bảng?",
                    "answers": [
                        "`INSERT INTO table_name VALUES (...)`",
                        "`SELECT * FROM table_name`",
                        "`UPDATE table_name SET ...`",
                        "`DELETE FROM table_name`"
                    ],
                    "correct": 0
                },
                {
                    "question": "Kết quả của câu lệnh sau là gì?\n```sql\nSELECT COUNT(*) FROM products;\n```",
                    "answers": ["Hiển thị tất cả sản phẩm", "Đếm số lượng sản phẩm", "Xóa tất cả sản phẩm", "Cập nhật sản phẩm"],
                    "correct": 1
                },
                {
                    "question": "Để sắp xếp kết quả theo thứ tự tăng dần, ta sử dụng từ khóa nào?",
                    "answers": ["`ORDER BY ASC`", "`SORT BY`", "`ARRANGE BY`", "`GROUP BY`"],
                    "correct": 0
                }
            ]
        }
    };
}

let currentLessonFile = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let correctAnswers = 0;
let startTime = null;
let timerInterval = null;

// Hàm xử lý và format nội dung có code
function formatContent(text) {
    if (!text) return text;

    // Xử lý code blocks (```sql ... ```)
    text = text.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
        const language = lang || 'sql';
        return `<pre><code class="language-${language}">${code.trim()}</code></pre>`;
    });

    // Xử lý inline code (`...`)
    text = text.replace(/`([^`]+)`/g, '<code class="code-inline">$1</code>');

    // Xử lý xuống dòng
    text = text.replace(/\n/g, '<br>');

    return text;
}

// Khởi tạo trang
async function init() {
    // Tải dữ liệu danh sách bài học
    await loadLessonData();

    // Cập nhật danh sách bài học lên form (drop down)
    loadLessons();
}

// Tải danh sách bài học
function loadLessons() {
    const dropdownContent = document.getElementById('dropdown-content');
    dropdownContent.innerHTML = '';

    if (!lessonData || !lessonData.lessons) {
        dropdownContent.innerHTML = '<a href="#" style="color: #999;">Không thể tải danh sách bài học</a>';
        return;
    }

    lessonData.lessons.forEach((lesson, index) => {
        const a = document.createElement('a');
        a.href = '#';
        a.textContent = lesson.name;
        a.onclick = (e) => {
            e.preventDefault();
            selectLesson(lesson.name, lesson.file);
        };
        dropdownContent.appendChild(a);
    });
}

// Chọn bài học
function selectLesson(lessonName, file) {
    document.getElementById('selected-lesson').textContent = lessonName;
    currentLessonFile = file;
    document.getElementById('start-btn').disabled = false;
    document.querySelector('.dropdown-content').style.display = 'none';
    document.querySelector('.arrow').classList.remove('rotate');
}

// Toggle dropdown menu
function toggleDropdown() {
    const dropdown = document.querySelector('.dropdown-content');
    const arrow = document.querySelector('.arrow');

    if (dropdown.style.display === 'block') {
        dropdown.style.display = 'none';
        arrow.classList.remove('rotate');
    } else {
        dropdown.style.display = 'block';
        arrow.classList.add('rotate');
    }
}

// Đóng dropdown khi click bên ngoài
window.onclick = function (event) {
    if (!event.target.matches('.dropdown-btn') && !event.target.matches('.dropdown-btn *')) {
        const dropdown = document.querySelector('.dropdown-content');
        const arrow = document.querySelector('.arrow');
        dropdown.style.display = 'none';
        arrow.classList.remove('rotate');
    }
}

// Bắt đầu bài tập
async function startQuiz() {
    if (!currentLessonFile) return;

    // Hiển thị loading
    const loadingMsg = document.createElement('div');
    loadingMsg.innerHTML = '<p style="text-align: center; color: #667eea;">⏳ Đang tải câu hỏi...</p>';
    document.body.appendChild(loadingMsg);

    try {
        // Tải câu hỏi từ file
        const data = await loadQuestionData(currentLessonFile);
        currentQuestions = data.questions || [];

        if (currentQuestions.length === 0) {
            alert('Không thể tải câu hỏi cho bài học này!');
            document.body.removeChild(loadingMsg);
            return;
        }

        currentQuestionIndex = 0;
        correctAnswers = 0;
        startTime = Date.now();

        // Hiển thị trang quiz
        document.getElementById('home-page').style.display = 'none';
        document.getElementById('quiz-page').style.display = 'block';
        document.getElementById('quiz-page').classList.add('fade-in');

        // Cập nhật thông tin
        document.getElementById('total-questions').textContent = currentQuestions.length;

        // Bắt đầu timer
        startTimer();

        // Hiển thị câu hỏi đầu tiên
        showQuestion();

    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Có lỗi xảy ra khi tải câu hỏi!');
    } finally {
        // Xóa loading message
        if (document.body.contains(loadingMsg)) {
            document.body.removeChild(loadingMsg);
        }
    }
}

// Hiển thị câu hỏi
function showQuestion() {
    if (currentQuestionIndex >= currentQuestions.length) {
        endQuiz();
        return;
    }

    const question = currentQuestions[currentQuestionIndex];
    const container = document.getElementById('question-container');

    // Cập nhật tiến trình
    document.getElementById('current-question').textContent = currentQuestionIndex + 1;
    const progress = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;
    document.getElementById('progress-fill').style.width = progress + '%';

    // Tạo HTML cho câu hỏi
    let html = `<h3>Câu ${currentQuestionIndex + 1}: ${formatContent(question.question)}</h3>`;
    question.answers.forEach((answer, index) => {
        html += `<button class="answer" onclick="selectAnswer(${index})">${String.fromCharCode(65 + index)}. ${formatContent(answer)}</button>`;
    });

    container.innerHTML = html;
    container.classList.add('fade-in');

    // Áp dụng syntax highlighting cho code blocks
    if (window.Prism) {
        Prism.highlightAllUnder(container);
    }

    // Ẩn nút next và xóa thông báo
    document.getElementById('next-btn').disabled = true;
    document.getElementById('message-container').innerHTML = '';
}

// Chọn đáp án
function selectAnswer(selectedIndex) {
    const question = currentQuestions[currentQuestionIndex];
    const answers = document.querySelectorAll('.answer');
    const messageContainer = document.getElementById('message-container');

    // Vô hiệu hóa tất cả nút đáp án
    answers.forEach(answer => answer.disabled = true);

    if (selectedIndex === question.correct) {
        // Đáp án đúng
        answers[selectedIndex].classList.add('correct');
        messageContainer.innerHTML = '<div class="message success">🎉 Chính xác! Bạn đã chọn đúng đáp án.</div>';
        correctAnswers++;

        // Hiển thị nút next sau 1 giây
        setTimeout(() => {
            document.getElementById('next-btn').disabled = false;
        }, 1000);
    } else {
        // Đáp án sai
        answers[selectedIndex].classList.add('incorrect');
        answers[question.correct].classList.add('correct');
        messageContainer.innerHTML = '<div class="message error">❌ Chưa chính xác. Hãy thử lại!</div>';

        // Cho phép chọn lại sau 2 giây
        setTimeout(() => {
            answers.forEach(answer => {
                answer.disabled = false;
                answer.classList.remove('incorrect');
            });
            messageContainer.innerHTML = '';
        }, 2000);
    }
}

// Câu hỏi tiếp theo
function nextQuestion() {
    currentQuestionIndex++;
    showQuestion();
}

// Bắt đầu timer
function startTimer() {
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('timer').textContent =
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// Kết thúc bài tập
function endQuiz() {
    clearInterval(timerInterval);

    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(totalTime / 60);
    const seconds = totalTime % 60;
    const accuracy = Math.round((correctAnswers / currentQuestions.length) * 100);

    // Hiển thị trang kết quả
    document.getElementById('quiz-page').style.display = 'none';
    document.getElementById('result-page').style.display = 'block';
    document.getElementById('result-page').classList.add('fade-in');

    // Cập nhật kết quả
    document.getElementById('result-message').textContent =
        `Bạn đã hoàn thành bài ôn tập với ${correctAnswers}/${currentQuestions.length} câu trả lời đúng!`;
    document.getElementById('correct-answers').textContent = `${correctAnswers}/${currentQuestions.length}`;
    document.getElementById('total-time').textContent =
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('accuracy').textContent = accuracy + '%';
}

// Quay về trang chủ
function goHome() {
    document.getElementById('result-page').style.display = 'none';
    document.getElementById('home-page').style.display = 'block';

    // Reset trạng thái
    currentLessonFile = null;
    document.getElementById('selected-lesson').textContent = 'Chọn bài học';
    document.getElementById('start-btn').disabled = true;
}

// Khởi tạo khi trang được tải
window.onload = init;