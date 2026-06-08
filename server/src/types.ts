export type Priority = 'high' | 'medium' | 'low';
export type WorkMode = 'remote' | 'hybrid' | 'onsite';

export interface Stage {
  id: string;
  name: string;
  order: number;
  color: string;
  followUpDays?: number;
}

export interface Application {
  id: string;
  company: string;
  role: string;
  stageId: string;
  order: number;
  appliedDate: string;
  jobUrl?: string;
  priority: Priority;
  location?: string;
  workMode?: WorkMode;
  salaryMin?: number;
  salaryMax?: number;
  demandedSalary?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrackerData {
  stages: Stage[];
  applications: Application[];
}
