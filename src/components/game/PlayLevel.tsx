import { useEffect, useRef, useState, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { POWERUPS, Level } from '@/data/game';

interface Props {
  level: Level;
  catImg: string;
  onExit: () => void;
}

type ObjType = 'gold' | 'bonus' | 'enemy';
interface Obj {
  id: number;
  type: ObjType;
  x: number;
  y: number;
  hit?: boolean;
}

const LANES = [30, 55, 80];

export default function PlayLevel({ level, catImg, onExit }: Props) {
  const [running, setRunning] = useState(true);
  const [lane, setLane] = useState(1);
  const [gold, setGold] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [shield, setShield] = useState(false);
  const [boost, setBoost] = useState(false);
  const [objs, setObjs] = useState<Obj[]>([]);
  const [finished, setFinished] = useState(false);
  const [pop, setPop] = useState<{ id: number; x: number; y: number; txt: string }[]>([]);

  const idRef = useRef(0);
  const comboTimer = useRef<number>();

  const multiplier = 1 + Math.floor(combo / 3);

  const move = useCallback((dir: number) => {
    if (!running) return;
    setLane((l) => Math.max(0, Math.min(2, l + dir)));
  }, [running]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') move(-1);
      if (e.key === 'ArrowRight') move(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move]);

  // spawn objects
  useEffect(() => {
    if (!running) return;
    const spawn = setInterval(() => {
      const r = Math.random();
      const type: ObjType = r < 0.62 ? 'gold' : r < 0.78 ? 'bonus' : 'enemy';
      setObjs((o) => [
        ...o,
        { id: idRef.current++, type, x: LANES[Math.floor(Math.random() * 3)], y: -10 },
      ]);
    }, 850);
    return () => clearInterval(spawn);
  }, [running]);

  // game loop
  useEffect(() => {
    if (!running) return;
    const speed = boost ? 3.4 : 2.2;
    const loop = setInterval(() => {
      setObjs((prev) => {
        const catX = LANES[lane];
        const next: Obj[] = [];
        for (const o of prev) {
          const y = o.y + speed;
          const collided = !o.hit && y > 72 && y < 90 && Math.abs(o.x - catX) < 14;
          if (collided) {
            if (o.type === 'gold') {
              const val = 1;
              setGold((g) => g + val);
              setScore((s) => s + 10 * multiplier);
              bumpCombo();
              addPop(o.x, '+' + (10 * multiplier));
            } else if (o.type === 'bonus') {
              const which = Math.random();
              if (which < 0.5) { setBoost(true); setTimeout(() => setBoost(false), 3500); }
              else { setShield(true); }
              setScore((s) => s + 25 * multiplier);
              bumpCombo();
              addPop(o.x, 'БОНУС!');
            } else {
              if (shield) { setShield(false); addPop(o.x, 'ЩИТ!'); }
              else { setCombo(0); setScore((s) => Math.max(0, s - 15)); addPop(o.x, '−15'); }
            }
            continue;
          }
          if (y < 110) next.push({ ...o, y });
        }
        return next;
      });
    }, 30);
    return () => clearInterval(loop);
  }, [running, lane, boost, shield, multiplier]);

  // win check
  useEffect(() => {
    if (gold >= level.goldTarget && running) {
      setRunning(false);
      setFinished(true);
    }
  }, [gold, level.goldTarget, running]);

  const bumpCombo = () => {
    setCombo((c) => c + 1);
    window.clearTimeout(comboTimer.current);
    comboTimer.current = window.setTimeout(() => setCombo(0), 2600);
  };

  const addPop = (x: number, txt: string) => {
    const id = idRef.current++;
    setPop((p) => [...p, { id, x, y: 78, txt }]);
    setTimeout(() => setPop((p) => p.filter((i) => i.id !== id)), 700);
  };

  const stars = gold >= level.goldTarget ? 3 : gold >= level.goldTarget * 0.6 ? 2 : 1;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden cloud-bg select-none">
      {/* HUD */}
      <div className="absolute top-0 inset-x-0 z-20 p-4 flex items-center justify-between">
        <button onClick={onExit} className="btn-3d bg-white text-caramel font-display font-bold rounded-2xl px-4 py-2 flex items-center gap-1">
          <Icon name="ChevronLeft" size={20} /> Выход
        </button>
        <div className="flex gap-2">
          <div className="bg-white/90 rounded-2xl px-4 py-2 font-display font-bold text-caramel flex items-center gap-1 card-pop">
            <span className="text-xl">🪙</span> {gold}/{level.goldTarget}
          </div>
          <div className="bg-grape text-white rounded-2xl px-4 py-2 font-display font-bold flex items-center gap-1 card-pop">
            <Icon name="Star" size={18} /> {score}
          </div>
        </div>
      </div>

      {/* Combo */}
      {combo >= 2 && (
        <div className="absolute top-24 inset-x-0 z-20 flex justify-center animate-scale-in">
          <div className="bg-candy text-white font-display font-extrabold text-2xl px-6 py-2 rounded-full card-pop rotate-[-3deg]">
            🔥 КОМБО x{multiplier} <span className="text-white/80 text-lg">({combo})</span>
          </div>
        </div>
      )}

      {/* Powerup indicators */}
      <div className="absolute top-24 right-4 z-20 flex flex-col gap-2">
        {boost && <Badge icon="Zap" label="Ускорение" c="bg-honey" />}
        {shield && <Badge icon="Shield" label="Щит" c="bg-sky" />}
      </div>

      {/* Progress bar */}
      <div className="absolute top-[70px] inset-x-6 z-20 h-3 bg-white/50 rounded-full overflow-hidden">
        <div className="h-full bg-mint transition-all duration-300" style={{ width: `${Math.min(100, (gold / level.goldTarget) * 100)}%` }} />
      </div>

      {/* Field */}
      <div className="absolute inset-0">
        {/* ground */}
        <div className="absolute bottom-0 inset-x-0 h-[22%] bg-gradient-to-t from-caramel to-honey-dark" />
        {/* lane hints */}
        {LANES.map((x, i) => (
          <div key={i} className="absolute bottom-0 w-1 h-[22%] bg-white/15" style={{ left: `${x}%` }} />
        ))}

        {/* objects */}
        {objs.map((o) => (
          <div key={o.id} className="absolute -translate-x-1/2 -translate-y-1/2 text-3xl md:text-4xl drop-shadow"
            style={{ left: `${o.x}%`, top: `${o.y}%` }}>
            {o.type === 'gold' ? '🪙' : o.type === 'bonus' ? '🎁' : '🌵'}
          </div>
        ))}

        {/* pops */}
        {pop.map((p) => (
          <div key={p.id} className="absolute -translate-x-1/2 font-display font-extrabold text-xl text-white text-stroke-white animate-float-coin"
            style={{ left: `${p.x}%`, top: `${p.y}%`, WebkitTextStroke: '2px #C25E00' }}>
            {p.txt}
          </div>
        ))}

        {/* cat */}
        <img src={catImg} alt="Пряник"
          className={`absolute bottom-[16%] -translate-x-1/2 w-24 md:w-28 transition-all duration-150 drop-shadow-2xl ${running ? 'animate-bounce-soft' : ''}`}
          style={{ left: `${LANES[lane]}%` }} />
      </div>

      {/* Controls */}
      {running && (
        <div className="absolute bottom-6 inset-x-0 z-20 flex justify-center gap-6 px-6">
          <button onClick={() => move(-1)} className="btn-3d bg-white text-caramel rounded-3xl w-24 h-16 flex items-center justify-center">
            <Icon name="ArrowLeft" size={36} />
          </button>
          <button onClick={() => move(1)} className="btn-3d bg-white text-caramel rounded-3xl w-24 h-16 flex items-center justify-center">
            <Icon name="ArrowRight" size={36} />
          </button>
        </div>
      )}

      {/* Win screen */}
      {finished && (
        <div className="absolute inset-0 z-30 bg-black/40 flex items-center justify-center p-6">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center card-pop animate-scale-in">
            <div className="text-6xl mb-2 animate-wiggle inline-block">🏆</div>
            <h2 className="font-display font-extrabold text-3xl text-caramel">Уровень пройден!</h2>
            <p className="font-body text-muted-foreground mt-1">{level.name}</p>
            <div className="flex justify-center gap-2 my-4">
              {[1, 2, 3].map((s) => (
                <span key={s} className={`text-4xl ${s <= stars ? '' : 'grayscale opacity-30'}`}>⭐</span>
              ))}
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

      {/* Powerup legend */}
      <div className="absolute bottom-24 left-4 z-10 hidden md:flex flex-col gap-1 text-white/90 font-body text-sm">
        {POWERUPS.map((p) => (
          <div key={p.id} className="flex items-center gap-1"><Icon name={p.icon} size={14} /> {p.name}</div>
        ))}
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
