import { useEffect, useRef } from 'react';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hue: number;
  scanned: boolean;
  scanProgress: number;
};

type ParticleFieldProps = {
  count?: number;
  intensity?: 'normal' | 'scanning';
  className?: string;
};

export default function ParticleField({
  count = 80,
  intensity = 'normal',
  className,
}: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intensityRef = useRef(intensity);
  const rafRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Scanner position — centered, flows left to right and back
    const scanner = {
      x: width * 0.5,
      y: height * 0.5,
      radius: 0,
      sweep: 0,
    };

    const initParticles = () => {
      const particles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 1.6,
          vy: (Math.random() - 0.5) * 1.6,
          radius: 1.5 + Math.random() * 2,
          hue: 200 + Math.random() * 60,
          scanned: false,
          scanProgress: 0,
        });
      }
      particlesRef.current = particles;
    };
    initParticles();

    const linkDist = 130;
    const scanDist = 180;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const isScanning = intensityRef.current === 'scanning';

      // Update scanner
      scanner.radius = isScanning ? scanDist : 120;
      scanner.sweep += 0.025;
      scanner.x = width * 0.5 + Math.cos(scanner.sweep) * width * 0.15;
      scanner.y = height * 0.5 + Math.sin(scanner.sweep * 0.7) * height * 0.12;

      // Draw scanner ring
      const scanGradient = ctx.createRadialGradient(
        scanner.x, scanner.y, 0,
        scanner.x, scanner.y, scanner.radius,
      );
      scanGradient.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
      scanGradient.addColorStop(0.6, 'rgba(56, 189, 248, 0.04)');
      scanGradient.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = scanGradient;
      ctx.beginPath();
      ctx.arc(scanner.x, scanner.y, scanner.radius, 0, Math.PI * 2);
      ctx.fill();

      // Scanner ring outline
      ctx.strokeStyle = isScanning ? 'rgba(56, 189, 248, 0.35)' : 'rgba(56, 189, 248, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(scanner.x, scanner.y, scanner.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Rotating sweep line
      if (isScanning) {
        const sweepAngle = scanner.sweep * 3;
        const grad = ctx.createLinearGradient(
          scanner.x, scanner.y,
          scanner.x + Math.cos(sweepAngle) * scanner.radius,
          scanner.y + Math.sin(sweepAngle) * scanner.radius,
        );
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.6)');
        grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(scanner.x, scanner.y);
        ctx.lineTo(
          scanner.x + Math.cos(sweepAngle) * scanner.radius,
          scanner.y + Math.sin(sweepAngle) * scanner.radius,
        );
        ctx.stroke();
      }

      const particles = particlesRef.current;

      // Update + draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Gentle flow — slightly biased toward scanner when scanning
        if (isScanning) {
          const dx = scanner.x - p.x;
          const dy = scanner.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < scanner.radius && dist > 10) {
            p.vx += (dx / dist) * 0.06;
            p.vy += (dy / dist) * 0.06;
            p.scanned = true;
            p.scanProgress = Math.min(1, p.scanProgress + 0.02);
          }
        }

        p.x += p.vx;
        p.y += p.vy;

        // Light damping — preserve momentum for faster flow
        p.vx *= 0.995;
        p.vy *= 0.995;

        // Keep some base movement
        if (Math.abs(p.vx) < 0.2) p.vx += (Math.random() - 0.5) * 0.4;
        if (Math.abs(p.vy) < 0.2) p.vy += (Math.random() - 0.5) * 0.4;

        // Wrap edges
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Draw particle
        const alpha = p.scanned ? 0.9 : 0.6;
        const glowR = p.radius * (p.scanned ? 3 : 2);
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
        const hue = p.scanned ? 170 : p.hue;
        glow.addColorStop(0, `hsla(${hue}, 80%, 60%, ${alpha})`);
        glow.addColorStop(1, `hsla(${hue}, 80%, 60%, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `hsla(${hue}, 90%, 75%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw links between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < linkDist) {
            const alpha = (1 - dist / linkDist) * 0.7;
            const bothScanned = a.scanned && b.scanned;
            ctx.strokeStyle = bothScanned
              ? `rgba(110, 231, 183, ${alpha})`
              : `rgba(125, 211, 252, ${alpha * 0.8})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Draw links from scanner to nearby particles when scanning
      if (isScanning) {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const dx = scanner.x - p.x;
          const dy = scanner.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < scanner.radius) {
            const alpha = (1 - dist / scanner.radius) * 0.4;
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(scanner.x, scanner.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
