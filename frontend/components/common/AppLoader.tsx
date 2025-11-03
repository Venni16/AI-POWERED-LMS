'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface AppLoaderProps {
  children: React.ReactNode;
}

const AppLoader: React.FC<AppLoaderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  
  // Setting total loading time to 3000 milliseconds (3 seconds)
  const totalLoadingTime = 2500; 

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, totalLoadingTime);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5, delay: 0.2 } }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
              className="flex flex-col items-center w-full max-w-lg p-4"
            >
              
              {/* Book GIF - Smaller size */}
              <img 
                src="/Book.gif" 
                alt="Loading Book" 
                className="w-20 h-20 md:w-24 md:h-24 mb-4 object-contain" 
              />
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="mt-4 text-lg font-semibold text-gray-700 flex items-center"
              >
                <Sparkles className="w-4 h-4 mr-2 text-gray-500" />
                Loading Vortex...
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {!isLoading && (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="w-full h-full"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AppLoader;