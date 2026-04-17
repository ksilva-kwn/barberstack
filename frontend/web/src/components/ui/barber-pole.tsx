// Animated barber pole — CSS-only, no JS
export function BarberPole({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-full ${className}`}
      style={{
        width: 10,
        height: 40,
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: 'inset 0 0 6px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)',
        borderRadius: '999px',
      }}
    >
      {/* Rotating stripes */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `repeating-linear-gradient(
            -45deg,
            #C42B2B 0px,
            #C42B2B 5px,
            #ffffff 5px,
            #ffffff 10px,
            #1A4FA0 10px,
            #1A4FA0 15px,
            #ffffff 15px,
            #ffffff 20px
          )`,
          backgroundSize: '100% 60px',
          animation: 'barber-spin 1.8s linear infinite',
        }}
      />
      {/* Glass sheen */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to right, rgba(255,255,255,0.18) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.15) 100%)',
        borderRadius: 'inherit',
        pointerEvents: 'none',
      }} />
    </div>
  );
}
