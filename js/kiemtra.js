document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Sử dụng const cho các biến không thay đổi giá trị
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
    const prev_button = document.getElementById('prev-button');
    const next_button = document.getElementById('next-button');
    const finish_button = document.getElementById('finish-button');

    // Các nhãn thống kê cuối bài ôn tập
    // Số câu đã hoàn thành
    const complete_count_part1 = document.getElementById('complete-count-part1');
    const complete_count_part2 = document.getElementById('complete-count-part2');
    const complete_count_part3 = document.getElementById('complete-count-part3');
    const complete_count_total = document.getElementById('complete-count-total');

    // Số điểm từng phần
    const complete_score_part1 = document.getElementById('complete-score-part1');
    const complete_score_part2 = document.getElementById('complete-score-part2');
    const complete_score_part3 = document.getElementById('complete-score-part3');
    const complete_score_total = document.getElementById('complete-score-total');

    // Tổng thời gian làm bài
    const total_time_total = document.getElementById('total-time-total');

    // Nút nhấn xem lại bài làm
    const review_button = document.getElementById('review-button');

    // Nút nhấn trở lại trang chọn bài làm
    const restart_button = document.getElementById('restart-button');

    // Số lượng câu hỏi cần lấy ra từng phần
    const questions_per_part = [6, 4, 0]; // Phần 1: 6 câu, Phần 2: 1 câu (4 phương án), Phần 3: 0 câu

    // Global variables
    // Biến toàn cục lưu trữ trạng thái làm bài
    let completed_test = false;

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
        part_1: [], part_2: [], part_3: []
    }

    // Lưu câu trả lời của học sinh
    // Lưu câu trả lời của học sinh theo mẫu sau
    // answered_questions = {
    //     part_1: [0, 2, null, 1, ...], // Mảng lưu chỉ số phương án đã chọn của phần 1
    //     part_2: [[true, false, ...],...],   // Mảng lưu giá trị đúng/sai đã chọn của phần 2
    //     part_3: ['42', '100', ...]    // Mảng lưu giá trị nhập vào của phần 3
    // };
    let answered_questions = {
        part_1: [], part_2: [], part_3: []
    };

    // Lưu điểm từng câu
    // Lưu theo mẫu
    // question_score = {
    //     part_1: [1, 0, 0, ...],
    //     part_2: [[1, 0, 0, 1], ...],
    //     part_3: [1, 0, ...]
    // }
    let question_score = {
        part_1: [], part_2: [], part_3: []
    };

    // Lưu điểm tổng
    let part_score = [0, 0, 0];

    // Lưu số câu hỏi đã hoàn thành của từng phần
    let completed_questions = [0, 0, 0];

    // Lưu thời gian thực hiện bài quiz
    let quiz_start_time;
    let quiz_timer;

    // Load lessons from baihoc.json
    // Tải danh sách bài học từ file JSON
    async function loadLessons() {
        try {
            // Đọc nội dung file JSON
            const response = await fetch('./json/baihoc.json');

            // Phân tích nội dung JSON
            const data = await response.json();

            // Lưu danh sách bài học vào biến toàn cục
            lessons = data.lessons;

            // Duyệt danh sách bài học, thêm vào select (dropdown)
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
            // Lấy ra số lượng câu hỏi cần kiểm tra từng phần
            question_part.part_1 = shuffleArray(data.part_1).shuffled_array.slice(0, questions_per_part[0]);
            question_part.part_2 = shuffleArray(data.part_2).shuffled_array.slice(0, questions_per_part[1]);
            question_part.part_3 = shuffleArray(data.part_3).shuffled_array.slice(0, questions_per_part[2]);

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

            // Khởi tạo biến ghi nhận câu trả lời của học sinh
            // Ban đầu tất cả đều có giá trị null (chưa trả lời)
            // Lệnh này gây lỗi vì cả 4 mảng con đều cùng trỏ chung địa chỉ
            // answered_questions.part_2 = Array(question_part.part_2.length).fill(Array(4).fill(null));

            answered_questions.part_1 = Array(question_part.part_1.length).fill(null);
            answered_questions.part_2 = Array.from(
                { length: question_part.part_2.length },
                () => Array(4).fill(null)
            );
            answered_questions.part_3 = Array(question_part.part_3.length).fill(null);

            // Khởi tạo biến ghi nhận điểm số của học sinh
            // Ban đầu tất cả đều có giá trị 0
            question_score.part_1 = Array(question_part.part_1.length).fill(0);
            question_score.part_2 = Array.from(
                { length: question_part.part_2.length },
                () => Array(4).fill(0)
            );
            question_score.part_3 = Array(question_part.part_3.length).fill(0);

            // Cập nhật vị trí bắt đầu ôn tập
            current_question_part_number = 0; // Bắt đầu từ phần 1

            // Bắt đầu với phần 1
            current_questions_list = question_part[`part_${current_question_part_number + 1}`];

            current_question_index = 0; // Bắt đầu từ câu hỏi đầu tiên của phần 1

            // Reset các biến thống kê
            completed_questions = [0, 0, 0];
            part_score = [0, 0, 0];

            // Đặt trạng thái làm bài
            completed_test = false;

            // Hiển thị câu hỏi
            displayQuestion(); // Bắt đầu với phần 1 (biến current_question_part_number)

        } catch (error) {
            console.error('Lỗi khi tải câu hỏi:', error);
            alert('Không thể tải câu hỏi cho bài học này.');
            return false;
        }

        return true;
    }

    // Cập nhật hiển thị các nút chọn phần câu hỏi
    function updatePartButtons() {
        part1_button.disabled = current_question_part_number === 0;
        part2_button.disabled = current_question_part_number === 1;
        part3_button.disabled = current_question_part_number === 2;
    }

    // Display current question
    function displayQuestion() {

        // Cập nhật danh sách câu hỏi hiện tại
        current_questions_list = question_part[`part_${current_question_part_number + 1}`];

        // Nếu danh sách câu hỏi không có nội dung thì dừng
        //if (current_questions_list.length === 0) { return; }

        // Kiểm tra nếu chỉ số câu hỏi hiện lớn hơn số lượng hoặc nằm cuối cùng danh sách
        if (current_question_index >= current_questions_list.length) {

            // Kiểm tra nếu đang ở phần 3 thì kết thúc bài làm
            if (current_question_part_number >= 2) {

                // Nếu đã hoàn thành phần 3, kết thúc bài ôn tập
                if (endQuiz()) {
                    return;
                } else {
                    current_question_index--; // Giữ nguyên phần hiện tại nếu không kết thúc được bài
                }
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

        // Nếu không có dữ liệu câu hỏi được lấy ra thì dừng lại
        if (!question_data) { return; }

        // Update question info
        // Cập nhật thông tin câu hỏi
        question_counter.textContent = `Câu ${current_question_index + 1}/${current_questions_list.length}`;
        question_text.textContent = question_data.question;

        // Kiểm tra xem đối tượng image có tồn tại không VÀ src có giá trị hay không
        // Nếu câu hỏi có hình ảnh thì hiển thị hình ảnh sau text, nếu không có ảnh thì ẩn thẻ <img>
        if (!question_data.image || !question_data.image.src) {
            // Nếu không có image hoặc không có src, ẩn phần tử đi
            question_image.style.display = "none";
        } else {
            question_image.style.display = "block";
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

                    // Kiểm tra câu hỏi này học sinh có trả lời chưa
                    // Nếu học sinh đã trả lời thì tô màu
                    if (answered_questions.part_1[current_question_index] === index) {
                        answer_option.classList.add('selected');
                        feedback_message.style.display = 'block';
                        feedback_message.textContent = 'Bạn đã chọn phương án. Nhấn nút "Câu tiếp theo" để tiếp tục.';
                        feedback_message.classList.add('selected');
                        feedback_message.classList.remove('alert');
                    }

                    // Nếu chưa hoàn thành bài làm thì tiến hành thêm sự kiện click
                    if (!completed_test) {
                        answer_option.addEventListener('click', () => handleAnswerClick_Part1(answer_option, index));
                    } else {
                        // Nếu đã hoàn thành thì tô màu đáp án đúng
                        if (answer.correct) {
                            answer_option.classList.add('correct');
                        }
                    }
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
                    true_button.value = true;
                    false_button.value = false;

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

                    // Kiểm tra câu hỏi này học sinh có trả lời chưa
                    if (answered_questions.part_2[current_question_index][index] === 'true') {
                        true_button.classList.add('selected');
                        false_button.classList.remove('selected');
                        answer_option.classList.add('selected');
                    } else if (answered_questions.part_2[current_question_index][index] === 'false') {
                        false_button.classList.add('selected');
                        true_button.classList.remove('selected');
                        answer_option.classList.add('selected');
                    }

                    // Nếu chưa kết thúc bài làm thì thêm sự kiện để người dùng chọn
                    if (!completed_test) {
                        // Thêm sự kiện cho nút Đúng/Sai
                        true_button.addEventListener('click', () => handleAnswerClick_Part2(true_button, false_button, index, answer_option));
                        false_button.addEventListener('click', () => handleAnswerClick_Part2(false_button, true_button, index, answer_option));
                    } else {
                        // Tô màu phương án đúng
                        if (answer.correct) {
                            true_button.classList.add('correct');
                        } else {
                            false_button.classList.add('correct');
                        }
                    }

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

                // Kiểm tra câu hỏi này học sinh có trả lời chưa
                if (answered_questions.part_3[current_question_index] !== null) {
                    answer_input.value = answered_questions.part_3[current_question_index];
                    feedback_message.style.display = 'block';
                    feedback_message.textContent = 'Bạn đã nhập đáp án.';
                    feedback_message.classList.add('selected');
                    feedback_message.classList.remove('alert');
                }

                // Nếu chưa hoàn thành bài kiểm tra thì thêm sự kiện nhập đáp án
                if (!completed_test) {
                    // Thêm sự kiện khi người dùng nhập xong đáp án
                    answer_input.addEventListener('change', () => handleAnswerClick_Part3(answer_input));
                } else {
                    // Hiển thị đáp án nếu đã hoàn thành bài kiểm tra
                    feedback_message.style.display = 'block';
                    feedback_message.textContent = `Đáp án đúng: ${question_data.answer}`;
                    feedback_message.classList.add('selected');
                    feedback_message.classList.remove('alert');
                }

                // Thêm trường nhập vào dòng câu trả lời
                answer_row.appendChild(answer_input);

                // Thêm dòng câu trả lời vào container
                answers_container.appendChild(answer_row);
                break;

            default:
                // Mệnh đề default sẽ chạy nếu không có case nào khớp [7]
                // Bạn có thể thêm xử lý cho trường hợp mặc định nếu cần
                console.log("Loại câu hỏi không hợp lệ.");
                break;
        }
    }

    // Handle user's answer
    // Hàm kiểm tra đáp án phần 1
    function handleAnswerClick_Part1(selected_option, index) {

        // Bỏ chọn tất cả các phương án khác và tô màu phương án được chọn
        const all_options = answers_container.querySelectorAll('.answer-option-part1');
        all_options.forEach(option => option.classList.remove('selected'));
        selected_option.classList.add('selected');

        // Hiển thị thông báo chung
        showSelectionFeedback('Bạn đã chọn phương án. Nhấn nút "Câu tiếp theo" để tiếp tục.');

        // Kiểm tra phương án chọn có đúng không
        answered_questions.part_1[current_question_index] = index; // Lưu câu trả lời của học sinh

        // Tính điểm cho câu hỏi hiện tại
        if (question_part.part_1[current_question_index].answers[index].correct) {
            question_score.part_1[current_question_index] = 1;
        } else {
            question_score.part_1[current_question_index] = 0;
        }

        console.log(index);
        //console.log(question_score.part_1);
    }

    // Hàm kiểm tra đáp án phần 2
    function handleAnswerClick_Part2(true_false_selected_button, true_false_another_button, index, selected_option) {

        // Tô màu cho biết nút nào được chọn
        true_false_selected_button.classList.add('selected');
        true_false_another_button.classList.remove('selected');
        selected_option.classList.add('selected');

        // Lưu câu trả lời của học sinh
        answered_questions.part_2[current_question_index][index] = true_false_selected_button.value;

        let bool = (true_false_selected_button.value === "true");

        // Kiểm tra phương án đúng không và tính điểm
        if (bool === question_part.part_2[current_question_index].answers[index].correct) {
            question_score.part_2[current_question_index][index] = 1;
        } else {
            question_score.part_2[current_question_index][index] = 0;
        }

        console.log(true_false_selected_button.value);

        // Hiển thị thông báo chung
        showSelectionFeedback('Bạn đã chọn phương án. Sau khi hoàn thành, nhấn nút "Câu tiếp theo"');
    }

    // Hàm kiểm tra đáp án phần 3
    function handleAnswerClick_Part3(answer_input) {

        // Lấy ra giá trị người dùng nhập vào
        const user_answer = answer_input.value.trim();

        // Lưu câu trả lời của học sinh
        answered_questions.part_3[current_question_index] = user_answer;

        // Xác định câu trả lời đúng không và tính điểm
        if (Number(user_answer) === question_part.part_3[current_question_index].answer) {
            question_score.part_3[current_question_index] = 1;
        } else {
            question_score.part_3[current_question_index] = 0;
        }

        console.log(user_answer);
        //console.log(question_score.part_3);

        // Hiển thị thông báo chung
        showSelectionFeedback('Bạn đã nhập đáp án.');
    }

    // Hàm hiển thị thông báo chung khi người dùng chọn đáp án
    function showSelectionFeedback(message) {
        feedback_message.style.display = 'block';
        feedback_message.textContent = message;
        feedback_message.classList.add('selected');
        feedback_message.classList.remove('alert');
    }

    // Start the quiz
    // Bắt đầu bài ôn tập
    async function startQuiz() {
        const selected_lesson_file = lesson_select.value;
        const selected_lesson_name = lesson_select.options[lesson_select.selectedIndex].text;

        if (!selected_lesson_file) {
            alert('Vui lòng chọn một bài học.');
            return;
        }

        // Tải câu hỏi trước khi chuyển trang
        const questionsLoaded = await loadQuestions(selected_lesson_file);

        // Nếu tải câu hỏi thất bại, dừng lại và không chuyển trang
        if (!questionsLoaded) {
            return;
        }

        // Reset trạng thái hoàn thành bài làm
        completed_test = false;

        // Cập nhật tiêu đề trang web
        document.title = `Tự kiểm tra - ${selected_lesson_name}`;

        lesson_title.textContent = selected_lesson_name;

        quiz_start_time = Date.now();
        quiz_timer = setInterval(updateTimer, 1000);

        // Chuyển sang trang quiz
        home_page.classList.remove('active');
        quiz_page.classList.add('active');
    }

    // Update the timer
    // Cập nhật bộ đếm thời gian
    function updateTimer() {
        const timeElapsed = Math.floor((Date.now() - quiz_start_time) / 1000);
        const minutes = Math.floor(timeElapsed / 60);
        const seconds = timeElapsed % 60;
        time_spent.textContent = `Thời gian: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Move to the previous question
    // Chuyển sang câu hỏi trước
    function prevQuestion() {
        // Kiểm tra nếu không phải câu hỏi đầu tiên
        if (current_question_index > 0) {
            current_question_index--;
            displayQuestion();
        } else {
            if (current_question_part_number > 0) {
                current_question_part_number--;
                current_questions_list = question_part[`part_${current_question_part_number + 1}`];
                current_question_index = question_part[`part_${current_question_part_number + 1}`].length - 1;
                console.log('Chỉ số câu hỏi hiện tại: ', current_question_index);
                displayQuestion();
            } else {
                feedback_message.style.display = 'block';
                feedback_message.textContent = 'Đây là câu hỏi đầu tiên.';
                feedback_message.classList.add('alert');
                feedback_message.classList.remove('selected');
            }
        }
    }

    // Move to the next question
    // Chuyển sang câu hỏi tiếp theo
    function nextQuestion() {
        // Kiểm tra nếu không phải câu hỏi cuối cùng
        if (current_question_index < current_questions_list.length) {
            current_question_index++;
            displayQuestion();
        } else {
            if (current_question_part_number < 2) {
                current_question_part_number++;
                current_questions_list = question_part[`part_${current_question_part_number + 1}`];
                current_question_index = 0;
                console.log('Chỉ số câu hỏi hiện tại: ', current_question_index);
                displayQuestion();
            } else {
                feedback_message.style.display = 'block';
                feedback_message.textContent = 'Đây là câu hỏi cuối cùng.';
                feedback_message.classList.add('alert');
                feedback_message.classList.remove('selected');
            }
        }
    }

    // Tổng hợp kết quả của bài kiểm tra
    function summarizeResults() {
        // Tính số câu hoàn thành của từng phần
        completed_questions[0] = answered_questions.part_1.filter(answer => answer !== null).length;
        completed_questions[1] = answered_questions.part_2.flat().filter(answer => answer !== null).length;
        completed_questions[2] = answered_questions.part_3.filter(answer => answer !== null).length;

        //console.log(answered_questions);
        //console.log(completed_questions);

        // Tính tổng điểm từng phần
        // Tính điểm phần 1
        part_score[0] = question_score.part_1.reduce((sum, value) => sum + value, 0);

        // Tính điểm phần 2
        question_score.part_2.forEach(score => {
            let total_correct_answer = 0;

            total_correct_answer = score.reduce((sum, score) => sum + score, 0);

            // Tính điểm theo bậc chuẩn 2025
            switch (total_correct_answer) {
                case 1:
                    part_score[1] += 0.1;
                    break;
                case 2:
                    part_score[1] += 0.25;
                    break;
                case 3:
                    part_score[1] += 0.5;
                    break;
                case 4:
                    part_score[1] += 1;
                    break;
                default:
                    part_score[1] += 0;
                    break;
            }
        });

        // Tính điểm phần 3
        part_score[2] = question_score.part_3.reduce((sum, score) => sum + score, 0);
    }

    // End the quiz and show results
    // Kết thúc bài ôn tập và hiển thị kết quả
    function endQuiz() {
        // Xác nhận kết thúc bài làm
        if (!confirm('Bạn có chắc chắn muốn kết thúc bài ôn tập không?')) {
            return false;
        }

        // Chuyển trạng thái đã hoàn thành bài làm
        completed_test = true;

        // Dừng bộ đếm thời gian
        clearInterval(quiz_timer);
        const totalTimeElapsed = Math.floor((Date.now() - quiz_start_time) / 1000);
        const minutes = Math.floor(totalTimeElapsed / 60);
        const seconds = totalTimeElapsed % 60;

        quiz_page.classList.remove('active');
        result_page.classList.add('active');

        // Thực hiện tổng điểm
        summarizeResults();

        // Cập nhật thống kê số câu hoàn thành

        complete_count_part1.textContent = completed_questions[0] + "/" + question_part.part_1.length;
        complete_count_part2.textContent = completed_questions[1] + "/" + question_part.part_2.length * 4;
        complete_count_part3.textContent = completed_questions[2] + "/" + question_part.part_3.length;
        complete_count_total.textContent = completed_questions[0] + completed_questions[1] + completed_questions[2] + "/" + (question_part.part_1.length + question_part.part_2.length * 4 + question_part.part_3.length);

        // Cập nhật điểm số từng phần
        complete_score_part1.textContent = part_score[0];
        complete_score_part2.textContent = part_score[1];
        complete_score_part3.textContent = part_score[2];
        complete_score_total.textContent = part_score[0] + part_score[1] + part_score[2];

        // Cập nhật thời gian làm bài của từng phần
        //total_time_part1.textContent = `${Math.floor(time_spent_part[0] / 60)} phút ${time_spent_part[0] % 60} giây`;
        //total_time_part2.textContent = `${Math.floor(time_spent_part[1] / 60)} phút ${time_spent_part[1] % 60} giây`;
        //total_time_part3.textContent = `${Math.floor(time_spent_part[2] / 60)} phút ${time_spent_part[2] % 60} giây`;
        total_time_total.textContent = `${minutes} phút ${seconds} giây`;

        return true;
    }

    // Event Listeners
    // Gán sự kiện cho đối tượng

    // Bắt đầu bài kiểm tra
    start_button.addEventListener('click', startQuiz);

    // Hàm chung để xử lý việc chuyển phần
    function switchPart(partNumber) {
        if (current_question_part_number !== partNumber) {
            current_question_part_number = partNumber;
            current_questions_list = question_part[`part_${current_question_part_number + 1}`];
            current_question_index = 0;
            updatePartButtons();
            displayQuestion();
        }
    }

    // Gán sự kiện cho các nút bấm chuyển phần câu hỏi
    part1_button.addEventListener('click', () => switchPart(0));
    part2_button.addEventListener('click', () => switchPart(1));
    part3_button.addEventListener('click', () => switchPart(2));

    // Gán sự kiện cho các nút
    prev_button.addEventListener('click', prevQuestion);
    next_button.addEventListener('click', nextQuestion);
    finish_button.addEventListener('click', endQuiz);

    // Sự kiện nhấn nút xem lại
    review_button.addEventListener('click', () => {
        quiz_page.classList.add('active');
    });

    // Sự kiện quay lại trang chọn bài làm
    restart_button.addEventListener('click', () => {
        quiz_page.classList.remove('active');
        result_page.classList.remove('active');
        home_page.classList.add('active');
        document.title = "Chọn bài học";
    });

    // Initial load
    loadLessons();
});