# 📚 AI Study Buddy

A full-stack web application that uses AI to generate flashcards, mock tests, and answer questions from uploaded study materials. Built with React.js, Python (Flask), Supabase, and multiple AI APIs (Google Gemini and Groq).

## Core Features

-   **User Authentication:** Secure sign-up and login with email/password and Google OAuth.
-   **File Upload:** Users can upload their study documents (.pdf, .txt).
-   **Flashcard Generation:** AI-powered creation of a flashcard carousel from the document text.
-   **Mock Test Generation:** AI-powered creation of multiple-choice quizzes.
-   **Q&A Chatbot:** An interactive chatbot that answers questions based on the document's content.

## Tech Stack

-   **Frontend:** React.js
-   **Backend:** Python (Flask)
-   **Database & Storage:** Supabase (PostgreSQL)
-   **AI APIs:** Google Gemini & Groq
-   **Deployment:** (You can add this later, e.g., Vercel for Frontend, Railway for Backend)

## Local Setup

1.  Clone the repository.
2.  Set up the backend:
    -   `cd backend`
    -   `python -m venv venv`
    -   `source venv/Scripts/activate` (or `venv\Scripts\activate` on Windows)
    -   `pip install -r requirements.txt`
    -   Create a `.env` file and add your Supabase and AI API keys.
    -   `python app.py`
3.  Set up the frontend:
    -   `cd frontend`
    -   `npm install`
    -   Create a `.env` file and add your Supabase URL and Anon key.
    -   `npm start`