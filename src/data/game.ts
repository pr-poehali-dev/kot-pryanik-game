export interface Level {
  id: number;
  name: string;
  emoji: string;
  color: string;
  stars: number;
  locked: boolean;
  goldTarget: number;
}

export interface ShopItem {
  id: string;
  name: string;
  desc: string;
  icon: string;
  price: number;
  color: string;
}

export interface RankPlayer {
  rank: number;
  name: string;
  avatar: string;
  gold: number;
  you?: boolean;
}

export interface PowerUp {
  id: string;
  name: string;
  icon: string;
  color: string;
  desc: string;
}

export const LEVELS: Level[] = [
  { id: 1, name: 'Медовый лес', emoji: '🌲', color: 'bg-mint', stars: 3, locked: false, goldTarget: 20 },
  { id: 2, name: 'Карамельные горы', emoji: '⛰️', color: 'bg-candy', stars: 2, locked: false, goldTarget: 30 },
  { id: 3, name: 'Пряничный город', emoji: '🏰', color: 'bg-honey', stars: 1, locked: false, goldTarget: 40 },
  { id: 4, name: 'Ледяная пещера', emoji: '❄️', color: 'bg-sky', stars: 0, locked: false, goldTarget: 50 },
  { id: 5, name: 'Вулкан сокровищ', emoji: '🌋', color: 'bg-caramel', stars: 0, locked: true, goldTarget: 60 },
  { id: 6, name: 'Космос Пряника', emoji: '🚀', color: 'bg-grape', stars: 0, locked: true, goldTarget: 80 },
];

export const POWERUPS: PowerUp[] = [
  { id: 'speed', name: 'Ускорение', icon: 'Zap', color: 'text-honey', desc: 'Пряник бежит быстрее' },
  { id: 'shield', name: 'Защита', icon: 'Shield', color: 'text-sky', desc: 'Щит от препятствий' },
  { id: 'magnet', name: 'Магнит', icon: 'Magnet', color: 'text-candy', desc: 'Притягивает золото' },
];

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'scarf', name: 'Тёплый шарф', desc: '+10% к золоту на уровне', icon: 'Sparkles', price: 150, color: 'bg-candy' },
  { id: 'boots', name: 'Реактивные ботинки', desc: 'Старт с ускорением', icon: 'Zap', price: 300, color: 'bg-honey' },
  { id: 'shield', name: 'Золотой щит', desc: 'Одна защита в запасе', icon: 'Shield', price: 250, color: 'bg-sky' },
  { id: 'magnet', name: 'Супер-магнит', desc: 'Увеличенный радиус магнита', icon: 'Magnet', price: 400, color: 'bg-grape' },
  { id: 'combo', name: 'Комбо-перчатки', desc: 'Комбо держится дольше', icon: 'Hand', price: 350, color: 'bg-mint' },
  { id: 'skin', name: 'Скин «Космонавт»', desc: 'Эксклюзивный образ Пряника', icon: 'Rocket', price: 500, color: 'bg-caramel' },
];

export const RANKING: RankPlayer[] = [
  { rank: 1, name: 'МурчащийКороль', avatar: '👑', gold: 9820 },
  { rank: 2, name: 'ЛапаУдачи', avatar: '🐾', gold: 8450 },
  { rank: 3, name: 'ЗолотойУс', avatar: '⭐', gold: 7200 },
  { rank: 4, name: 'Ты (Пряник)', avatar: '🍪', gold: 6100, you: true },
  { rank: 5, name: 'Мяу-Ниндзя', avatar: '🥷', gold: 5300 },
  { rank: 6, name: 'ПушистыйВор', avatar: '😼', gold: 4100 },
];

export const CHALLENGES = [
  { id: 1, title: 'Собери 100 золота с другом', reward: 200, progress: 64, icon: 'Users' },
  { id: 2, title: 'Комбо x10 на любом уровне', reward: 150, progress: 40, icon: 'Flame' },
  { id: 3, title: 'Пройди 3 уровня без урона', reward: 300, progress: 33, icon: 'Trophy' },
];
