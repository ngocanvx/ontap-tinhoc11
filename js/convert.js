async function convertToJson() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file) {
        alert('Vui lòng chọn file Word (.docx)');
        return;
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const html = result.value;
        const messages = result.messages; // Warnings if any

        // Parse HTML to extract text
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const textContent = doc.body.textContent.trim();

        // Split into lines and parse
        const lines = textContent.split('\n').map(line => line.trim()).filter(line => line);

        const json = {
            part_1: [],
            part_2: [],
            part_3: [] // Khởi tạo thêm phần 3
        };

        let currentPart = 'part_1';
        let questionTextBuffer = []; // Sử dụng buffer để thu thập các dòng của câu hỏi
        let answers = [];
        let isQuestion = false;

        // Hàm để lưu câu hỏi hiện tại vào JSON
        function saveCurrentQuestion() {
            if (questionTextBuffer.length > 0 && answers.length > 0) { // Kiểm tra nếu có nội dung câu hỏi và đáp án
                json[currentPart].push({
                    question: questionTextBuffer.join(' ').trim(), // Nối các dòng lại thành nội dung câu hỏi
                    image: { src: "", alt: "" },
                    answers: answers.map(ans => ({
                        text: ans.text,
                        image: { src: "", alt: "" },
                        correct: ans.correct
                    }))
                });
            }
            // Reset state for the next question
            questionTextBuffer = []; // Xóa buffer câu hỏi
            answers = [];
            isQuestion = false;
        }

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Detect part change
            if (line.includes('Phần 2')) {
                saveCurrentQuestion(); // Lưu câu hỏi cuối cùng của phần 1
                currentPart = 'part_2';
                continue;
            }

            // Detect question start: "Câu X:"
            const questionMatch = line.match(/^Câu\s+\d+:\s*(.*)$/); // Regex linh hoạt hơn với khoảng trắng
            if (questionMatch) {
                saveCurrentQuestion(); // Lưu câu hỏi trước đó
                questionTextBuffer.push(questionMatch[1].trim()); // Lấy phần nội dung câu hỏi sau "Câu X:"
                answers = [];
                isQuestion = true;
                continue;
            }

            // For part 1: Answers A. B. C. D.
            if (currentPart === 'part_1' && isQuestion && line.match(/^[A-D]\./)) {
                const match = line.match(/^([A-D])\.\s*(.*)$/);
                if (match) {
                    const letter = match[1];
                    const text = match[2].trim();
                    // Assume correct based on underline simulation; here, we'll mark D as example, adjust logic as needed
                    // In real, you'd need to detect bold/underline in mammoth, but for simplicity, assume last is correct or manual
                    answers.push({ letter, text, correct: letter === 'D' }); // Placeholder logic
                }
                continue;
            }

            // For part 2: Multi statements a. b. c. d. with Đáp án: ĐĐS etc.
            if (currentPart === 'part_2' && isQuestion) {
                if (line.match(/^[a-d]\./)) {
                    const match = line.match(/^([a-d])\.\s*(.*)$/);
                    if (match) {
                        const letter = match[1];
                        const text = match[2].trim();
                        answers.push({ letter, text, correct: false }); // Will set later
                    }
                } else if (line.includes('Đáp án:')) {
                    const answerKey = line.replace('Đáp án:', '').trim();
                    // Map Đ to true, S to false. Đảm bảo không vượt quá số lượng đáp án đã thu thập
                    for (let j = 0; j < answers.length && j < answerKey.length; j++) {
                        answers[j].correct = answerKey[j] === 'Đ';
                    }
                }
            }

            // Append to question if not answer
            if (isQuestion && !line.match(/^[A-D]\./) && !line.match(/^[a-d]\./) && !line.includes('Đáp án:')) {
                questionTextBuffer.push(line); // Thêm dòng vào buffer câu hỏi nếu không phải đáp án
            }
        }

        // Save last question
        saveCurrentQuestion();

        const output = document.getElementById('output');
        output.textContent = JSON.stringify(json, null, 2);

        // Download JSON
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name.replace('.docx', '.json');
        a.click();
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error(error);
        alert('Lỗi khi chuyển đổi: ' + error.message);
    }
}