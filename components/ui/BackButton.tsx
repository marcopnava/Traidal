import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
// import { motion } from 'framer-motion'; // Temporarily disabled to fix build issue

interface BackButtonProps {
  to?: string;
  label?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ to, label = 'Back' }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
    >
      <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
      <span className="font-medium">{label}</span>
    </button>
  );
};

