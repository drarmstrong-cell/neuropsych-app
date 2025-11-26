import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithCustomToken,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  updateDoc 
} from 'firebase/firestore';
import { 
  ClipboardList, 
  UserPlus, 
  FileText, 
  Save, 
  Download, 
  Trash2, 
  Activity, 
  Brain, 
  Baby, 
  User as UserIcon, 
  Menu,
  X,
  ArrowRight,
  ArrowLeft,
  PenTool,
  Mic,
  MicOff,
  Camera,
  Lock,
  Phone,
  Mail,
  MapPin,
  Printer,
  Shield,
  FileCheck,
  Calculator,
  UploadCloud,
  CheckSquare,
  Stethoscope,
  BookOpen,
  List,
  Search
} from 'lucide-react';

// --- Error Boundary to Catch "White Screen" Crashes ---
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 text-red-900 min-h-screen">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <pre className="bg-red-100 p-4 rounded border border-red-300 overflow-auto">
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded">Reload App</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==========================================
// === YOUR FIREBASE KEYS (PRE-FILLED) ===
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyB-BmsEy8fbB0rm8ULG4K8ag-cudD1G2tQ",
  authDomain: "integra-neuro.firebaseapp.com",
  projectId: "integra-neuro",
  storageBucket: "integra-neuro.firebasestorage.app",
  messagingSenderId: "179956498350",
  appId: "1:179956498350:web:e35ccc28cf3481ad46923f"
};

// Initialize Firebase safely
let app: any = null;
let auth: any = null;
let db: any = null;

try {
    // Initialize immediately since we have keys
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (e) {
    console.error("Firebase init failed:", e);
}

// --- Branding ---
const BRAND_COLOR = "bg-[#003366]";
const BRAND_TEXT = "text-[#003366]";

// --- CONSTANTS ---

const getAACNLabel = (percentile: number) => {
    if (!percentile && percentile !== 0) return "N/A";
    const p = Number(percentile);
    if (p >= 98) return "Exceptionally High";
    if (p >= 91) return "Above Average";
    if (p >= 75) return "High Average";
    if (p >= 25) return "Average";
    if (p >= 9) return "Low Average";
    if (p >= 2) return "Below Average";
    return "Exceptionally Low";
};

// MASTER TEST BATTERY (Full List from PDFs)
const MASTER_TEST_BATTERY = [
    // --- CORE / SENSORY / MOTOR ---
    { id: 'clinical_interview', name: 'Diagnostic Clinical Interview', domain: 'Core' },
    { id: 'record_review', name: 'Review of Records', domain: 'Core' },
    { id: 'lateral_dominance', name: 'Lateral Dominance Exam', domain: 'Sensory/Motor' },
    { id: 'line_bisection', name: 'Line Bisection Test', domain: 'Sensory/Motor' },
    { id: 'finger_tapping', name: 'Finger Tapping Test', domain: 'Sensory/Motor' },
    { id: 'grooved_pegboard', name: 'Grooved Pegboard Test', domain: 'Sensory/Motor' },
    { id: 'grip_strength', name: 'Grip Strength', domain: 'Sensory/Motor' },
    { id: 'reitan_klove', name: 'Reitan-Klove Sensory Perceptual Exam', domain: 'Sensory/Motor' },
    { id: 'visual_field', name: 'Visual Field Screening', domain: 'Sensory/Motor' },
    { id: 'color_blindness', name: 'Color Blindness Screening (Snellen)', domain: 'Sensory/Motor' },
    { id: 'luria_motor', name: 'Luria\'s Tests of Motor Programming & Inhibition', domain: 'Sensory/Motor' },

    // --- INTELLIGENCE ---
    { id: 'wais_v_full', name: 'WAIS-V Full Scale', domain: 'Intelligence' },
    { id: 'wisc_v_full', name: 'WISC-V Full Scale', domain: 'Intelligence' },
    { id: 'wisc_v_sub', name: 'WISC-V Subtests (VCI, FRI, WMI, PSI)', domain: 'Intelligence' },
    { id: 'wppsi_iv_full', name: 'WPPSI-IV Full Scale', domain: 'Intelligence' },
    { id: 'wppsi_iv_sub', name: 'WPPSI-IV Subtests (Receptive Vocab, Info, Block Design, etc.)', domain: 'Intelligence' },
    { id: 'wasi_2_vocab', name: 'WASI-II Vocabulary', domain: 'Intelligence' },
    { id: 'wasi_2_matrix', name: 'WASI-II Matrix Reasoning', domain: 'Intelligence' },
    { id: 'wasi_2_blocks', name: 'WASI-II Block Design', domain: 'Intelligence' },
    { id: 'wasi_2_sim', name: 'WASI-II Similarities', domain: 'Intelligence' },
    { id: 'rait_full', name: 'RAIT (Full Battery)', domain: 'Intelligence' },
    { id: 'rait_abrv', name: 'RAIT (Abbreviated)', domain: 'Intelligence' },

    // --- ATTENTION & EXECUTIVE FUNCTION ---
    { id: 'iva_2', name: 'IVA-2 (Integrated Visual & Auditory CPT)', domain: 'Attention/Executive' },
    { id: 'cpt_3', name: 'Conners CPT-3', domain: 'Attention/Executive' },
    { id: 'trails_a', name: 'Trail Making Test Part A', domain: 'Attention/Executive' },
    { id: 'trails_b', name: 'Trail Making Test Part B', domain: 'Attention/Executive' },
    { id: 'd_kefs_trails', name: 'D-KEFS Trails Condition 4', domain: 'Attention/Executive' },
    { id: 'd_kefs_cw', name: 'D-KEFS Color Word Test', domain: 'Attention/Executive' },
    { id: 'd_kefs_20q', name: 'D-KEFS 20 Questions', domain: 'Attention/Executive' },
    { id: 'wcst', name: 'Wisconsin Card Sorting Test (WCST)', domain: 'Attention/Executive' },
    { id: 'igt_2', name: 'Iowa Gambling Task-2', domain: 'Attention/Executive' },
    { id: 'halstead_cat', name: 'Halstead Category Test', domain: 'Attention/Executive' },
    { id: 'nab_exec_judge', name: 'NAB Executive Judgment', domain: 'Attention/Executive' },
    { id: 'nab_exec_mazes', name: 'NAB Executive Mazes', domain: 'Attention/Executive' },
    { id: 'nab_word_gen', name: 'NAB Word Generation', domain: 'Attention/Executive' },
    { id: 'nab_attn_digits', name: 'NAB Attention Digits (Fwd/Bwd)', domain: 'Attention/Executive' },
    { id: 'nab_attn_num_let', name: 'NAB Attention Numbers & Letters', domain: 'Attention/Executive' },
    { id: 'dot_counting', name: 'Dot Counting Test', domain: 'Attention/Executive' },
    
    // --- NEPSY-II (Specific Subtests) ---
    { id: 'nepsy_aud_attn', name: 'NEPSY-II Auditory Attention', domain: 'Attention/Executive' },
    { id: 'nepsy_resp_set', name: 'NEPSY-II Response Set', domain: 'Attention/Executive' },
    { id: 'nepsy_inhibit', name: 'NEPSY-II Inhibition', domain: 'Attention/Executive' },
    { id: 'nepsy_statue', name: 'NEPSY-II Statue', domain: 'Attention/Executive' },
    { id: 'nepsy_comp', name: 'NEPSY-II Comprehension of Instructions', domain: 'Attention/Executive' },
    { id: 'nepsy_word_gen', name: 'NEPSY-II Word Generation', domain: 'Attention/Executive' },
    { id: 'nepsy_visuomotor', name: 'NEPSY-II Visuomotor Precision', domain: 'Visuospatial' },
    { id: 'nepsy_affect', name: 'NEPSY-II Affect Recognition', domain: 'Emotional' },
    { id: 'nepsy_tom', name: 'NEPSY-II Theory of Mind', domain: 'Emotional' },
    { id: 'nepsy_sentence', name: 'NEPSY-II Sentence Repetition', domain: 'Language' },
    { id: 'nepsy_memory', name: 'NEPSY-II Memory for Designs / Narrative', domain: 'Memory' },

    // --- MEMORY & LEARNING ---
    { id: 'rey_15', name: 'Rey-15 Item Test w/ Recognition', domain: 'Memory/Validity' },
    { id: 'rey_o_copy', name: 'Rey-O Complex Figure (Copy)', domain: 'Visuospatial' },
    { id: 'rey_o_imm', name: 'Rey-O Complex Figure (Immediate)', domain: 'Memory' },
    { id: 'rey_o_del', name: 'Rey-O Complex Figure (Delayed)', domain: 'Memory' },
    { id: 'rey_o_rec', name: 'Rey-O Complex Figure (Recognition)', domain: 'Memory' },
    { id: 'wraml_3', name: 'WRAML-3 Full Battery', domain: 'Memory' },
    { id: 'cvlt_3', name: 'CVLT-3', domain: 'Memory' },
    { id: 'nab_list', name: 'NAB List Learning (Imm/Del/Rec)', domain: 'Memory' },
    { id: 'nab_story', name: 'NAB Story Learning (Imm/Del/Rec)', domain: 'Memory' },
    { id: 'nab_shape', name: 'NAB Shape Learning (Imm/Del/Rec)', domain: 'Memory' },
    { id: 'champ_list', name: 'CHAMP Lists (Learn/Del/Rec)', domain: 'Memory' },
    { id: 'champ_objects', name: 'CHAMP Objects (Learn/Del/Rec)', domain: 'Memory' },
    { id: 'champ_instruct', name: 'CHAMP Instructions', domain: 'Memory' },
    { id: 'champ_places', name: 'CHAMP Places', domain: 'Memory' },
    
    // --- RBANS (Form A) Breakdown by Domain ---
    { id: 'rbans_full_a', name: 'RBANS (Full Battery) - Form A', domain: 'Memory' },
    { id: 'rbans_list_learning', name: 'RBANS List Learning', domain: 'Memory' },
    { id: 'rbans_story_memory', name: 'RBANS Story Memory', domain: 'Memory' },
    { id: 'rbans_figure_copy', name: 'RBANS Figure Copy', domain: 'Visuospatial' },
    { id: 'rbans_line_orientation', name: 'RBANS Line Orientation', domain: 'Visuospatial' },
    { id: 'rbans_picture_naming', name: 'RBANS Picture Naming', domain: 'Language' },
    { id: 'rbans_semantic_fluency', name: 'RBANS Semantic Fluency', domain: 'Language' },
    { id: 'rbans_digit_span', name: 'RBANS Digit Span', domain: 'Attention/Executive' },
    { id: 'rbans_coding', name: 'RBANS Coding', domain: 'Attention/Executive' },
    { id: 'rbans_list_recall', name: 'RBANS List Recall', domain: 'Memory' },
    { id: 'rbans_list_recognition', name: 'RBANS List Recognition', domain: 'Memory' },
    { id: 'rbans_story_recall', name: 'RBANS Story Recall', domain: 'Memory' },
    { id: 'rbans_figure_recall', name: 'RBANS Figure Recall', domain: 'Memory' },

    // --- LANGUAGE ---
    { id: 'sentence_rep', name: 'Sentence Repetition Test', domain: 'Language' },
    { id: 'nab_lang_oral', name: 'NAB Language Oral Production', domain: 'Language' },
    { id: 'nab_lang_aud', name: 'NAB Language Auditory Comp', domain: 'Language' },
    { id: 'nab_lang_name', name: 'NAB Language Naming', domain: 'Language' },
    { id: 'nab_lang_write', name: 'NAB Language Writing', domain: 'Language' },

    // --- ACADEMIC ACHIEVEMENT ---
    { id: 'wiat_4_word', name: 'WIAT-4 Word Reading', domain: 'Academic' },
    { id: 'wiat_4_spell', name: 'WIAT-4 Spelling', domain: 'Academic' },
    { id: 'wiat_4_num', name: 'WIAT-4 Numerical Operations', domain: 'Academic' },
    { id: 'wiat_4_ps', name: 'WIAT-4 Math Problem Solving', domain: 'Academic' },
    { id: 'wiat_4_rc', name: 'WIAT-4 Reading Comprehension', domain: 'Academic' },
    { id: 'wiat_4_fluency', name: 'WIAT-4 Oral/Orthographic Fluency', domain: 'Academic' },
    { id: 'wrat_5_word', name: 'WRAT-5 Word Reading', domain: 'Academic' },
    { id: 'wrat_5_spell', name: 'WRAT-5 Spelling', domain: 'Academic' },
    { id: 'wrat_5_math', name: 'WRAT-5 Math Computation', domain: 'Academic' },
    { id: 'wrat_5_sent', name: 'WRAT-5 Sentence Comp', domain: 'Academic' },
    { id: 'wj_4_letter', name: 'WJ-4 Letter-Word ID', domain: 'Academic' },
    { id: 'wj_4_spell', name: 'WJ-4 Spelling', domain: 'Academic' },
    { id: 'wj_4_passage', name: 'WJ-4 Passage Comp', domain: 'Academic' },
    { id: 'wj_4_calc', name: 'WJ-4 Calculation', domain: 'Academic' },

    // --- EMOTIONAL / BEHAVIORAL / ADAPTIVE ---
    { id: 'mmpi_3', name: 'MMPI-3', domain: 'Emotional' },
    { id: 'mmpi_a_rf', name: 'MMPI-A-RF', domain: 'Emotional' },
    { id: 'mcmi_iv', name: 'MCMI-IV', domain: 'Emotional' },
    { id: 'pai', name: 'PAI', domain: 'Emotional' },
    { id: 'pai_a', name: 'PAI-A (Adolescent)', domain: 'Emotional' }, // ADDED
    { id: 'maci_2', name: 'MACI-2', domain: 'Emotional' },
    { id: 'bdi_ii', name: 'BDI-II (Depression)', domain: 'Emotional' },
    { id: 'bai', name: 'BAI (Anxiety)', domain: 'Emotional' },
    { id: 'asrs', name: 'Adult ADHD Self-Report Scale (ASRS)', domain: 'Emotional' },
    { id: 'basc_3_self', name: 'BASC-3 Self Report', domain: 'Emotional' },
    { id: 'basc_3_parent', name: 'BASC-3 Parent Report', domain: 'Emotional' },
    { id: 'basc_3_teacher', name: 'BASC-3 Teacher Report', domain: 'Emotional' },
    { id: 'brief_2_parent', name: 'BRIEF-2 Parent', domain: 'Emotional' },
    { id: 'brief_2_teacher', name: 'BRIEF-2 Teacher', domain: 'Emotional' },
    { id: 'brief_2a', name: 'BRIEF-2A (Adult)', domain: 'Emotional' },
    { id: 'gars_3', name: 'GARS-3 (Autism)', domain: 'Emotional' },
    { id: 'abas_3', name: 'ABAS-3 (Adaptive)', domain: 'Adaptive' },
    { id: 'tfls', name: 'Texas Functional Living Scale (TFLS)', domain: 'Adaptive' },
    { id: 'lawton', name: 'Lawton ADL/IADL', domain: 'Adaptive' },
    { id: 'scared', name: 'SCARED (Anxiety)', domain: 'Emotional' },
    { id: 'tscc', name: 'Trauma Symptom Checklist (TSCC/TSCYC)', domain: 'Emotional' },
    { id: 'byi_2', name: 'Beck Youth Inventories-2', domain: 'Emotional' },
    
    // --- VALIDITY ---
    { id: 'tomm', name: 'TOMM', domain: 'Validity' },
    { id: 'mvp', name: 'Memory Validity Profile (MVP)', domain: 'Validity' },
    { id: 'vsvt', name: 'VSVT', domain: 'Validity' },
    { id: 'sims', name: 'SIMS', domain: 'Validity' },
    { id: 'acs', name: 'ACS (Word Choice / Social Cog)', domain: 'Validity' }
];

const BEHAVIORAL_FIELDS = [
    { id: 'arrival', label: 'Arrival to Exam', options: ['Arrived on time to the exam and in no apparent distress', 'Arrived late', 'Arrived early', 'Appeared distressed'] },
    { id: 'informant', label: 'Collateral Informant', options: ['Biological parent', 'None', 'Spouse', 'Sibling', 'Case Worker', 'Other'] },
    { id: 'appearance', label: 'Appearance', options: ['Dressed appropriately; average height; average build', 'Disheveled', 'Unkempt', 'Distinctive features'] },
    { id: 'orientation', label: 'Alertness/Orientation', options: ['Alert and oriented times four (person, place, time, and situation)', 'Alert but disoriented to time', 'Drowsy', 'Inattentive'] },
    { id: 'gait', label: 'Gait / Balance', options: ['Normal and age-appropriate', 'Unsteady', 'Slow', 'Assisted (Cane/Walker)'] },
    { id: 'coordination', label: 'Coordination', options: ['Normal for both fine and gross motor coordination', 'Tremor observed', 'Motor slowing', 'Clumsy'] },
    { id: 'mood', label: 'Mood', options: ['Euthymic', 'Calm', 'Positive', 'Dysphoric', 'Indifferent', 'Oppositional', 'Anxious', 'Irritable'] },
    { id: 'affect', label: 'Affect', options: ['Normal range and intensity; mood congruent', 'Serious', 'Constricted', 'Flat', 'Labile', 'Inappropriate'] },
    { id: 'thought_process', label: 'Thought Processes', options: ['Linear, normal pace', 'Tangential at times', 'Flight of ideas', 'Circumstantial', 'Blocked'] },
    { id: 'thought_content', label: 'Thought Content', options: ['Normal, rational; no evidence of special preoccupations, delusions, or paranoia', 'Paranoid ideation', 'Grandiosity', 'Perseverative'] },
    { id: 'speech', label: 'Speech', options: ['Normal for articulation, rate, and volume', 'Pressured', 'Soft/Quiet', 'Dysarthric', 'Stuttering'] },
    { id: 'expressive', label: 'Expressive Language', options: ['No difficulty with word finding; fluent and age-appropriate', 'Word finding pauses', 'Reduced fluency', 'Paraphasic errors'] },
    { id: 'receptive', label: 'Receptive Language', options: ['Age-appropriate comprehension; Did not require repetition/clarification', 'Required frequent repetition', 'Required simplification', 'Impaired'] },
    { id: 'non_verbal', label: 'Non-Verbal Communication', options: ['Appropriate eye contact; Correctly interpreted non-verbal cues', 'Poor eye contact', 'Intense eye contact', 'Misinterpreted cues'] },
    { id: 'conversation', label: 'Conversational Dynamics', options: ['Normal spontaneous conversation; Able to appreciate humor; Age-Appropriate', 'Passive/Brief', 'Over-talkative', 'Socially awkward'] },
    { id: 'attention', label: 'Attention', options: ['Variable and seemingly task/interest-dependent; some distractibility observed', 'Normal/Sustained', 'Highly distractible', 'Required frequent redirection'] },
    { id: 'processing', label: 'Processing Speed', options: ['Normal for age and commensurate with estimated intelligence', 'Slowed', 'Rapid/Impulsive'] },
    { id: 'visuospatial', label: 'Visuospatial Processing', options: ['No overt hemispatial inattention or visuomotor dyspraxia', 'Hemispatial neglect', 'Visuomotor difficulties'] },
    { id: 'memory_recent', label: 'Recent Memory', options: ['Normal for recent autobiographical events and details', 'Impaired', 'Inconsistent'] },
    { id: 'memory_remote', label: 'Remote Memory', options: ['Normal for remote autobiographical memories, overlearned information, etc.', 'Gaps noted', 'Poor'] },
    { id: 'judgment', label: 'Judgment / Impulse Control', options: ['Age-appropriate and contextually appropriate judgment; impulsivity noted during exam', 'Good judgment/control', 'Poor safety awareness', 'Impulsive'] },
    { id: 'insight', label: 'Insight & Awareness', options: ['Age-appropriate self-awareness; Normal', 'Limited', 'Poor/Denial of deficits'] },
    { id: 'reliability', label: 'Reliability & Validity', options: ['No evidence for symptom exaggeration or inconsistent details in reported history', 'Questionable effort', 'Inconsistent reporting'] },
    { id: 'rapport', label: 'Rapport & Attitude', options: ['Rapport easily established; appeared to give consistently good effort', 'Guarded', 'Friendly but distractible', 'Hostile/Resistant'] }
];

const DIAGNOSIS_DB: any = {
    'adhd_combined': {
        name: 'Attention-Deficit/Hyperactivity Disorder, Combined Presentation',
        codes: 'ICD-10: F90.2 | DSM-5-TR: 314.01',
        neurobiology: `ADHD is a neurodevelopmental disorder associated with dysregulation in dopamine and norepinephrine pathways, particularly within the prefrontal cortex and basal ganglia circuits. These networks are critical for executive functions such as inhibition, working memory, and sustained attention.`,
        functional: `In everyday life, this neurocognitive profile often manifests as difficulty sustaining attention during uninteresting tasks, impulsivity in decision making, and restlessness.`,
        recommendations: ["Academic accommodations.", "Medication consultation.", "Executive function coaching."]
    },
    'sld_reading': {
        name: 'Specific Learning Disorder with impairment in reading (Dyslexia)',
        codes: 'ICD-10: F81.0 | DSM-5-TR: 315.00',
        neurobiology: `Linked to atypical function in the left hemisphere language network (temporo-parietal and occipito-temporal regions).`,
        functional: `Results in slow reading, decoding difficulties, and reduced comprehension.`,
        recommendations: ["Structured literacy intervention.", "Audiobooks."]
    },
    'anxiety_gen': {
        name: 'Generalized Anxiety Disorder',
        codes: 'ICD-10: F41.1 | DSM-5-TR: 300.02',
        neurobiology: `Involves amygdala hyperreactivity and reduced prefrontal control, leading to persistent physiological arousal.`,
        functional: `Causes sleep disturbance, mental fatigue, and concentration difficulties.`,
        recommendations: ["CBT.", "Mindfulness."]
    }
};

// --- Hooks ---
const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      // @ts-ignore
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    } else {
      alert("Browser not supported for dictation.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      setIsListening(false);
      recognitionRef.current.stop();
    }
  };

  return { isListening, transcript, startListening, stopListening, setTranscript };
};

// --- Main Application ---
export default function NeuroPsychApp() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [view, setView] = useState<'dashboard' | 'intake' | 'report' | 'kiosk' | 'scoring'>('dashboard');
  const [patients, setPatients] = useState<any[]>([]);
  const [activePatient, setActivePatient] = useState<any | null>(null);
  const [activeReport, setActiveReport] = useState<any | null>(null);
  
  // --- HYBRID DATA LAYER ---
  
  useEffect(() => {
    if (!isLoggedIn) return;

    // 1. Try Firebase Cloud
    if (app && auth && db && auth.currentUser) {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            if (u) {
                const unsubP = onSnapshot(collection(db, 'patients'), (snap) => {
                    setPatients(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                });
                return () => unsubP();
            }
        });
        return () => unsubscribe && unsubscribe();
    } 
    
    // 2. Fallback to Local Storage (Offline Mode)
    else {
        const saved = localStorage.getItem('integra_patients');
        if (saved) setPatients(JSON.parse(saved));
        setUser({ uid: 'local-user' } as User); // Mock user for UI
    }
  }, [isLoggedIn]);

  const saveData = async (collectionName: string, data: any, id?: string) => {
      // Cloud Mode
      if (user && db && auth && auth.currentUser && user.uid !== 'local-user') {
          if (id) await updateDoc(doc(db, collectionName, id), data);
          else await addDoc(collection(db, collectionName), { ...data, createdAt: serverTimestamp() });
      } 
      // Local Mode
      else {
          let list = [...patients];
          if (id) {
              const idx = list.findIndex(p => p.id === id);
              if (idx >= 0) list[idx] = { ...list[idx], ...data };
          } else {
              list.push({ ...data, id: Math.random().toString(36).substr(2,9), createdAt: new Date().toISOString() });
          }
          setPatients(list);
          localStorage.setItem('integra_patients', JSON.stringify(list));
      }
  };

  const handleCreateReport = (patient: any) => {
    // Data Prep
    const dobDate = new Date(patient.dob);
    const age = new Date().getFullYear() - dobDate.getFullYear();
    const isForensic = patient.evalType === 'forensic';

    // Build Test Table
    const testsGiven = patient.testsAdministered || [];
    const testListString = testsGiven.length > 0 
        ? testsGiven.map((tid: string) => MASTER_TEST_BATTERY.find(t => t.id === tid)?.name || tid).join('\n- ') 
        : "No tests selected.";

    // Build Behavioral Narrative
    const obs = patient.behavioralObservations || {};
    let behavNarrative = "";
    if (obs.arrival) behavNarrative += `The patient ${obs.arrival.toLowerCase()}. `;
    if (obs.appearance) behavNarrative += `Appearance was ${obs.appearance.toLowerCase()}. `;
    if (obs.orientation) behavNarrative += `Orientation was ${obs.orientation.toLowerCase()}. `;
    if (obs.mood) behavNarrative += `Mood was ${obs.mood.toLowerCase()}. `;

    let testNarrative = "Testing was not administered or scores were not entered.";
    if (patient.scores) {
        testNarrative = `INTELLIGENCE: Full Scale IQ fell in the **${getAACNLabel(patient.scores.wasi_iq)}** range.`;
    }

    const skeleton = `
${isForensic ? 'FORENSIC NEUROPSYCHOLOGICAL EVALUATION' : 'NEUROPSYCHOLOGICAL EVALUATION REPORT'}

CONFIDENTIAL
--------------------------------------------------------------------------------
NAME: ${patient.firstName} ${patient.lastName}
DOB: ${patient.dob} (Age: ${age})
DATE OF REPORT: ${new Date().toLocaleDateString()}

I. REFERRAL QUESTION
${patient.referralReason || 'Referral reason not provided.'}

II. TESTS ADMINISTERED
${testListString}

III. BEHAVIORAL OBSERVATIONS
${behavNarrative}
${patient.sessionAdditionalNotes || ''}

IV. RESULTS
${testNarrative}

_________________________
Levi Armstrong, PsyD, MSCP
Clinical Neuropsychologist
`;

    const newReport = {
        id: Math.random().toString(36).substr(2, 9),
        patientId: patient.id,
        title: `Eval: ${patient.lastName}`,
        content: skeleton
    };
    setActiveReport(newReport);
    setView('report');
  };

  const handleSavePatient = (data: any, isUpdate = false) => {
      saveData('patients', data, isUpdate && activePatient ? activePatient.id : undefined);
      setView('dashboard');
  };

  // --- Sub-Components ---
  
  const LoginScreen = () => {
      const [id, setId] = useState('');
      const [pin, setPin] = useState('');
      const handleLogin = (e: any) => {
          e.preventDefault();
          if (id.toUpperCase() === 'INTEGRA' && pin === '1234') setIsLoggedIn(true);
          else alert("Invalid Credentials");
      };

      return (
          <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
              <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                  <div className="flex justify-center mb-4"><Brain className="w-12 h-12 text-[#003366]" /></div>
                  <h1 className="text-2xl font-serif font-bold text-[#003366] mb-2">INTEGRA</h1>
                  <p className="text-gray-500 text-sm mb-8 uppercase tracking-widest">Psychological Services</p>
                  <form onSubmit={handleLogin} className="space-y-4">
                      <input className="w-full p-3 border rounded-lg bg-gray-50 text-center" placeholder="CLINIC ID" value={id} onChange={(e) => setId(e.target.value)}/>
                      <input type="password" className="w-full p-3 border rounded-lg bg-gray-50 text-center" placeholder="PIN" value={pin} onChange={(e) => setPin(e.target.value)}/>
                      <button type="submit" className={`w-full py-3 rounded-lg text-white font-bold ${BRAND_COLOR}`}>ACCESS</button>
                  </form>
              </div>
          </div>
      );
  };

  const BrandingHeader = () => (
    <div className="flex flex-col items-center md:items-start border-b border-gray-100 pb-4 mb-4">
        <div className="flex items-center space-x-2 mb-2">
            <Brain className="w-8 h-8 text-[#003366]" />
            <h1 className="text-2xl font-serif font-bold text-[#003366] tracking-wide">INTEGRA</h1>
        </div>
        <div className="text-xs text-gray-500 flex flex-wrap gap-3">
            <span className="flex items-center"><MapPin className="w-3 h-3 mr-1"/>Wylie, TX</span>
            <span className="flex items-center"><Phone className="w-3 h-3 mr-1"/>972-442-0605</span>
        </div>
    </div>
  );

  const IntakeForm = ({ isKiosk = false }) => {
    const [formData, setFormData] = useState<any>(activePatient || { firstName: '', lastName: '', dob: '', referralSource: '' });
    const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

    return (
      <div className={`max-w-5xl mx-auto animate-fadeIn ${isKiosk ? 'pt-8' : ''}`}>
        {!isKiosk && <button onClick={() => setView('dashboard')} className="mb-4 px-4 border rounded">Cancel</button>}
        {isKiosk && <BrandingHeader />}
        <div className="bg-white p-8 rounded-xl shadow-sm border">
            <h2 className="text-xl font-bold mb-4">New Patient Intake</h2>
            <div className="grid grid-cols-2 gap-4">
                <input name="firstName" placeholder="First Name" value={formData.firstName||''} onChange={handleChange} className="p-3 border rounded" />
                <input name="lastName" placeholder="Last Name" value={formData.lastName||''} onChange={handleChange} className="p-3 border rounded" />
                <input type="date" name="dob" value={formData.dob||''} onChange={handleChange} className="p-3 border rounded" />
            </div>
            <button onClick={() => handleSavePatient(formData, !!activePatient)} className="mt-6 px-6 py-2 bg-green-600 text-white rounded font-bold">Save Profile</button>
        </div>
      </div>
    );
  };

  const ExpertScoringModule = () => {
      const [scores, setScores] = useState<any>(activePatient?.scores || {});
      const [observations, setObservations] = useState<any>(activePatient?.behavioralObservations || {});
      const [testsAdministered, setTestsAdministered] = useState<string[]>(activePatient?.testsAdministered || []);
      const [testSearch, setTestSearch] = useState('');

      const handleObsChange = (e: any) => setObservations({ ...observations, [e.target.name]: e.target.value });
      const toggleTest = (id: string) => setTestsAdministered(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);

      const filteredTests = MASTER_TEST_BATTERY.filter(t => t.name.toLowerCase().includes(testSearch.toLowerCase()));

      return (
          <div className="max-w-5xl mx-auto pb-12">
              <div className="flex justify-between mb-6">
                  <h2 className="text-2xl font-bold">Clinical Workup</h2>
                  <button onClick={() => setView('dashboard')} className="px-4 border rounded">Cancel</button>
              </div>

              {/* 1. Test Selection */}
              <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-[#003366] flex items-center"><List className="w-4 h-4 mr-2"/> Tests Administered</h3>
                      <input type="text" placeholder="Search tests..." className="p-2 border rounded text-sm w-64" value={testSearch} onChange={(e) => setTestSearch(e.target.value)} />
                  </div>
                  <div className="h-64 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 border p-4 rounded bg-gray-50">
                      {filteredTests.map(test => (
                          <label key={test.id} className={`flex items-center space-x-2 p-2 rounded border cursor-pointer text-sm ${testsAdministered.includes(test.id) ? 'bg-blue-100 border-blue-500' : 'bg-white hover:bg-gray-100'}`}>
                              <input type="checkbox" checked={testsAdministered.includes(test.id)} onChange={() => toggleTest(test.id)} className="rounded text-blue-600"/>
                              <span className="truncate" title={test.name}>{test.name}</span>
                          </label>
                      ))}
                  </div>
              </div>

              {/* 2. Behavioral Observations */}
              <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
                  <h3 className="font-bold text-[#003366] mb-4">Neurobehavioral Status Exam</h3>
                  <div className="grid grid-cols-2 gap-4">
                      {BEHAVIORAL_FIELDS.map(field => (
                          <div key={field.id}>
                              <label className="text-xs font-bold text-gray-500">{field.label}</label>
                              <select name={field.id} value={observations[field.id] || ''} onChange={handleObsChange} className="w-full border rounded p-2 text-sm">
                                  <option value="">Select...</option>
                                  {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                          </div>
                      ))}
                  </div>
              </div>
              
              <button onClick={() => handleSavePatient({ scores, behavioralObservations: observations, testsAdministered }, true)} className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold">Save Clinical Data</button>
          </div>
      );
  };

  const ReportEditor = () => {
    if (!activeReport) return null;
    return (
      <div className="h-[calc(100vh-100px)] flex flex-col">
        <div className="flex justify-between mb-4">
            <h2 className="text-xl font-bold">{activeReport.title}</h2>
            <button onClick={() => setView('dashboard')} className="px-4 border rounded">Close</button>
        </div>
        <textarea className="flex-1 p-8 border rounded font-mono text-sm" defaultValue={activeReport.content} />
      </div>
    );
  };

  const Dashboard = () => (
    <div className="animate-fadeIn space-y-8">
        <div className="flex justify-between items-center">
            <BrandingHeader />
            <div className="flex space-x-2">
                <button onClick={() => setView('kiosk')} className="px-4 py-2 border rounded flex items-center"><Lock className="w-4 h-4 mr-2"/> Kiosk Mode</button>
                <button onClick={() => { setActivePatient(null); setView('intake'); }} className={`px-4 py-2 rounded text-white ${BRAND_COLOR}`}>New Patient</button>
            </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
            {patients.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-xl border shadow-sm flex justify-between items-center">
                    <div>
                        <div className="font-bold text-lg">{p.lastName}, {p.firstName}</div>
                        <div className="text-sm text-gray-500">{p.dob}</div>
                    </div>
                    <div className="flex space-x-2">
                        <button onClick={() => { setActivePatient(p); setView('scoring'); }} className="px-3 py-2 bg-purple-50 text-purple-700 rounded border border-purple-200">Clinical</button>
                        <button onClick={() => handleCreateReport(p)} className="px-3 py-2 bg-gray-50 text-gray-700 rounded border">Report</button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  // Main Render with Error Boundary Wrapper
  return (
    <ErrorBoundary>
      {!isLoggedIn ? (
        <LoginScreen />
      ) : view === 'kiosk' ? (
        <div className="min-h-screen bg-gray-50 p-6"><button onClick={() => setView('dashboard')} className="fixed top-4 right-4 text-gray-300"><Lock/></button><IntakeForm isKiosk={true}/></div>
      ) : (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex">
            <aside className="hidden md:flex flex-col w-64 bg-white border-r h-screen sticky top-0 p-6">
                <div className="mb-8"><div className={`font-serif font-bold text-xl ${BRAND_TEXT}`}>INTEGRA</div></div>
                <nav className="space-y-1">
                    <button onClick={() => setView('dashboard')} className="w-full flex items-center px-4 py-3 rounded hover:bg-gray-50">Dashboard</button>
                    <button onClick={() => setView('intake')} className="w-full flex items-center px-4 py-3 rounded hover:bg-gray-50">Intake</button>
                </nav>
            </aside>
            <main className="flex-1 p-8 overflow-y-auto">
                {view === 'dashboard' && <Dashboard />}
                {view === 'intake' && <IntakeForm />}
                {view === 'scoring' && <ExpertScoringModule />}
                {view === 'report' && <ReportEditor />}
            </main>
        </div>
      )}
    </ErrorBoundary>
  );
}
