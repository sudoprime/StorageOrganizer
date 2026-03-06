function HoardLogo({ size = 'default', className = '' }) {
  const dims = size === 'lg' ? { w: 40, h: 40, text: 'text-3xl' }
    : size === 'sm' ? { w: 20, h: 20, text: 'text-sm' }
    : { w: 24, h: 24, text: 'text-lg' };

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={dims.w}
        height={dims.h}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer box - rounded container */}
        <rect
          x="4" y="6" width="40" height="36" rx="4"
          stroke="currentColor" strokeWidth="2.5" className="text-orange-500"
        />
        {/* Middle shelf */}
        <line x1="4" y1="22" x2="44" y2="22" stroke="currentColor" strokeWidth="2" className="text-orange-500" />
        {/* Vertical divider top */}
        <line x1="24" y1="6" x2="24" y2="22" stroke="currentColor" strokeWidth="2" className="text-orange-400/70" />
        {/* Bottom shelf */}
        <line x1="4" y1="32" x2="44" y2="32" stroke="currentColor" strokeWidth="2" className="text-orange-500" />
        {/* Small box top-left */}
        <rect x="9" y="11" width="10" height="7" rx="1.5" fill="currentColor" className="text-orange-500/40" />
        {/* Small box top-right */}
        <rect x="29" y="11" width="10" height="7" rx="1.5" fill="currentColor" className="text-orange-500/40" />
        {/* Wide box middle */}
        <rect x="9" y="24" width="26" height="5" rx="1.5" fill="currentColor" className="text-orange-500/30" />
        {/* Small box bottom */}
        <rect x="9" y="34" width="14" height="5" rx="1.5" fill="currentColor" className="text-orange-500/40" />
      </svg>
      <span
        className={`${dims.text} font-black tracking-tight text-orange-500`}
        style={{ fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif", letterSpacing: '-0.04em' }}
      >
        HOARD
      </span>
    </span>
  );
}

export default HoardLogo;
