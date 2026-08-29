export default function SpinnerBars({
   bars = 3,
   barWidth = 6, // px
   minHeight = 6, // px
   maxHeight = 20, // px
   gap = 4, // px
   duration = 0.8, // seconds
   color = 'currentColor',
   className = '',
}) {
   const delayStep = duration * 0.25;

   return (
      <>
         <style>{`
        @keyframes spinner-bars-anim {
          0%, 100% { height: ${minHeight}px; }
          50% { height: ${maxHeight}px; }
        }
      `}</style>
         <div
            className={`flex items-end ${className}`}
            style={{ gap: `${gap}px`, height: `${maxHeight}px` }}
            role="status"
            aria-label="Loading"
         >
            {Array.from({ length: bars }).map((_, i) => (
               <span
                  key={i}
                  className="rounded-sm"
                  style={{
                     width: `${barWidth}px`,
                     height: `${minHeight}px`,
                     backgroundColor: color,
                     animation: `spinner-bars-anim ${duration}s ease-in-out infinite`,
                     animationDelay: `${i * delayStep}s`,
                  }}
               />
            ))}
         </div>
      </>
   );
}
