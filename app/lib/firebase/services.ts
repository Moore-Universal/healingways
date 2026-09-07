import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import {
  signOut,
} from 'firebase/auth';
import { auth, db } from './client';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  phone?: string;
  age?: string;
  gender?: string;
  country?: string;
  state?: string;
  role: 'patient' | 'admin' | 'coordinator';
  createdAt?: string;
  updatedAt?: string;
}

export interface Hospital {
  id: string;
  name: string;
  location: string;
  country?: string;
  specialties: string[];
  description: string;
  rating?: number;
  accreditation?: string;
  estimatedCost?: string;
  imageUrl?: string;
}

export interface CaseDocument {
  id: string;
  caseId: string;
  userId: string;
  name: string;
  fileSize?: number | string;
  fileType?: string;
  fileUrl?: string;
  category?: string;
  createdAt: string;
}

export interface TreatmentUpdate {
  id: string;
  caseId: string;
  title: string;
  notes: string;
  date: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
}

export interface PatientCase {
  id: string;
  case_number: string;
  user_id: string;
  patient_name: string;
  patient_email: string;
  patient_phone?: string;
  age?: string;
  gender?: string;
  country?: string;
  state?: string;
  need: string;
  support_type?: string;
  healthcare_area?: string;
  situation?: string;
  situation_description?: string;
  has_diagnosis?: string;
  diagnosis?: string;
  treatment_status?: string;
  care_outside_country?: string;
  preferred_destination?: string;
  preferred_location?: string;
  time_frame?: string;
  budget?: string;
  companions?: string;
  special_assistance?: string;
  notes?: string;
  stage: string;
  workflow_stage:
    | 'Consultation Submitted'
    | 'Case Review'
    | 'Hospital Recommendation'
    | 'Medical Itinerary'
    | 'Accommodation & Visa'
    | 'Travel Preparation'
    | 'Treatment & Recovery'
    | 'Completed';
  status: 'New' | 'Under Review' | 'In Progress' | 'Scheduled' | 'Completed' | 'Cancelled';
  priority: 'Normal' | 'Medium' | 'High' | 'Urgent';
  coordinator_id?: string | null;
  coordinator_name?: string | null;
  review_text?: string | null;
  review_sent_to_patient?: boolean;
  review_accepted?: boolean;
  review_declined?: boolean;
  review_decline_reason?: string;
  review_accepted_at?: string | null;
  selected_hospital_id?: string | null;
  selected_hospital?: Hospital | null;
  hospitals_sent_to_patient?: boolean;
  hospital_accepted?: boolean;
  hospital_declined?: boolean;
  hospital_decline_reason?: string;
  recommended_hospitals?: Hospital[];
  itinerary_notes?: string | null;
  itinerary_sent_to_patient?: boolean;
  itinerary_confirmed_by_patient?: boolean;
  itinerary_declined?: boolean;
  itinerary_decline_reason?: string;
  accommodation_details?: string | null;
  visa_details?: string | null;
  accommodation_visa_sent_to_patient?: boolean;
  accommodation_visa_confirmed_by_patient?: boolean;
  accommodation_visa_declined?: boolean;
  accommodation_visa_decline_reason?: string;
  flight_details?: string | null;
  travel_sent_to_patient?: boolean;
  confirmed_by_patient?: boolean; // flight/travel confirmed
  travel_declined?: boolean;
  travel_decline_reason?: string;
  created_at: string;
  updated_at: string;
  documents?: CaseDocument[];
  treatment_updates?: TreatmentUpdate[];
  consultation_for?: string;
  contact_name?: string;
  patient_for?: string;
  looking_for?: string;
  diagnosed?: string;
  open_to_care_abroad?: string;
  what_matters_most?: string[] | string;
  documents_submitted?: number;
  document_name?: string;
  document_status?: 'Pending Review' | 'Accepted' | 'Update Requested';
  billing_paid?: number;
  billing_outstanding?: number;
  internal_notes?: { id: string; author: string; text: string; date: string }[];
  accommodations?: { id: string; name: string; type: string; price: string; location: string }[];
  tasks?: { id: string; title: string; stage: string; status: 'open' | 'resolved'; date?: string }[];
}

// ----------------------------------------------------
// DEFAULT SEED HOSPITALS
// ----------------------------------------------------
export const DEFAULT_HOSPITALS: Hospital[] = [
  {
    id: 'hosp-1',
    name: 'Apollo Hospital International',
    location: 'Chennai, India',
    country: 'India',
    specialties: ['Orthopedic Surgery', 'Cardiology', 'Oncology', 'Joint Replacement'],
    description: 'JCI Accredited multi-specialty center renowned for robotic knee and hip joint replacements with 99.4% clinical success rate.',
    rating: 4.9,
    accreditation: 'JCI & NABH Accredited',
    estimatedCost: '$6,500 - $8,200',
  },
  {
    id: 'hosp-2',
    name: 'Bumrungrad International Hospital',
    location: 'Bangkok, Thailand',
    country: 'Thailand',
    specialties: ['Spine Surgery', 'Robotic Surgery', 'Executive Wellness', 'Neurology'],
    description: 'World-leading medical tourism center offering cutting-edge minimally invasive procedures, dedicated multilingual international coordinators, and 5-star patient suites.',
    rating: 4.9,
    accreditation: 'JCI & GHA Certified',
    estimatedCost: '$8,800 - $11,500',
  },
  {
    id: 'hosp-3',
    name: 'Anadolu Medical Center',
    location: 'Istanbul, Turkey',
    country: 'Turkey',
    specialties: ['Oncology', 'Bone Marrow Transplant', 'Neurosurgery', 'Urology'],
    description: 'Affiliated with Johns Hopkins Medicine, offering world-class care in Istanbul with comprehensive diagnostic imaging and rehabilitation facilities.',
    rating: 4.8,
    accreditation: 'JCI & ESMO Accredited',
    estimatedCost: '$7,200 - $9,400',
  },
  {
    id: 'hosp-4',
    name: 'Mount Elizabeth Hospital',
    location: 'Singapore',
    country: 'Singapore',
    specialties: ['Cardiothoracic', 'Transplant Surgery', 'Precision Oncology'],
    description: 'Premier tertiary care hospital in South East Asia with distinguished surgical teams and advanced rehabilitation robotics.',
    rating: 4.9,
    accreditation: 'JCI Accredited',
    estimatedCost: '$12,000 - $16,000',
  },
];

export const DEFAULT_COORDINATORS = [
  { id: 'coord-1', full_name: 'Sarah James', email: 'sarah.james@healingways.com', role: 'Patient Care Coordinator' },
  { id: 'coord-2', full_name: 'Dr. Elena Vance', email: 'elena.vance@healingways.com', role: 'Clinical Travel Specialist' },
  { id: 'coord-3', full_name: 'Marcus Chen', email: 'marcus.chen@healingways.com', role: 'Medical Logistics Manager' },
];

// Helper to sanitize Firestore documents
function formatDoc<T>(docSnap: { id: string; data: () => Record<string, unknown> }): T {
  const data = docSnap.data();
  const created = data.created_at as { toDate?: () => Date } | string | undefined;
  const updated = data.updated_at as { toDate?: () => Date } | string | undefined;
  return {
    id: docSnap.id,
    ...data,
    created_at: created && typeof created === 'object' && 'toDate' in created && typeof created.toDate === 'function' ? created.toDate().toISOString() : created || new Date().toISOString(),
    updated_at: updated && typeof updated === 'object' && 'toDate' in updated && typeof updated.toDate === 'function' ? updated.toDate().toISOString() : updated || new Date().toISOString(),
  } as unknown as T;
}

// ----------------------------------------------------
// AUTHENTICATION METHODS & SESSION MANAGEMENT
// ----------------------------------------------------

export const ACTIVE_USER_STORAGE_KEY = 'hw_active_user';
export const REGISTERED_USERS_KEY = 'hw_registered_users_registry';

export function getLocalRegisteredUsers(): Record<string, UserProfile & { password?: string }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalRegisteredUser(profile: UserProfile & { password?: string }): void {
  if (typeof window === 'undefined') return;
  try {
    const reg = getLocalRegisteredUsers();
    reg[profile.email.toLowerCase()] = profile;
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(reg));
  } catch {}
}

export function getStoredUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: UserProfile | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem('hw_user_email', user.email);
    } else {
      localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
      localStorage.removeItem('hw_user_email');
    }
  } catch (err) {
    console.warn('Could not update stored user:', err);
  }
}

export function getCurrentUserId(): string | null {
  if (auth.currentUser?.uid) return auth.currentUser.uid;
  return getStoredUser()?.uid || null;
}

export function getCurrentUserEmail(): string | null {
  if (auth.currentUser?.email) return auth.currentUser.email;
  return getStoredUser()?.email || null;
}

// Helper: Timeout wrapper to prevent async hanging on slower networks
function withTimeout<T>(promise: Promise<T>, ms = 3500, fallbackVal?: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallbackVal as T), ms);
  });
  return Promise.race([
    promise.then((res) => {
      clearTimeout(timer);
      return res;
    }),
    timeoutPromise,
  ]);
}

export async function getUserProfileByUid(uid: string): Promise<UserProfile | null> {
  try {
    const userDoc = await withTimeout(getDoc(doc(db, 'users', uid)), 3500, null);
    if (userDoc && userDoc.exists()) {
      return formatDoc<UserProfile>(userDoc);
    }
  } catch (err) {
    console.warn('Error reading user profile by uid:', err);
  }
  return null;
}

export async function getUserProfileByEmail(email: string): Promise<UserProfile | null> {
  const clean = email.trim().toLowerCase();
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', clean), limit(1));
    const snap = await withTimeout(getDocs(q), 3500, null);
    if (snap && !snap.empty) {
      return formatDoc<UserProfile>(snap.docs[0]);
    }
  } catch (err) {
    console.warn('Error reading user profile by email from Firestore:', err);
  }

  // Check local registry fallback
  const localReg = getLocalRegisteredUsers();
  if (localReg[clean]) {
    return localReg[clean];
  }

  return null;
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const user = auth.currentUser;
  if (user) {
    const profile = await getUserProfileByUid(user.uid);
    if (profile) return profile;
    return {
      uid: user.uid,
      email: user.email || '',
      fullName: user.displayName || user.email?.split('@')[0] || 'Patient',
      role: user.email?.toLowerCase().includes('admin') ? 'admin' : 'patient',
    };
  }

  // Check stored active user session
  const stored = getStoredUser();
  if (stored) {
    const refreshed = await getUserProfileByUid(stored.uid);
    if (refreshed) {
      setStoredUser(refreshed);
      return refreshed;
    }
    return stored;
  }

  return null;
}

export async function saveUserProfile(profile: Partial<UserProfile> & { uid: string; email: string }): Promise<void> {
  console.log('saveUserProfile called with profile:', profile);
  try {
    const userRef = doc(db, 'users', profile.uid);
    const now = new Date().toISOString();
    const cleanEmail = profile.email.trim().toLowerCase();
    const role = profile.role || (cleanEmail.includes('admin') ? 'admin' : 'patient');

    const dataToSave = {
      ...profile,
      email: cleanEmail,
      role,
      updatedAt: now,
      updated_at: now,
    };

    // Use withTimeout to prevent hanging Firestore calls on slower environments
    try {
      await withTimeout(setDoc(userRef, dataToSave, { merge: true }), 2500, undefined);
    } catch (dbErr) {
      console.warn('Firestore setDoc failed/timeout, continuing with local persistence:', dbErr);
    }

    // Always update the active stored user session so that the application instantly recognizes the user
    const currentStored = getStoredUser();
    const updatedProfile: UserProfile = {
      uid: profile.uid,
      email: cleanEmail,
      fullName: profile.fullName || currentStored?.fullName || '',
      phone: profile.phone || currentStored?.phone || '',
      country: profile.country || currentStored?.country || '',
      role: role as 'patient' | 'admin' | 'coordinator',
      createdAt: currentStored?.createdAt || now,
      updatedAt: now,
    };
    setStoredUser(updatedProfile);

    // Also persist in the local registration registry for robust authentication integration
    try {
      const reg = getLocalRegisteredUsers();
      reg[cleanEmail] = {
        ...updatedProfile,
        password: reg[cleanEmail]?.password || '', // preserve local password if any, else blank
      };
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(reg));
    } catch (regErr) {
      console.warn('Could not save to local registry fallback:', regErr);
    }
  } catch (err) {
    console.error('Error saving user profile:', err);
  }
}

export interface AuthResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
  reason?: 'not_found' | 'wrong_password' | 'email_already_in_use' | 'general';
}

/**
 * Register a new user with email and password
 */
export async function registerUser(params: {
  email: string;
  password?: string;
  fullName: string;
  role?: 'patient' | 'admin' | 'coordinator';
  phone?: string;
}): Promise<AuthResult> {
  const cleanEmail = params.email.trim().toLowerCase();
  const role = params.role || (cleanEmail.includes('admin') ? 'admin' : 'patient');

  // 1. Check if user already exists in Firestore or local registry
  const existing = await getUserProfileByEmail(cleanEmail);
  if (existing) {
    return {
      success: false,
      reason: 'email_already_in_use',
      error: 'An account with this email address already exists. Please sign in.',
    };
  }

  // 2. Generate deterministic UID for user profile
  const resolvedUid = `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now().toString(36)}`;
  const now = new Date().toISOString();
  const profile: UserProfile = {
    uid: resolvedUid,
    email: cleanEmail,
    fullName: params.fullName?.trim() || 'Patient',
    role,
    phone: params.phone || '',
    createdAt: now,
    updatedAt: now,
  };

  // 3. Save profile and credentials in Firestore (with timeout to never block UI)
  try {
    const userDocRef = doc(db, 'users', resolvedUid);
    await withTimeout(
      setDoc(userDocRef, {
        ...profile,
        password: params.password || '',
      }, { merge: true }),
      3500
    );
  } catch (err) {
    console.warn('Notice saving user to Firestore (proceeding with local store):', err);
  }

  // 4. Always cache in local registered users registry
  saveLocalRegisteredUser({
    ...profile,
    password: params.password || '',
  });

  // 5. Set active user session
  setStoredUser(profile);

  return { success: true, user: profile };
}

/**
 * Login user with email and password
 */
export async function loginUser(emailInput: string, passwordInput: string): Promise<AuthResult> {
  const cleanEmail = emailInput.trim().toLowerCase();

  // Special handling for requested Admin credentials: admin@mail.com / admin
  if (cleanEmail === 'admin@mail.com') {
    if (passwordInput === 'admin') {
      const now = new Date().toISOString();
      const adminProfile: UserProfile = {
        uid: 'admin_master_uid',
        email: 'admin@mail.com',
        fullName: 'Administrator',
        role: 'admin',
        createdAt: now,
        updatedAt: now,
      };
      setStoredUser(adminProfile);
      saveLocalRegisteredUser({
        ...adminProfile,
        password: 'admin',
      });
      return { success: true, user: adminProfile };
    } else {
      return {
        success: false,
        reason: 'wrong_password',
        error: 'Incorrect password. The admin password is "admin".',
      };
    }
  }

  // 1. First check if the account exists in Firestore or local registry
  const firestoreUserDoc = await getUserProfileByEmail(cleanEmail);

  // 2. If account does NOT exist, report not_found
  if (!firestoreUserDoc) {
    return {
      success: false,
      reason: 'not_found',
      error: 'No account found with this email address. Please sign up to create your account.',
    };
  }

  // 3. Verify password if stored
  const rawData = firestoreUserDoc as UserProfile & { password?: string };
  if (rawData.password && passwordInput && rawData.password !== passwordInput) {
    return {
      success: false,
      reason: 'wrong_password',
      error: 'Incorrect password. Please verify your credentials and try again.',
    };
  }

  // 4. Set stored session and return success
  setStoredUser(firestoreUserDoc);
  return { success: true, user: firestoreUserDoc };
}

/**
 * Log out user from both Firebase Auth and stored local session
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Sign out notice:', err);
  }
  setStoredUser(null);
  if (typeof window !== 'undefined') {
    localStorage.removeItem('hw_consultation_case_id');
    localStorage.removeItem('hw_user_token');
    localStorage.removeItem('hw_user_email');
    localStorage.removeItem('hw_user_role');
    localStorage.removeItem('hw_user_name');
    sessionStorage.removeItem('hw_login_draft_email');
    sessionStorage.removeItem('hw_login_draft_password');
    sessionStorage.removeItem('hw_login_not_found_user');
    sessionStorage.removeItem('hw_login_error_msg');
    window.dispatchEvent(new Event('storage'));
  }
}

// ----------------------------------------------------
// CASE MANAGEMENT (PATIENT & ADMIN)
// ----------------------------------------------------

/**
 * Creates or initializes a new patient case in Firestore
 */
export async function createPatientCase(caseData: Partial<PatientCase> & { user_id?: string }): Promise<PatientCase> {
  const caseNumber = caseData.case_number || `HW-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date().toISOString();
  const userId = caseData.user_id || auth.currentUser?.uid || `guest_${Date.now()}`;

  const fullCase: PatientCase = {
    id: caseData.id || `case_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    case_number: caseNumber,
    patient_name: caseData.patient_name || 'Patient',
    patient_email: caseData.patient_email || '',
    patient_phone: caseData.patient_phone || '',
    age: caseData.age || '',
    gender: caseData.gender || '',
    country: caseData.country || '',
    state: caseData.state || '',
    need: caseData.need || caseData.healthcare_area || 'General Medical Consultation',
    support_type: caseData.support_type || caseData.need || '',
    healthcare_area: caseData.healthcare_area || '',
    situation: caseData.situation || '',
    situation_description: caseData.situation_description || caseData.situation || '',
    has_diagnosis: caseData.has_diagnosis || 'Yes',
    diagnosis: caseData.diagnosis || '',
    treatment_status: caseData.treatment_status || '',
    care_outside_country: caseData.care_outside_country || 'Yes',
    preferred_destination: caseData.preferred_destination || '',
    preferred_location: caseData.preferred_location || caseData.preferred_destination || '',
    time_frame: caseData.time_frame || 'Within 1-3 months',
    budget: caseData.budget || '$5,000 - $10,000',
    companions: caseData.companions || 'None',
    special_assistance: caseData.special_assistance || 'None',
    notes: caseData.notes || '',
    stage: caseData.stage || 'Consultation Submitted',
    workflow_stage: caseData.workflow_stage || 'Consultation Submitted',
    status: caseData.status || 'New',
    priority: caseData.priority || 'Normal',
    coordinator_id: caseData.coordinator_id || null,
    coordinator_name: caseData.coordinator_name || null,
    review_text: caseData.review_text ?? null,
    review_accepted: caseData.review_accepted ?? false,
    review_accepted_at: caseData.review_accepted_at ?? null,
    selected_hospital_id: caseData.selected_hospital_id ?? null,
    selected_hospital: caseData.selected_hospital ?? null,
    recommended_hospitals: caseData.recommended_hospitals || [],
    itinerary_notes: caseData.itinerary_notes ?? null,
    itinerary_confirmed_by_patient: caseData.itinerary_confirmed_by_patient ?? false,
    accommodation_details: caseData.accommodation_details ?? null,
    visa_details: caseData.visa_details ?? null,
    accommodation_visa_confirmed_by_patient: caseData.accommodation_visa_confirmed_by_patient ?? false,
    flight_details: caseData.flight_details ?? null,
    confirmed_by_patient: caseData.confirmed_by_patient ?? false,
    created_at: caseData.created_at || now,
    updated_at: now,
    documents: caseData.documents || [],
    treatment_updates: caseData.treatment_updates || [],
    consultation_for: caseData.consultation_for || 'Myself',
    contact_name: caseData.contact_name || caseData.patient_name || '',
    user_id: userId,
  };

  // 1. Immediately save to localStorage so the application is responsive and never blocked
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('hw_active_case', JSON.stringify(fullCase));
      localStorage.setItem('hw_active_case_id', fullCase.id);
      localStorage.setItem('hw_consultation_case_id', fullCase.id);
      const casesRaw = localStorage.getItem('hw_all_cases');
      const allCases: PatientCase[] = casesRaw ? JSON.parse(casesRaw) : [];
      const idx = allCases.findIndex((c) => c.id === fullCase.id);
      if (idx >= 0) {
        allCases[idx] = fullCase;
      } else {
        allCases.unshift(fullCase);
      }
      localStorage.setItem('hw_all_cases', JSON.stringify(allCases));
    } catch {}
  }

  // 2. Persist to Firestore with a timeout so network lag never freezes the intake form
  try {
    const caseRef = doc(db, 'cases', fullCase.id);
    await withTimeout(setDoc(caseRef, fullCase, { merge: true }), 2000, undefined);
  } catch (err) {
    console.warn('Firestore case save notice (proceeding with local backup):', err);
  }

  return fullCase;
}

/**
 * Updates any specific fields of an existing patient case
 */
export async function updatePatientCase(caseId: string, updates: Partial<PatientCase>): Promise<void> {
  const now = new Date().toISOString();

  // 1. Immediately update localStorage backup
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('hw_active_case');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.id === caseId) {
          localStorage.setItem('hw_active_case', JSON.stringify({ ...parsed, ...updates, updated_at: now }));
        }
      }
      const casesRaw = localStorage.getItem('hw_all_cases');
      if (casesRaw) {
        const allCases: PatientCase[] = JSON.parse(casesRaw);
        const idx = allCases.findIndex((c) => c.id === caseId);
        if (idx >= 0) {
          allCases[idx] = { ...allCases[idx], ...updates, updated_at: now };
          localStorage.setItem('hw_all_cases', JSON.stringify(allCases));
        }
      }
    } catch {}
  }

  // 2. Persist update to Firestore with a timeout
  try {
    const caseRef = doc(db, 'cases', caseId);
    await withTimeout(setDoc(caseRef, { ...updates, updated_at: now }, { merge: true }), 2000, undefined);
  } catch (err) {
    console.warn('Firestore case update notice (proceeding with local backup):', err);
  }
}

/**
 * Retrieves a single case by its ID
 */
export async function getCaseById(caseId: string): Promise<PatientCase | null> {
  // Check local backup first
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('hw_active_case');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.id === caseId) return parsed;
      }
      const casesRaw = localStorage.getItem('hw_all_cases');
      if (casesRaw) {
        const allCases: PatientCase[] = JSON.parse(casesRaw);
        const found = allCases.find((c) => c.id === caseId);
        if (found) return found;
      }
    } catch {}
  }

  try {
    const caseRef = doc(db, 'cases', caseId);
    const snap = await withTimeout(getDoc(caseRef), 2500, null);
    if (snap && snap.exists()) {
      return formatDoc<PatientCase>(snap);
    }
  } catch (err) {
    console.warn('Error fetching case by ID from Firestore:', err);
  }

  return null;
}

/**
 * Retrieves the active case for a logged in user by UID or email
 */
export async function getUserActiveCase(userId?: string | null, userEmail?: string | null): Promise<PatientCase | null> {
  const effectiveUid = userId || getCurrentUserId();
  const effectiveEmail = userEmail || getCurrentUserEmail();

  try {
    const casesRef = collection(db, 'cases');

    if (effectiveUid) {
      try {
        const q = query(casesRef, where('user_id', '==', effectiveUid), orderBy('created_at', 'desc'), limit(1));
        const snapshot = await withTimeout(getDocs(q), 2500, null);
        if (snapshot && !snapshot.empty) {
          return formatDoc<PatientCase>(snapshot.docs[0]);
        }
      } catch {
        const qFallback = query(casesRef, where('user_id', '==', effectiveUid));
        const snapshot = await withTimeout(getDocs(qFallback), 2500, null);
        if (snapshot && !snapshot.empty) {
          return formatDoc<PatientCase>(snapshot.docs[0]);
        }
      }
    }

    if (effectiveEmail) {
      const qEmail = query(casesRef, where('patient_email', '==', effectiveEmail), limit(1));
      const snapshot = await withTimeout(getDocs(qEmail), 2500, null);
      if (snapshot && !snapshot.empty) {
        const found = formatDoc<PatientCase>(snapshot.docs[0]);
        if (effectiveUid && found.user_id !== effectiveUid) {
          try {
            await withTimeout(updateDoc(doc(db, 'cases', found.id), { user_id: effectiveUid }), 1500, undefined);
          } catch {}
        }
        return found;
      }
    }
  } catch (err) {
    console.warn('Error fetching active case from Firestore:', err);
  }

  // Check local active case backup if matching user or stored case ID
  if (typeof window !== 'undefined') {
    try {
      const activeCaseId = localStorage.getItem('hw_active_case_id') || localStorage.getItem('hw_consultation_completed_case_id');
      if (activeCaseId) {
        const found = await getCaseById(activeCaseId);
        if (found) {
          if (effectiveUid && !found.user_id) {
            found.user_id = effectiveUid;
            updatePatientCase(found.id, { user_id: effectiveUid }).catch(() => {});
          }
          return found;
        }
      }

      const stored = localStorage.getItem('hw_active_case');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          !effectiveUid ||
          parsed.user_id === effectiveUid ||
          (effectiveEmail && parsed.patient_email?.toLowerCase() === effectiveEmail.toLowerCase())
        ) {
          return parsed as PatientCase;
        }
      }

      // Check all cached cases
      const allCasesRaw = localStorage.getItem('hw_all_cases');
      if (allCasesRaw) {
        const allCases: PatientCase[] = JSON.parse(allCasesRaw);
        if (effectiveEmail) {
          const match = allCases.find((c) => c.patient_email?.toLowerCase() === effectiveEmail.toLowerCase());
          if (match) return match;
        }
        if (effectiveUid) {
          const match = allCases.find((c) => c.user_id === effectiveUid);
          if (match) return match;
        }
      }
    } catch {}
  }

  return null;
}

/**
 * Retrieves all cases for a specific user by UID or email
 */
export async function getUserCases(userId?: string | null, userEmail?: string | null): Promise<PatientCase[]> {
  const effectiveUid = userId || getCurrentUserId();
  const effectiveEmail = userEmail || getCurrentUserEmail();

  try {
    const casesRef = collection(db, 'cases');
    const casesMap = new Map<string, PatientCase>();

    if (effectiveUid) {
      try {
        const q = query(casesRef, where('user_id', '==', effectiveUid));
        const snapshot = await withTimeout(getDocs(q), 3000, null);
        if (snapshot && !snapshot.empty) {
          snapshot.docs.forEach((d) => {
            casesMap.set(d.id, formatDoc<PatientCase>(d));
          });
        }
      } catch (err) {
        console.warn('Error querying cases by user_id:', err);
      }
    }

    if (effectiveEmail) {
      try {
        const qEmail = query(casesRef, where('patient_email', '==', effectiveEmail));
        const snapshot = await withTimeout(getDocs(qEmail), 3000, null);
        if (snapshot && !snapshot.empty) {
          snapshot.docs.forEach((d) => {
            casesMap.set(d.id, formatDoc<PatientCase>(d));
          });
        }
      } catch (err) {
        console.warn('Error querying cases by patient_email:', err);
      }
    }

    if (casesMap.size > 0) {
      return Array.from(casesMap.values()).sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
    }
  } catch (err) {
    console.warn('Error fetching user cases from Firestore:', err);
  }

  // Check local active case backup
  if (typeof window !== 'undefined') {
    try {
      const activeCaseId = localStorage.getItem('hw_active_case_id') || localStorage.getItem('hw_consultation_completed_case_id');
      if (activeCaseId) {
        const found = await getCaseById(activeCaseId);
        if (found) return [found];
      }
    } catch {}
  }

  return [];
}

/**
 * Retrieves all cases for the admin dashboard
 */
export async function getAllCasesForAdmin(): Promise<PatientCase[]> {
  try {
    const casesRef = collection(db, 'cases');
    const snapshot = await withTimeout(getDocs(casesRef), 3000, null);
    if (snapshot && !snapshot.empty) {
      const cases: PatientCase[] = [];
      snapshot.forEach((d) => {
        cases.push(formatDoc<PatientCase>(d));
      });
      // Sort descending by created_at
      return cases.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  } catch (err) {
    console.warn('Error fetching admin cases from Firestore:', err);
  }

  // Fallback to local cases if Firestore times out
  if (typeof window !== 'undefined') {
    try {
      const casesRaw = localStorage.getItem('hw_all_cases');
      if (casesRaw) {
        const parsed: PatientCase[] = JSON.parse(casesRaw);
        return parsed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
      const activeRaw = localStorage.getItem('hw_active_case');
      if (activeRaw) {
        return [JSON.parse(activeRaw)];
      }
    } catch {}
  }

  return [];
}

/**
 * Initial cases seeder
 */
export async function ensureInitialCasesSeeded(): Promise<void> {
  return;
}

// ----------------------------------------------------
// SEQUENTIAL STAGE ACTIONS & CONFIRMATIONS
// ----------------------------------------------------

export const JOURNEY_STAGES = [
  'Consultation Submitted',
  'Case Review',
  'Hospital Recommendation',
  'Medical Itinerary',
  'Accommodation & Visa',
  'Travel Preparation',
  'Treatment & Recovery',
  'Completed',
] as const;

export type JourneyStageName = (typeof JOURNEY_STAGES)[number];

/**
 * Returns the numerical step number (1 to 8) for any stage name string
 */
export function getJourneyStepNumber(stageName?: string | null): number {
  if (!stageName) return 1;
  const s = stageName.toLowerCase().trim();
  if (s.includes('completed') || s.includes('post-care') || s.includes('finished')) return 8;
  if (s.includes('treatment & recovery') || s.includes('recovery') || s.includes('treatment') || s.includes('milestone')) return 7;
  if (s.includes('travel preparation') || s.includes('travel') || s.includes('flight') || s.includes('logistics')) return 6;
  if (s.includes('accommodation & visa') || s.includes('accommodation') || s.includes('visa') || s.includes('hotel')) return 5;
  if (s.includes('medical itinerary') || s.includes('itinerary') || s.includes('treatment plan') || s.includes('schedule')) return 4;
  if (s.includes('hospital recommendation') || s.includes('recommendation') || s.includes('hospital')) return 3;
  if (s.includes('case review') || s.includes('review') || s.includes('consultation')) {
    if (s.includes('submitted') || s.includes('inquiry') || s.includes('intake')) return 1;
    return 2;
  }
  return 1;
}

/**
 * Checks if a specific journey step (1 to 7) is unlocked and accessible.
 * If the patient's case has already reached or passed this step, it is ALWAYS allowed.
 * Otherwise, verifies if prerequisite conditions are satisfied.
 */
export function checkStepAccess(stepNumber: number, activeCase: PatientCase | null): {
  allowed: boolean;
  reason?: string;
  requiredStep?: number;
} {
  // Step 1 (Consultation Submitted / Journey Dashboard) is always accessible
  if (stepNumber <= 1) {
    return { allowed: true };
  }

  // If no case exists at all, all subsequent steps are locked
  if (!activeCase) {
    return {
      allowed: false,
      reason: 'You must first submit your Initial Consultation to initialize your clinical case file.',
      requiredStep: 1,
    };
  }

  // If case's current workflow stage is already at or past this step, it is unlocked
  const caseCurrentStep = getJourneyStepNumber(activeCase.workflow_stage || activeCase.stage);
  if (stepNumber <= caseCurrentStep) {
    return { allowed: true };
  }

  // Step 2: Case Review
  // Requires: Step 1 (Intake) submitted by patient AND admin has reviewed and sent it back
  if (stepNumber === 2) {
    const adminReviewed = !!(activeCase.review_text || activeCase.review_sent_to_patient);
    if (!adminReviewed && caseCurrentStep < 2) {
      return {
        allowed: false,
        reason: 'Your case is currently under evaluation by our Senior Medical Board. Case Review will unlock as soon as the doctor submits and sends the clinical assessment.',
        requiredStep: 1,
      };
    }
    return { allowed: true };
  }

  // Step 3: Hospital Recommendation
  // Requires: Step 2 dealt with: Patient must have accepted the Case Review
  if (stepNumber === 3) {
    if (!activeCase.review_accepted && caseCurrentStep < 3) {
      return {
        allowed: false,
        reason: 'You must review and accept the doctor’s clinical assessment in Step 2 (Case Review) before hospital recommendations can be unlocked.',
        requiredStep: 2,
      };
    }
    return { allowed: true };
  }

  // Step 4: Medical Itinerary
  // Requires: Step 3 dealt with: Patient must have accepted / selected a recommended hospital
  if (stepNumber === 4) {
    if ((!activeCase.selected_hospital_id || activeCase.hospital_declined) && caseCurrentStep < 4) {
      return {
        allowed: false,
        reason: 'You must select and confirm your preferred accredited hospital in Step 3 (Hospital Recommendation) before the medical itinerary can be unlocked.',
        requiredStep: 3,
      };
    }
    return { allowed: true };
  }

  // Step 5: Accommodation & Visa
  // Requires: Step 4 dealt with: Patient must have accepted the Medical Itinerary
  if (stepNumber === 5) {
    if (!activeCase.itinerary_confirmed_by_patient && caseCurrentStep < 5) {
      return {
        allowed: false,
        reason: 'You must review and confirm your clinical care schedule in Step 4 (Medical Itinerary) before accommodation and visa arrangements can be unlocked.',
        requiredStep: 4,
      };
    }
    return { allowed: true };
  }

  // Step 6: Travel Preparation
  // Requires: Step 5 dealt with: Patient must have accepted the Accommodation & Visa plan
  if (stepNumber === 6) {
    if (!activeCase.accommodation_visa_confirmed_by_patient && caseCurrentStep < 6) {
      return {
        allowed: false,
        reason: 'You must review and confirm your accommodation and visa arrangements in Step 5 before travel preparation can be unlocked.',
        requiredStep: 5,
      };
    }
    return { allowed: true };
  }

  // Step 7: Treatment & Recovery
  // Requires: Step 6 dealt with: Patient must have confirmed travel logistics
  if (stepNumber === 7) {
    if (!activeCase.confirmed_by_patient && caseCurrentStep < 7) {
      return {
        allowed: false,
        reason: 'You must confirm your travel preparation and flight logistics in Step 6 before treatment & recovery monitoring can be unlocked.',
        requiredStep: 6,
      };
    }
    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * Admin advances or sets the journey stage directly for a patient case.
 * Ensures stage-specific prerequisite flags are maintained so both admin and patient can progress smoothly.
 */
export async function adminAdvanceCaseStage(caseId: string, newStage: string): Promise<void> {
  const targetStepNumber = getJourneyStepNumber(newStage);
  const updates: Partial<PatientCase> = {
    workflow_stage: newStage as PatientCase['workflow_stage'],
    stage: newStage,
  };

  // If advancing forward, ensure prerequisites for that stage are satisfied in case document
  if (targetStepNumber >= 2) {
    updates.review_sent_to_patient = true;
    if (!updates.status || updates.status === 'New') {
      updates.status = 'Under Review';
    }
  }
  if (targetStepNumber >= 3) {
    updates.review_accepted = true;
    updates.review_declined = false;
    if (updates.status === 'Under Review') {
      updates.status = 'In Progress';
    }
  }
  if (targetStepNumber >= 4) {
    updates.hospital_accepted = true;
    updates.hospital_declined = false;
  }
  if (targetStepNumber >= 5) {
    updates.itinerary_confirmed_by_patient = true;
    updates.itinerary_declined = false;
  }
  if (targetStepNumber >= 6) {
    updates.accommodation_visa_confirmed_by_patient = true;
    updates.accommodation_visa_declined = false;
  }
  if (targetStepNumber >= 7) {
    updates.confirmed_by_patient = true;
    updates.travel_declined = false;
    updates.status = 'Scheduled';
  }
  if (targetStepNumber >= 8) {
    updates.status = 'Completed';
  }

  await updatePatientCase(caseId, updates);
}

/**
 * Admin publishes or updates the clinical case review and sends it to the patient
 */
export async function adminSubmitCaseReview(caseId: string, reviewText: string): Promise<void> {
  await updatePatientCase(caseId, {
    review_text: reviewText,
    review_sent_to_patient: true,
    review_accepted: false,
    review_declined: false,
    review_decline_reason: '',
    review_accepted_at: null,
    workflow_stage: 'Case Review',
    stage: 'Case Review',
    status: 'In Progress',
  });
}

/**
 * Patient accepts the Case Review to unlock Hospital Recommendation (Step 3)
 */
export async function patientAcceptCaseReview(caseId: string): Promise<void> {
  await updatePatientCase(caseId, {
    review_accepted: true,
    review_declined: false,
    review_accepted_at: new Date().toISOString(),
    workflow_stage: 'Hospital Recommendation',
    stage: 'Hospital Recommendation',
  });
}

/**
 * Patient declines the Case Review and requests revisions from the admin/doctor
 */
export async function patientDeclineCaseReview(caseId: string, reason: string): Promise<void> {
  await updatePatientCase(caseId, {
    review_accepted: false,
    review_declined: true,
    review_decline_reason: reason,
    status: 'Under Review',
  });
}

/**
 * Admin updates hospital recommendations for a case and sends to patient
 */
export async function adminSetRecommendedHospitals(caseId: string, hospitals: Hospital[]): Promise<void> {
  await updatePatientCase(caseId, {
    recommended_hospitals: hospitals,
    hospitals_sent_to_patient: true,
    hospital_accepted: false,
    hospital_declined: false,
    hospital_decline_reason: '',
  });
}

/**
 * Patient selects a recommended hospital to unlock Medical Itinerary (Step 4)
 */
export async function patientSelectHospital(caseId: string, hospitalId: string, hospitalObj?: Hospital): Promise<void> {
  await updatePatientCase(caseId, {
    selected_hospital_id: hospitalId,
    selected_hospital: hospitalObj || null,
    hospital_accepted: true,
    hospital_declined: false,
    workflow_stage: 'Medical Itinerary',
    stage: 'Medical Itinerary',
  });
}

/**
 * Patient declines the hospital options and requests alternative choices
 */
export async function patientDeclineHospitals(caseId: string, reason: string): Promise<void> {
  await updatePatientCase(caseId, {
    hospital_accepted: false,
    hospital_declined: true,
    hospital_decline_reason: reason,
  });
}

/**
 * Admin sets or updates the Medical Itinerary schedule and sends to patient
 */
export async function adminSetMedicalItinerary(caseId: string, itineraryNotes: string): Promise<void> {
  await updatePatientCase(caseId, {
    itinerary_notes: itineraryNotes,
    itinerary_sent_to_patient: true,
    itinerary_confirmed_by_patient: false,
    itinerary_declined: false,
    itinerary_decline_reason: '',
  });
}

/**
 * Patient confirms the Medical Itinerary to unlock Accommodation & Visa (Step 5)
 */
export async function patientConfirmMedicalItinerary(caseId: string): Promise<void> {
  await updatePatientCase(caseId, {
    itinerary_confirmed_by_patient: true,
    itinerary_declined: false,
    workflow_stage: 'Accommodation & Visa',
    stage: 'Accommodation & Visa',
  });
}

/**
 * Patient declines the itinerary schedule and requests changes
 */
export async function patientDeclineMedicalItinerary(caseId: string, reason: string): Promise<void> {
  await updatePatientCase(caseId, {
    itinerary_confirmed_by_patient: false,
    itinerary_declined: true,
    itinerary_decline_reason: reason,
  });
}

/**
 * Admin sets Accommodation & Visa arrangements and sends to patient
 */
export async function adminSetAccommodationAndVisa(caseId: string, accommodationDetails: string, visaDetails: string): Promise<void> {
  await updatePatientCase(caseId, {
    accommodation_details: accommodationDetails,
    visa_details: visaDetails,
    accommodation_visa_sent_to_patient: true,
    accommodation_visa_confirmed_by_patient: false,
    accommodation_visa_declined: false,
    accommodation_visa_decline_reason: '',
  });
}

/**
 * Patient confirms Accommodation & Visa to unlock Travel Preparation (Step 6)
 */
export async function patientConfirmAccommodationAndVisa(caseId: string): Promise<void> {
  await updatePatientCase(caseId, {
    accommodation_visa_confirmed_by_patient: true,
    accommodation_visa_declined: false,
    workflow_stage: 'Travel Preparation',
    stage: 'Travel Preparation',
  });
}

/**
 * Patient declines accommodation & visa and requests modifications
 */
export async function patientDeclineAccommodationAndVisa(caseId: string, reason: string): Promise<void> {
  await updatePatientCase(caseId, {
    accommodation_visa_confirmed_by_patient: false,
    accommodation_visa_declined: true,
    accommodation_visa_decline_reason: reason,
  });
}

/**
 * Admin sets Travel / Flight preparation details and sends to patient
 */
export async function adminSetTravelDetails(caseId: string, flightDetails: string): Promise<void> {
  await updatePatientCase(caseId, {
    flight_details: flightDetails,
    travel_sent_to_patient: true,
    confirmed_by_patient: false,
    travel_declined: false,
    travel_decline_reason: '',
  });
}

/**
 * Patient confirms Travel Details to unlock Treatment & Recovery (Step 7)
 */
export async function patientConfirmTravel(caseId: string): Promise<void> {
  await updatePatientCase(caseId, {
    confirmed_by_patient: true,
    travel_declined: false,
    workflow_stage: 'Treatment & Recovery',
    stage: 'Treatment & Recovery',
    status: 'Scheduled',
  });
}

/**
 * Patient declines travel details and requests itinerary modification
 */
export async function patientDeclineTravel(caseId: string, reason: string): Promise<void> {
  await updatePatientCase(caseId, {
    confirmed_by_patient: false,
    travel_declined: true,
    travel_decline_reason: reason,
  });
}

/**
 * Adds a new clinical/recovery update for a patient during Treatment & Recovery
 */
export async function addTreatmentUpdate(caseId: string, update: Omit<TreatmentUpdate, 'id' | 'caseId' | 'createdAt'>): Promise<TreatmentUpdate> {
  const updateId = `upd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const fullUpdate: TreatmentUpdate = {
    id: updateId,
    caseId,
    title: update.title,
    notes: update.notes,
    date: update.date || new Date().toLocaleDateString('en-GB'),
    authorName: update.authorName || 'Care Coordinator',
    authorRole: update.authorRole || 'Clinical Lead',
    createdAt: now,
  };

  // Add to Firestore collection
  try {
    const updRef = doc(db, 'treatment_updates', updateId);
    await setDoc(updRef, fullUpdate);
  } catch (err) {
    console.error('Error saving treatment update document:', err);
  }

  // Also append into case record's array
  try {
    const currentCase = await getCaseById(caseId);
    if (currentCase) {
      const existing = currentCase.treatment_updates || [];
      await updatePatientCase(caseId, {
        treatment_updates: [fullUpdate, ...existing],
      });
    }
  } catch (err) {
    console.error('Error updating case treatment updates array:', err);
  }

  return fullUpdate;
}

/**
 * Fetches all treatment updates for a specific case
 */
export async function getTreatmentUpdatesForCase(caseId: string): Promise<TreatmentUpdate[]> {
  try {
    const updatesRef = collection(db, 'treatment_updates');
    const q = query(updatesRef, where('caseId', '==', caseId), orderBy('createdAt', 'desc'));
    const snap = await withTimeout(getDocs(q), 2500, null);
    if (snap && !snap.empty) {
      return snap.docs.map((d) => formatDoc<TreatmentUpdate>(d));
    }
  } catch (_err) {
    // Fallback: load from case document directly
    const caseDoc = await getCaseById(caseId);
    if (caseDoc && caseDoc.treatment_updates) {
      return caseDoc.treatment_updates;
    }
  }
  return [];
}

/**
 * Registers an uploaded document in Firestore
 */
export async function saveCaseDocument(docData: Omit<CaseDocument, 'id' | 'createdAt'>): Promise<CaseDocument> {
  const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const fullDoc: CaseDocument = {
    id: docId,
    caseId: docData.caseId,
    userId: docData.userId,
    name: docData.name,
    fileSize: docData.fileSize,
    fileType: docData.fileType,
    fileUrl: docData.fileUrl || '',
    category: docData.category || 'Medical Record',
    createdAt: now,
  };

  try {
    const docRef = doc(db, 'documents', docId);
    await setDoc(docRef, fullDoc);
  } catch (err) {
    console.error('Error saving document to Firestore:', err);
  }

  // Also append to case document record
  try {
    const currentCase = await getCaseById(docData.caseId);
    if (currentCase) {
      const existing = currentCase.documents || [];
      await updatePatientCase(docData.caseId, {
        documents: [fullDoc, ...existing],
      });
    }
  } catch (err) {
    console.error('Error updating case documents array:', err);
  }

  return fullDoc;
}

// ----------------------------------------------------
// REAL-TIME DIRECT MESSAGING (PATIENT & ADMIN)
// ----------------------------------------------------

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Info: ', JSON.stringify(errInfo));
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('insufficient permissions') || msg.includes('Missing or insufficient permissions')) {
    throw new Error(JSON.stringify(errInfo));
  }
}

export interface ChatMessage {
  id: string;
  caseId: string;
  sender: 'user' | 'agent';
  senderName: string;
  senderRole?: 'patient' | 'coordinator' | 'admin';
  senderId?: string;
  text: string;
  timestamp: string;
  createdAt: string;
  read?: boolean;
}

/**
 * Sends a message between patient and admin/care coordinator
 */
export async function sendChatMessage(params: {
  caseId: string;
  altCaseId?: string;
  sender: 'user' | 'agent';
  senderName: string;
  senderRole?: 'patient' | 'coordinator' | 'admin';
  senderId?: string;
  text: string;
}): Promise<ChatMessage> {
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const message: ChatMessage = {
    id: msgId,
    caseId: params.caseId,
    sender: params.sender,
    senderName: params.senderName,
    senderRole: params.senderRole || (params.sender === 'agent' ? 'coordinator' : 'patient'),
    senderId: params.senderId || (params.sender === 'agent' ? 'coordinator_sarah' : getCurrentUserId() || 'patient_user'),
    text: params.text.trim(),
    timestamp: timeFormatted,
    createdAt: now.toISOString(),
    read: false,
  };

  // 1. Optimistic LocalStorage caching for both primary and alternate IDs
  if (typeof window !== 'undefined') {
    try {
      const keys = [params.caseId, params.altCaseId].filter(Boolean) as string[];
      for (const k of keys) {
        const storageKey = `hw_chat_msgs_${k}`;
        const raw = localStorage.getItem(storageKey);
        const list: ChatMessage[] = raw ? JSON.parse(raw) : [];
        list.push(message);
        localStorage.setItem(storageKey, JSON.stringify(list));
      }

      // Track global latest message by case
      const summariesRaw = localStorage.getItem('hw_conversations_meta') || '{}';
      const summaries = JSON.parse(summariesRaw);
      summaries[params.caseId] = {
        lastMessage: message.text,
        lastTimestamp: timeFormatted,
        lastSender: message.sender,
        updatedAt: message.createdAt,
      };
      if (params.altCaseId) {
        summaries[params.altCaseId] = summaries[params.caseId];
      }
      localStorage.setItem('hw_conversations_meta', JSON.stringify(summaries));

      // Dispatch event for instant reactive updates across components in the same tab
      window.dispatchEvent(new CustomEvent('hw_new_chat_message', { detail: message }));
    } catch (e) {
      console.warn('Notice updating local chat cache:', e);
    }
  }

  // 2. Persist to Firestore
  try {
    const msgRef = doc(db, 'messages', msgId);
    await setDoc(msgRef, message);
  } catch (err) {
    console.error('Error persisting chat message to Firestore:', err);
    try {
      handleFirestoreError(err, OperationType.CREATE, `messages/${msgId}`);
    } catch {}
  }

  return message;
}

/**
 * Subscribes to real-time messages for a given case ID (and optional alt ID)
 */
export function subscribeToCaseMessages(
  caseId: string,
  onUpdate: (messages: ChatMessage[]) => void,
  altCaseId?: string,
  defaultInitialText?: string
): () => void {
  let isUnsubscribed = false;

  const targetKeys = Array.from(new Set([caseId, altCaseId].filter(Boolean) as string[]));

  // Local helper to read cache
  const getCachedMessages = (): ChatMessage[] => {
    if (typeof window !== 'undefined') {
      try {
        for (const k of targetKeys) {
          const raw = localStorage.getItem(`hw_chat_msgs_${k}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          }
        }
      } catch {}
    }
    return [];
  };

  const initialWelcome: ChatMessage = {
    id: `init_${caseId}`,
    caseId,
    sender: 'agent',
    senderName: 'Sarah James',
    senderRole: 'coordinator',
    text:
      defaultInitialText ||
      "Thanks for reaching out — we've received your consultation request and will begin reviewing your case shortly.",
    timestamp: 'Just now',
    createdAt: new Date().toISOString(),
    read: true,
  };

  // Initial load from cache or fallback welcome
  const cached = getCachedMessages();
  if (cached.length > 0) {
    onUpdate(cached);
  } else {
    onUpdate([initialWelcome]);
  }

  // Same-window instant sync listener
  const handleLocalEvent = (e: Event) => {
    if (isUnsubscribed) return;
    const detail = (e as CustomEvent<ChatMessage>).detail;
    if (detail && targetKeys.includes(detail.caseId)) {
      const current = getCachedMessages();
      if (current.length > 0) {
        onUpdate(current);
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('hw_new_chat_message', handleLocalEvent);
  }

  // Firestore real-time listener
  let firestoreUnsubscribe: (() => void) | null = null;
  try {
    const messagesRef = collection(db, 'messages');
    // Query with single caseId or 'in' array if multiple keys
    const q =
      targetKeys.length === 1
        ? query(messagesRef, where('caseId', '==', targetKeys[0]))
        : query(messagesRef, where('caseId', 'in', targetKeys.slice(0, 10)));

    firestoreUnsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (isUnsubscribed) return;
        if (!snapshot.empty) {
          const fetched: ChatMessage[] = [];
          snapshot.forEach((d) => {
            fetched.push(formatDoc<ChatMessage>(d));
          });

          // Sort chronologically
          fetched.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

          // Save to local cache
          if (typeof window !== 'undefined') {
            try {
              for (const k of targetKeys) {
                localStorage.setItem(`hw_chat_msgs_${k}`, JSON.stringify(fetched));
              }
            } catch {}
          }

          onUpdate(fetched);
        } else {
          // If no messages on Firestore yet, keep cached or default welcome
          const latestCached = getCachedMessages();
          if (latestCached.length > 0) {
            onUpdate(latestCached);
          } else {
            onUpdate([initialWelcome]);
          }
        }
      },
      (error) => {
        console.warn('onSnapshot message sync notice (falling back to cache):', error);
      }
    );
  } catch (err) {
    console.warn('Could not establish Firestore snapshot listener:', err);
  }

  return () => {
    isUnsubscribed = true;
    if (firestoreUnsubscribe) firestoreUnsubscribe();
    if (typeof window !== 'undefined') {
      window.removeEventListener('hw_new_chat_message', handleLocalEvent);
    }
  };
}

/**
 * Retrieves all direct message conversations for the admin panel
 */
export async function getAdminConversations(): Promise<
  Array<{
    id: string;
    caseRecordId: string;
    name: string;
    caseId: string;
    avatarLetter: string;
    unread?: boolean;
    lastMessage: string;
  }>
> {
  // Load real cases from admin service
  const cases = await getAllCasesForAdmin();

  // Read conversation metadata from localStorage if any
  let meta: Record<string, { lastMessage: string; lastTimestamp?: string }> = {};
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('hw_conversations_meta');
      if (raw) meta = JSON.parse(raw);
    } catch {}
  }

  return cases.map((c, idx) => {
    const caseMeta = meta[c.id] || meta[c.case_number];
    const initialName = c.patient_name || 'Patient';
    const firstLetter = initialName.charAt(0).toUpperCase() || 'P';

    return {
      id: c.id,
      caseRecordId: c.id,
      name: initialName,
      caseId: c.case_number || `HW-2026-${c.id.substring(0, 6)}`,
      avatarLetter: firstLetter,
      unread: idx === 0,
      lastMessage:
        caseMeta?.lastMessage ||
        (c.situation
          ? c.situation
          : "Thanks for reaching out — we've received your consultation request and will begin reviewing your case shortly."),
    };
  });
}
