import { useState } from 'react';
import Icon from '@/components/ui/icon';
import PlayLevel from '@/components/game/PlayLevel';
import {
  LEVELS, SHOP_ITEMS, RANKING, POWERUPS, CHALLENGES, Level,
} from '@/data/game';

const CAT_IMG = 'https://cdn.poehali.dev/projects/ee9c33ea-4b8f-4a78-9763-92a7406d9016/files/d8540158-0bae-4d80-87ea-2dd0263ec8f4.jpg';

type Screen = 'menu' | 'levels' | 'ranking' | 'shop' | 'settings' | 'help';

const MENU: { key: Screen; label: string; icon: string; color: string }[] = [
  { key: 'levels', label: 'Уровни', icon: 'Map', color: 'bg-mint' },
  { key: 'ranking', label: 'Рейтинг', icon: 'Trophy', color: 'bg-honey' },
  { key: 'shop', label: 'Магазин', icon: 'ShoppingBag', color: 'bg-candy' },
  { key: 'settings', label: 'Настройки', icon: 'Settings', color: 'bg-sky' },
  { key: 'help', label: 'Обучение', icon: 'GraduationCap', color: 'bg-grape' },
];

export default function Index() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [playing, setPlaying] = useState<Level | null>(null);
  const [gold] = useState(6100);

  if (playing) {
    return <PlayLevel level={playing} catImg={CAT_IMG} onExit={() => setPlaying(null)} />;
  }

  return (
    <div className="min-h-screen cloud-bg font-body relative overflow-hidden">
      <Cloud className="top-10 left-6 w-24 opacity-80" />
      <Cloud className="top-24 right-10 w-32 opacity-70" />
      <Cloud className="top-48 left-1/3 w-20 opacity-60" />

      <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <button
          onClick={() => setScreen('menu')}
          className="font-display font-extrabold text-2xl md:text-3xl text-white flex items-center gap-2"
          style={{ WebkitTextStroke: '2px #C25E00' }}
        >
          <span className="text-3xl">🍪</span> Кот&nbsp;Пряник
        </button>
        <div className="bg-white/90 rounded-full px-4 py-2 font-display font-bold text-caramel flex items-center gap-1 card-pop">
          <span className="text-xl">🪙</span> {gold.toLocaleString('ru')}
        </div>
      </header>

      <main className="relative z-10 px-4 md:px-6 pb-16 max-w-4xl mx-auto">
        {screen === 'menu' && <Menu onPlay={() => setPlaying(LEVELS[0])} go={setScreen} />}
        {screen === 'levels' && <Levels onPlay={setPlaying} />}
        {screen === 'ranking' && <Ranking />}
        {screen === 'shop' && <Shop gold={gold} />}
        {screen === 'settings' && <Settings />}
        {screen === 'help' && <Help />}
      </main>
    </div>
  );
}

/* ---------- MENU ---------- */
function Menu({ onPlay, go }: { onPlay: () => void; go: (s: Screen) => void }) {
  return (
    <div className="text-center animate-fade-in">
      <div className="relative inline-block mt-2 mb-4">
        <div className="absolute inset-0 bg-honey-light rounded-full blur-2xl scale-90 opacity-70 animate-spin-slow" />
        <img src={CAT_IMG} alt="Пряник" className="relative w-56 md:w-72 mx-auto drop-shadow-2xl animate-bounce-soft" />
      </div>
      <h1 className="font-display font-extrabold text-4xl md:text-5xl text-white" style={{ WebkitTextStroke: '3px #C25E00' }}>
        Бег за золотом
      </h1>
      <p className="font-body text-white/95 mt-1 mb-6 drop-shadow">Помоги Прянику собрать все сокровища галактики!</p>

      <button
        onClick={onPlay}
        className="btn-3d bg-candy text-white font-display font-extrabold text-2xl rounded-3xl px-12 py-4 animate-wiggle inline-flex items-center gap-2"
      >
        <Icon name="Play" size={28} /> Играть
      </button>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-8">
        {MENU.map((m, i) => (
          <button
            key={m.key}
            onClick={() => go(m.key)}
            style={{ animationDelay: `${i * 70}ms` }}
            className={`${m.color} text-white rounded-3xl p-4 card-pop hover:scale-105 transition-transform animate-scale-in flex flex-col items-center gap-1`}
          >
            <Icon name={m.icon} size={30} />
            <span className="font-display font-bold">{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- LEVELS ---------- */
function Levels({ onPlay }: { onPlay: (l: Level) => void }) {
  return (
    <Section title="Уровни" icon="Map">
      <div className="grid sm:grid-cols-2 gap-4">
        {LEVELS.map((l, i) => (
          <div
            key={l.id}
            style={{ animationDelay: `${i * 60}ms` }}
            className={`bg-white rounded-3xl p-5 card-pop animate-fade-in flex items-center gap-4 ${l.locked ? 'opacity-70' : ''}`}
          >
            <div className={`${l.color} w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0`}>{l.emoji}</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-lg text-caramel truncate">{l.name}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                🪙 Цель: {l.goldTarget}
                <span className="ml-2">{[1, 2, 3].map((s) => (
                  <span key={s} className={s <= l.stars ? '' : 'grayscale opacity-30'}>⭐</span>
                ))}</span>
              </div>
            </div>
            {l.locked ? (
              <div className="text-muted-foreground flex flex-col items-center"><Icon name="Lock" size={24} /></div>
            ) : (
              <button onClick={() => onPlay(l)} className="btn-3d bg-mint text-white font-display font-bold rounded-2xl px-5 py-2 flex items-center gap-1">
                <Icon name="Play" size={18} />
              </button>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- RANKING ---------- */
function Ranking() {
  return (
    <Section title="Рейтинг" icon="Trophy">
      <div className="space-y-3 mb-8">
        {RANKING.map((p, i) => (
          <div
            key={p.rank}
            style={{ animationDelay: `${i * 55}ms` }}
            className={`rounded-3xl p-4 card-pop animate-fade-in flex items-center gap-4 ${p.you ? 'bg-honey text-white' : 'bg-white'}`}
          >
            <div className={`font-display font-extrabold text-2xl w-8 text-center ${p.rank <= 3 && !p.you ? 'text-honey-dark' : p.you ? 'text-white' : 'text-muted-foreground'}`}>
              {p.rank}
            </div>
            <div className="text-3xl">{p.avatar}</div>
            <div className={`flex-1 font-display font-bold ${p.you ? 'text-white' : 'text-caramel'}`}>{p.name}</div>
            <div className={`font-display font-bold flex items-center gap-1 ${p.you ? 'text-white' : 'text-caramel'}`}>
              🪙 {p.gold.toLocaleString('ru')}
            </div>
          </div>
        ))}
      </div>

      <h3 className="font-display font-extrabold text-xl text-white mb-3" style={{ WebkitTextStroke: '2px #C25E00' }}>
        Челленджи с друзьями
      </h3>
      <div className="space-y-3">
        {CHALLENGES.map((c, i) => (
          <div key={c.id} style={{ animationDelay: `${i * 55}ms` }} className="bg-white rounded-3xl p-4 card-pop animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-grape text-white w-11 h-11 rounded-2xl flex items-center justify-center"><Icon name={c.icon} size={22} /></div>
              <div className="flex-1 font-display font-bold text-caramel">{c.title}</div>
              <div className="font-display font-bold text-caramel whitespace-nowrap">🪙 {c.reward}</div>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-candy transition-all" style={{ width: `${c.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- SHOP ---------- */
function Shop({ gold }: { gold: number }) {
  return (
    <Section title="Магазин" icon="ShoppingBag">
      <div className="grid sm:grid-cols-2 gap-4">
        {SHOP_ITEMS.map((it, i) => (
          <div key={it.id} style={{ animationDelay: `${i * 55}ms` }} className="bg-white rounded-3xl p-5 card-pop animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
              <div className={`${it.color} text-white w-14 h-14 rounded-2xl flex items-center justify-center shrink-0`}>
                <Icon name={it.icon} size={26} />
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-bold text-lg text-caramel truncate">{it.name}</h3>
                <p className="text-sm text-muted-foreground">{it.desc}</p>
              </div>
            </div>
            <button
              disabled={gold < it.price}
              className={`btn-3d w-full font-display font-bold rounded-2xl py-2.5 mt-1 flex items-center justify-center gap-1 ${
                gold < it.price ? 'bg-muted text-muted-foreground' : 'bg-honey text-white'
              }`}
            >
              🪙 {it.price}
            </button>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- SETTINGS ---------- */
function Settings() {
  const [state, setState] = useState({ music: true, sound: true, vibro: false });
  const toggles: { key: keyof typeof state; label: string; icon: string }[] = [
    { key: 'music', label: 'Музыка', icon: 'Music' },
    { key: 'sound', label: 'Звуки', icon: 'Volume2' },
    { key: 'vibro', label: 'Вибрация', icon: 'Vibrate' },
  ];
  return (
    <Section title="Настройки" icon="Settings">
      <div className="space-y-3 max-w-lg mx-auto">
        {toggles.map((t, i) => (
          <div key={t.key} style={{ animationDelay: `${i * 60}ms` }} className="bg-white rounded-3xl p-4 card-pop animate-fade-in flex items-center gap-3">
            <div className="bg-sky text-white w-11 h-11 rounded-2xl flex items-center justify-center"><Icon name={t.icon} size={22} /></div>
            <div className="flex-1 font-display font-bold text-caramel">{t.label}</div>
            <button
              onClick={() => setState((s) => ({ ...s, [t.key]: !s[t.key] }))}
              className={`w-14 h-8 rounded-full transition-colors relative ${state[t.key] ? 'bg-mint' : 'bg-muted'}`}
            >
              <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${state[t.key] ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        ))}
        <div className="bg-white rounded-3xl p-4 card-pop animate-fade-in">
          <div className="font-display font-bold text-caramel mb-2 flex items-center gap-2"><Icon name="Globe" size={20} /> Язык</div>
          <div className="flex gap-2">
            {['Русский', 'English'].map((l, idx) => (
              <button key={l} className={`flex-1 font-display font-bold rounded-2xl py-2 ${idx === 0 ? 'bg-honey text-white' : 'bg-muted text-muted-foreground'}`}>{l}</button>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ---------- HELP ---------- */
function Help() {
  const steps = [
    { icon: 'ArrowLeftRight', title: 'Управление', text: 'Двигай Пряника влево-вправо стрелками или кнопками, чтобы ловить золото.' },
    { icon: 'Coins', title: 'Собирай золото 🪙', text: 'Каждая монета приносит очки. Набери нужное количество, чтобы пройти уровень.' },
    { icon: 'Flame', title: 'Комбо', text: 'Собирай предметы подряд — растёт множитель очков x2, x3 и больше!' },
    { icon: 'Gift', title: 'Бонусы 🎁', text: 'Дают ускорение или щит и добавляют очки.' },
    { icon: 'ShieldAlert', title: 'Враги 🌵', text: 'Кактусы и препятствия сбивают комбо. Уворачивайся или используй щит!' },
  ];
  return (
    <Section title="Обучение" icon="GraduationCap">
      <div className="space-y-3 mb-6">
        {steps.map((s, i) => (
          <div key={i} style={{ animationDelay: `${i * 60}ms` }} className="bg-white rounded-3xl p-4 card-pop animate-fade-in flex items-start gap-4">
            <div className="bg-grape text-white w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"><Icon name={s.icon} size={24} /></div>
            <div>
              <h3 className="font-display font-bold text-lg text-caramel">{s.title}</h3>
              <p className="text-muted-foreground">{s.text}</p>
            </div>
          </div>
        ))}
      </div>
      <h3 className="font-display font-extrabold text-xl text-white mb-3" style={{ WebkitTextStroke: '2px #C25E00' }}>
        Силовые апы
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {POWERUPS.map((p) => (
          <div key={p.id} className="bg-white rounded-3xl p-4 card-pop text-center animate-scale-in">
            <div className={`mx-auto mb-1 flex justify-center ${p.color}`}><Icon name={p.icon} size={30} /></div>
            <div className="font-display font-bold text-caramel text-sm">{p.name}</div>
            <div className="text-xs text-muted-foreground">{p.desc}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- shared ---------- */
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="animate-fade-in">
      <h2 className="font-display font-extrabold text-3xl text-white mb-5 flex items-center gap-2" style={{ WebkitTextStroke: '2px #C25E00' }}>
        <Icon name={icon} size={30} /> {title}
      </h2>
      {children}
    </div>
  );
}

function Cloud({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute z-0 pointer-events-none ${className}`}>
      <div className="bg-white rounded-full w-full aspect-[2/1] blur-[1px] animate-bounce-soft" />
    </div>
  );
}
