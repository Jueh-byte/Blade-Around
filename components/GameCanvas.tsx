import React, { useRef, useEffect, useCallback } from 'react';
import { Player, Enemy, Gem, Particle, DamageText, Position, EnemyType, Pickup, PickupType } from '../types';

// --- Audio System (Synthesizer) ---
const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

const playSound = (type: 'hit' | 'swing' | 'levelUp' | 'roar' | 'pickup' | 'deflect' | 'spawn') => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  if (type === 'hit') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'swing') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  } else if (type === 'roar') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.linearRampToValueAtTime(50, now + 0.8);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.8);
    osc.start(now);
    osc.stop(now + 0.8);
  } else if (type === 'pickup') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'deflect') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    osc.start(now);
    osc.stop(now + 0.05);
  } else if (type === 'levelUp') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(554, now + 0.1);
    osc.frequency.setValueAtTime(659, now + 0.2);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.6);
    osc.start(now);
    osc.stop(now + 0.6);
  }
};

// --- Jiumozhi SVG Data URI ---
const JIUMOZHI_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<circle cx="50" cy="50" r="48" fill="%23fca5a5" stroke="%23b91c1c" stroke-width="2"/>
<path d="M15,55 Q50,20 85,55" fill="none" stroke="%23fbbf24" stroke-width="6"/>
<path d="M20,90 Q50,115 80,90 L85,55 L15,55 Z" fill="%23b91c1c"/>
<circle cx="50" cy="40" r="25" fill="%23fca5a5"/>
<path d="M25,32 Q35,20 45,32" fill="none" stroke="black" stroke-width="3"/>
<path d="M55,32 Q65,20 75,32" fill="none" stroke="black" stroke-width="3"/>
<circle cx="38" cy="40" r="4" fill="black"/>
<circle cx="62" cy="40" r="4" fill="black"/>
<path d="M40,55 Q50,60 60,55" fill="none" stroke="black" stroke-width="2"/>
<circle cx="50" cy="18" r="6" fill="%231f2937"/>
<circle cx="50" cy="12" r="4" fill="%231f2937"/>
</svg>`;

interface GameCanvasProps {
  isPlaying: boolean;
  onGameOver: (stats: { score: number; level: number }) => void;
  onUpdateStats: (hp: number, maxHp: number, mp: number, maxMp: number, xp: number, level: number, score: number, combo: number) => void;
  joystickInput: { x: number; y: number };
  triggerSkill: boolean;
  onSkillUsed: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ isPlaying, onGameOver, onUpdateStats, joystickInput, triggerSkill, onSkillUsed }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0); // Store last frame timestamp properly
  const scoreRef = useRef(0);
  const timeRef = useRef(0); // Total game time
  const playerImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = JIUMOZHI_SVG;
    playerImageRef.current = img;
  }, []);
  
  const playerRef = useRef<Player>({
    id: 'player',
    x: 0,
    y: 0,
    radius: 30,
    type: 'player',
    hp: 100,
    maxHp: 100,
    mp: 100,
    maxMp: 100,
    xp: 0,
    level: 1,
    speed: 200, // Pixels per second
    bladeCount: 1,
    bladeSpeed: 3.5, // Radians per second
    bladeDamage: 35,
    bladeSize: 60,
    combo: 0,
    comboTimer: 0,
  });

  const enemiesRef = useRef<Enemy[]>([]);
  const gemsRef = useRef<Gem[]>([]);
  const pickupsRef = useRef<Pickup[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const damageTextsRef = useRef<DamageText[]>([]);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const bladeAngleRef = useRef(0);
  const cameraRef = useRef<Position>({ x: 0, y: 0 });
  const lastSpawnTime = useRef(0);
  const roarEffectRef = useRef({ active: false, radius: 0, alpha: 0 });

  const SPAWN_RATE = 500; // ms
  const COMBO_WINDOW = 3.0; // seconds

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const spawnEnemy = useCallback((canvasWidth: number, canvasHeight: number) => {
    const p = playerRef.current;
    const angle = Math.random() * Math.PI * 2;
    // Spawn slightly closer so user sees them immediately
    const dist = (Math.min(canvasWidth, canvasHeight) / 2) + 100;
    
    const x = p.x + Math.cos(angle) * dist;
    const y = p.y + Math.sin(angle) * dist;
    
    const rand = Math.random();
    let type = EnemyType.NORMAL;
    let radius = 22;
    let hp = 40 + (scoreRef.current * 0.2);
    let speed = 100; // px per second
    let sprite = '🥷'; // Ninja
    let damage = 10;

    if (rand > 0.9) {
      type = EnemyType.TANK;
      radius = 35;
      hp = 150 + (scoreRef.current * 0.5);
      speed = 60;
      sprite = '👹'; // Oni
      damage = 20;
    } else if (rand > 0.75) {
      type = EnemyType.FAST;
      radius = 18;
      hp = 25 + (scoreRef.current * 0.1);
      speed = 180;
      sprite = '👺'; // Goblin
      damage = 5;
    }

    enemiesRef.current.push({
      id: Math.random().toString(),
      x,
      y,
      radius,
      type: 'enemy',
      enemyType: type,
      hp,
      maxHp: hp,
      speed,
      damage,
      sprite,
      stunned: 0,
    });
  }, []);

  const spawnPickup = (x: number, y: number) => {
    const rand = Math.random();
    // Increased drop rate for fun
    if (rand > 0.2) return; 

    let type = PickupType.HEAL;
    if (rand < 0.05) type = PickupType.BLADE_UP;
    else if (rand < 0.1) type = PickupType.POWER_UP;

    pickupsRef.current.push({
      id: Math.random().toString(),
      x,
      y,
      radius: 20,
      type: 'pickup',
      pickupType: type,
      life: 30.0,
    });
  };

  const createExplosion = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        id: Math.random().toString(),
        x,
        y,
        radius: Math.random() * 4 + 2,
        type: 'particle',
        vx: (Math.random() - 0.5) * 300, // Velocity in px/sec
        vy: (Math.random() - 0.5) * 300,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1.0,
        color: color,
      });
    }
  };

  const showDamage = (x: number, y: number, value: number | string, isCrit: boolean = false) => {
    damageTextsRef.current.push({
      id: Math.random().toString(),
      x: x + (Math.random() * 40 - 20),
      y: y - 30,
      value,
      life: 1.0,
      opacity: 1.0,
      color: isCrit ? '#fbbf24' : '#ffffff',
    });
  };

  const activateLionsRoar = () => {
    const p = playerRef.current;
    if (p.mp < 30) return; 

    p.mp -= 30;
    playSound('roar');
    roarEffectRef.current = { active: true, radius: 0, alpha: 1.0 };
    
    const range = 400;
    enemiesRef.current.forEach(e => {
      const dist = Math.hypot(e.x - p.x, e.y - p.y);
      if (dist < range) {
        e.stunned = 3.0;
        showDamage(e.x, e.y, "⛔", true);
        const angle = Math.atan2(e.y - p.y, e.x - p.x);
        e.x += Math.cos(angle) * 150;
        e.y += Math.sin(angle) * 150;
      }
    });
    onSkillUsed();
  };

  // --- Main Update Logic ---
  const update = useCallback((deltaTime: number, width: number, height: number) => {
    if (!isPlaying) return;

    const p = playerRef.current;
    const dtSec = deltaTime / 1000; // Convert ms to seconds
    timeRef.current += deltaTime;

    // 1. Skill / MP
    if (p.mp < p.maxMp) p.mp += 5 * dtSec;
    if (triggerSkill) activateLionsRoar();

    if (roarEffectRef.current.active) {
      roarEffectRef.current.radius += 1000 * dtSec;
      roarEffectRef.current.alpha -= 2.0 * dtSec;
      if (roarEffectRef.current.alpha <= 0) roarEffectRef.current.active = false;
    }

    if (p.combo > 0) {
      p.comboTimer -= dtSec;
      if (p.comboTimer <= 0) p.combo = 0;
    }

    // 2. Movement
    let dx = 0;
    let dy = 0;
    if (keysPressed.current['KeyW'] || keysPressed.current['ArrowUp']) dy -= 1;
    if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) dy += 1;
    if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) dx -= 1;
    if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) dx += 1;

    if (joystickInput.x !== 0 || joystickInput.y !== 0) {
      dx = joystickInput.x;
      dy = joystickInput.y;
    }

    // Normalize movement vector
    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      const scale = len > 1 ? 1 / len : 1;
      p.x += dx * scale * p.speed * dtSec;
      p.y += dy * scale * p.speed * dtSec;
    }

    cameraRef.current.x = p.x - width / 2;
    cameraRef.current.y = p.y - height / 2;

    // 3. Blade Rotation
    const spinSpeed = p.bladeSpeed * (1 + Math.min(p.combo, 50) * 0.02);
    bladeAngleRef.current += spinSpeed * dtSec;

    // 4. Spawning
    if (timeRef.current - lastSpawnTime.current > Math.max(100, SPAWN_RATE - (p.level * 10))) {
      spawnEnemy(width, height);
      lastSpawnTime.current = timeRef.current;
    }

    // 5. Entities
    const orbitRadius = 90 + (p.bladeSize * 0.3);
    const bladePositions: {x: number, y: number}[] = [];
    
    for (let i = 0; i < p.bladeCount; i++) {
      const angle = bladeAngleRef.current + (i * (2 * Math.PI / p.bladeCount));
      bladePositions.push({
        x: p.x + Math.cos(angle) * orbitRadius,
        y: p.y + Math.sin(angle) * orbitRadius
      });
    }

    // Enemies
    enemiesRef.current = enemiesRef.current.filter(enemy => {
      // Tracking Player
      if (enemy.stunned > 0) {
        enemy.stunned -= dtSec;
      } else {
        const angleToPlayer = Math.atan2(p.y - enemy.y, p.x - enemy.x);
        enemy.x += Math.cos(angleToPlayer) * enemy.speed * dtSec;
        enemy.y += Math.sin(angleToPlayer) * enemy.speed * dtSec;
      }

      // Hit Player?
      const distToPlayer = Math.hypot(p.x - enemy.x, p.y - enemy.y);
      if (distToPlayer < p.radius + enemy.radius - 5) {
        p.hp -= enemy.damage * dtSec * 2; 
        p.combo = 0;
        if (p.hp <= 0) {
          onGameOver({ score: scoreRef.current, level: p.level });
          return false;
        }
      }

      // Hit by Blade?
      let hit = false;
      for (const blade of bladePositions) {
        const distToBlade = Math.hypot(blade.x - enemy.x, blade.y - enemy.y);
        // Blade hitbox is the size of the blade
        if (distToBlade < (p.bladeSize * 0.6) + enemy.radius) {
            if (enemy.enemyType === EnemyType.TANK && enemy.stunned <= 0 && Math.random() < 0.3) {
                playSound('deflect');
                showDamage(enemy.x, enemy.y, "BLOCK");
                // Small knockback on block
                const kAngle = Math.atan2(enemy.y - p.y, enemy.x - p.x);
                enemy.x += Math.cos(kAngle) * 20;
                enemy.y += Math.sin(kAngle) * 20;
                hit = false;
                continue;
            }

            const dmg = p.bladeDamage * (1 + p.combo * 0.05);
            enemy.hp -= dmg;
            hit = true;
            createExplosion(enemy.x, enemy.y, '#f59e0b', 5);
            showDamage(enemy.x, enemy.y, Math.floor(dmg), p.combo > 10);
            playSound('hit');
            
            p.combo++;
            p.comboTimer = COMBO_WINDOW;

            // Knockback
            const kAngle = Math.atan2(enemy.y - p.y, enemy.x - p.x);
            const force = enemy.enemyType === EnemyType.TANK ? 30 : 80;
            enemy.x += Math.cos(kAngle) * force;
            enemy.y += Math.sin(kAngle) * force;
            
            // Only hit by one blade per frame to prevent insta-gib
            break; 
        }
      }

      if (enemy.hp <= 0) {
        // Drop Gems
        gemsRef.current.push({
          id: Math.random().toString(),
          x: enemy.x,
          y: enemy.y,
          radius: 8,
          type: 'gem',
          value: enemy.enemyType === EnemyType.TANK ? 50 : 10,
          color: '#06b6d4'
        });
        spawnPickup(enemy.x, enemy.y);
        createExplosion(enemy.x, enemy.y, '#ef4444', 10);
        scoreRef.current += (enemy.enemyType === EnemyType.TANK ? 50 : 10);
        return false;
      }
      return true;
    });

    // Pickups
    pickupsRef.current = pickupsRef.current.filter(item => {
        item.life -= dtSec;
        const dist = Math.hypot(p.x - item.x, p.y - item.y);
        if (dist < p.radius + item.radius + 10) {
            playSound('pickup');
            if (item.pickupType === PickupType.HEAL) {
                p.hp = Math.min(p.maxHp, p.hp + 40);
                showDamage(p.x, p.y - 50, "❤️ HEAL", true);
            } else if (item.pickupType === PickupType.BLADE_UP) {
                p.bladeCount = Math.min(8, p.bladeCount + 1);
                showDamage(p.x, p.y - 50, "⚔️ BLADE UP", true);
            } else if (item.pickupType === PickupType.POWER_UP) {
                p.bladeDamage += 15;
                p.bladeSize += 8;
                showDamage(p.x, p.y - 50, "🔥 POWER UP", true);
            }
            return false;
        }
        return item.life > 0;
    });

    // Gems (Magnet)
    gemsRef.current = gemsRef.current.filter(gem => {
        const dist = Math.hypot(p.x - gem.x, p.y - gem.y);
        if (dist < 150) {
            const ang = Math.atan2(p.y - gem.y, p.x - gem.x);
            gem.x += Math.cos(ang) * 400 * dtSec;
            gem.y += Math.sin(ang) * 400 * dtSec;
        }
        if (dist < p.radius + gem.radius) {
            p.xp += gem.value;
            if (p.xp >= p.level * 100) {
                p.level++;
                p.xp = 0;
                p.hp = p.maxHp;
                p.bladeDamage += 5;
                playSound('levelUp');
                showDamage(p.x, p.y - 80, "LEVEL UP!", true);
                createExplosion(p.x, p.y, '#fbbf24', 30);
            }
            return false;
        }
        return true;
    });

    // Particles
    particlesRef.current = particlesRef.current.filter(pt => {
        pt.x += pt.vx * dtSec;
        pt.y += pt.vy * dtSec;
        pt.life -= dtSec;
        return pt.life > 0;
    });

    // Text
    damageTextsRef.current = damageTextsRef.current.filter(t => {
        t.y -= 50 * dtSec;
        t.life -= dtSec;
        return t.life > 0;
    });

    onUpdateStats(Math.max(0, p.hp), p.maxHp, p.mp, p.maxMp, p.xp, p.level, scoreRef.current, p.combo);

  }, [isPlaying, joystickInput, onGameOver, onUpdateStats, spawnEnemy, triggerSkill, onSkillUsed]);

  // Draw
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cam = cameraRef.current;

    // Clear Background
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, width, height);

    // Grid Floor
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    const gridSize = 100;
    const ox = -cam.x % gridSize;
    const oy = -cam.y % gridSize;
    ctx.beginPath();
    for (let x = ox; x < width; x += gridSize) ctx.rect(x, 0, 0, height);
    for (let y = oy; y < height; y += gridSize) ctx.rect(0, y, width, 0);
    ctx.stroke();

    ctx.save();
    ctx.translate(-cam.x, -cam.y);

    // Gems
    gemsRef.current.forEach(g => {
        ctx.beginPath();
        ctx.fillStyle = g.color;
        ctx.shadowColor = g.color;
        ctx.shadowBlur = 8;
        ctx.arc(g.x, g.y, g.radius, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    // Pickups (Chests)
    pickupsRef.current.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        const bob = Math.sin(timeRef.current / 200) * 5;
        ctx.translate(0, bob);
        
        // Draw Chest/Bag shape
        ctx.fillStyle = p.pickupType === PickupType.HEAL ? '#10b981' : '#f59e0b';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(-15, -15, 30, 30);
        ctx.fill();
        ctx.stroke();
        
        // Icon
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const icon = p.pickupType === PickupType.HEAL ? '+' : (p.pickupType === PickupType.BLADE_UP ? '⚔️' : '⚡');
        ctx.fillText(icon, 0, 0);
        ctx.restore();
    });

    // Enemies
    enemiesRef.current.forEach(e => {
        if (e.x < cam.x - 100 || e.x > cam.x + width + 100 || e.y < cam.y - 100 || e.y > cam.y + height + 100) return;
        
        ctx.save();
        ctx.translate(e.x, e.y);
        if (e.stunned > 0) {
            ctx.rotate(Math.random() * 0.5 - 0.25); // Shake when stunned
            ctx.fillStyle = '#fcd34d'; // Yellow tint
            ctx.beginPath();
            ctx.arc(0, 0, e.radius + 5, 0, Math.PI*2);
            ctx.fill();
        } else {
            // Face player
            const p = playerRef.current;
            if (p.x < e.x) ctx.scale(-1, 1);
        }
        
        ctx.font = `${e.radius * 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 10;
        ctx.fillText(e.sprite, 0, 0);
        ctx.shadowBlur = 0;

        ctx.restore();
        
        // HP Bar
        const pct = e.hp / e.maxHp;
        ctx.fillStyle = 'black';
        ctx.fillRect(e.x - 20, e.y - e.radius - 15, 40, 6);
        ctx.fillStyle = pct < 0.3 ? '#ef4444' : '#10b981';
        ctx.fillRect(e.x - 20, e.y - e.radius - 15, 40 * pct, 6);
    });

    // Roar Effect
    if (roarEffectRef.current.active) {
        ctx.beginPath();
        ctx.arc(playerRef.current.x, playerRef.current.y, roarEffectRef.current.radius, 0, Math.PI*2);
        ctx.strokeStyle = `rgba(251, 191, 36, ${roarEffectRef.current.alpha})`;
        ctx.lineWidth = 10;
        ctx.stroke();
    }

    // Player
    const p = playerRef.current;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 20;
    if (playerImageRef.current && playerImageRef.current.complete) {
        ctx.drawImage(playerImageRef.current, -p.radius * 1.5, -p.radius * 1.5, p.radius * 3, p.radius * 3);
    } else {
        ctx.fillStyle = '#f87171';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.restore();

    // Blades
    const bladeOrbit = 90 + (p.bladeSize * 0.3);
    for (let i = 0; i < p.bladeCount; i++) {
        const ang = bladeAngleRef.current + (i * (2 * Math.PI / p.bladeCount));
        const bx = p.x + Math.cos(ang) * bladeOrbit;
        const by = p.y + Math.sin(ang) * bladeOrbit;

        ctx.save();
        ctx.translate(bx, by);
        // Rotate blade to face direction of spin + self spin
        ctx.rotate(ang + Math.PI/2 + (timeRef.current / 50)); 

        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 15;
        
        // Draw Scimitar
        const sz = p.bladeSize;
        ctx.beginPath();
        // Hilt
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(-sz * 0.15, sz * 0.3, sz * 0.3, sz * 0.2);
        
        // Blade Curve
        ctx.fillStyle = '#f59e0b'; // Gold/Fire
        ctx.beginPath();
        ctx.moveTo(0, sz * 0.3);
        ctx.bezierCurveTo(sz, 0, sz, -sz, 0, -sz); // Outer curve
        ctx.bezierCurveTo(sz * 0.4, -sz * 0.4, 0, 0, 0, sz * 0.3); // Inner curve
        ctx.fill();

        // Inner Fire
        ctx.fillStyle = '#fee2e2';
        ctx.beginPath();
        ctx.moveTo(0, sz * 0.2);
        ctx.bezierCurveTo(sz * 0.6, 0, sz * 0.6, -sz * 0.6, 0, -sz * 0.6);
        ctx.fill();

        ctx.restore();
    }

    // Particles
    particlesRef.current.forEach(pt => {
        ctx.globalAlpha = pt.life;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI*2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Damage Text
    ctx.font = 'bold 24px Arial';
    damageTextsRef.current.forEach(t => {
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'black';
        ctx.strokeText(t.value.toString(), t.x, t.y);
        ctx.fillStyle = t.color;
        ctx.fillText(t.value.toString(), t.x, t.y);
    });

    ctx.restore();

  }, []);

  // --- Main Loop ---
  const tick = useCallback((time: number) => {
    if (!isPlaying) {
        lastFrameTimeRef.current = 0; // Reset on stop
        return;
    }
    
    if (lastFrameTimeRef.current === 0) {
        lastFrameTimeRef.current = time;
    }
    
    const deltaTime = time - lastFrameTimeRef.current;
    lastFrameTimeRef.current = time;

    // Only update if frame time is reasonable (prevent huge jumps on tab switch)
    if (canvasRef.current && deltaTime < 200) { 
        const cvs = canvasRef.current;
        if (cvs.width !== window.innerWidth || cvs.height !== window.innerHeight) {
            cvs.width = window.innerWidth;
            cvs.height = window.innerHeight;
        }
        update(deltaTime, cvs.width, cvs.height);
        draw();
    }
    
    requestRef.current = requestAnimationFrame(tick);
  }, [isPlaying, update, draw]);

  useEffect(() => {
    if (isPlaying) {
        requestRef.current = requestAnimationFrame(tick);
    } else {
        cancelAnimationFrame(requestRef.current);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, tick]);

  return <canvas ref={canvasRef} className="block w-full h-full" />;
};

export default GameCanvas;