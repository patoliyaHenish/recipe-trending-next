"use client";
import React from "react";
import { useTheme } from "../context/ThemeContext";

const CoolLoader = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className="modern-loader-container">
      <div className="loader-visual">
        <div className="ring-outer"></div>
        <div className="ring-inner"></div>
        <div className="center-dot"></div>
      </div>
      
      <div className="loader-text-container">
        <h2 className="loader-title">Getting Your Recipe</h2>
      </div>

      <style>{`
        .modern-loader-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          width: 100%;
          background: transparent;
          gap: 40px;
        }

        .loader-visual {
          position: relative;
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ring-outer {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 4px solid transparent;
          border-top-color: #CA6014;
          border-right-color: #CA6014;
          border-radius: 50%;
          animation: rotate-clockwise 1.5s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        }

        .ring-inner {
          position: absolute;
          width: 70%;
          height: 70%;
          border: 4px solid transparent;
          border-bottom-color: #FF9F1C;
          border-left-color: #FF9F1C;
          border-radius: 50%;
          animation: rotate-counter-clockwise 1s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        }

        .center-dot {
          width: 12px;
          height: 12px;
          background-color: #CA6014;
          border-radius: 50%;
          animation: pulse-dot 1.5s ease-in-out infinite;
          box-shadow: 0 0 15px rgba(202, 96, 20, 0.5);
        }

        .loader-text-container {
          text-align: center;
          animation: fade-up 0.8s ease-out forwards;
        }

        .loader-title {
          font-family: 'Basic', sans-serif;
          font-weight: 700;
          font-size: 28px;
          margin: 0;
          background: linear-gradient(135deg, #CA6014, #FF9F1C);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.5px;
        }

        .loader-subtitle {
          font-family: 'Basic', sans-serif;
          font-weight: 500;
          font-size: 16px;
          color: ${isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)'};
          margin: 8px 0 0 0;
          letter-spacing: 0.5px;
          animation: breathe 2s ease-in-out infinite;
        }

        @keyframes breathe {
          0%, 100% { opacity: 0.4; transform: scale(0.98); }
          50% { opacity: 1; transform: scale(1); }
        }

        @keyframes rotate-clockwise {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes rotate-counter-clockwise {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }

        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.5); opacity: 1; }
        }

        @keyframes fade-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default CoolLoader;

