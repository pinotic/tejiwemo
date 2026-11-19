export type DivisionId = string;

export type ProposalStatus =
  | 'Diajukan'
  | 'Ditinjau'
  | 'Disetujui'
  | 'Dikerjakan'
  | 'Selesai'
  | 'Ditolak';

export type ProposalUrgency = 'Normal' | 'Prioritas' | 'Mendesak';

export type UserRole = 'warga' | 'pengurus';

export interface RtOfficial {
  id: string;
  name: string;
  position: string;
  roleGroup: 'inti' | 'koordinator';
  block: string;
  schedule: string;
  photoUrl?: string;
}

export interface DivisionInfo {
  id: DivisionId;
  name: string;
  shortName: string;
  coordinator: string;
  description: string;
  annualBudget: number;
  photoUrl?: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  category: string;
  divisionId: DivisionId;
  date: string;
  time: string;
  location: string;
  summary: string;
  details: string;
  coordinator: string;
  imageUrl?: string;
  attendeesCount: number;
  status: 'Terjadwal' | 'Berlangsung' | 'Selesai';
}

export interface TreasuryTransaction {
  id: string;
  divisionId: DivisionId;
  date: string;
  description: string;
  type: 'pemasukan' | 'pengeluaran';
  amount: number;
  recordedBy: string;
  referenceCode: string;
}

export interface ProposalHistoryEntry {
  id: string;
  status: ProposalStatus;
  timestamp: string;
  updatedBy: string;
  note: string;
}

export interface ProposalItem {
  id: string;
  code: string;
  title: string;
  divisionId: DivisionId;
  residentName: string;
  houseBlock: string;
  urgency: ProposalUrgency;
  estimatedBudget: number;
  description: string;
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
  supportersCount: number;
  history: ProposalHistoryEntry[];
}

export interface AgendaAttendee {
  id: string;
  name: string;
  block: string;
  timestamp: string;
}

export interface AgendaItem {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  divisionId: DivisionId;
  category: string;
  description: string;
  rsvpCount: number;
  attendees?: AgendaAttendee[];
}

export interface NewsItem {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  author: string;
  publishedAt: string;
  imageUrl?: string;
}

export interface HeroConfig {
  eyebrow: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
}

export interface NotificationItem {
  id: string;
  type:
    | 'proposal_status'
    | 'proposal_new'
    | 'activity_new'
    | 'treasury_new'
    | 'agenda_new'
    | 'division_new'
    | 'division_deleted'
    | 'hero_updated'
    | 'officials_updated'
    | 'news_new';
  title: string;
  message: string;
  proposalId?: string;
  status?: ProposalStatus;
  timestamp: string;
  read: boolean;
}

export interface SiteSettings {
  webTitle: string;
  regionCode: string;
  regionIdentity: string;
  locationName: string;
}

export interface RtSnapshotState {
  siteSettings: SiteSettings;
  hero: HeroConfig;
  officials: RtOfficial[];
  divisions: DivisionInfo[];
  activities: ActivityItem[];
  treasury: TreasuryTransaction[];
  proposals: ProposalItem[];
  agenda: AgendaItem[];
  news: NewsItem[];
  notifications: NotificationItem[];
}

export type AuthRole = 'pengurus' | 'superadmin';

export interface AuthUser {
  id: string;
  username: string;
  role: AuthRole;
  displayName: string;
  position: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type RtRealtimeEvent =
  | { type: 'state:sync'; payload: RtSnapshotState }
  | {
      type: 'site:updated';
      payload: { siteSettings: SiteSettings; hero?: HeroConfig };
    }
  | { type: 'hero:updated'; payload: { hero: HeroConfig } }
  | { type: 'official:created'; payload: { official: RtOfficial } }
  | { type: 'official:updated'; payload: { official: RtOfficial } }
  | { type: 'official:deleted'; payload: { officialId: string } }
  | {
      type: 'proposal:created';
      payload: { proposal: ProposalItem; notification: NotificationItem };
    }
  | {
      type: 'proposal:updated';
      payload: { proposal: ProposalItem; notification?: NotificationItem };
    }
  | { type: 'proposal:deleted'; payload: { proposalId: string } }
  | {
      type: 'treasury:created';
      payload: { transaction: TreasuryTransaction; notification: NotificationItem };
    }
  | { type: 'treasury:updated'; payload: { transaction: TreasuryTransaction } }
  | { type: 'treasury:deleted'; payload: { transactionId: string } }
  | {
      type: 'division:created';
      payload: { division: DivisionInfo; notification: NotificationItem };
    }
  | { type: 'division:updated'; payload: { division: DivisionInfo } }
  | { type: 'division:deleted'; payload: { divisionId: string; notification: NotificationItem } }
  | {
      type: 'activity:created';
      payload: { activity: ActivityItem; notification: NotificationItem };
    }
  | {
      type: 'agenda:created';
      payload: { agenda: AgendaItem; notification: NotificationItem };
    }
  | { type: 'agenda:updated'; payload: { agenda: AgendaItem } }
  | { type: 'agenda:deleted'; payload: { agendaId: string } }
  | {
      type: 'news:created';
      payload: { news: NewsItem; notification: NotificationItem };
    }
  | { type: 'news:updated'; payload: { news: NewsItem } }
  | { type: 'news:deleted'; payload: { newsId: string } }
  | { type: 'notifications:read'; payload: { id?: string; all?: boolean } };
