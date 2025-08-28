'use client';
import React from 'react';

const Navbar = () => {
  return (
    <nav style={{
      backgroundColor: '#1a1a1a',
      color: 'white',
      padding: '1rem',
      textAlign: 'center',
      borderBottom: '1px solid #333'
    }}>
      <h1 style={{ margin: 0, fontSize: '1.5rem' }}>BraTS GLI 2024 Segmentation Viewer</h1>
      <p style={{ margin: '0.5rem 0 0', color: '#aaa' }}>Powered by Next.js, Three.js, and AMI Toolkit</p>
    </nav>
  );
};

export default Navbar;
