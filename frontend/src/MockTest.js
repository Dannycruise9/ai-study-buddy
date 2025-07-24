// frontend/src/MockTest.js
import React, { useState } from 'react';
import './MockTest.css';

const MockTest = ({ testData }) => {
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleOptionChange = (questionIndex, optionKey) => {
    // Only allow changing answers if the test hasn't been submitted
    if (!submitted) {
      setUserAnswers({
        ...userAnswers,
        [questionIndex]: optionKey,
      });
    }
  };

  const handleSubmit = () => {
    let correctAnswers = 0;
    testData.questions.forEach((q, index) => {
      if (userAnswers[index] === q.correct_answer) {
        correctAnswers++;
      }
    });
    setScore(correctAnswers);
    setSubmitted(true);
  };

  // --- THIS IS THE UPDATED LOGIC ---
  const getOptionClassName = (question, optionKey, index) => {
    if (!submitted) {
      // If the user has selected an answer before submitting, give it a 'selected' style
      return userAnswers[index] === optionKey ? 'option selected' : 'option';
    }

    // After submission:
    const isCorrect = optionKey === question.correct_answer;
    const isUserChoice = userAnswers[index] === optionKey;

    if (isCorrect) {
      return 'option correct'; // Always highlight the correct answer in green
    }
    if (isUserChoice && !isCorrect) {
      return 'option incorrect'; // If the user chose this and it's wrong, highlight in red
    }
    
    return 'option'; // Default style for unselected, incorrect options
  };

  return (
    <div className="mock-test-container">
      <h2>Mock Test</h2>
      
      {testData.questions.map((q, index) => (
        <div key={index} className="question-block">
          <p className="question-text">{index + 1}. {q.question}</p>
          <div className="options-container">
            {Object.entries(q.options).map(([key, value]) => (
              <label key={key} className={getOptionClassName(q, key, index)}>
                <input
                  type="radio"
                  name={`question-${index}`}
                  value={key}
                  onChange={() => handleOptionChange(index, key)}
                  // The disabled prop now prevents changes after submission
                  disabled={submitted}
                />
                <strong>{key}:</strong> {value}
              </label>
            ))}
          </div>
        </div>
      ))}

      {!submitted ? (
        <button onClick={handleSubmit} className="submit-test-button">Submit Test</button>
      ) : (
        <div className="score-container">
          <h3>Test Complete!</h3>
          <p>Your Score: <strong>{score}</strong> out of <strong>{testData.questions.length}</strong></p>
        </div>
      )}
    </div>
  );
};

export default MockTest;