import React from 'react';

interface LogoProps {
  className?: string;
  style?: React.CSSProperties;
  width?: number;
  height?: number;
}

const Logo: React.FC<LogoProps> = ({ className = '', style, width = 32, height = 32 }) => {
  return (
    <div className={`relative inline-block ${className}`} style={style}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={width} 
        height={height} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="transition-all duration-200 hover:scale-105"
      >
        <circle cx="12" cy="12" r="1"/>
        <path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/>
        <path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"/>
      </svg>
    </div>
  );
};

export default Logo;
