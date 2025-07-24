// frontend/src/FlashcardCarousel.js
import React, { useState } from 'react';
import Flashcard from './flashcard';
import './FlashcardCarousel.css';

const FlashcardCarousel = ({ flashcards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!flashcards || flashcards.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    const isFirstCard = currentIndex === 0;
    const newIndex = isFirstCard ? flashcards.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastCard = currentIndex === flashcards.length - 1;
    const newIndex = isLastCard ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const currentCard = flashcards[currentIndex];

  return (
    <div className="carousel-container">
      <h2>Flashcards</h2>
      <div className="carousel-main">
        <button onClick={goToPrevious} className="carousel-nav-button">←</button>
        <Flashcard 
          key={currentCard.id || currentIndex} 
          question={currentCard.question} 
          answer={currentCard.answer} 
        />
        <button onClick={goToNext} className="carousel-nav-button">→</button>
      </div>
      <p className="carousel-counter">
        Card {currentIndex + 1} of {flashcards.length}
      </p>
    </div>
  );
};

export default FlashcardCarousel;