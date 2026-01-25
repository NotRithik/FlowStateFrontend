import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const SwissButton: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyle = "font-sans font-black tracking-wide uppercase transition-all duration-300 border border-black flex items-center justify-center";

  const variants = {
    primary: "bg-black text-white hover:bg-swiss-red hover:border-swiss-red",
    secondary: "bg-swiss-red text-white hover:bg-black hover:border-black",
    outline: "bg-transparent text-black hover:bg-black hover:text-white",
  };

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-8 py-4 text-sm",
    lg: "px-10 py-5 text-base md:text-lg",
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const SwissCard: React.FC<{ children: React.ReactNode, className?: string, hover?: boolean }> = ({ children, className = '', hover = false }) => {
  // Check if bg- class is present in className, if so, don't add default bg-white
  const hasBg = className.includes('bg-');
  const bgClass = hasBg ? '' : 'bg-white';

  return (
    <div className={`${bgClass} border border-black p-8 ${hover ? 'hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-shadow duration-300' : ''} ${className}`}>
      {children}
    </div>
  );
};

export const SwissBadge: React.FC<{ children: React.ReactNode, color?: string }> = ({ children, color = 'bg-gray-100' }) => {
  return (
    <span className={`inline-block px-3 py-1 text-xs font-sans font-bold uppercase tracking-wider border border-black ${color}`}>
      {children}
    </span>
  );
};

export const SectionTitle: React.FC<{ children: React.ReactNode, subtitle?: string }> = ({ children, subtitle }) => {
  return (
    <div className="mb-16 border-l-4 border-swiss-red pl-6">
      <h2 className="text-4xl md:text-6xl font-serif italic mb-2">{children}</h2>
      {subtitle && <p className="font-sans font-bold text-gray-400 uppercase tracking-widest text-xs">{subtitle}</p>}
    </div>
  );
};