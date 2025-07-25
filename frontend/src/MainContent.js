// frontend/src/MainContent.js

import React, { useState } from 'react';
import FlashcardCarousel from './FlashcardCarousel';
import MockTest from './MockTest';
import QAChatbot from './QAChatbot';
import './MainContent.css';

function MainContent({ session }) {
  // State Definitions
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [documentId, setDocumentId] = useState(null);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [generatingTest, setGeneratingTest] = useState(false);
  const [mockTest, setMockTest] = useState(null);
  const [numQuestions, setNumQuestions] = useState(10);
  const [message, setMessage] = useState(
    `Welcome, ${session.user.email}! Upload a document to begin.`
  );

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setDocumentId(null);
    setFlashcards([]);
    setMockTest(null);
    setMessage('File selected. Click "Upload" to process.');
  };

  const handleUpload = async () => {
    if (!file) { setMessage('Please select a file first.'); return; }
    setUploading(true);
    setMessage('Uploading and processing...');
    const formData = new FormData();
    formData.append('file', file);
    try {
      // --- UPDATED FETCH URL ---
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'An unknown error occurred.');
      setMessage(data.message);
      setDocumentId(data.document_id);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!documentId) return;
    setGeneratingFlashcards(true);
    setMockTest(null);
    setMessage('Generating flashcards...');
    try {
      // --- UPDATED FETCH URL ---
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/generate-flashcards/${documentId}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFlashcards(data);
      setMessage('Flashcards generated successfully!');
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  const handleGenerateMockTest = async () => {
    if (!documentId) return;
    const questionCount = parseInt(numQuestions);
    if (isNaN(questionCount) || questionCount < 10 || questionCount > 50) {
      setMessage("Please enter a number of questions between 10 and 50.");
      return;
    }
    setGeneratingTest(true);
    setFlashcards([]);
    setMessage(`Generating a ${questionCount}-question mock test...`);
    try {
      // --- UPDATED FETCH URL ---
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/generate-mock-test/${documentId}?count=${questionCount}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unknown error');
      setMockTest(data);
      setMessage('Mock test generated successfully!');
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setGeneratingTest(false);
    }
  };

  const isActionInProgress = uploading || generatingFlashcards || generatingTest;

  return (
    <main className="main-content">
      <div className="upload-section">
        <h2>Upload Your Study Material</h2>
        <input type="file" onChange={handleFileChange} accept=".pdf,.txt" disabled={isActionInProgress} />
        <button onClick={handleUpload} disabled={!file || isActionInProgress}>
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      {message && <p className="message">{message}</p>}

      {documentId && (
        <div className="actions-section">
          <h2>Study Tools</h2>
          <div className="action-item">
            <button onClick={handleGenerateFlashcards} disabled={isActionInProgress}>
              {generatingFlashcards ? 'Generating...' : 'Generate Flashcards'}
            </button>
          </div>
          <div className="action-item">
            <div className="mock-test-controls">
              <label htmlFor="num-questions">Questions (10-50):</label>
              <input
                id="num-questions"
                type="number"
                min="10"
                max="50"
                value={numQuestions}
                onChange={(e) => setNumQuestions(e.target.value)}
                disabled={isActionInProgress}
              />
              <button onClick={handleGenerateMockTest} disabled={isActionInProgress}>
                {generatingTest ? 'Generating...' : 'Generate Mock Test'}
              </button>
            </div>
          </div>
        </div>
      )}

      {flashcards.length > 0 && <FlashcardCarousel flashcards={flashcards} />}
      {mockTest && <MockTest testData={mockTest} />}
      {documentId && <QAChatbot documentId={documentId} session={session} />}
    </main>
  );
}

export default MainContent;