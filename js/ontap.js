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

    // Các phần tử câu hỏi
    const question_text = document.getElementById('question-text');
    const question_image = document.getElementById('question-image');
    const answers_container = document.getElementById('answers-container');
    const feedback_message = document.getElementById('feedback-message');

    // Nút bấm điều hướng
    const next_button = document.getElementById('next-button');
    const finish_button = document.getElementById('finish-button');

    // Các nhãn thống kê cuối bài ôn tập
    // Số câu đã hoàn thành
    const complete_count_part1 = document.getElementById('complete-count-part1');
    const complete_count_part2 = document.getElementById('complete-count-part2');
    const complete_count_part3 = document.getElementById('complete-count-part3');
    const complete_count_total = document.getElementById('complete-count-total');

    // Số câu trả lời đúng lần đầu
    const first_correct_count_part1 = document.getElementById('correct-count-part1');
    const first_correct_count_part2 = document.getElementById('correct-count-part2');
    const first_correct_count_part3 = document.getElementById('correct-count-part3');
    const first_correct_count_total = document.getElementById('correct-count-total');

    // Tỉ lệ câu trả lời đúng lần đầu
    const percent_first_correct_part1 = document.getElementById('percent-correct-first-part1');
    const percent_first_correct_part2 = document.getElementById('percent-correct-first-part2');
    const percent_first_correct_part3 = document.getElementById('percent-correct-first-part3');
    const percent_first_correct_total = document.getElementById('percent-correct-first-total');

    // Số câu trả lời sai (số lần chọn lại)
    const incorrect_count_part1 = document.getElementById('incorrect-count-part1');
    const incorrect_count_part2 = document.getElementById('incorrect-count-part2');
    const incorrect_count_part3 = document.getElementById('incorrect-count-part3');
    const incorrect_count_total = document.getElementById('incorrect-count-total');

    const total_time_part1 = document.getElementById('total-time-part1');
    const total_time_part2 = document.getElementById('total-time-part2');
    const total_time_part3 = document.getElementById('total-time-part3');
    const total_time_total = document.getElementById('total-time-total');

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

    // Lưu số câu hỏi trả lời đúng lần đầu
    let first_correct_count = [0, 0, 0];

    // Biến lưu trạng thái kiểm tra có phải câu trả lời đầu tiên không
    let is_first_attempt = true;

    // Lưu số câu hỏi chọn sai của từng phần
    let incorrect_questions = [0, 0, 0];

    // Lưu số câu hỏi đã hoàn thành của từng phần
    let completed_questions = [0, 0, 0];

    // Lưu thời gian làm bài của từng phần
    let time_spent_part = [0, 0, 0];

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

            //alert(fileName);
            console.log("File câu hỏi: ", fileName);

            // Đọc và XÁO TRỘN danh sách câu hỏi các phần
            //question_part.part_1 = data.part_1;
            question_part.part_1 = shuffleArray(data.part_1).shuffled_array;
            question_part.part_2 = shuffleArray(data.part_2).shuffled_array;
            question_part.part_3 = shuffleArray(data.part_3).shuffled_array;

            // Xáo trộn danh sách đáp án của từng câu hỏi trong phần 1
            question_part.part_1.forEach(question => {
                const result = shuffleArray(question.answers);
                question.answers = result.shuffled_array;
            });

            // Xáo trộn danh sách đáp án của từng câu hỏi trong phần 2
            question_part.part_2.forEach(question => {
                const result = shuffleArray(question.answers);
                question.answers = result.shuffled_array;
            });

            // Cập nhật vị trí bắt đầu ôn tập
            current_question_part_number = 0; // Bắt đầu từ phần 1

            // Bắt đầu với phần 1
            //current_questions_list = question_part.part_1;
            current_questions_list = question_part[`part_${current_question_part_number + 1}`];

            current_question_index = 0; // Bắt đầu từ câu hỏi đầu tiên của phần 1

            // Reset các biến thống kê
            first_correct_count = [0, 0, 0];
            incorrect_questions = [0, 0, 0];
            completed_questions = [0, 0, 0];
            time_spent_part = [0, 0, 0];

            // Hiển thị câu hỏi
            displayQuestion(); // Bắt đầu với phần 1 (biến current_question_part_number)

        } catch (error) {
            console.error('Lỗi khi tải câu hỏi:', error);
            alert('Không thể tải câu hỏi cho bài học này.');
        }
    }

    // Cập nhật hiển thị các nút chọn phần câu hỏi
    function updatePartButtons() {
        part1_button.disabled = current_question_part_number === 0;
        part2_button.disabled = current_question_part_number === 1;
        part3_button.disabled = current_question_part_number === 2;
    }

    // Display current question
    function displayQuestion() {

        // Kiểm tra nếu chỉ số câu hỏi hiện lớn hơn số lượng hoặc nằm cuối cùng danh sách
        if (current_question_index >= current_questions_list.length) {

            // Kiểm tra nếu đang ở phần 3 thì kết thúc bài làm
            if (current_question_part_number >= 2) {

                // Nếu đã hoàn thành phần 3, kết thúc bài ôn tập
                endQuiz();
                return;
            } else {

                // Chuyển sang phần tiếp theo
                // Tăng biến đếm theo dõi phần câu hỏi hiện tại
                current_question_part_number++;

                // Cập nhật danh sách câu hỏi hiện tại sang phần mới
                current_questions_list = question_part[`part_${current_question_part_number + 1}`];

                // Đặt lại chỉ số câu hỏi về 0 để bắt đầu từ câu đầu tiên của phần mới
                current_question_index = 0;
            }
        }

        // Cập nhật nút bấm từng phần dựa trên biến theo dõi phần câu hỏi hiện tại
        // Nếu đang ở phần 1, disable nút phần 1, enable nút phần 2 và 3
        // Nếu đang ở phần 2, disable nút phần 2, enable nút phần 1 và 3
        // Nếu đang ở phần 3, disable nút phần 3, enable nút phần 1 và 2
        updatePartButtons();

        // Lấy câu hỏi hiện tại để hiển thị
        const question_data = current_questions_list[current_question_index];

        // Reset UI
        // Đặt lại giao diện người dùng
        answers_container.innerHTML = '';
        feedback_message.style.display = 'none';
        next_button.disabled = true;

        // Update question info
        // Cập nhật thông tin câu hỏi
        question_counter.textContent = `Câu ${current_question_index + 1}/${current_questions_list.length}`;
        question_text.textContent = question_data.question;

        // Kiểm tra xem đối tượng image có tồn tại không VÀ src có giá trị hay không
        if (!question_data.image || !question_data.image.src) {
            // Nếu không có image hoặc không có src, ẩn phần tử đi
            question_image.style.display = "none";
        } else {
            question_image.src = question_data.image.src;
        }

        // Create answer options
        switch (current_question_part_number) {
            case 0:
                question_data.answers.forEach((answer, index) => {
                    const answer_option = document.createElement('button');
                    answer_option.className = 'answer-option-part1';

                    // BƯỚC 1: Thêm phần văn bản vào nút
                    // Chúng ta tạo một Text Node để đảm bảo văn bản không bị ảnh hưởng bởi HTML
                    const textNode = document.createTextNode(answer.text);
                    answer_option.appendChild(textNode);

                    // BƯỚC 2 & 3: Kiểm tra nếu có ảnh và tạo thẻ <img>
                    if (answer.image && answer.image.src) {
                        const imgElement = document.createElement('img');

                        // BƯỚC 4: Gán thuộc tính cho ảnh
                        imgElement.src = answer.image.src;
                        imgElement.alt = answer.image.alt || 'Ảnh phương án'; // Giá trị alt dự phòng

                        // BƯỚC 5: Thêm ảnh vào nút
                        answer_option.appendChild(imgElement);
                    }
                    // Dòng textContent cũ không còn cần thiết
                    // answer_option.textContent = answer.text;

                    answer_option.addEventListener('click', () => handleAnswerClick_Part1(answer_option, answer));
                    answers_container.appendChild(answer_option);
                });
                break;

            case 1:
                question_data.answers.forEach((answer, index) => {
                    // Tạo một thẻ div để chứa nút Đ S và nội dung phương án
                    const answer_row = document.createElement('div');
                    answer_row.className = 'answer-row-part2';

                    // Tạo nút Đúng/Sai
                    const true_button = document.createElement('button');
                    const false_button = document.createElement('button');
                    true_button.className = 'true-false-buttons-part2 true-button-part2';
                    false_button.className = 'true-false-buttons-part2 false-button-part2';
                    true_button.textContent = 'Đ';
                    false_button.textContent = 'S';
                    true_button.value = 'true';
                    false_button.value = 'false';

                    // Thêm nút chứa nội dung phương án
                    const answer_option = document.createElement('button');
                    answer_option.className = 'answer-option-part2';

                    // BƯỚC 1: Thêm phần văn bản vào nút
                    // Chúng ta tạo một Text Node để đảm bảo văn bản không bị ảnh hưởng bởi HTML
                    const textNode = document.createTextNode(answer.text);
                    answer_option.appendChild(textNode);

                    // BƯỚC 2 & 3: Kiểm tra nếu có ảnh và tạo thẻ <img>
                    if (answer.image && answer.image.src) {
                        const imgElement = document.createElement('img');

                        // BƯỚC 4: Gán thuộc tính cho ảnh
                        imgElement.src = answer.image.src;
                        imgElement.alt = answer.image.alt || 'Ảnh phương án'; // Giá trị alt dự phòng

                        // BƯỚC 5: Thêm ảnh vào nút
                        answer_option.appendChild(imgElement);
                    }

                    // Thêm sự kiện cho nút Đúng/Sai
                    true_button.addEventListener('click', () => handleAnswerClick_Part2(true_button, false_button, answer, answer_option));
                    false_button.addEventListener('click', () => handleAnswerClick_Part2(false_button, true_button, answer, answer_option));
                    // Nút phương án cũng có thể click để chọn
                    //answer_option.addEventListener('click', () => handleAnswerClick_Part2(answer_option, { correct: false }, answer_option));

                    // Tạo dòng gồm 3 nút (Đ, S, nội dung phương án)
                    answer_row.appendChild(true_button);
                    answer_row.appendChild(false_button);
                    answer_row.appendChild(answer_option);

                    // Thêm dòng câu trả lời vào container
                    answers_container.appendChild(answer_row);
                });

                break;

            case 2:
                const answer_row = document.createElement('div');
                answer_row.className = 'answer-row-part3';

                const answer_input = document.createElement('input');
                answer_input.className = 'answer-input-part3';
                //answer_input.type = 'number';
                answer_row.appendChild(answer_input);

                const answer_check_button = document.createElement('button');
                answer_check_button.className = 'answer-check-part3';
                answer_check_button.textContent = 'Kiểm tra';
                answer_check_button.addEventListener('click', () => handleAnswerClick_Part3(answer_input, question_data.answer));
                answer_row.appendChild(answer_check_button);
                answers_container.appendChild(answer_row);
                break;

            default:
                // Mệnh đề default sẽ chạy nếu không có case nào khớp [7]
                // Bạn có thể thêm xử lý cho trường hợp mặc định nếu cần
                console.log("Loại câu hỏi không hợp lệ.");
                break;
        }

        // Đặt lại biến trạng thái về true cho câu hỏi mới
        is_first_attempt = true;
    }

    // Handle user's answer
    // Hàm kiểm tra đáp án phần 1
    function handleAnswerClick_Part1(selected_option, answer) {
        const all_options = answers_container.querySelectorAll('.answer-option-part1');
        all_options.forEach(option => option.disabled = true); // Disable all buttons after a choice

        // Kiểm tra phương án chọn có đúng không
        if (answer.correct === true) {
            selected_option.classList.add('correct');
            feedback_message.textContent = '👏 Chính xác! Chúc mừng bạn!';
            feedback_message.classList.add('correct');
            feedback_message.classList.remove('incorrect');
            feedback_message.style.display = 'block';
            next_button.disabled = false;
            completed_questions[current_question_part_number]++;

            // Kiểm tra nếu đây là lần trả lời đầu tiên
            if (is_first_attempt) {
                first_correct_count[current_question_part_number]++;

                // Cập nhật biến trạng thái không phải lần đầu
                is_first_attempt = false;
            }

        } else {
            selected_option.classList.add('incorrect');
            feedback_message.textContent = '💔 Chưa đúng! Vui lòng chọn lại.';
            feedback_message.classList.add('incorrect');
            feedback_message.classList.remove('correct');
            feedback_message.style.display = 'block';

            // Re-enable options for a new attempt
            all_options.forEach(option => option.disabled = false);
            selected_option.disabled = true; // Keep the incorrect option disabled
            incorrect_questions[current_question_part_number]++;

            // Cập nhật biến trạng thái không phải lần đầu
            is_first_attempt = false;
        }
    }

    // Hàm kiểm tra đáp án phần 2
    function handleAnswerClick_Part2(true_false_selected_button, true_false_another_button, answer, selected_option) {

        // Tô màu cho biết nút nào được chọn
        true_false_selected_button.classList.add('selected');
        true_false_another_button.classList.remove('selected');

        if (true_false_selected_button.value === answer.correct.toString()) {

            // Thay đổi màu sắc và nội dung thông báo
            selected_option.classList.add('correct');
            selected_option.classList.remove('incorrect');
            feedback_message.textContent = '👏 Chính xác! Chúc mừng bạn!';
            feedback_message.classList.add('correct');
            feedback_message.classList.remove('incorrect');
            feedback_message.style.display = 'block';
            next_button.disabled = false;

            // Cập nhật số câu hỏi hoàn thành
            completed_questions[current_question_part_number]++;

            // Kiểm tra nếu đây là lần trả lời đầu tiên
            if (is_first_attempt) {
                first_correct_count[current_question_part_number]++;

                // Cập nhật biến trạng thái không phải lần đầu
                is_first_attempt = false;
            }

        } else {
            selected_option.classList.add('incorrect');
            selected_option.classList.remove('correct');
            feedback_message.textContent = '💔 Chưa đúng! Vui lòng chọn lại.';
            feedback_message.classList.add('incorrect');
            feedback_message.classList.remove('correct');
            feedback_message.style.display = 'block';

            // Cập nhật số câu hỏi chọn sai
            incorrect_questions[current_question_part_number]++;

            // Cập nhật biến trạng thái không phải lần đầu
            is_first_attempt = false;
        }
    }

    // Hàm kiểm tra đáp án phần 3
    function handleAnswerClick_Part3(answer_input, answer) {

        // Lấy ra giá trị người dùng nhập vào
        const user_answer = answer_input.value.trim();

        // Kiểm tra phương án chọn có đúng không
        if (user_answer === answer.toString()) {
            feedback_message.classList.add('correct');
            feedback_message.classList.remove('incorrect');
            feedback_message.textContent = '👏 Chính xác! Chúc mừng bạn!';

            // Kích hoạt nút qua câu tiếp theo
            next_button.disabled = false;
            completed_questions[current_question_part_number]++;

            // Kiểm tra nếu đây là lần trả lời đầu tiên
            if (is_first_attempt) {
                first_correct_count[current_question_part_number]++;

                // Cập nhật biến trạng thái không phải lần đầu
                is_first_attempt = false;
            }
        } else {
            feedback_message.classList.add('incorrect');
            feedback_message.classList.remove('correct');
            feedback_message.textContent = '💔 Chưa đúng! Vui lòng chọn lại.';

            // Cập nhật số câu hỏi chọn sai
            incorrect_questions[current_question_part_number]++;

            // Cập nhật biến trạng thái không phải lần đầu
            is_first_attempt = false;
        }
        feedback_message.style.display = 'block';
    }

    // Start the quiz
    // Bắt đầu bài ôn tập
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
    // Cập nhật bộ đếm thời gian
    function updateTimer() {
        const timeElapsed = Math.floor((Date.now() - quiz_start_time) / 1000);
        const minutes = Math.floor(timeElapsed / 60);
        const seconds = timeElapsed % 60;
        time_spent.textContent = `Thời gian: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Move to the next question
    function nextQuestion() {
        current_question_index++;
        displayQuestion();
    }

    // End the quiz and show results
    function endQuiz() {
        clearInterval(quiz_timer);
        const totalTimeElapsed = Math.floor((Date.now() - quiz_start_time) / 1000);
        const minutes = Math.floor(totalTimeElapsed / 60);
        const seconds = totalTimeElapsed % 60;

        quiz_page.classList.remove('active');
        result_page.classList.add('active');

        // Cập nhật thống kê số câu hoàn thành
        complete_count_part1.textContent = completed_questions[0] + "/" + question_part.part_1.length;
        complete_count_part2.textContent = completed_questions[1] + "/" + question_part.part_2.length * 4;
        complete_count_part3.textContent = completed_questions[2] + "/" + question_part.part_3.length;
        complete_count_total.textContent = completed_questions[0] + completed_questions[1] + completed_questions[2] + "/" + (question_part.part_1.length + question_part.part_2.length * 4 + question_part.part_3.length);

        // Cập nhật thống kê số câu trả lời đúng lần đầu
        first_correct_count_part1.textContent = first_correct_count[0];
        first_correct_count_part2.textContent = first_correct_count[1];
        first_correct_count_part3.textContent = first_correct_count[2];
        first_correct_count_total.textContent = first_correct_count[0] + first_correct_count[1] + first_correct_count[2];

        // Cập nhật tỉ lệ câu trả lời đúng lần đầu
        percent_first_correct_part1.textContent = ((first_correct_count[0] / completed_questions[0]) * 100).toFixed(2) + "%";
        percent_first_correct_part2.textContent = ((first_correct_count[1] / completed_questions[1]) * 100).toFixed(2) + "%";
        percent_first_correct_part3.textContent = ((first_correct_count[2] / completed_questions[2]) * 100).toFixed(2) + "%";
        percent_first_correct_total.textContent = (((first_correct_count[0] + first_correct_count[1] + first_correct_count[2]) / (completed_questions[0] + completed_questions[1] + completed_questions[2])) * 100).toFixed(2) + "%";

        // Cập nhật số lần chọn lại
        incorrect_count_part1.textContent = incorrect_questions[0];
        incorrect_count_part2.textContent = incorrect_questions[1];
        incorrect_count_part3.textContent = incorrect_questions[2];
        incorrect_count_total.textContent = incorrect_questions[0] + incorrect_questions[1] + incorrect_questions[2];

        // Cập nhật thời gian làm bài của từng phần
        //total_time_part1.textContent = `${Math.floor(time_spent_part[0] / 60)} phút ${time_spent_part[0] % 60} giây`;
        //total_time_part2.textContent = `${Math.floor(time_spent_part[1] / 60)} phút ${time_spent_part[1] % 60} giây`;
        //total_time_part3.textContent = `${Math.floor(time_spent_part[2] / 60)} phút ${time_spent_part[2] % 60} giây`;
        total_time_total.textContent = `${minutes} phút ${seconds} giây`;
    }

    // Event Listeners
    // Gán sự kiện cho đối tượng
    start_button.addEventListener('click', startQuiz);

    // Gán sự kiện cho các nút bấm chuyển phần câu hỏi
    part1_button.addEventListener('click', () => {
        if (current_question_part_number !== 0) {
            current_question_part_number = 0;
            current_questions_list = question_part[`part_${current_question_part_number + 1}`];
            current_question_index = 0;

            part1_button.disabled = current_question_part_number === 0;
            part2_button.disabled = current_question_part_number === 1;
            part3_button.disabled = current_question_part_number === 2;

            displayQuestion();
        }
    });

    part2_button.addEventListener('click', () => {
        if (current_question_part_number !== 1) {
            current_question_part_number = 1;
            current_questions_list = question_part[`part_${current_question_part_number + 1}`];
            current_question_index = 0;

            part1_button.disabled = current_question_part_number === 0;
            part2_button.disabled = current_question_part_number === 1;
            part3_button.disabled = current_question_part_number === 2;

            displayQuestion();
        }
    });

    part3_button.addEventListener('click', () => {
        if (current_question_part_number !== 2) {
            current_question_part_number = 2;
            current_questions_list = question_part[`part_${current_question_part_number + 1}`];
            current_question_index = 0;

            part1_button.disabled = current_question_part_number === 0;
            part2_button.disabled = current_question_part_number === 1;
            part3_button.disabled = current_question_part_number === 2;

            displayQuestion();
        }
    });

    part3_button.addEventListener('click', () => {
        if (current_question_part_number !== 2) {
            current_question_part_number = 2;
            displayQuestion();
        }
    });

    next_button.addEventListener('click', nextQuestion);
    finish_button.addEventListener('click', endQuiz);
    restart_button.addEventListener('click', () => {
        result_page.classList.remove('active');
        home_page.classList.add('active');
    });

    // Initial load
    loadLessons();
});