import { useState, useEffect } from 'react';
import { db, handleFirestoreError } from '../firebase';
import { User as FirebaseUser } from 'firebase/auth';
import {
  collection, doc, query, where, onSnapshot, orderBy,
  setDoc, updateDoc, serverTimestamp
} from 'firebase/firestore';
import { ClinicalEncounter, OperationType, OverrideType } from '../types';

export function useEncounters(currentUser: FirebaseUser | null) {
  const [encounters, setEncounters] = useState<ClinicalEncounter[]>([]);
  const [activeEncounterId, setActiveEncounterId] = useState<string | null>(null);
  const [dbSaving, setDbSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'synced' | 'error'>('synced');

  const activeEncounter = encounters.find(e => e.id === activeEncounterId) || null;

  // 3. Realtime listening to Clinician Encounters
  useEffect(() => {
    if (!currentUser) {
      setEncounters([]);
      setActiveEncounterId(null);
      return;
    }

    const path = 'encounters';
    const q = query(
      collection(db, path),
      where('ownerId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ClinicalEncounter[] = [];
      snapshot.forEach((snapshotDoc) => {
        const data = snapshotDoc.data();
        list.push({
          id: snapshotDoc.id,
          ...data,
          // Handle timestamps safely
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        } as ClinicalEncounter);
      });
      setEncounters(list);

      // Auto-select the first encounter if none selected and list has item
      if (list.length > 0 && !activeEncounterId) {
        setActiveEncounterId(list[0].id);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [currentUser, activeEncounterId]);

  // 4. Save encounter state changes directly to Cloud Firestore
  const handleUpdateActiveEncounter = async (updates: Partial<ClinicalEncounter>) => {
    if (!activeEncounterId || !currentUser) return;

    // Reject updates on completed sessions to honor security policies
    if (activeEncounter && activeEncounter.status === 'completed') {
      alert('Clinical Safeguard: Completed clinical sessions are locked and cannot be restructured.');
      return;
    }

    setSyncStatus('saving');
    const path = `encounters/${activeEncounterId}`;
    try {
      const docRef = doc(db, 'encounters', activeEncounterId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  // 5. Toggle Overrides
  const handleToggleOverride = (type: OverrideType) => {
    if (!activeEncounter) return;
    let updated: OverrideType[] = [...activeEncounter.activeOverrides];
    if (updated.includes(type)) {
      updated = updated.filter(o => o !== type);
    } else {
      updated.push(type);
    }
    handleUpdateActiveEncounter({ activeOverrides: updated });
  };

  // 6. Clinician metric feed updater
  const handleMetricUpdate = (metrics: { heartRate: number; hrv: number; swayIndex: number }) => {
    if (!activeEncounter || activeEncounter.status === 'completed') return;
    // Debounce updates by only saving to database occasionally or keeping it local
    // For this full-stack proof we keep the real-time simulation reactive in local variables, and save occasionally
    handleUpdateActiveEncounter({
      heartRate: metrics.heartRate,
      hrv: metrics.hrv,
      swayIndex: metrics.swayIndex
    });
  };

  // 7. Initialize a new clinical encounter session
  const handleStartNewEncounter = async (barcodePatient?: any) => {
    if (!currentUser) return;

    setDbSaving(true);
    const newId = 'enc_' + Math.random().toString(36).substring(2, 11);
    const path = `encounters/${newId}`;

    // Standard clinical defaults
    let patientName = "EHR Patient Outline";
    let preVisitIntake = "Patient requests autonomic and neuro-somatic screening.";
    let patientDob = "1994-01-01";
    let initialObs: string[] = [];

    if (barcodePatient) {
      patientName = barcodePatient.name;
      patientDob = barcodePatient.dob;
      preVisitIntake = barcodePatient.intake;
      initialObs = barcodePatient.observations || [];
    }

    const newEncPayload = {
      id: newId,
      ownerId: currentUser.uid,
      patientName,
      patientDob,
      preVisitIntake,
      currentEngine: 1,
      maxVisitedEngine: 1,
      observations: initialObs,
      activeOverrides: [],
      notes: '',
      heartRate: 72,
      hrv: 48,
      swayIndex: 2.1,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'encounters', newId), newEncPayload);
      setActiveEncounterId(newId);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setDbSaving(false);
    }
  };

  // 8. Meaning Engine Session Lockdown
  const handleLockSession = async () => {
    if (!activeEncounterId) return;
    setDbSaving(true);
    const path = `encounters/${activeEncounterId}`;
    try {
      const docRef = doc(db, 'encounters', activeEncounterId);
      await updateDoc(docRef, {
        status: 'completed',
        updatedAt: serverTimestamp()
      });
      alert('Secure Storage Archive Synced: This somatic encounter lock is active.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setDbSaving(false);
    }
  };

  return {
    encounters,
    activeEncounterId,
    setActiveEncounterId,
    activeEncounter,
    dbSaving,
    syncStatus,
    handleUpdateActiveEncounter,
    handleToggleOverride,
    handleMetricUpdate,
    handleStartNewEncounter,
    handleLockSession
  };
}
