import React, { useRef } from 'react';
import '../styles/Certificate.css';

const Certificate = ({ username, category, difficulty, score, totalQuestions, date }) => {
  const certificateRef = useRef();
  const percentage = Math.round((score / totalQuestions) * 100);

  const handleDownload = () => {
    // Create a print-friendly version
    window.print();
  };

  return (
    <div className="certificate-wrapper">
      <div className="certificate-container" ref={certificateRef}>
        <div className="certificate-border">
          <div className="certificate-content">
            <div className="certificate-header">
              <div className="certificate-seal">🏆</div>
              <h1 className="certificate-title">Certificate of Achievement</h1>
              <p className="certificate-subtitle">This certifies that</p>
            </div>

            <div className="certificate-body">
              <h2 className="recipient-name">{username}</h2>
              <p className="certificate-text">
                has successfully completed the quiz on
              </p>
              <h3 className="category-name">{category}</h3>
              <p className="certificate-text">
                at <strong>{difficulty}</strong> difficulty level
              </p>

              <div className="certificate-score">
                <div className="score-box">
                  <div className="score-label">Score</div>
                  <div className="score-value">{percentage}%</div>
                  <div className="score-detail">{score} out of {totalQuestions} correct</div>
                </div>
              </div>

              <div className="certificate-date">
                <p>Awarded on {new Date(date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
              </div>
            </div>

            <div className="certificate-footer">
              <div className="signature-line">
                <div className="signature">
                  <div className="signature-name">Quiz Application</div>
                  <div className="signature-title">Online Learning Platform</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="certificate-actions no-print">
        <button className="btn-download" onClick={handleDownload}>
          🖨️ Print Certificate
        </button>
      </div>
    </div>
  );
};

export default Certificate;
