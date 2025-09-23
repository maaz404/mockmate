import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const DarkModeToggle = ({ className = '' }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative p-2 rounded-lg transition-all duration-200 
        bg-surface-200 dark:bg-surface-700 
        hover:bg-surface-300 dark:hover:bg-surface-600
        focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 
        focus:ring-offset-surface-50 dark:focus:ring-offset-surface-900
        ${className}
      `}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative w-5 h-5">
        <Sun 
          className={`
            absolute inset-0 w-5 h-5 transition-all duration-200 text-orange-600 dark:text-orange-400
            ${isDarkMode ? 'scale-0 rotate-90' : 'scale-100 rotate-0'}
          `}
        />
        <Moon 
          className={`
            absolute inset-0 w-5 h-5 transition-all duration-200 text-surface-600 dark:text-surface-300
            ${isDarkMode ? 'scale-100 rotate-0' : 'scale-0 -rotate-90'}
          `}
        />
      </div>
    </button>
  );
};

export default DarkModeToggle;