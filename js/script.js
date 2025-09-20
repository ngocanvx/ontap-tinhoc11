document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const homePage = document.getElementById('home-page');
    const quizPage = document.getElementById('quiz-page');
    const resultPage = document.getElementById('result-page');

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
    const completeCountSpan = document.getElementById('complete-count');
    const correctCountSpan = document.getElementById('correct-count');
    const incorrectCountSpan = document.getElementById('incorrect-count');
    const percentCorrectFirst = document.getElementById('percent-correct-first');
    const totalTimeSpan = document.getElementById('total-time');

    // Nút nhấn quay về trang chủ
    const restartButton = document.getElementById('restart-button');

    // Global variables
    let lessons = [];
    let currentQuestions = [];
    let totalQuestions = 0;
    let currentQuestionIndex = 0;
    let completeAnswers = 0;
    let incorrectAnswers = 0;
    let quizStartTime;
    let quizTimer;

    // Load lessons from baihoc.json
    async function loadLessons() {
        try {
            const response = await fetch('./json/baihoc.json');
            const data = await response.json();
            lessons = data.lessons;
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

    // Load questions for a selected lesson
    async function loadQuestions(fileName) {
        try {
            const response = await fetch(`./json/${fileName}`);
            const data = await response.json();
            currentQuestions = data.questions;
            totalQuestions = currentQuestions.length;
            currentQuestionIndex = 0;
            completeAnswers = 0;
            incorrectAnswers = 0;
            displayQuestion();
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