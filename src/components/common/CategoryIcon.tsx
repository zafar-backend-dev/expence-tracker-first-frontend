import React from 'react';
import {
  UtensilsCrossed,
  Car,
  Home,
  ShoppingBag,
  HeartPulse,
  GraduationCap,
  Gamepad2,
  Wifi,
  Gift,
  MoreHorizontal,
  Briefcase,
  Laptop,
  TrendingUp,
  Coins,
  Wallet,
  CircleDot,
  Building2,
  DollarSign,
  Coffee,
  Plane,
  Zap
} from 'lucide-react';

interface CategoryIconProps {
  name?: string;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name = '', className = 'w-5 h-5', size }) => {
  const n = (name || '').toLowerCase();

  let Icon = CircleDot;

  if (n.includes('food') || n.includes('yemek') || n.includes('restoran') || n.includes('market') || n.includes('cafe')) {
    Icon = UtensilsCrossed;
  } else if (n.includes('car') || n.includes('transport') || n.includes('araç') || n.includes('ulaşım') || n.includes('benzin')) {
    Icon = Car;
  } else if (n.includes('home') || n.includes('house') || n.includes('ev') || n.includes('kira') || n.includes('housing')) {
    Icon = Home;
  } else if (n.includes('shop') || n.includes('alışveriş') || n.includes('giyim') || n.includes('cloth')) {
    Icon = ShoppingBag;
  } else if (n.includes('health') || n.includes('sağlık') || n.includes('hastane') || n.includes('dori') || n.includes('tıp')) {
    Icon = HeartPulse;
  } else if (n.includes('edu') || n.includes('eğitim') || n.includes('kurs') || n.includes('okul')) {
    Icon = GraduationCap;
  } else if (n.includes('invest') || n.includes('yatırım') || n.includes('hisse') || n.includes('fon')) {
    Icon = TrendingUp;
  } else if (n.includes('salary') || n.includes('maaş') || n.includes('gelir') || n.includes('work') || n.includes('iş')) {
    Icon = Briefcase;
  } else if (n.includes('tech') || n.includes('laptop') || n.includes('freelance') || n.includes('bilgisayar')) {
    Icon = Laptop;
  } else if (n.includes('bill') || n.includes('fatura') || n.includes('elektrik') || n.includes('su') || n.includes('gaz')) {
    Icon = Zap;
  } else if (n.includes('game') || n.includes('eğlence') || n.includes('sinema') || n.includes('tatil')) {
    Icon = Gamepad2;
  } else if (n.includes('gift') || n.includes('hediye') || n.includes('bağış')) {
    Icon = Gift;
  } else if (n.includes('travel') || n.includes('seyahat') || n.includes('uçak')) {
    Icon = Plane;
  } else if (n.includes('coin') || n.includes('kripto') || n.includes('faiz')) {
    Icon = Coins;
  }

  return <Icon className={className} size={size} />;
};
