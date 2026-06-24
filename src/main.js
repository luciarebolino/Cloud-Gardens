import './styles.css';

const cloudCanvas = document.querySelector('#three');
const cloudCtx = cloudCanvas.getContext('2d', { alpha: false });
const asciiCanvas = document.querySelector('#ascii');
const asciiCtx = asciiCanvas.getContext('2d', { alpha: true });
const modeToggle = document.querySelector('.mode-toggle');

const vaporCount = 560;
const mistCount = 4600;
const gardenCount = 2900;
const vapor = [];
const mist = [];
const garden = [];

let width = 1;
let height = 1;
let dpr = 1;
let asciiActive = false;
let asciiAmount = 0;

function random(seed) {
  const value = Math.sin(seed * 127.1) * 43758.5453123;
  return value - Math.floor(value);
}

function seedScene() {
  vapor.length = 0;
  mist.length = 0;
  garden.length = 0;

  const lobes = [
    { x: 0.16, y: 0.51, rx: 0.18, ry: 0.048, weight: 0.13 },
    { x: 0.31, y: 0.49, rx: 0.23, ry: 0.060, weight: 0.21 },
    { x: 0.50, y: 0.485, rx: 0.28, ry: 0.065, weight: 0.28 },
    { x: 0.69, y: 0.50, rx: 0.24, ry: 0.058, weight: 0.22 },
    { x: 0.86, y: 0.52, rx: 0.20, ry: 0.048, weight: 0.16 }
  ];

  for (let i = 0; i < vaporCount; i++) {
    const pick = random(i * 3.1);
    let acc = 0;
    let lobe = lobes[0];
    for (const option of lobes) {
      acc += option.weight;
      if (pick <= acc) {
        lobe = option;
        break;
      }
    }
    const angle = random(i * 8.3) * Math.PI * 2;
    const radius = Math.pow(random(i * 11.7), 0.72);
    vapor.push({
      x: lobe.x + Math.cos(angle) * radius * lobe.rx,
      y: lobe.y + Math.sin(angle) * radius * lobe.ry,
      r: 0.040 + random(i * 5.6) * 0.095,
      a: 0.040 + random(i * 7.8) * 0.080,
      seed: random(i * 19.3) * Math.PI * 2
    });
  }

  for (let i = 0; i < mistCount; i++) {
    const t = random(i * 2.7);
    const edge = Math.pow(random(i * 5.9), 0.55);
    const angle = random(i * 10.4) * Math.PI * 2;
    mist.push({
      x: 0.04 + t * 0.92 + Math.cos(angle) * edge * 0.035,
      y: 0.505 + Math.sin(angle) * edge * 0.078 + (random(i * 13.5) - 0.5) * 0.020,
      a: 0.035 + random(i * 17.1) * 0.13,
      s: 0.75 + random(i * 21.2) * 1.35,
      seed: random(i * 31.4) * Math.PI * 2
    });
  }

  for (let i = 0; i < gardenCount; i++) {
    const sourceIndex = Math.floor(random(i * 6.4) * mist.length);
    const source = mist[sourceIndex];
    garden.push({
      sourceIndex,
      ox: (random(i * 8.2) - 0.5) * 0.070,
      depth: random(i * 9.7),
      x: 0.5 + (source.x - 0.5) * 0.76,
      y: 0.72,
      a: 0.035 + source.a * 0.75,
      s: 0.65 + random(i * 12.3) * 1.25,
      seed: random(i * 15.1) * Math.PI * 2
    });
  }
}

function flowX(x, y, seed, time, strength = 1) {
  return (
    Math.sin(time * 0.30 + seed + y * 9.5) * 0.020 +
    Math.sin(time * 0.19 + seed * 1.7 + x * 15.0) * 0.014 +
    Math.cos(time * 0.42 + seed * 0.6 + (x + y) * 10.0) * 0.008
  ) * strength;
}

function flowY(x, y, seed, time, strength = 1) {
  return (
    Math.cos(time * 0.24 + seed * 1.3 + x * 7.0) * 0.016 +
    Math.sin(time * 0.39 + seed * 0.9 + y * 13.0) * 0.012
  ) * strength;
}

function currentMistPosition(index, time) {
  const particle = mist[index];
  const wind = Math.sin(time * 0.11 + particle.seed * 0.25) * 0.016 + time * 0.004;
  return {
    x: particle.x + wind + flowX(particle.x, particle.y, particle.seed, time, 1.0),
    y: particle.y + flowY(particle.x, particle.y, particle.seed, time, 0.96)
  };
}

function projectGardenParticle(particle, time) {
  const source = currentMistPosition(particle.sourceIndex, time);
  const depth = Math.pow(particle.depth, 1.85);
  const horizon = 0.61;
  const groundY = horizon + depth * 0.36 + Math.sin(time * 0.12 + particle.seed) * 0.004;
  const perspectiveScale = 0.18 + depth * 0.86;
  const mirrorX = 0.5 + (source.x - 0.5) * perspectiveScale + particle.ox * perspectiveScale;
  return {
    x: mirrorX,
    y: groundY,
    depth
  };
}

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio, 1.5);

  for (const canvas of [cloudCanvas, asciiCanvas]) {
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }

  cloudCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  asciiCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawBackground(time) {
  const gradient = cloudCtx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#171717');
  gradient.addColorStop(0.42, '#111111');
  gradient.addColorStop(0.62, '#0a0a0a');
  gradient.addColorStop(1, '#020202');
  cloudCtx.fillStyle = gradient;
  cloudCtx.fillRect(0, 0, width, height);

  const horizonGlow = cloudCtx.createRadialGradient(
    width * 0.50,
    height * 0.58,
    0,
    width * 0.50,
    height * 0.58,
    width * 0.70
  );
  horizonGlow.addColorStop(0, 'rgba(190,190,184,0.20)');
  horizonGlow.addColorStop(0.36, 'rgba(110,110,108,0.10)');
  horizonGlow.addColorStop(1, 'rgba(0,0,0,0)');
  cloudCtx.fillStyle = horizonGlow;
  cloudCtx.fillRect(0, 0, width, height);

  cloudCtx.globalAlpha = 0.16;
  cloudCtx.fillStyle = '#ffffff';
  for (let i = 0; i < 900; i++) {
    const x = random(i * 3.4) * width;
    const y = random(i * 5.7 + Math.floor(time * 2)) * height;
    cloudCtx.fillRect(x, y, 0.75, 0.75);
  }
  cloudCtx.globalAlpha = 1;
}

function drawTerrain(time) {
  const horizon = height * 0.61;
  const terrain = cloudCtx.createLinearGradient(0, horizon, 0, height);
  terrain.addColorStop(0, 'rgba(150,150,145,0.20)');
  terrain.addColorStop(0.26, 'rgba(110,110,106,0.18)');
  terrain.addColorStop(1, 'rgba(52,52,50,0.34)');
  cloudCtx.fillStyle = terrain;
  cloudCtx.fillRect(0, horizon, width, height - horizon);

  cloudCtx.save();
  cloudCtx.globalAlpha = 0.32;
  cloudCtx.strokeStyle = 'rgba(210,210,202,0.22)';
  cloudCtx.lineWidth = 1;
  for (let i = 0; i < 24; i++) {
    const t = i / 23;
    const y = horizon + Math.pow(t, 1.9) * (height - horizon);
    cloudCtx.beginPath();
    for (let x = 0; x <= width; x += 28) {
      const wave =
        Math.sin(x * 0.012 + time * 0.45 + i * 0.7) * (2 + t * 10) +
        Math.sin(x * 0.027 - time * 0.28 + i) * (1 + t * 6);
      if (x === 0) {
        cloudCtx.moveTo(x, y + wave);
      } else {
        cloudCtx.lineTo(x, y + wave);
      }
    }
    cloudCtx.stroke();
  }

  cloudCtx.globalAlpha = 0.22;
  for (let i = 0; i < 18; i++) {
    const x0 = width * 0.5 + (i - 8.5) * width * 0.045;
    cloudCtx.beginPath();
    cloudCtx.moveTo(width * 0.5, horizon);
    cloudCtx.lineTo(x0, height);
    cloudCtx.stroke();
  }
  cloudCtx.restore();
}

function drawVapor(time) {
  cloudCtx.save();
  cloudCtx.globalCompositeOperation = 'lighter';

  for (const particle of vapor) {
    const wobble = 0.86 + Math.sin(time * 0.36 + particle.seed) * 0.14;
    const wind = Math.sin(time * 0.10 + particle.seed * 0.2) * 0.018 + time * 0.004;
    const x = (particle.x + wind + flowX(particle.x, particle.y, particle.seed, time, 1.06)) * width;
    const y = (particle.y + flowY(particle.x, particle.y, particle.seed, time, 1.02)) * height;
    const r = particle.r * width * wobble;
    const pulse = 0.88 + Math.sin(time * 0.28 + particle.seed * 1.7) * 0.22;
    const gradient = cloudCtx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, `rgba(238,238,232,${particle.a * 1.45 * pulse})`);
    gradient.addColorStop(0.38, `rgba(198,198,192,${particle.a * 0.62 * pulse})`);
    gradient.addColorStop(0.74, `rgba(120,120,116,${particle.a * 0.18 * pulse})`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    cloudCtx.fillStyle = gradient;
    cloudCtx.beginPath();
    cloudCtx.arc(x, y, r, 0, Math.PI * 2);
    cloudCtx.fill();
  }

  cloudCtx.fillStyle = 'rgba(230,230,225,0.22)';
  for (let i = 0; i < mist.length; i++) {
    const particle = mist[i];
    const position = currentMistPosition(i, time);
    const x = position.x * width;
    const y = position.y * height;
    cloudCtx.globalAlpha = particle.a * (0.62 + Math.sin(time * 0.52 + particle.seed) * 0.30);
    cloudCtx.fillRect(x, y, particle.s, particle.s);
  }

  cloudCtx.restore();
  cloudCtx.globalAlpha = 1;

  cloudCtx.save();
  cloudCtx.globalCompositeOperation = 'multiply';
  const shadowA = cloudCtx.createRadialGradient(
    width * 0.50,
    height * 0.405,
    0,
    width * 0.50,
    height * 0.405,
    width * 0.30
  );
  shadowA.addColorStop(0, 'rgba(0,0,0,0.34)');
  shadowA.addColorStop(0.36, 'rgba(0,0,0,0.18)');
  shadowA.addColorStop(1, 'rgba(0,0,0,0)');
  cloudCtx.fillStyle = shadowA;
  cloudCtx.fillRect(0, 0, width, height);

  const underside = cloudCtx.createLinearGradient(0, height * 0.43, 0, height * 0.62);
  underside.addColorStop(0, 'rgba(0,0,0,0)');
  underside.addColorStop(1, 'rgba(0,0,0,0.36)');
  cloudCtx.fillStyle = underside;
  cloudCtx.fillRect(0, height * 0.39, width, height * 0.25);
  cloudCtx.restore();
}

function drawGarden(time) {
  cloudCtx.save();
  cloudCtx.globalCompositeOperation = 'lighter';
  cloudCtx.fillStyle = 'rgba(200,205,196,0.26)';
  for (const particle of garden) {
    const projected = projectGardenParticle(particle, time);
    const x = projected.x * width;
    const y = projected.y * height;
    const size = particle.s * (0.55 + projected.depth * 1.9);
    cloudCtx.globalAlpha = particle.a * (0.34 + projected.depth * 0.92);
    cloudCtx.fillRect(x, y, size, size);
  }
  cloudCtx.restore();
  cloudCtx.globalAlpha = 1;
}

function drawAscii(time) {
  asciiCtx.clearRect(0, 0, width, height);
  if (asciiAmount <= 0.01) {
    return;
  }

  asciiCtx.save();
  asciiCtx.globalAlpha = asciiAmount * 0.9;
  asciiCtx.font = '600 12px "IBM Plex Mono", "Courier New", monospace';
  asciiCtx.textAlign = 'center';
  asciiCtx.textBaseline = 'middle';
  const glyphs = ['+', '.', ':', '*', 'o', '1', 'w'];
  for (let i = 0; i < garden.length; i += 1) {
    const particle = garden[i];
    const projected = projectGardenParticle(particle, time);
    const x = projected.x * width;
    const y = projected.y * height;
    const glyph = glyphs[Math.floor(random(i * 3.3) * glyphs.length)];
    const size = 8 + projected.depth * 8;
    asciiCtx.font = `600 ${size}px "IBM Plex Mono", "Courier New", monospace`;
    asciiCtx.fillStyle = `rgba(42,160,92,${0.08 + particle.a * (1.3 + projected.depth * 2.4)})`;
    asciiCtx.fillText(glyph, x, y);
  }

  asciiCtx.restore();
}

function animate(timeMs) {
  const time = timeMs / 1000;
  asciiAmount += ((asciiActive ? 1 : 0) - asciiAmount) * 0.08;

  drawBackground(time);
  drawTerrain(time);
  drawGarden(time);
  drawVapor(time);
  drawAscii(time);
  requestAnimationFrame(animate);
}

function setAsciiActive(active) {
  asciiActive = active;
  modeToggle.setAttribute('aria-pressed', String(asciiActive));
  modeToggle.textContent = asciiActive ? 'hide ascii' : 'activate ascii';
}

modeToggle.addEventListener('pointerdown', event => {
  event.preventDefault();
  setAsciiActive(!asciiActive);
});
modeToggle.addEventListener('click', event => {
  event.preventDefault();
});
window.addEventListener('resize', resize);

seedScene();
resize();
requestAnimationFrame(animate);
