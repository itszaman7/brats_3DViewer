'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap, Home, Upload, Cpu, Info, ChevronDown } from 'lucide-react';
import { cn } from "@/lib/utils";

const Navbar = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative"
    >
      {/* Glass morphism background */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 backdrop-blur-xl border-b border-white/10" />
      
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/10 to-pink-500/5 animate-pulse" />
      
      {/* Floating particles */}
      {mounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-60"
              style={{
                left: `${10 + i * 12}%`,
                top: `${20 + (i % 3) * 20}%`,
              }}
              animate={{
                y: [-10, 10, -10],
                opacity: [0.3, 0.8, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <motion.div 
            className="flex items-center space-x-3"
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur-lg opacity-20" />
              <div className="relative bg-gradient-to-r from-slate-800 to-slate-700 p-2.5 rounded-xl border border-white/10">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Brain className="w-7 h-7 text-blue-400" />
                </motion.div>
              </div>
            </motion.div>
            
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                BraTS GLI 2024
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                AI-Powered Brain Tumor Segmentation
              </p>
            </div>
          </motion.div>

          {/* Navigation Links */}
          <motion.div 
            className="hidden md:flex items-center space-x-1"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {[
              { icon: Home, label: "Home", href: "#home", color: "blue" },
              { icon: Upload, label: "Upload", href: "#upload", color: "green" },
              { icon: Cpu, label: "AI Demo", href: "#api-demo", color: "purple" },
              { icon: Info, label: "About", href: "#about", color: "pink" }
            ].map((item, index) => (
              <motion.a
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all duration-300 group",
                  "hover:bg-white/5 hover:backdrop-blur-sm border border-transparent hover:border-white/10"
                )}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
              >
                <item.icon className={cn(
                  "w-4 h-4 transition-colors duration-300",
                  item.color === "blue" && "text-blue-400 group-hover:text-blue-300",
                  item.color === "green" && "text-green-400 group-hover:text-green-300",
                  item.color === "purple" && "text-purple-400 group-hover:text-purple-300",
                  item.color === "pink" && "text-pink-400 group-hover:text-pink-300"
                )} />
                <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors duration-300">
                  {item.label}
                </span>
              </motion.a>
            ))}
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <motion.button
              className="relative group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl blur-lg opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2.5 rounded-xl text-white font-medium text-sm border border-white/20 group-hover:border-white/30 transition-all duration-300">
                Get Started
              </div>
            </motion.button>
          </motion.div>
        </div>

        {/* Segmentation Legend */}
        <motion.div 
          className="mt-4 flex items-center justify-center space-x-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className="flex items-center space-x-4 bg-black/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10">
            <span className="text-xs text-slate-400 font-medium">Tumor Types:</span>
            {[
              { label: "Whole Tumor", color: "bg-yellow-400", textColor: "text-yellow-300" },
              { label: "Enhancing", color: "bg-red-400", textColor: "text-red-300" },
              { label: "Core", color: "bg-blue-400", textColor: "text-blue-300" }
            ].map((type, index) => (
              <motion.div
                key={type.label}
                className="flex items-center space-x-1.5"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.3 }}
              >
                <div className={cn("w-2.5 h-2.5 rounded-full", type.color)} />
                <span className={cn("text-xs font-medium", type.textColor)}>
                  {type.label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
