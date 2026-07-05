import { useEffect, useRef, useState, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { POWERUPS, Level } from '@/data/game';
import { useTransparentImage } from '@/hooks/use-transparent-image';

interface Props {
  level: Level;
  catImg: string;
  onExit: () => void;
}

type ObjType = 'gold' | 'bonus' | 'enemy';
interface Obj {
  id: number;
  type: ObjType;
  lane: number;
  z: number;
}

const LANE_X = [-1, 0, 1];

interface Tree {
  id: number;
  z: number;
  side: -1 | 1;
  variant: number;
}

export default function PlayLevel({ level, catImg, onExit }: Props) {
  const catImgTransparent = useTransparentImage(catImg);
  const [running, setRunning] = useState(true);
  const [paused, setPaused] = useState(false);
  const [lane, setLane] = useState(1);
  const [jumping, setJumping] = useState(false);
  const [gold, setGold] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [shield, setShield] = useState(false);
  const [boost, setBoost] = useState(false);
  const [objs, setObjs] = useState<Obj[]>([]);
  const [trees, setTrees] = useState<Tree[]>([]);
  const [finished, setFinished] = useState(false);
  const [pops, setPops] = useState<{ id: number; txt: string; x: number }[]>([]);
  const [shake, setShake] = useState(false);

  const idRef = useRef(0);
  const treeIdRef = useRef(0);
  const comboTimer = useRef<number>();
  const jumpTimer = useRef<number>();
  const laneRef = useRef(1);
  const jumpingRef = useRef(false);
  const active = running && !paused;

  const multiplier = 1 + Math.floor(combo / 3);

  const move = useCallback((dir: number) => {
    if (!active) return;
    setLane((l) => {
      const n = Math.max(0, Math.min(2, l + dir));
      laneRef.current = n;
      return n;
    });
  }, [active]);

  const jump = useCallback(() => {
    if (!active || jumpingRef.current) return;
    jumpingRef.current = true;
    setJumping(true);
    window.clearTimeout(jumpTimer.current);
    jumpTimer.current = window.setTimeout(() => {
      jumpingRef.current = false;
      setJumping(false);
    }, 620);
  }, [active]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') move(-1);
      if (e.key === 'ArrowRight') move(1);
      if (e.key === 'ArrowUp' || e.key === ' ') { e.preventDefault(); jump(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move, jump]);

  useEffect(() => {
    let sx = 0, sy = 0;
    const start = (e: TouchEvent) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; };
    const end = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > 30) move(dx > 0 ? 1 : -1);
      } else if (dy < -30) jump();
    };
    window.addEventListener('touchstart', start);
    window.addEventListener('touchend', end);
    return () => { window.removeEventListener('touchstart', start); window.removeEventListener('touchend', end); };
  }, [move, jump]);

  useEffect(() => {
    if (!active) return;
    const spawn = setInterval(() => {
      const r = Math.random();
      const type: ObjType = r < 0.62 ? 'gold' : r < 0.78 ? 'bonus' : 'enemy';
      setObjs((o) => [
        ...o,
        { id: idRef.current++, type, lane: Math.floor(Math.random() * 3), z: 0 },
      ]);
    }, 720);
    return () => clearInterval(spawn);
  }, [active]);

  // trees along the road
  useEffect(() => {
    if (!active) return;
    const spawn = setInterval(() => {
      setTrees((t) => [
        ...t,
        { id: treeIdRef.current++, z: 0, side: -1, variant: Math.floor(Math.random() * 3) },
        { id: treeIdRef.current++, z: 0, side: 1, variant: Math.floor(Math.random() * 3) },
      ]);
    }, 500);
    return () => clearInterval(spawn);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const speed = boost ? 0.024 : 0.016;
    const loop = setInterval(() => {
      setTrees((prev) => prev.map((t) => ({ ...t, z: t.z + speed })).filter((t) => t.z < 1.15));
    }, 30);
    return () => clearInterval(loop);
  }, [active, boost]);

  useEffect(() => {
    if (!active) return;
    const speed = boost ? 0.03 : 0.02;
    const loop = setInterval(() => {
      setObjs((prev) => {
        const next: Obj[] = [];
        for (const o of prev) {
          const z = o.z + speed;
          const collide = o.z <= 0.9 && z >= 0.9 && o.lane === laneRef.current;
          if (collide) {
            if (o.type === 'gold') {
              setGold((g) => g + 1);
              setScore((s) => s + 10 * multiplier);
              bumpCombo();
              addPop('+' + 10 * multiplier);
            } else if (o.type === 'bonus') {
              if (Math.random() < 0.5) { setBoost(true); setTimeout(() => setBoost(false), 3500); }
              else setShield(true);
              setScore((s) => s + 25 * multiplier);
              bumpCombo();
              addPop('БОНУС!');
            } else {
              if (jumpingRef.current) {
                setScore((s) => s + 15 * multiplier);
                bumpCombo();
                addPop('ПРЫЖОК!');
              } else if (shield) {
                setShield(false); addPop('ЩИТ!'); triggerShake();
              } else {
                setCombo(0); setScore((s) => Math.max(0, s - 15)); addPop('−15'); triggerShake();
              }
            }
            continue;
          }
          if (z < 1.1) next.push({ ...o, z });
        }
        return next;
      });
    }, 30);
    return () => clearInterval(loop);
  }, [active, boost, shield, multiplier]);

  useEffect(() => {
    if (gold >= level.goldTarget && running) { setRunning(false); setFinished(true); }
  }, [gold, level.goldTarget, running]);

  const bumpCombo = () => {
    setCombo((c) => c + 1);
    window.clearTimeout(comboTimer.current);
    comboTimer.current = window.setTimeout(() => setCombo(0), 2600);
  };
  const addPop = (txt: string) => {
    const id = idRef.current++;
    const x = 30 + Math.random() * 40;
    setPops((p) => [...p, { id, txt, x }]);
    setTimeout(() => setPops((p) => p.filter((i) => i.id !== id)), 700);
  };
  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 300); };

  const stars = gold >= level.goldTarget ? 3 : gold >= level.goldTarget * 0.6 ? 2 : 1;

  const projected = (o: Obj) => {
    const scale = 0.16 + o.z * 1.0;
    const laneShift = LANE_X[o.lane] * (16 + o.z * 24);
    const left = 50 + laneShift;
    const bottom = 20 + (1 - o.z) * 44;
    return { left, bottom, scale };
  };

  const projectedTree = (t: Tree) => {
    const scale = 0.25 + t.z * 1.3;
    const spread = 36 + t.z * 30;
    const left = 50 + t.side * spread;
    const bottom = 16 + (1 - t.z) * 46;
    return { left, bottom, scale };
  };

  const catBottom = jumping ? 30 : 15;

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden select-none ${shake ? 'animate-wiggle' : ''}`}>
      {/* SKY */}
      <div className="absolute inset-0 cloud-bg" />

      {/* CITY SKYLINE */}
      <div className="absolute inset-x-0 bottom-[58%] h-24 flex items-end justify-center gap-1 opacity-40 pointer-events-none">
        {[38, 60, 45, 70, 50, 65, 40].map((h, i) => (
          <div key={i} className="bg-sky/60 rounded-t-sm" style={{ width: 26, height: h }} />
        ))}
      </div>

      {/* ROAD */}
      <div className="absolute inset-x-0 bottom-0 h-[62%] overflow-hidden" style={{ perspective: '480px' }}>
        <div
          className="absolute inset-x-0 bottom-0 h-[220%] origin-bottom"
          style={{
            transform: 'rotateX(64deg)',
            background: 'repeating-linear-gradient(0deg, #C25E00 0 40px, #A34E00 40px 80px)',
          }}
        >
          <div className="absolute top-0 bottom-0 left-[38%] w-1 bg-white/40" />
          <div className="absolute top-0 bottom-0 left-[62%] w-1 bg-white/40" />
        </div>
      </div>

      {/* TREES */}
      <div className="absolute inset-0 z-[5] pointer-events-none">
        {trees.map((t) => {
          const p = projectedTree(t);
          return (
            <div key={t.id} className="absolute -translate-x-1/2"
              style={{ left: `${p.left}%`, bottom: `${p.bottom}%`, fontSize: `${p.scale * 3.2}rem`, opacity: Math.min(1, 0.4 + t.z) }}>
              🌲
            </div>
          );
        })}
      </div>

      {/* HUD */}
      <div className="absolute top-0 inset-x-0 z-30 p-4 flex items-center justify-between">
        <div className="bg-white/90 rounded-2xl px-4 py-2 font-display font-bold text-caramel flex items-center gap-1 card-pop">
          🪙 {gold}/{level.goldTarget}
        </div>
        <div className="bg-grape text-white rounded-2xl px-4 py-2 font-display font-bold flex items-center gap-1 card-pop">
          <Icon name="Star" size={18} /> {score}
        </div>
        <button onClick={() => setPaused(true)} className="btn-3d bg-honey text-white rounded-full w-12 h-12 flex items-center justify-center">
          <Icon name="Pause" size={22} />
        </button>
      </div>

      <div className="absolute top-[70px] inset-x-6 z-30 h-3 bg-white/50 rounded-full overflow-hidden">
        <div className="h-full bg-mint transition-all duration-300" style={{ width: `${Math.min(100, (gold / level.goldTarget) * 100)}%` }} />
      </div>

      {combo >= 2 && (
        <div className="absolute top-24 inset-x-0 z-30 flex justify-center animate-scale-in">
          <div className="bg-candy text-white font-display font-extrabold text-2xl px-6 py-2 rounded-full card-pop rotate-[-3deg]">
            🔥 КОМБО x{multiplier} <span className="text-white/80 text-lg">({combo})</span>
          </div>
        </div>
      )}

      <div className="absolute top-24 right-4 z-30 flex flex-col gap-2">
        {boost && <Badge icon="Zap" label="Ускорение" c="bg-honey" />}
        {shield && <Badge icon="Shield" label="Щит" c="bg-sky" />}
      </div>

      {/* OBJECTS */}
      <div className="absolute inset-0 z-10">
        {objs.map((o) => {
          const p = projected(o);
          const emoji = o.type === 'gold' ? '🪙' : o.type === 'bonus' ? '🎁' : '🚧';
          return (
            <div
              key={o.id}
              className="absolute -translate-x-1/2"
              style={{ left: `${p.left}%`, bottom: `${p.bottom}%`, fontSize: `${p.scale * 3.4}rem`, opacity: Math.min(1, 0.3 + o.z), zIndex: Math.round(o.z * 100) }}
            >
              {emoji}
            </div>
          );
        })}
      </div>

      {pops.map((p) => (
        <div key={p.id} className="absolute z-30 -translate-x-1/2 font-display font-extrabold text-2xl text-white animate-float-coin"
          style={{ left: `${p.x}%`, bottom: '34%', WebkitTextStroke: '2px #C25E00' }}>
          {p.txt}
        </div>
      ))}

      {/* CAT */}
      <div className="absolute z-20 left-1/2 transition-all duration-200"
        style={{ bottom: `${catBottom}%`, transform: `translateX(-50%) translateX(${LANE_X[lane] * 26}%)` }}>
        <img
          src={catImgTransparent}
          alt="Пряник"
          className={`w-32 md:w-40 origin-bottom ${jumping ? '-rotate-6' : 'animate-run-cycle'}`}
          style={{ filter: 'drop-shadow(0 12px 12px rgba(0,0,0,.3))' }}
        />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-20 h-4 bg-black/25 rounded-[100%] blur-sm" />
      </div>

      {/* CONTROLS */}
      {active && (
        <div className="absolute bottom-5 inset-x-0 z-30 flex items-center justify-center gap-3 px-4">
          <button onClick={() => move(-1)} className="btn-3d bg-white text-caramel rounded-3xl w-20 h-16 flex items-center justify-center">
            <Icon name="ArrowLeft" size={32} />
          </button>
          <button onClick={jump} className="btn-3d bg-honey text-white rounded-3xl w-28 h-16 flex items-center justify-center font-display font-bold gap-1">
            <Icon name="ArrowUp" size={28} /> Прыжок
          </button>
          <button onClick={() => move(1)} className="btn-3d bg-white text-caramel rounded-3xl w-20 h-16 flex items-center justify-center">
            <Icon name="ArrowRight" size={32} />
          </button>
        </div>
      )}

      {/* WIN */}
      {finished && (
        <div className="absolute inset-0 z-40 bg-black/40 flex items-center justify-center p-6">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center card-pop animate-scale-in">
            <div className="text-6xl mb-2 animate-wiggle inline-block">🏆</div>
            <h2 className="font-display font-extrabold text-3xl text-caramel">Уровень пройден!</h2>
            <p className="font-body text-muted-foreground mt-1">{level.name}</p>
            <div className="flex justify-center gap-2 my-4">
              {[1, 2, 3].map((s) => <span key={s} className={`text-4xl ${s <= stars ? '' : 'grayscale opacity-30'}`}>⭐</span>)}
            </div>
            <div className="flex justify-center gap-3 mb-5">
              <div className="bg-honey-light rounded-2xl px-4 py-2 font-display font-bold text-caramel">🪙 {gold}</div>
              <div className="bg-grape text-white rounded-2xl px-4 py-2 font-display font-bold">⭐ {score}</div>
            </div>
            <button onClick={onExit} className="btn-3d bg-mint text-white font-display font-bold text-lg rounded-2xl w-full py-3">
              Продолжить
            </button>
          </div>
        </div>
      )}

      {/* PAUSE */}
      {paused && (
        <div className="absolute inset-0 z-40 bg-black/50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center card-pop animate-scale-in">
            <div className="text-6xl mb-2">⏸️</div>
            <h2 className="font-display font-extrabold text-3xl text-caramel mb-5">Пауза</h2>
            <button onClick={() => setPaused(false)} className="btn-3d bg-mint text-white font-display font-bold text-lg rounded-2xl w-full py-3 mb-3 flex items-center justify-center gap-2">
              <Icon name="Play" size={22} /> Продолжить
            </button>
            <button onClick={onExit} className="btn-3d bg-white border-2 border-muted text-caramel font-display font-bold text-lg rounded-2xl w-full py-3 flex items-center justify-center gap-2">
              <Icon name="ChevronLeft" size={22} /> Выйти в меню
            </button>
          </div>
        </div>
      )}

      <div className="absolute bottom-24 left-4 z-10 hidden md:flex flex-col gap-1 text-white/90 font-body text-sm">
        {POWERUPS.map((p) => (
          <div key={p.id} className="flex items-center gap-1"><Icon name={p.icon} size={14} /> {p.name}</div>
        ))}
        <div className="flex items-center gap-1 mt-1"><Icon name="ArrowUp" size={14} /> Прыгай через 🚧</div>
      </div>
    </div>
  );
}

function Badge({ icon, label, c }: { icon: string; label: string; c: string }) {
  return (
    <div className={`${c} text-white rounded-2xl px-3 py-1 font-display font-bold text-sm flex items-center gap-1 card-pop animate-scale-in`}>
      <Icon name={icon} size={16} /> {label}
    </div>
  );
}