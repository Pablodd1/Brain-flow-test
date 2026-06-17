/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GenomeNode, EngineInfo } from './types';

export const GENOME_NODES: GenomeNode[] = [
  {
    id: 1,
    name: "Vagus Nerve Tone",
    category: "Autonomic",
    description: "Evaluates parasympathetic regulatory capacity and vagal brake resilience.",
    guideline: "Apply paced diaphragmatic breathing at 5.5s inhalation/exhalation to amplify respiratory sinus arrhythmia (RSA)."
  },
  {
    id: 2,
    name: "Celiac Plexus Integrity",
    category: "Autonomic",
    description: "Monitors splanchnic sympathetic neural output and visceral hyperalgesia markers.",
    guideline: "Manual release of abdominal muscular tension and heat sensory therapy."
  },
  {
    id: 3,
    name: "Mast Cell Regulation",
    category: "Neuroimmune",
    description: "Monitors localized histamine and cytokine release pathways under psychological stress.",
    guideline: "Identify chemical triggers; administer bioflavonoids, and schedule vagal exercises to suppress histamine storms."
  },
  {
    id: 4,
    name: "Microglia De-escalation",
    category: "Neuroimmune",
    description: "Assesses central nervous system low-grade inflammation and chronic fatigue/fog triggers.",
    guideline: "Recommend deep rest sleep hygiene, photobiomodulation, and vagal nerve stimulation (VNS) protocols."
  },
  {
    id: 5,
    name: "Blood-Brain Barrier Stability",
    category: "Neuroimmune",
    description: "Tracks tight junction vascular leakage stimulated by sustained autonomic distress.",
    guideline: "Restrict systemic inflammatory foods; initiate neurovascular cooling and high-density antioxidant support."
  },
  {
    id: 6,
    name: "Sacral Pump Rhythm",
    category: "Structural",
    description: "Evaluates standard craniosacral fluid mechanical rhythm and cerebrospinal drainage.",
    guideline: "Perform pelvic tilts, neural-flossing exercises, and light sacral myofascial compression."
  },
  {
    id: 7,
    name: "Atlanto-Occipital Decompression",
    category: "Structural",
    description: "Coordinates alignment of C1 vertebrae to prevent restriction of the jugular foramen (Vagus nerve path).",
    guideline: "Perform chin-tucks, gentle suboccipital active releases, and posture calibration checks."
  },
  {
    id: 8,
    name: "TMJ Repositioning",
    category: "Structural",
    description: "Monitors temporomandibular structural occlusion and its link to trigeminal autonomic sensitization.",
    guideline: "Introduce intraoral pterygoid releases, masseter myofascial mobilization, and dental guard calibrations."
  },
  {
    id: 9,
    name: "Iliopsoas Release",
    category: "Structural",
    description: "Screens for deep lumbar pelvic postural locking (the somatic survival muscle sequence).",
    guideline: "Stretched psoas myofascial release, low lunge holds, and active pelvic floor adjustments."
  },
  {
    id: 10,
    name: "Baroreceptor Tuning",
    category: "Performance",
    description: "Assesses carotid sinus and aortic arch feedback mechanics protecting against orthostatic stress.",
    guideline: "Administer rapid orthostatic transition drills, tilt-table monitoring, and gradual isometric loading."
  },
  {
    id: 11,
    name: "Diaphragm Reset",
    category: "Autonomic",
    description: "Regulates dome excursion mechanics to break intercostal accessory muscle breathing patterns.",
    guideline: "Active diaphragm excursion override. Mandate 3-beat inhalation, 6-beat exhalation with absolute abdominal expansion."
  },
  {
    id: 12,
    name: "Stellate Ganglion Inhibition",
    category: "Autonomic",
    description: "Modulates hyper-sympathetic firing from the thoracic sympathetic chain (often locked in severe trauma/freeze).",
    guideline: "Override signal active. High-frequency sensory gating, unilateral neck somatic cooling, and vagal stimulation."
  },
  {
    id: 13,
    name: "Pulmonary V/Q Alignment",
    category: "Performance",
    description: "Optimizes alveolar ventilation to perfusion ratio for optimal tissue oxygenation.",
    guideline: "Perform slow oxygen-depletion exhaled breath holds, high-resistance respiratory pacing, and postural drainage."
  },
  {
    id: 14,
    name: "Glymphatic Drainage",
    category: "Neuroimmune",
    description: "Facilitates sleep-state convective bulk flow clears of metabolic waste from brain interstitial spaces.",
    guideline: "Optimize lateral sleeping postures, thermal contrast therapies, and pre-sleep calming routines."
  },
  {
    id: 15,
    name: "HRV Amplification",
    category: "Performance",
    description: "Maximizes instantaneous heart schedule variability via fine autonomic oscillations.",
    guideline: "Engage in coherent resonant-frequency visual training at exactly 0.1 Hz frequency (6 breaths per minute)."
  },
  {
    id: 16,
    name: "Prefrontal Cortical Brake",
    category: "Executive",
    description: "Supports down-regulation of hyperactive amygdala signaling through cortical-vagal pathways.",
    guideline: "Clinician cognitive framing exercises, non-judgmental somatic scanning, and structured threat-reappraisal."
  },
  {
    id: 17,
    name: "ACC Modulation",
    category: "Executive",
    description: "Assesses conflict detection, internal error representation, and goal-directed attention flexibility.",
    guideline: "Implement Stroop-adaptation focus loops, dual N-back pacing, and active attention shifting training."
  }
];

export const ENGINES: EngineInfo[] = [
  {
    index: 1,
    name: "Perception Engine",
    subtitle: "Observation & Signal Capture",
    focus: "Observe current patient baseline state and document somatic distress markers.",
    instructions: "Add a minimum of 3 clinical observations from the sensory feed, physical exam, or clinical interview to proceed. This ensures clinical rigor."
  },
  {
    index: 2,
    name: "Pattern Recognition Engine",
    subtitle: "Override Allocation & Syndrome Mapping",
    focus: "Evaluate standard clinical parameters against Coherence neuro-profiles.",
    instructions: "If patterns suggest patient distress, choose a primary safety override (e.g. FREEZE, NEUROIMMUNE, etc.) to alter the standard clinical roadmap."
  },
  {
    index: 3,
    name: "Confidence Engine",
    subtitle: "Clinician Cognitive Calibrator",
    focus: "Mitigate anchoring bias, selection heuristics, and confirmation bias.",
    instructions: "Read and answer the critical clinician introspective questions carefully. Once answered, this checkpoint remains permanently visible."
  },
  {
    index: 4,
    name: "Reserve Engine",
    subtitle: "Adaptive Cushion Scanning",
    focus: "Quantify cellular, metabolic, and neuro-autonomic structural reserves.",
    instructions: "Evaluate the patient's resting capacity vs current load. Identify sleep debt, nutritional depletion, or severe mechanical fatigue factors."
  },
  {
    index: 5,
    name: "Sequencing Engine",
    subtitle: "Neurological Tier Ranking",
    focus: "Formulate step-by-step tiered sequence for clinical action.",
    instructions: "Organize therapeutic targets logically. Note how downstream interventions depend on initial autonomic stabilization (e.g., reset breathing first)."
  },
  {
    index: 6,
    name: "Alliance Engine",
    subtitle: "Somatic Consensus & Therapeutic Resonance",
    focus: "Formulate safe shared expectations and a collaborative container.",
    instructions: "Verify co-regulation state. Confirm that patient and practitioner align on immediate priorities without provoking active distress reactions."
  },
  {
    index: 7,
    name: "Intervention Engine",
    subtitle: "Somatic Neuromodulation Strategy",
    focus: "Select and deploy targeted neuro-somatic maneuvers based on active Genome nodes.",
    instructions: "Instruct the patient on custom biological tasks. Focus heavily on active guidelines of highlighted nodes."
  },
  {
    index: 8,
    name: "Response Engine",
    subtitle: "Autonomic Flux Tracking",
    focus: "Re-evaluate live sensory bio-feed parameters following target tasks.",
    instructions: "Observe shifts in heart pace, HRV increase, or muscular relaxation. Check if the active overrides can be safely deactivated."
  },
  {
    index: 9,
    name: "Learning Engine",
    subtitle: "Cortex Meta-Update",
    focus: "Archive diagnostic findings and update system predictive heuristics.",
    instructions: "Analyze gaps between expected response and actual observed biological shifts. Document key insights."
  },
  {
    index: 10,
    name: "Meaning Engine",
    subtitle: "Existential Integration & Self-directed Growth",
    focus: "Synthesize clinical path results into patient-owned home protocols.",
    instructions: "Finalize the session. Export a clean self-regulation routine for home care. Mark the encounter as completed."
  }
];

export interface BarcodeProfile {
  name: string;
  dob: string;
  intake: string;
  observations: string[];
}

export const BARCODE_PATIENTS: BarcodeProfile[] = [
  {
    name: "Elias Vance [Case: Dorsal Vagal Freeze]",
    dob: "1994-08-01",
    intake: "Client exhibits severe trauma-induced dorsal vagal collapse, profound physical lock/freeze episodes sparked by minor cognitive triggers, extreme muscle bracing, and flat affect after historically severe motor vehicle impact.",
    observations: [
      "Somatic freeze response with motor gating stiffness",
      "Severely depressed RMSSD (<12ms) with high-frequency respiratory loss",
      "Exaggerated respiratory accessory muscle recruitment (shallow holding)"
    ]
  },
  {
    name: "Dr. Adrian Thorne [Case: Neuroimmune / Mast-Cell]",
    dob: "1978-04-12",
    intake: "Presents with systemic mast-cell hyper-reactivity, toxic brain fog, chemical/light sensitivities, and transient peripheral burning following mild chronic respiratory infections. Autonomic threshold is critically low.",
    observations: [
      "Pronounced blood-tissue barrier instability (flushing/rash flares)",
      "Profound cognitive-vagal suppression during focus trials",
      "Chronic low HRV (<18ms) tracking with sub-acute autonomic load"
    ]
  },
  {
    name: "Elena Rostova [Case: Cervicogenic / Structural Lock]",
    dob: "1991-03-15",
    intake: "Reports debilitating cervicogenic headaches, intense TMJ masseter clicking, and restricted cervical rotation. Clinical palpation highlights massive Atlanto-Occipital compression restricting typical jugular outflow (CN X pathway).",
    observations: [
      "Rigid cervical musculature and high Atlanto-occipital restriction",
      "Bilateral masseter / temporomandibular joint structural occlusion",
      "Iliopsoas pelvic-cushion guarding restricting extension kinetics"
    ]
  },
  {
    name: "Sarah Sterling, RN [Case: Orthostatic Performance]",
    dob: "1983-11-22",
    intake: "Clinical veteran presenting with chronic fatigue syndrome, dysautonomia, postural lightheadedness, and POTS-like orthostatic swings. Significant balance sway index fluctuations detected on standing assessments.",
    observations: [
      "Sustained orthostatic pulse rate drops and post-stand flight response",
      "High postural kinetic sway index during upright stance balance",
      "Shallow clavicular breathing patterns with diaphragm excursion locks"
    ]
  },
  {
    name: "Marcus Vance, MBA [Case: Amygdala Executive Overdrive]",
    dob: "1988-06-25",
    intake: "Presents with acute sympathetic hyper-arousal, runaway anxiety, resting cardiac fast-pacing, and profound executive burnout with loss of emotional down-regulation (failed prefrontal cortical brake).",
    observations: [
      "High resting heart rate (vagal deceleration brake failure)",
      "Heightened pupillary tracking reactivity and rapid sensory reflexing",
      "Low RMSSD coherence during high-cognitive Stroop metrics"
    ]
  }
];
