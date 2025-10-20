let convertedData = null;
let fileName = '';

// Drag and drop
const uploadSection = document.getElementById('uploadSection');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadSection.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    uploadSection.addEventListener(eventName, () => {
        uploadSection.classList.add('dragover');
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    uploadSection.addEventListener(eventName, () => {
        uploadSection.classList.remove('dragover');
    }, false);
});

uploadSection.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

document.getElementById('fileInput').addEventListener('change', function (e) {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

async function handleFile(file) {
    if (!file.name.endsWith('.docx')) {
        showError('Vui lòng chọn file DOCX!');
        return;
    }

    fileName = file.name.replace('.docx', '');
    showLoading(true);
    hideError();

    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
        const html = result.value;

        convertedData = parseQuestionsFromHTML(html);

        displayResults(convertedData);
        showLoading(false);
    } catch (error) {
        showError('Lỗi khi xử lý file: ' + error.message);
        showLoading(false);
    }
}

function parseQuestionsFromHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const text = doc.body.textContent;

    // Debug: Log text để kiểm tra
    console.log('=== FULL TEXT ===');
    console.log(text.substring(0, 500));

    const result = {};

    // Tách theo "Phần" với nhiều pattern khác nhau
    const phần1Match = text.match(/Phần\s*1[\s\S]*?(?=Phần\s*2|$)/i);
    const phần2Match = text.match(/Phần\s*2[\s\S]*$/i);
    const phần3Match = text.match(/Phần\s*3[\s\S]*$/i);

    console.log('=== Phần 1 found:', !!phần1Match);
    console.log('=== Phần 2 found:', !!phần2Match);
    console.log('=== Phần 3 found:', !!phần3Match);

    // Kiểm tra nếu tìm thấy các phần

    if (phần1Match) {
        const part1Text = phần1Match[0];
        console.log('=== PART 1 TEXT (first 300 chars) ===');
        console.log(part1Text.substring(0, 300));
        result.part_1 = parsePart1(part1Text);
    } else {
        result.part_1 = [];
    }

    if (phần2Match) {
        const part2Text = phần2Match[0];
        console.log('=== PART 2 TEXT (first 300 chars) ===');
        console.log(part2Text.substring(0, 300));
        result.part_2 = parsePart2(part2Text);
    } else {
        result.part_2 = [];
    }

    if (phần3Match) {
        const part3Text = phần3Match[0];
        console.log('=== PART 3 TEXT (first 300 chars) ===');
        console.log(part3Text.substring(0, 300));
        result.part_3 = parsePart1(part3Text);
    } else {
        result.part_3 = [];
    }

    return result;
}

function parsePart1(text) {
    const questions = [];

    // Tìm tất cả các câu hỏi với pattern "Câu X:"
    const questionRegex = /Câu\s+(\d+)(?:[.:])\s*([^\n]+(?:\n(?!Câu\s+\d+[.:])[^\n]+)*)/gi;

    let match;

    while ((match = questionRegex.exec(text)) !== null) {
        const questionNumber = match[1];
        const fullBlock = match[0];

        console.log(`--- Parsing Question ${questionNumber} ---`);
        console.log(fullBlock.substring(0, 200));

        // Tách các dòng
        const lines = fullBlock.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        if (lines.length === 0) continue;

        // Dòng đầu tiên là câu hỏi (bỏ "Câu X:")
        const questionText = lines[0].replace(/^Câu\s+\d+:\s*/i, '').trim();
        const answers = [];

        // Parse các đáp án A, B, C, D
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Pattern cho đáp án: A. hoặc [A.] hoặc A)
            const answerMatch = line.match(/^\[?([A-D])\]?[\.\)]\s*(.+)/i);

            if (answerMatch) {
                const letter = answerMatch[1].toUpperCase();
                let answerText = answerMatch[2];

                // Kiểm tra đáp án đúng - có thể xuất hiện ở nhiều dạng:
                // [C.]{.underline} hoặc [C.] hoặc line có chứa {.underline}
                const isCorrect = line.includes('[' + letter) ||
                    line.includes('{.underline}') ||
                    answerText.includes('{.underline}');

                // Làm sạch text
                answerText = answerText
                    .replace(/\{\.underline\}/g, '')
                    .replace(/[\[\]{ }]/g, '')
                    .trim();

                answers.push({
                    text: answerText,
                    image: { src: "", alt: "" },
                    correct: isCorrect
                });

                console.log(`  ${letter}. ${answerText} - ${isCorrect ? 'CORRECT' : 'wrong'}`);
            }
        }

        if (questionText && answers.length >= 4) {
            questions.push({
                question: questionText,
                image: { src: "", alt: "" },
                answers: answers
            });
            console.log(`✓ Added question ${questionNumber} with ${answers.length} answers`);
        } else {
            console.log(`✗ Skipped question ${questionNumber} - text: ${!!questionText}, answers: ${answers.length}`);
        }
    }

    console.log(`=== PART 1 TOTAL: ${questions.length} questions ===`);
    return questions;
}

function parsePart2(text) {
    const questions = [];

    // Tìm tất cả các câu hỏi với pattern "Câu X."
    const questionRegex = /Câu\s+(\d+)\.\s*([^\n]+(?:\n(?!Câu\s+\d+\.)[^\n]+)*)/gi;
    let match;

    while ((match = questionRegex.exec(text)) !== null) {
        const questionNumber = match[1];
        const fullBlock = match[0];

        console.log(`--- Parsing Part 2 Question ${questionNumber} ---`);
        console.log(fullBlock.substring(0, 200));

        const lines = fullBlock.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        if (lines.length === 0) continue;

        // Dòng đầu tiên là câu hỏi
        const questionText = lines[0].replace(/^Câu\s+\d+\.\s*/i, '').trim();
        const answers = [];
        let answerKey = '';

        // Tìm dòng "Đáp án:"
        for (let line of lines) {
            const answerMatch = line.match(/Đáp\s*án:\s*([ĐS]+)/i);
            if (answerMatch) {
                answerKey = answerMatch[1];
                console.log(`  Answer key found: ${answerKey}`);
                break;
            }
        }

        // Parse các đáp án a, b, c, d
        for (let line of lines) {
            const answerMatch = line.match(/^([a-d])[\.\)]\s*(.+)/i);

            if (answerMatch) {
                const letter = answerMatch[1].toLowerCase();
                const answerText = answerMatch[2].trim();
                const index = letter.charCodeAt(0) - 97; // a=0, b=1, c=2, d=3

                const isCorrect = answerKey.length > index && answerKey[index] === 'Đ';

                answers.push({
                    text: answerText,
                    image: { src: "", alt: "" },
                    correct: isCorrect
                });

                console.log(`  ${letter}. ${answerText.substring(0, 50)}... - ${isCorrect ? 'CORRECT' : 'wrong'}`);
            }
        }

        if (questionText && answers.length >= 4 && answerKey) {
            questions.push({
                question: questionText,
                image: { src: "", alt: "" },
                answers: answers
            });
            console.log(`✓ Added Part 2 question ${questionNumber} with ${answers.length} answers`);
        } else {
            console.log(`✗ Skipped Part 2 question ${questionNumber} - text: ${!!questionText}, answers: ${answers.length}, key: ${!!answerKey}`);
        }
    }

    console.log(`=== PART 2 TOTAL: ${questions.length} questions ===`);
    return questions;
}

function displayResults(data) {
    const results = document.getElementById('results');
    const stats = document.getElementById('stats');
    const jsonOutput = document.getElementById('jsonOutput');
    const previewList = document.getElementById('previewList');

    // Thống kê
    let totalQuestions = 0;
    let part1Count = 0;
    let part2Count = 0;

    if (data.part_1) {
        part1Count = data.part_1.length;
        totalQuestions += part1Count;
    }
    if (data.part_2) {
        part2Count = data.part_2.length;
        totalQuestions += part2Count;
    }

    stats.innerHTML = `
    <div class="stat-card">
        <div class="stat-number">${totalQuestions}</div>
        <div class="stat-label">Tổng số câu hỏi</div>
    </div>
    <div class="stat-card">
        <div class="stat-number">${part1Count}</div>
        <div class="stat-label">Phần 1 (1 đáp án)</div>
    </div>
    <div class="stat-card">
        <div class="stat-number">${part2Count}</div>
        <div class="stat-label">Phần 2 (nhiều đáp án)</div>
    </div>
    `;

    // JSON output
    jsonOutput.textContent = JSON.stringify(data, null, 4);

    // Preview
    previewList.innerHTML = '';

    Object.keys(data).forEach(partKey => {
        const partNumber = partKey.replace('part_', '');
        const partTitle = document.createElement('h3');
        partTitle.textContent = `Phần ${partNumber}`;
        partTitle.style.color = '#667eea';
        partTitle.style.marginBottom = '15px';
        previewList.appendChild(partTitle);

        data[partKey].forEach((q, index) => {
            const qDiv = document.createElement('div');
            qDiv.className = 'question-preview';

            let html = `<h4>Câu ${index + 1}: ${q.question}</h4>`;
            q.answers.forEach((ans, i) => {
                const letter = String.fromCharCode(65 + i);
                html += `<div class="answer-item ${ans.correct ? 'correct' : ''}">
        ${letter}. ${ans.text} ${ans.correct ? '✓' : ''}
    </div>`;
            });

            qDiv.innerHTML = html;
            previewList.appendChild(qDiv);
        });
    });

    results.style.display = 'block';
    uploadSection.style.display = 'none';
}

function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    document.getElementById('jsonTab').style.display = tabName === 'json' ? 'block' : 'none';
    document.getElementById('previewTab').style.display = tabName === 'preview' ? 'block' : 'none';
}

function copyJSON() {
    const jsonText = document.getElementById('jsonOutput').textContent;
    navigator.clipboard.writeText(jsonText).then(() => {
        alert('Đã copy JSON vào clipboard!');
    });
}

function downloadJSON() {
    const jsonText = document.getElementById('jsonOutput').textContent;
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_converted.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function resetUpload() {
    document.getElementById('results').style.display = 'none';
    uploadSection.style.display = 'block';
    document.getElementById('fileInput').value = '';
    convertedData = null;
}

function showLoading(show) {
    document.getElementById('loading').classList.toggle('active', show);
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.innerHTML = `<div class="error">${message}</div>`;
}

function hideError() {
    document.getElementById('errorMessage').innerHTML = '';
}