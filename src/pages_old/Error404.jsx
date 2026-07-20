"use client";
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTheme } from '../context/ThemeContext';

const Error404 = () => {
    const { isDarkMode } = useTheme();

  return (
    <div 
        className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative transition-colors duration-300"
        style={{
            background: isDarkMode 
                ? 'radial-gradient(circle at 50% 50%, #2a1a12 0%, #121212 100%)' 
                : 'radial-gradient(circle at 50% 50%, #fff8ed 0%, #ffffff 100%)',
        }}
    >
      <div className="text-center z-10 max-w-2xl px-4">
        <motion.div
           initial={{ opacity: 0, scale: 0.5 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.8, ease: "easeOut" }}
           className="relative inline-block mb-4"
        >
            <h1 
                className="text-[150px] md:text-[200px] leading-none font-black opacity-20 select-none"
                style={{ color: '#F97C1B' }}
            >
                404
            </h1>
            <motion.div 
                className="absolute inset-0 flex items-center justify-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
            >
                <span className="text-6xl md:text-8xl">🍳</span>
            </motion.div>
        </motion.div>

        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
        >
            <h2 
                className="text-3xl md:text-5xl font-bold mb-4 font-montserrat transition-colors duration-300"
                style={{ color: isDarkMode ? '#f5f5f5' : '#3B2200' }}
            >
                Nothing to eat here...
            </h2>
            <p 
                className="text-lg md:text-xl opacity-70 mb-8 max-w-lg mx-auto transition-colors duration-300"
                style={{ color: isDarkMode ? '#e0e0e0' : '#3B2200' }}
            >
                The recipe you are looking for seems to have vanished from our kitchen, or maybe it was never here.
            </p>
        </motion.div>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
        >
            <Link href="/"
                className="inline-block px-8 py-4 bg-[#F97C1B] text-white rounded-full font-bold text-lg shadow-lg hover:bg-[#e06b12] hover:shadow-xl transition-all transform hover:-translate-y-1"
                style={{
                    boxShadow: isDarkMode ? '0 10px 20px rgba(249, 124, 27, 0.2)' : '0 10px 20px rgba(59, 34, 0, 0.2)'
                }}
            >
                Return to Kitchen
            </Link>
        </motion.div>
      </div>


      <motion.div 
        className="absolute top-20 left-10 text-4xl opacity-10 rotate-12"
        animate={{ y: [0, 20, 0], rotate: [12, 24, 12] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        🍅
      </motion.div>
      <motion.div 
        className="absolute bottom-20 right-10 text-6xl opacity-10 -rotate-12"
        animate={{ y: [0, -30, 0], rotate: [-12, 0, -12] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        🥬
      </motion.div>
       <motion.div 
        className="absolute top-1/2 right-20 text-5xl opacity-5 rotate-45"
        animate={{ scale: [1, 1.2, 1], rotate: [45, 90, 45] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      >
        🥕
      </motion.div>
    </div>
  );
}

export default Error404;
