/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export interface ClinicianProfile {
  userId: string;
  email: string;
  name: string;
  createdAt: Date;
}

export type OverrideType = 'freeze' | 'neuroimmune' | 'structural' | 'performance' | 'executive';

export interface GenomeNode {
  id: number;
  name: string;
  category: 'Autonomic' | 'Neuroimmune' | 'Structural' | 'Performance' | 'Executive';
  description: string;
  guideline: string;
}

export interface ClinicalEncounter {
  id: string;
  ownerId: string;
  patientName: string;
  patientDob: string;
  preVisitIntake: string;
  currentEngine: number; // 1 to 10
  maxVisitedEngine: number;
  observations: string[]; // Minimum 3 needed to pass Engine 1
  activeOverrides: OverrideType[];
  notes: string;
  heartRate: number; // Dynamic simulated metrics
  hrv: number;
  swayIndex: number;
  status: 'active' | 'completed';
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface EngineInfo {
  index: number;
  name: string;
  subtitle: string;
  focus: string;
  instructions: string;
}
