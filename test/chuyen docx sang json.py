import docx
import json
import re

def is_underlined(paragraph):
    """Kiểm tra xem paragraph có chứa run nào được gạch chân không"""
    for run in paragraph.runs:
        if run.underline:
            return True
    return False

def convert_docx_to_json(file_path):
    try:
        doc = docx.Document(file_path)
    except Exception as e:
        return f"Không thể mở file: {e}"
    
    # Khuôn dữ liệu json
    data = {"part_1": [], "part_2": [], "part_3": []}
    current_part = None
    current_question = None

    # Đọc qua từng đoạn trong file docx
    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue

        # 1. Nhận diện chuyển Phần (Linh hoạt hoa thường và khoảng trắng)
        text_lower = text.lower()
        if "phần 1" in text_lower:
            current_part = "part_1"
            continue
        elif "phần 2" in text_lower:
            current_part = "part_2"
            continue

        if not current_part:
            continue

        # 2. XỬ LÝ PHẦN 1
        if current_part == "part_1":
            # Khớp: "Câu 1:", "Câu 01.", "Câu 1 :", v.v...
            q_match = re.match(r"^\s*Câu\s*(\d+)\s*[:.]", text, re.IGNORECASE)
            if q_match:
                q_content = re.sub(r"^\s*Câu\s*\d+\s*[:.]", "", text).strip()
                current_question = {
                    "question": q_content,
                    "image": {"src": "", "alt": ""},
                    "answers": []
                }
                data["part_1"].append(current_question)
            
            # Khớp đáp án A, B, C, D
            elif current_question and re.match(r"^[A-D]\s*[\.]", text):
                is_correct = is_underlined(para)
                ans_text = re.sub(r"^[A-D]\s*[\.]\s*", "", text).strip()
                current_question["answers"].append({
                    "text": ans_text,
                    "image": {"src": "", "alt": ""},
                    "correct": is_correct
                })

        # 3. XỬ LÝ PHẦN 2
        elif current_part == "part_2":
            q_match = re.match(r"^\s*Câu\s*(\d+)\s*[:.]", text, re.IGNORECASE)
            if q_match:
                q_content = re.sub(r"^\s*Câu\s*\d+\s*[:.]", "", text).strip()
                current_question = {
                    "question": q_content,
                    "image": {"src": "", "alt": ""},
                    "answers": []
                }
                data["part_2"].append(current_question)
            
            # Khớp phương án a, b, c, d
            elif current_question and re.match(r"^[a-d]\s*[\.\)]", text, re.IGNORECASE):
                ans_text = re.sub(r"^[a-d]\s*[\.\)]\s*", "", text, flags=re.IGNORECASE).strip()
                current_question["answers"].append({
                    "text": ans_text,
                    "image": {"src": "", "alt": ""},
                    "correct": False
                })
            
            # Xử lý dòng đáp án ĐĐĐS
            elif current_question and "Đáp án:" in text:
                ans_string = text.split(":")[1].strip().upper()
                for i, char in enumerate(ans_string):
                    if i < len(current_question["answers"]):
                        current_question["answers"][i]["correct"] = (char == "Đ")

    return data

# Thực thi
file_name = "BÀI 17.docx"
result = convert_docx_to_json(file_name)

if isinstance(result, dict):
    with open(file_name+".json", "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=4)
    print(f"--- THỐNG KÊ ---")
    print(f"Phần 1: {len(result['part_1'])} câu")
    print(f"Phần 2: {len(result['part_2'])} câu")
    print(f"Đã lưu tại: ",file_name+".json")
else:
    print(result)