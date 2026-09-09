import { useEffect } from 'react';

/**
 * Real-time animated canvas-based gyroscopic favicon for Noesis.
 * Uses the exact monochromatic metallic silver & pure white neural gyroscopic theme
 * with the central Brain icon and revolving sub-moons matching the Chat and Login pages.
 */
export function useAnimatedFavicon() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const canvas = document.createElement('canvas');
    const size = 64; // High-DPI canvas
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.type = 'image/png';
      link.rel = 'shortcut icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }

    let animationFrameId: number;
    let isTabVisible = !document.hidden;
    let lastRenderTime = 0;
    const FPS = 25;
    const frameInterval = 1000 / FPS;

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        lastRenderTime = performance.now();
        animationFrameId = requestAnimationFrame(render);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const cx = size / 2;
    const cy = size / 2;
    const rx = 24;
    const ry = 8.5;

    // 4 orbital planes matching exact speeds and angles from ChatStudio.css & AuthModal.css
    const TWO_PI = Math.PI * 2;
    const orbits = [
      { tilt: 0, speed: TWO_PI / 10000, moonSpeed: TWO_PI / 2500 },                // 10s Equatorial
      { tilt: (45 * Math.PI) / 180, speed: TWO_PI / 7500, moonSpeed: TWO_PI / 1900 }, // 7.5s +45° Tilted
      { tilt: (-45 * Math.PI) / 180, speed: -TWO_PI / 8800, moonSpeed: -TWO_PI / 2200 },// 8.8s -45° Tilted (reverse)
      { tilt: (90 * Math.PI) / 180, speed: TWO_PI / 6200, moonSpeed: TWO_PI / 1600 }  // 6.2s 90° Polar
    ];

    const render = (currentTime: number) => {
      if (!isTabVisible) return;

      const delta = currentTime - lastRenderTime;
      if (delta < frameInterval) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      lastRenderTime = currentTime - (delta % frameInterval);

      // Clear canvas
      ctx.clearRect(0, 0, size, size);

      // 1. Ambient soft background aura
      const ambient = ctx.createRadialGradient(cx, cy, 2, cx, cy, 26);
      ambient.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
      ambient.addColorStop(0.5, 'rgba(255, 255, 255, 0.04)');
      ambient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = ambient;
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, TWO_PI);
      ctx.fill();

      // 2. Draw 4 Orbit Rings (Crisp Dotted White, identical to Chat and Login page)
      orbits.forEach(orb => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(orb.tilt);

        // Subtle soft glow behind ring
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, TWO_PI);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2.0;
        ctx.setLineDash([]);
        ctx.stroke();

        // Crisp dotted ring line
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, TWO_PI);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.1;
        ctx.setLineDash([2, 2.5]);
        ctx.stroke();

        ctx.restore();
      });

      // 3. Central Volumetric Metallic Sphere
      const sphereRadius = 8.5;

      // Outer shadow & soft glow
      ctx.save();
      ctx.shadowColor = 'rgba(255, 255, 255, 0.35)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, sphereRadius, 0, TWO_PI);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.restore();

      // Metallic Gradient Sphere: #ffffff -> #9ca3af -> #374151 -> #0f172a
      const sphereGrad = ctx.createRadialGradient(cx - 2.5, cy - 2.5, 0.5, cx, cy, sphereRadius);
      sphereGrad.addColorStop(0, '#ffffff');
      sphereGrad.addColorStop(0.35, '#9ca3af');
      sphereGrad.addColorStop(0.7, '#374151');
      sphereGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, sphereRadius, 0, TWO_PI);
      ctx.fill();

      // Highlight rim border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // White Brain icon in the center
      ctx.save();
      ctx.translate(cx - 4.5, cy - 4.5);
      ctx.scale(0.38, 0.38);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      // Left hemisphere
      ctx.moveTo(12, 5);
      ctx.bezierCurveTo(9, 5, 6, 7, 6, 11);
      ctx.bezierCurveTo(6, 14, 8, 16, 12, 19);
      // Right hemisphere
      ctx.moveTo(12, 5);
      ctx.bezierCurveTo(15, 5, 18, 7, 18, 11);
      ctx.bezierCurveTo(18, 14, 16, 16, 12, 19);
      // Center folds
      ctx.moveTo(12, 5);
      ctx.lineTo(12, 19);
      ctx.stroke();
      ctx.restore();

      // 4. Draw Orbiting White Planets and Sub-Moons
      orbits.forEach(orb => {
        const theta = currentTime * orb.speed;
        const localX = rx * Math.cos(theta);
        const localY = ry * Math.sin(theta);

        const cosT = Math.cos(orb.tilt);
        const sinT = Math.sin(orb.tilt);
        const px = cx + localX * cosT - localY * sinT;
        const py = cy + localX * sinT + localY * cosT;

        // Depth scaling based on orbit position
        const depth = Math.sin(theta);
        const scale = 0.9 + depth * 0.2;
        const pRadius = 2.8 * scale;

        // Planet Glow & Body (Pure White #ffffff)
        ctx.save();
        ctx.shadowColor = 'rgba(255, 255, 255, 1)';
        ctx.shadowBlur = 7;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px, py, pRadius, 0, TWO_PI);
        ctx.fill();
        ctx.restore();

        // Sub-Moon Orbiting Around Planet
        const moonTheta = currentTime * orb.moonSpeed;
        const moonDist = 5.2 * scale;
        const mx = px + moonDist * Math.cos(moonTheta);
        const my = py + (moonDist * 0.6) * Math.sin(moonTheta);

        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(mx, my, 1.2 * scale, 0, TWO_PI);
        ctx.fill();
        ctx.restore();
      });

      // Update favicon link href
      if (link) {
        link.type = 'image/png';
        link.href = canvas.toDataURL('image/png');
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
