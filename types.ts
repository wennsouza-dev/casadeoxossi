
export enum MemberRole {
  YAO = 'Yaô',
  OGA = 'Ogã',
  EKEDI = 'Ekedi',
  ABIAN = 'Abian',
  MEMBRO = 'Membro'
}

export enum PaymentStatus {
  EM_DIA = 'Em Dia',
  PENDENTE = 'Pendente',
  ATRASADO = 'Atrasado',
  ISENTO = 'Isento'
}

export interface Member {
  id: string;
  name: string;
  orixa: string;
  role: MemberRole;
  status: PaymentStatus;
  active: boolean;
  avatarUrl?: string;
}

export interface GiraEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'Firmeza' | 'Caridade' | 'Proteção';
  description: string;
}

export interface Activity {
  id: string;
  user: string;
  action: string;
  time: string;
  amount?: number;
  avatarUrl?: string;
}
