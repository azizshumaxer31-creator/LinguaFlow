import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  isActive: boolean;
  color?: string;
}

const Visualizer: React.FC<VisualizerProps> = ({ isActive, color = "#60A5FA" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    let t = 0;

    const render = () => {
      t += 0.1;
      
      // Clear with slight fade for trail effect if desired, but here we just clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (!isActive) {
        // Draw a static circle or "breathing" idle state
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 30 + Math.sin(t * 0.5) * 2;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = `${color}40`; // Low opacity
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        animationId = requestAnimationFrame(render);
        return;
      }

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const numBars = 30;
      const radius = 50;

      for (let i = 0; i < numBars; i++) {
        const angle = (i / numBars) * Math.PI * 2;
        // Simulate frequency data with sine waves for aesthetic visualization
        // In a real production app, we would hook into the AnalyserNode
        const noise = Math.sin(t * 2 + i) * Math.cos(t * 0.5 + i * 2);
        const barHeight = 20 + Math.abs(noise) * 60; 

        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius + barHeight);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isActive, color]);

  return (
    <canvas 
      ref={canvasRef} 
      width={400} 
      height={300} 
      className="w-full h-full max-w-[400px] max-h-[300px]"
    />
  );
};

export default Visualizer;
