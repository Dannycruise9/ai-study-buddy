// frontend/src/QAChatbot.js
import React, { useState } from 'react';
import './QAChatbot.css';

const QAChatbot = ({ documentId, session }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setIsLoading(true);
    setAnswer('');
    setError('');
    try {
      const response = await fetch(`http://localhost:5000/ask-question/${documentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ question }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Something went wrong');
      setAnswer(data.answer);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      <h2>Ask a Question</h2>
      <form onSubmit={handleSubmit} className="chatbot-form">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a specific question about your document..."
          rows="3"
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Thinking...' : 'Ask'}
        </button>
      </form>
      {isLoading && <p>Getting your answer...</p>}
      {answer && <div className="answer-box"><p>{answer}</p></div>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default QAChatbot;