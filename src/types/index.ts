export interface ConditionAllergyItem {
  name: string;
  severity: 'Mild' | 'Moderate' | 'Severe' | string;
  notes?: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  purpose?: string;
  date?: string;
  reminderMorning?: boolean;
  reminderAfternoon?: boolean;
  reminderNight?: boolean;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface MedicalDocument {
  id: string;
  name: string;
  date: string;
  size: string;
  category: string;
  url?: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  time: string;
  unread: boolean;
}

export interface PrivacySettings {
  showVitals: boolean;
  showConditions: boolean;
  showAllergies: boolean;
  showMedications: boolean;
  showContacts: boolean;
}

export interface PatientRecord {
  name: string;
  age: string;
  gender: string;
  bloodGroup: string;
  height: string;
  weight: string;
  photo: string;
  dateOfBirth: string;
  mobileNumber: string;
  conditions: ConditionAllergyItem[];
  allergies: ConditionAllergyItem[];
  medications: Medication[];
  contacts: EmergencyContact[];
  documents: MedicalDocument[];
  qrId: string;
}

export interface UserProfile {
  email: string;
  phone: string;
  patientRecord: PatientRecord;
  privacySettings: PrivacySettings;
  notifications: NotificationItem[];
}

export interface AuthUser {
  uid: string;
  email: string;
}

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  showVitals: true,
  showConditions: true,
  showAllergies: true,
  showMedications: true,
  showContacts: true,
};

export const createEmptyPatientRecord = (userId: string): PatientRecord => ({
  name: '',
  age: '',
  gender: '',
  bloodGroup: '',
  height: '',
  weight: '',
  photo: '',
  dateOfBirth: '',
  mobileNumber: '',
  conditions: [],
  allergies: [],
  medications: [],
  contacts: [],
  documents: [],
  qrId: `mqr-${userId.slice(0, 8)}`,
});
