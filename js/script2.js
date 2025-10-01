document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    // Khai báo các biến DOM (Document Object Model) cần thiết
    // Nhằm truy cập và thao tác với các phần tử HTML

    // Các trang chính
    const home_page = document.getElementById('home-page');
    const quiz_page = document.getElementById('quiz-page');
    const result_page = document.getElementById('result-page');

    // Các phần tử trong trang quiz
    const lesson_select = document.getElementById('lesson-select');
    const start_button = document.getElementById('start-button');
    const lesson_title = document.getElementById('lesson-title');
    const question_counter = document.getElementById('question-counter');
    const time_spent = document.getElementById('time-spent');

    // Các nút bấm chuyển phần câu hỏi
    const part1_button = document.getElementById('part1-button');
    const part2_button = document.getElementById('part2-button');
    const part3_button = document.getElementById('part3-button');

    const question_text = document.getElementById('question-text');
    const answers_container = document.getElementById('answers-container');
    const feedback_message = document.getElementById('feedback-message');
    const next_button = document.getElementById('next-button');
    const finish_button = document.getElementById('finish-button');

    // Các nhãn thống kê cuối bài ôn tập
    const complete_count_part1 = document.getElementById('complete-count-part1');
    const complete_count_part2 = document.getElementById('complete-count-part2');
    const complete_count_part3 = document.getElementById('complete-count-part3');

    const correct_count_part1 = document.getElementById('correct-count-part1');
    const correct_count_part2 = document.getElementById('correct-count-part2');
    const correct_count_part3 = document.getElementById('correct-count-part3');

    const incorrect_count_part1 = document.getElementById('incorrect-count-part1');
    const incorrect_count_part2 = document.getElementById('incorrect-count-part2');
    const incorrect_count_part3 = document.getElementById('incorrect-count-part3');

    const total_time_part1 = document.getElementById('total-time-part1');
    const total_time_part2 = document.getElementById('total-time-part2');
    const total_time_part3 = document.getElementById('total-time-part3');

    // Nút nhấn quay về trang chủ
    const restart_button = document.getElementById('restart-button');

    // Global variables
    // Lưu danh sách bài học và danh sách câu hỏi hiện tại
    let lessons = [];

    // Đánh dấu phần câu hỏi hiện tại đang ở phần nào
    let current_question_part_number = 0;

    // Lưu danh sách câu hỏi hiện tại đang làm
    let current_questions_list = [];

    // Đánh dấu thứ tự câu hỏi hiện tại trong phần đang làm
    let current_question_index = 0;

    // Biến lưu danh sách câu hỏi từng phần
    let question_part = {
        part_1: [],
        part_2: [],
        part_3: []
    }

    // Lưu số câu hỏi đã hoàn thành của từng phần
    let completed_questions = [0, 0, 0];

    // Lưu số câu hỏi chọn sai của từng phần
    let incorrect_questions = [0, 0, 0];

    // Lưu thời gian thực hiện bài quiz
    let quiz_start_time;
    let quiz_timer;

    // Load lessons from baihoc.json
    // Tải danh sách bài học từ file JSON
    async function loadLessons() {
        try {
            // Đọc nội dung file JSON
            const response = await fetch('./json/baihoc2.json');

            // Phân tích nội dung JSON
            const data = await response.json();

            // Lưu danh sách bài học và hiển thị trong thẻ select
            lessons = data.lessons;

            // Duyệt danh sách bài học, add vào select
            lessons.forEach((lesson, index) => {
                const option = document.createElement('option');
                option.value = lesson.file;
                option.textContent = lesson.name;
                lesson_select.appendChild(option);
            });

        } catch (error) {
            console.error('Lỗi khi tải danh sách bài học:', error);
        }
    }

    /**
     * Xáo trộn một mảng và cập nhật đồng bộ chỉ số hoặc mảng đáp án tương ứng.
     * Hàm này an toàn, không làm thay đổi dữ liệu gốc.
     *
     * @param {Array} array - Mảng cần xáo trộn.
     * @param {Object} [options] - Các tùy chọn.
     * @param {number} [options.correctIndex=null] - Chỉ số của câu trả lời đúng cần theo dõi.
     * @param {Array} [options.answersArray=null] - Mảng đáp án cần xáo trộn đồng bộ.
     * @returns {Object} Một đối tượng chứa kết quả.
     */
    function shuffleArray(array) {

        // 1. TẠO BẢN SAO -> An toàn, không có side effect
        // Không làm thay đổi mảng gốc
        const shuffled_array = [...array];

        // Thuật toán xáo trộn Fisher-Yates
        for (let i = shuffled_array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled_array[i], shuffled_array[j]] = [shuffled_array[j], shuffled_array[i]];
        }

        // 4. TRẢ VỀ MỘT ĐỐI TƯỢNG KẾT QUẢ -> Rõ ràng và xử lý được mọi trường hợp
        return { shuffled_array };
    }

    // Load questions for a selected lesson
    // Tải danh sách câu hỏi từ file JSON
    async function loadQuestions(fileName) {
        try {
            const response = await fetch(`./json/${fileName}`);
            const data = await response.json();

            // Đọc và XÁO TRỘN danh sách câu hỏi các phần
            //question_part.part_1 = data.part_1;
            question_part.part_1 = shuffleArray(data.part_1).shuffled_array;
            question_part.part_2 = shuffleArray(data.part_2).shuffled_array;
            question_part.part_3 = shuffleArray(data.part_3).shuffled_array;

            // Cập nhật vị trí bắt đầu ôn tập
            current_question_part_number = 1; // Bắt đầu từ phần 1
            current_questions_list = question_part.part_1; // Bắt đầu với phần 1
            current_question_index = 0; // Bắt đầu từ câu hỏi đầu tiên của phần 1

            // Hiển thị câu hỏi
            displayQuestion(); // Bắt đầu với phần 1 (biến current_question_part_number)

        } catch (error) {
            console.error('Lỗi khi tải câu hỏi:', error);
            alert('Không thể tải câu hỏi cho bài học này.');
        }
    }


    // Display current question
    function displayQuestion() {
        // Kiểm tra nếu chỉ số câu hỏi hiện lớn hơn số lượng hoặc nằm cuối cùng danh sách
        if (current_question_index >= current_questions_list.length) {

            // Kiểm tra nếu đang ở phần 3 thì kết thúc bài làm
            if (current_question_part_number >= 3) {

                // Nếu đã hoàn thành phần 3, kết thúc bài ôn tập
                endQuiz();
                return;
            } else {

                // Chuyển sang phần tiếp theo
                // Tăng biến đếm theo dõi phần câu hỏi hiện tại
                current_question_part_number++;

                // Cập nhật danh sách câu hỏi hiện tại sang phần mới
                current_questions_list = question_part[`part_${current_question_part_number}`];

                // Cập nhật nút bấm từng phần dựa trên biến theo dõi phần câu hỏi hiện tại
                // Nếu đang ở phần 1, disable nút phần 1, enable nút phần 2 và 3
                // Nếu đang ở phần 2, disable nút phần 2, enable nút phần 1 và 3
                // Nếu đang ở phần 3, disable nút phần 3, enable nút phần 1 và 2
                part1_button.disabled = current_question_part_number === 1;
                part2_button.disabled = current_question_part_number === 2;
                part3_button.disabled = current_question_part_number === 3;

                // Đặt lại chỉ số câu hỏi về 0 để bắt đầu từ câu đầu tiên của phần mới
                current_question_index = 0;
            }
        }

        // Lấy câu hỏi hiện tại để hiển thị
        const question_data = current_questions_list[current_question_index];

        // Reset UI
        answers_container.innerHTML = '';
        feedback_message.style.display = 'none';
        next_button.disabled = true;

        // Update question info
        // Cập nhật thông tin câu hỏi
        question_counter.textContent = `Câu ${current_question_index + 1}/${current_questions_list.length}`;
        question_text.textContent = question_data.question;

        // Create answer options
        switch (current_question_part_number) {
            case 1:
                question_data.answers.forEach((answer, index) => {
                    const answer_option = document.createElement('button');
                    answer_option.className = 'answer-option';
                    answer_option.textContent = answer;
                    answer_option.addEventListener('click', () => handleAnswerClick(answer_option, index, question_data.correct));
                    answers_container.appendChild(answer_option);
                });
            //break;
            case 2:
                question_data.answers.forEach((answer, index) => {
                    const answer_option = document.createElement('input');
                    answer_option.type = 'checkbox';
                    answer_option.className = 'answer-option';
                    answer_option.text = answer;
                    answer_option.addEventListener('click', () => handleAnswerClick(answer_option, index, question_data.correct));
                    answers_container.appendChild(answer_option);
                });
            //break;
            case 3:
                const answer_option = document.createElement('input');
                answer_option.className = 'answer-option';
                answer_option.type = 'number';
                answer_option.addEventListener('click', () => handleAnswerClick(answer_option, index, question_data.correct));
                answers_container.appendChild(answer_option);
            //break;
            default:
                // Mệnh đề default sẽ chạy nếu không có case nào khớp [7]
                // Bạn có thể thêm xử lý cho trường hợp mặc định nếu cần
                console.log("Loại câu hỏi không hợp lệ.");
                break;
        }
    }

    // Handle user's answer
    function handleAnswerClick(selected_option, selected_index, correct_index) {
        const all_options = answers_container.querySelectorAll('.answer-option');
        all_options.forEach(option => option.disabled = true); // Disable all buttons after a choice

        if (selected_index === correct_index) {
            selected_option.classList.add('correct');
            feedback_message.textContent = 'Chính xác! Chúc mừng bạn!';
            feedback_message.classList.add('correct');
            feedback_message.classList.remove('incorrect');
            feedback_message.style.display = 'block';
            next_button.disabled = false;
            completed_questions[current_question_part]++;
        } else {
            selected_option.classList.add('incorrect');
            feedback_message.textContent = 'Chưa đúng! Vui lòng chọn lại.';
            feedback_message.classList.add('incorrect');
            feedback_message.classList.remove('correct');
            feedback_message.style.display = 'block';

            // Re-enable options for a new attempt
            all_options.forEach(option => option.disabled = false);
            selected_option.disabled = true; // Keep the incorrect option disabled
            incorrect_questions[current_question_part]++;
        }
    }

    // Start the quiz
    function startQuiz() {
        const selected_lesson_file = lesson_select.value;
        const selected_lesson_name = lesson_select.options[lesson_select.selectedIndex].text;

        if (!selected_lesson_file) {
            alert('Vui lòng chọn một bài học.');
            return;
        }

        home_page.classList.remove('active');
        quiz_page.classList.add('active');
        lesson_title.textContent = selected_lesson_name;

        quiz_start_time = Date.now();
        quiz_timer = setInterval(updateTimer, 1000);

        loadQuestions(selected_lesson_file);
    }

    // Update the timer
    function updateTimer() {
        const timeElapsed = Math.floor((Date.now() - quiz_start_time) / 1000);
        const minutes = Math.floor(timeElapsed / 60);
        const seconds = timeElapsed % 60;
        timeSpent.textContent = `Thời gian: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Move to the next question
    function nextQuestion() {
        currentQuestionIndex++;
        displayQuestion();
    }

    // End the quiz and show results
    function endQuiz() {
        clearInterval(quiz_timer);
        const totalTimeElapsed = Math.floor((Date.now() - quiz_start_time) / 1000);
        const minutes = Math.floor(totalTimeElapsed / 60);
        const seconds = totalTimeElapsed % 60;

        quizPage.classList.remove('active');
        resultPage.classList.add('active');

        completeCountSpan.textContent = completeAnswers + "/" + totalQuestions;
        correctCountSpan.textContent = completeAnswers - incorrectAnswers;
        incorrectCountSpan.textContent = incorrectAnswers;
        percentCorrectFirst.textContent = ((completeAnswers - incorrectAnswers) / completeAnswers * 100).toFixed(2) + "%";
        totalTimeSpan.textContent = `${minutes} phút ${seconds} giây`;
    }

    // Event Listeners
    // Gán sự kiện cho đối tượng
    start_button.addEventListener('click', startQuiz);
    next_button.addEventListener('click', nextQuestion);
    finish_button.addEventListener('click', endQuiz);
    restart_button.addEventListener('click', () => {
        result_page.classList.remove('active');
        home_page.classList.add('active');
    });

    // Initial load
    loadLessons();
});