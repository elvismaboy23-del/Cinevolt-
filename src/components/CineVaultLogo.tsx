import React from 'react';

interface CineVaultLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export default function CineVaultLogo({
  className = '',
  size = 'md',
  showText = true,
}: CineVaultLogoProps) {
  // Determine dimensions based on size
  const dimensions = {
    sm: { height: 28, width: showText ? 150 : 30 },
    md: { height: 40, width: showText ? 210 : 44 },
    lg: { height: 60, width: showText ? 320 : 66 },
    xl: { height: 110, width: showText ? 500 : 120 },
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${showText ? 520 : 140} 140`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Metallic golden borders */}
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF1BE" />
            <stop offset="35%" stopColor="#DFB33F" />
            <stop offset="70%" stopColor="#B38612" />
            <stop offset="100%" stopColor="#E6C054" />
          </linearGradient>

          {/* Deep vault steel fill */}
          <linearGradient id="shieldFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E3C5F" />
            <stop offset="100%" stopColor="#0B1522" />
          </linearGradient>

          {/* Film strip sweep gradient */}
          <linearGradient id="filmGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1C5E7E" />
            <stop offset="50%" stopColor="#2D8EA7" />
            <stop offset="100%" stopColor="#4FB3CD" />
          </linearGradient>

          {/* Shiny text brand color */}
          <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#00F0FF" />
          </linearGradient>
        </defs>

        {/* --- LEFT SIDE: THE SECURE VAULT SHIELD & FILM STRIP BANNER --- */}
        <g id="logo-emblem">
          {/* 1. Behind/Underlay: Film strip curving up and out from the shield */}
          <path
            d="M 60,65 C 100,50 150,30 220,40 C 235,42 245,50 250,55 C 230,48 180,42 120,62"
            stroke="url(#filmGradient)"
            strokeWidth="35"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.95"
          />
          {/* Sprocket holes along upper edge */}
          <path
            d="M 72,52 C 108,39 152,24 216,36"
            stroke="#07111C"
            strokeWidth="3"
            strokeDasharray="4,6"
          />
          {/* Sprocket holes along lower edge */}
          <path
            d="M 88,68 C 122,57 165,42 224,44"
            stroke="#07111C"
            strokeWidth="3"
            strokeDasharray="4,6"
          />
          {/* Film frame division stripes */}
          <path
            d="M 105,52 L 102,68 M 135,46 L 132,62 M 165,42 L 162,58 M 195,38 L 192,54 M 225,38 L 222,52"
            stroke="#07111C"
            strokeWidth="2.5"
            opacity="0.8"
          />

          {/* 2. Primary Shield Body */}
          {/* Exterior golden-metallic border frame */}
          <path
            d="M 20,44 L 65,28 L 110,44 C 110,88 85,116 65,125 C 45,116 20,88 20,44 Z"
            fill="url(#goldGradient)"
          />
          {/* Shield face inner inlay */}
          <path
            d="M 24,47 L 65,32 L 106,47 C 106,87 82,112 65,120 C 48,112 24,87 24,47 Z"
            fill="url(#shieldFill)"
          />

          {/* 3. The Secure Vault Safe Dial inside shield */}
          {/* Inner wheel track */}
          <circle cx="65" cy="72" r="24" fill="#0E1E2E" stroke="url(#goldGradient)" strokeWidth="1.5" />
          <circle cx="65" cy="72" r="18" fill="none" stroke="#2D8EA7" strokeWidth="2.5" strokeDasharray="6,4" />
          
          {/* Vault dial central core nose */}
          <circle cx="65" cy="72" r="7" fill="url(#goldGradient)" />
          <circle cx="65" cy="72" r="3" fill="#091119" />

          {/* Dial lock spokes/handles */}
          <path
            d="M 65,48 L 65,58 
               M 65,86 L 65,96 
               M 41,72 L 51,72 
               M 79,72 L 89,72 
               M 48,55 L 55,62 
               M 75,82 L 82,89 
               M 48,89 L 55,82 
               M 75,55 L 82,62"
            stroke="url(#goldGradient)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </g>

        {/* --- RIGHT SIDE: THE EXQUISITE BRAND TYPOGRAPHY --- */}
        {showText && (
          <g id="logo-text">
            {/* "cinevault" text in highly elegant display format */}
            <text
              x="265"
              y="74"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="56"
              fill="white"
              letterSpacing="-2"
            >
              cine
              <tspan fill="#3CBBD8">v</tspan>
              <tspan fill="#4FB3CD">a</tspan>
              <tspan fill="#00F0FF">u</tspan>
              lt
            </text>

            {/* "MOVIE MARKET" stylized tag */}
            <text
              x="270"
              y="108"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="800"
              fontSize="22"
              fill="#00F0FF"
              letterSpacing="7"
              opacity="0.9"
            >
              MOVIE MARKET
            </text>
            
            {/* Small golden decorator dot matching the main asset visual color */}
            <circle cx="515" cy="100" r="3" fill="url(#goldGradient)" />
          </g>
        )}
      </svg>
    </div>
  );
}
