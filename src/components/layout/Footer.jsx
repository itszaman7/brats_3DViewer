'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Github, Globe } from 'lucide-react';
import { cn } from "@/lib/utils";

const Footer = () => {
  return (
    <motion.footer 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className={cn(
        "bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900",
        "border-t border-purple-500/20 backdrop-blur-sm",
        "px-6 py-4 relative overflow-hidden"
      )}
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 via-transparent to-blue-900/10" />
      
      <div className="relative z-10 flex flex-col items-center space-y-3">
        <motion.div 
          className="flex items-center space-x-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <motion.a
            href="https://github.com"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 bg-purple-600/20 rounded-full backdrop-blur-sm hover:bg-purple-600/40 transition-colors"
          >
            <Github className="w-5 h-5 text-purple-400" />
          </motion.a>
          
          <motion.a
            href="https://www.synapse.org/Synapse:syn53708126"
            whileHover={{ scale: 1.1, rotate: -5 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 bg-blue-600/20 rounded-full backdrop-blur-sm hover:bg-blue-600/40 transition-colors"
          >
            <Globe className="w-5 h-5 text-blue-400" />
          </motion.a>
        </motion.div>
        
        <motion.div 
          className="flex items-center space-x-2 text-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <span className="text-slate-400">© 2024 Brain Tumor Segmentation Challenge</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">Made with</span>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Heart className="w-4 h-4 text-red-400 fill-current" />
          </motion.div>
          <span className="text-slate-400">for medical AI</span>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="text-xs text-slate-500 text-center max-w-md"
        >
          This tool is designed for research and educational purposes in medical image analysis
        </motion.div>
      </div>
    </motion.footer>
  );
};

export default Footer;
