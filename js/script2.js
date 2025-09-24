document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    // Khai báo các biến DOM (Document Object Model) cần thiết
    // Nhằm truy cập và thao tác với các phần tử HTML

    // Các trang chính
    const homePage = document.getElementById('home-page');
    const quizPage = document.getElementById('quiz-page');
    const resultPage = document.getElementById('result-page');

    // Các phần tử trong trang quiz
    const lessonSelect = document.getElementById('lesson-select');
    const startButton = document.getElementById('start-button');
    const lessonTitle = document.getElementById('lesson-title');
    const questionCounter = document.getElementById('question-counter');
    const timeSpent = document.getElementById('time-spent');
    const questionText = document.getElementById('question-text');
    const answersContainer = document.getElementById('answers-container');
    const feedbackMessage = document.getElementById('feedback-message');
    const nextButton = document.getElementById('next-button');
    const finishButton = document.getElementById('finish-button');

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
    const restartButton = document.getElementById('restart-button');

    // Global variables
    // Lưu danh sách bài học và danh sách câu hỏi hiện tại
    let lessons = [];
    let currentQuestions = [];

    // Biến lưu danh sách câu hỏi từng phần
    let questions_part_1 = [];
    let questions_part_2 = [];
    let questions_part_3 = [];

    // Lưu tổng số câu hỏi từng phần
    let total_questions_1 = 0;
    let total_questions_2 = 0;
    let total_questions_3 = 0;

    // Lưu số câu hỏi đã hoàn thành của từng phần
    let completed_questions_1 = 0;
    let completed_questions_2 = 0;
    let completed_questions_3 = 0;

    // Lưu số câu hỏi sai của từng phần
    let incorrect_questions_1 = 0;
    let incorrect_questions_2 = 0;
    let incorrect_questions_3 = 0;

    // Đánh dấu phần câu hỏi hiện tại đang ở phần nào
    let current_question_part = 0;

    // Đánh dấu thứ tự câu hỏi hiện tại trong phần đang làm
    let current_question_index = 0;

    // Lưu thời gian thực hiện bài quiz
    let quizStartTime;
    let quizTimer;

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
                lessonSelect.appendChild(option);
            });

        } catch (error) {
            console.error('Lỗi khi tải danh sách bài học:', error);
        }
    }

    /**
    * Xáo trộn một mảng sử dụng thuật toán Fisher-Yates.
    * @param {Array} array Mảng cần xáo trộn.
    * @returns {Array} Mảng đã được xáo trộn.
    */
    function shuffleArray(array) {
        // Lặp ngược từ cuối mảng về đầu
        for (let i = array.length - 1; i > 0; i--) {
            // Chọn một vị trí ngẫu nhiên từ 0 đến i
            const j = Math.floor(Math.random() * (i + 1));
            // Hoán đổi phần tử ở vị trí i và j
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Load questions for a selected lesson
    // Tải danh sách câu hỏi từ file JSON
    async function loadQuestions(fileName) {
        try {
            const response = await fetch(`./json/${fileName}`);
            const data = await response.json();

            // Đọc và XÁO TRỘN danh sách câu hỏi các phần
            questions_part_1 = shuffleArray(data.part_1);
            questions_part_2 = shuffleArray(data.part_2);
            questions_part_3 = shuffleArray(data.part_3);

            // Đếm số lượng câu hỏi từng phần
            total_Questions_1 = questions_part_1.length;
            total_Questions_2 = questions_part_2.length;
            total_Questions_3 = questions_part_3.length;


            current_question_part = 0; // Bắt đầu từ phần 1
            current_question_index = 0;
            currentQuestions = questions_part_1; // Bắt đầu với phần 1

            completeAnswers = 0;
            incorrectAnswers = 0;
            displayQuestion(); // Giả sử bạn bắt đầu với phần 1

        } catch (error) {
            console.error('Lỗi khi tải câu hỏi:', error);
            alert('Không thể tải câu hỏi cho bài học này.');
        }
    }


    // Display current question
    function displayQuestion() {
        if (currentQuestionIndex >= currentQuestions.length) {
            endQuiz();
            return;
        }

        const questionData = currentQuestions[currentQuestionIndex];

        // Reset UI
        answersContainer.innerHTML = '';
        feedbackMessage.style.display = 'none';
        nextButton.disabled = true;

        // Update question info
        questionCounter.textContent = `Câu ${currentQuestionIndex + 1}/${currentQuestions.length}`;
        questionText.textContent = questionData.question;

        // Create answer options
        questionData.answers.forEach((answer, index) => {
            const answerOption = document.createElement('button');
            answerOption.className = 'answer-option';
            answerOption.textContent = answer;
            answerOption.addEventListener('click', () => handleAnswerClick(answerOption, index, questionData.correct));
            answersContainer.appendChild(answerOption);
        });
    }

    // Handle user's answer
    function handleAnswerClick(selectedOption, selectedIndex, correctIndex) {
        const allOptions = answersContainer.querySelectorAll('.answer-option');
        allOptions.forEach(option => option.disabled = true); // Disable all buttons after a choice

        if (selectedIndex === correctIndex) {
            selectedOption.classList.add('correct');
            feedbackMessage.textContent = 'Chính xác! Chúc mừng bạn!';
            feedbackMessage.classList.add('correct');
            feedbackMessage.classList.remove('incorrect');
            feedbackMessage.style.display = 'block';
            nextButton.disabled = false;
            completeAnswers++;
        } else {
            selectedOption.classList.add('incorrect');
            feedbackMessage.textContent = 'Câu trả lời sai. Vui lòng chọn lại.';
            feedbackMessage.classList.add('incorrect');
            feedbackMessage.classList.remove('correct');
            feedbackMessage.style.display = 'block';

            // Re-enable options for a new attempt
            allOptions.forEach(option => option.disabled = false);
            selectedOption.disabled = true; // Keep the incorrect option disabled
            incorrectAnswers++;
        }
    }

    // Start the quiz
    function startQuiz() {
        const selectedLessonFile = lessonSelect.value;
        const selectedLessonName = lessonSelect.options[lessonSelect.selectedIndex].text;

        if (!selectedLessonFile) {
            alert('Vui lòng chọn một bài học.');
            return;
        }

        homePage.classList.remove('active');
        quizPage.classList.add('active');
        lessonTitle.textContent = selectedLessonName;

        quizStartTime = Date.now();
        quizTimer = setInterval(updateTimer, 1000);

        loadQuestions(selectedLessonFile);
    }

    // Update the timer
    function updateTimer() {
        const timeElapsed = Math.floor((Date.now() - quizStartTime) / 1000);
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
        clearInterval(quizTimer);
        const totalTimeElapsed = Math.floor((Date.now() - quizStartTime) / 1000);
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
    startButton.addEventListener('click', startQuiz);
    nextButton.addEventListener('click', nextQuestion);
    finishButton.addEventListener('click', endQuiz);
    restartButton.addEventListener('click', () => {
        resultPage.classList.remove('active');
        homePage.classList.add('active');
    });

    // Initial load
    loadLessons();
});