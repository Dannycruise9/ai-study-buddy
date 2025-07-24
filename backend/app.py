# backend/app.py

import os
import fitz  # PyMuPDF
import google.generativeai as genai
from groq import Groq
import json
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from supabase import create_client, Client
from dotenv import load_dotenv
from functools import wraps

# Load environment variables from .env file
load_dotenv()

# --- Initialize Flask App and CORS ---
app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# --- Initialize ALL Clients (Supabase, Gemini, Groq) ---
try:
    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
    GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

    if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY, GROQ_API_KEY]):
        raise ValueError("One or more environment variables are not set. Please check your backend/.env file.")

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-1.5-flash-latest')
    groq_client = Groq(api_key=GROQ_API_KEY)

except Exception as e:
    print(f"Error during initialization: {e}")

# --- HELPER FUNCTIONS ---

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'authorization' in request.headers:
            token = request.headers['authorization'].split(" ")[1]
        if not token:
            return jsonify({'message': 'Authentication Token is missing!'}), 401
        try:
            user_response = supabase.auth.get_user(token)
            g.user = user_response.user
        except Exception as e:
            return jsonify({'message': 'Token is invalid or expired!', 'error': str(e)}), 401
        return f(*args, **kwargs)
    return decorated

def extract_json_from_response(raw_text):
    start_index = raw_text.find('[')
    end_index = raw_text.rfind(']') + 1
    if start_index == -1 or end_index == 0:
        raise ValueError("Could not find a JSON array in the AI response.")
    json_str = raw_text[start_index:end_index]
    return json.loads(json_str)

def find_main_content(text: str) -> str:
    start_markers = [
        "Table of Contents", "Contents", "Introduction", "Chapter 1", "Chapter I",
        "Module 1", "Unit 1", "Abstract", "Summary", "Preface"
    ]
    lower_text = text.lower()
    first_marker_index = -1
    for marker in start_markers:
        index = lower_text.find(marker.lower())
        if index != -1 and (first_marker_index == -1 or index < first_marker_index):
            first_marker_index = index
    if first_marker_index != -1:
        print(f"Main content marker found. Trimming text.")
        return text[first_marker_index:]
    else:
        print("No main content marker found. Using full text.")
        return text

# --- API ENDPOINTS ---

@app.route('/', methods=['GET'])
def health_check():
    return "AI Study Buddy Backend is running!"

@app.route('/upload', methods=['POST'])
@token_required
def upload_document():
    if 'file' not in request.files: return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '': return jsonify({"error": "No selected file"}), 400
    try:
        file_content = file.read()
        file_path_in_bucket = f"{g.user.id}/{file.filename}"
        supabase.storage.from_("study-bucket").upload(
            file=file_content, path=file_path_in_bucket, file_options={"content-type": file.content_type, "upsert": "true"}
        )
        extracted_text = ""
        if file.filename.lower().endswith('.pdf'):
            doc = fitz.open(stream=file_content, filetype="pdf")
            for page in doc: extracted_text += page.get_text()
        else:
            extracted_text = file_content.decode("utf-8")
        
        main_content_text = find_main_content(extracted_text)
        
        document_data = {
            "file_name": file.filename,
            "storage_path": file_path_in_bucket,
            "extracted_text": main_content_text,
            "user_id": g.user.id
        }
        data, count = supabase.table('study_documents').insert(document_data).execute()
        return jsonify({"message": "File uploaded and processed successfully!", "document_id": data[1][0]['id']}), 201
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

@app.route('/generate-flashcards/<document_id>', methods=['GET'])
@token_required
def generate_flashcards_endpoint(document_id):
    try:
        result = supabase.table('study_documents').select('extracted_text').eq('id', document_id).eq('user_id', g.user.id).single().execute()
        if not result.data: return jsonify({"error": "Document not found"}), 404
        text = result.data['extracted_text']
        prompt = f"Based on the following text, create 10 flashcards. Each card needs a 'question' and 'answer'. Respond ONLY with a valid JSON array.\n\nTEXT:\n{text[:4000]}"
        response = gemini_model.generate_content(prompt)
        flashcards_data = extract_json_from_response(response.text)
        for card in flashcards_data:
            card.update({'document_id': document_id, 'user_id': g.user.id})
        insert_result, count = supabase.table('flashcards').insert(flashcards_data).execute()
        return jsonify(insert_result[1]), 200
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

@app.route('/generate-mock-test/<document_id>', methods=['GET'])
@token_required
def generate_mock_test_endpoint(document_id):
    try:
        num_questions = int(request.args.get('count', 10))
        if not 10 <= num_questions <= 50: return jsonify({"error": "Question count must be between 10-50."}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid count parameter."}), 400
    try:
        result = supabase.table('study_documents').select('extracted_text').eq('id', document_id).eq('user_id', g.user.id).single().execute()
        if not result.data: return jsonify({"error": "Document not found"}), 404
        text = result.data['extracted_text']
        prompt = f"Generate EXACTLY {num_questions} multiple-choice questions from the text. Each needs 4 options (A, B, C, D) and a 'correct_answer' key (like 'C'). Respond ONLY with a valid JSON array.\n\nTEXT:\n{text[:12000]}"
        response = gemini_model.generate_content(prompt)
        test_data = extract_json_from_response(response.text)
        if len(test_data) > num_questions: test_data = test_data[:num_questions]
        insert_result, count = supabase.table('mock_tests').insert({"document_id": document_id, "user_id": g.user.id, "questions": test_data}).execute()
        return jsonify(insert_result[1][0]), 200
    except (ValueError, json.JSONDecodeError) as e:
        return jsonify({"error": f"Failed to parse AI response: {str(e)}", "raw_response": response.text if 'response' in locals() else "No response"}), 500
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

@app.route('/ask-question/<document_id>', methods=['POST'])
@token_required
def ask_question_endpoint(document_id):
    req_data = request.get_json()
    question = req_data.get('question')
    if not question: return jsonify({"error": "A question is required."}), 400
    try:
        result = supabase.table('study_documents').select('extracted_text').eq('id', document_id).eq('user_id', g.user.id).single().execute()
        if not result.data: return jsonify({"error": "Document not found"}), 404
        context = result.data['extracted_text']
        truncated_context = context[:4000]
        prompt = f"""Based ONLY on the following text, answer the user's question. If the answer is not in the text, say "I could not find an answer to that in the document."\n\nCONTEXT:\n{truncated_context}\n\nQUESTION:\n{question}"""
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}], model="llama3-8b-8192"
        )
        answer = chat_completion.choices[0].message.content
        return jsonify({"answer": answer}), 200
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

# --- Run the App ---
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)