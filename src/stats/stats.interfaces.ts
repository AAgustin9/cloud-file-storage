export interface UserStatsData {
  userId: string;
  username: string;
  usedQuota: number | bigint;
  fileCount: number;
}

export interface StatsSummary {
  totalUsers: number;
  totalFiles: number;
  totalStorage: number | bigint;
  averageStoragePerUser: number | bigint;
}

export interface GlobalStats {
  users: UserStatsData[];
  summary: StatsSummary;
}

export interface UserStats {
  userId: string;
  username: string;
  usedQuota: number | bigint;
  usedQuotaHuman: string;
  maxQuota: string;
  quotaPercentage: number;
  fileCount: number;
  recentFiles: Array<{
    id: string;
    name: string;
    size: number | bigint;
    createdAt: Date;
  }>;
}
