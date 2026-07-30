import React, { useEffect, useState, useRef, useCallback } from 'react';
const formatTime = (timeStr?: string) => {
  if (!timeStr) return '';
  try {
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return displayHour + ':' + minutes + ' ' + ampm;
  } catch (err) {
    return timeStr;
  }
};
import { useParams } from 'react-router-dom';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import { Button } from '../components/Button';
import type { PatientRecord, PrivacySettings } from '../types';

// Define Custom Document interface for Dhoni's documents
interface DhoniDocument {
  id: string;
  name: string;
  date: string;
  type: string;
  size?: string;
  category?: string;
  url?: string;
}

// Define Extended types for Dhoni's extra fields, overriding 'documents'
interface ExtendedPatientRecord extends Omit<PatientRecord, 'documents'> {
  dob?: string;
  phone?: string;
  email?: string;
  address?: string;
  bp?: string;
  diabetes?: string;
  smoking?: string;
  alcohol?: string;
  organDonor?: string;
  physicallyActive?: string;
  medicalHistory?: string[];
  previousSurgeries?: string[];
  labResults?: Array<{
    test: string;
    result: string;
    range: string;
    date: string;
  }>;
  lastVisit?: {
    date: string;
    doctor: string;
    specialization: string;
    clinic: string;
    notes: string;
  };
  additionalNotes?: string;
  authorization?: {
    label: string;
    doctor: string;
    credentials: string;
    regNo: string;
  };
  documents: DhoniDocument[];
}

// Fallback Mock Data for David Miller (mqr-david-8823)
const MOCK_DAVID_DATA = {
  patientRecord: {
    name: "David Miller",
    age: "37",
    gender: "Male",
    bloodGroup: "O+",
    height: "182",
    weight: "78",
    photo: "",
    dateOfBirth: "1985-10-14",
    mobileNumber: "+1 (555) 019-2834",
    dob: "14 October 1985",
    phone: "+1 (555) 019-2834",
    email: "david.miller@example.com",
    address: "San Francisco, CA, USA",
    bp: "115 / 75 mmHg",
    diabetes: "Yes",
    smoking: "Non-Smoker",
    alcohol: "Socially",
    organDonor: "Yes",
    physicallyActive: "Yes",
    conditions: [
      { name: "Type 1 Diabetes", severity: "Moderate", notes: "Type 1 Diabetes" }
    ],
    allergies: [
      { name: "Penicillin", severity: "Severe", notes: "Risk of Anaphylaxis" }
    ],
    medications: [
      { name: "Insulin Glargine", dosage: "20 units", frequency: "Nightly", purpose: "Diabetes Management" }
    ],
    contacts: [
      { name: "Sarah Mercer", relationship: "Wife", phone: "+1 (555) 019-2835" },
      { name: "Dr. Emily Chen", relationship: "Primary Physician", phone: "+1 (555) 489-1029" }
    ],
    medicalHistory: [
      "Diagnosed with Type 1 Diabetes in 2012"
    ],
    previousSurgeries: [
      "Tonsillectomy - 1995"
    ],
    labResults: [
      { test: "HbA1c", result: "6.2%", range: "< 5.7% (Normal), 5.7 - 6.4% (Prediabetes)", date: "12 April 2026" }
    ],
    lastVisit: {
      date: "12 April 2026",
      doctor: "Dr. Emily Chen",
      specialization: "Endocrinologist",
      clinic: "Bay Area Diabetes Clinic",
      notes: "Blood sugar levels are stable. Maintain current insulin dosage."
    },
    additionalNotes: "Patient carries glucagon emergency kit in backpack. In case of severe hypoglycemia, administer glucagon immediately.",
    documents: [
      { id: "doc-1", name: "Blood Report", date: "12 April 2026", type: "PDF" }
    ],
    authorization: {
      label: "Authorized By",
      doctor: "Dr. Emily Chen",
      credentials: "MD (Endocrinology)",
      regNo: "Reg. No: CA-98425"
    },
    qrId: "mqr-david-8823"
  },
  privacySettings: {
    showVitals: true,
    showConditions: true,
    showAllergies: true,
    showMedications: true,
    showContacts: true
  }
};

// Fallback Mock Data for Dhoni (MQ-784512)
const MOCK_DHONI_DATA = {
  patientRecord: {
    name: "Dhoni",
    age: "37",
    gender: "Male",
    bloodGroup: "A+",
    height: "181",
    weight: "78",
    photo: "",
    dateOfBirth: "1987-07-07",
    mobileNumber: "+91 98765 43210",
    dob: "07 July 1987",
    phone: "+91 98765 43210",
    email: "dhoni@example.com",
    address: "Chennai, Tamil Nadu, India",
    bp: "120 / 80 mmHg",
    diabetes: "No",
    smoking: "Non-Smoker",
    alcohol: "Occasional",
    organDonor: "Yes",
    physicallyActive: "Yes",
    conditions: [
      { name: "None", severity: "None", notes: "No chronic conditions" }
    ],
    allergies: [
      { name: "Penicillin", severity: "Severe", notes: "Severe allergic reaction" },
      { name: "Peanuts", severity: "Severe", notes: "Severe allergic reaction" }
    ],
    medications: [
      { name: "Lisinopril", dosage: "10 mg", frequency: "Once Daily", purpose: "Blood Pressure" },
      { name: "Atorvastatin", dosage: "20 mg", frequency: "Once Daily", purpose: "Cholesterol" },
      { name: "Vitamin D3", dosage: "1000 IU", frequency: "Once Daily", purpose: "Supplement" },
      { name: "Aspirin (Low Dose)", dosage: "81 mg", frequency: "Once Daily", purpose: "Heart Protection" }
    ],
    contacts: [
      { name: "Sarah Miller", relationship: "Spouse", phone: "+1 (555) 019-2835" },
      { name: "Dr. Arthur Brown", relationship: "Physician", phone: "+1 (555) 019-2836" }
    ],
    medicalHistory: [
      "Hypertension diagnosed in 2019",
      "High Cholesterol diagnosed in 2021",
      "No history of heart attack or stroke",
      "No history of asthma or COPD"
    ],
    previousSurgeries: [
      "Appendectomy – 2010",
      "Right Knee Arthroscopy – 2018",
      "Tonsillectomy – 1998"
    ],
    labResults: [
      { test: "Hemoglobin", result: "15.2 g/dL", range: "13.0 – 17.0 g/dL", date: "12 May 2024" },
      { test: "Blood Sugar (Fasting)", result: "92 mg/dL", range: "70 – 100 mg/dL", date: "12 May 2024" },
      { test: "Cholesterol (Total)", result: "168 mg/dL", range: "< 200 mg/dL", date: "12 May 2024" },
      { test: "HDL", result: "52 mg/dL", range: "> 40 mg/dL", date: "12 May 2024" },
      { test: "LDL", result: "98 mg/dL", range: "< 130 mg/dL", date: "12 May 2024" }
    ],
    lastVisit: {
      date: "12 May 2024",
      doctor: "Dr. Arthur Brown",
      specialization: "Cardiologist",
      clinic: "City Heart Clinic, Chennai",
      notes: "Patient is stable. Continue current medications."
    },
    additionalNotes: "Patient has severe allergies to Penicillin and Peanuts. Carry antihistamine in case of allergic reaction. In case of emergency, please contact the emergency contact person immediately.",
    documents: [
      { id: "doc-dhoni-1", name: "Prescription", date: "12 May 2024", type: "PDF" },
      { id: "doc-dhoni-2", name: "Blood Report", date: "12 May 2024", type: "PDF" },
      { id: "doc-dhoni-3", name: "ECG Report", date: "12 May 2024", type: "PDF" },
      { id: "doc-dhoni-4", name: "X-Ray Chest", date: "12 May 2024", type: "PDF" }
    ],
    authorization: {
      label: "Authorized By",
      doctor: "Dr. Arthur Brown",
      credentials: "MBBS, MD (Cardiology)",
      regNo: "Reg. No: TN-78562"
    },
    qrId: "mq-784512"
  },
  privacySettings: {
    showVitals: true,
    showConditions: true,
    showAllergies: true,
    showMedications: true,
    showContacts: true
  }
};

export const PublicEmergencyProfile: React.FC = () => {
  const { qrId } = useParams<{ qrId: string }>();
  const todayDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const [recordData, setRecordData] = useState<{ patientRecord: ExtendedPatientRecord; privacySettings: PrivacySettings } | null>(null);
  const [loading, setLoading] = useState(true);

  // Security gate states
  const [gatePassed, setGatePassed] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [useCamera, setUseCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Document modal & profile locking states
  const [selectedDoc, setSelectedDoc] = useState<DhoniDocument | null>(null);

  const handleOpenDoc = () => {
    if (!selectedDoc || !selectedDoc.url) return;
    if (selectedDoc.url.startsWith('data:')) {
      try {
        const base64Parts = selectedDoc.url.split(',');
        const contentType = base64Parts[0].split(':')[1].split(';')[0];
        const byteCharacters = atob(base64Parts[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } catch (e) {
        console.error('Failed to open base64 document:', e);
        window.open(selectedDoc.url, '_blank');
      }
    } else {
      window.open(selectedDoc.url, '_blank');
    }
  };

  const getDocStyle = (category: string) => {
    switch (category) {
      case 'Prescription':
        return { icon: 'medication', iconColor: 'text-emerald-500', badgeStyle: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
      case 'Lab Report':
        return { icon: 'science', iconColor: 'text-amber-500', badgeStyle: 'bg-amber-50 text-amber-600 border-amber-100' };
      case 'Insurance':
        return { icon: 'health_and_safety', iconColor: 'text-blue-500', badgeStyle: 'bg-blue-50 text-blue-600 border-blue-100' };
      case 'ID Proof':
        return { icon: 'badge', iconColor: 'text-indigo-500', badgeStyle: 'bg-indigo-50 text-indigo-600 border-indigo-100' };
      default:
        return { icon: 'description', iconColor: 'text-rose-500', badgeStyle: 'bg-rose-50 text-rose-600 border-rose-100' };
    }
  };

  const [showQrModal, setShowQrModal] = useState(false);
  const [isProfileLocked, setIsProfileLocked] = useState(() => {
    const activeQrId = qrId || 'mq-784512';
    return localStorage.getItem('mediqr_locked_' + activeQrId) === 'true';
  });
  const [verificationName, setVerificationName] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleVerifyUnlock = () => {
    if (!recordData) return;
    const patientName = recordData.patientRecord.name;
    const isNameMatch = verificationName.trim().toLowerCase() === patientName.trim().toLowerCase();

    if (isNameMatch) {
      setIsUnlocking(true);
      setVerificationError('');
      const activeQrId = qrId || 'mq-784512';
      setTimeout(() => {
        setIsProfileLocked(false);
        localStorage.setItem('mediqr_locked_' + activeQrId, 'false');
        setIsUnlocking(false);
        setVerificationName('');
      }, 1200);
    } else {
      const lastThree = patientName.substring(Math.max(0, patientName.length - 3));
      setVerificationError(`Incorrect patient name. (Hint: Name ends with "...${lastThree}")`);
    }
  };

  const handleLockProfile = () => {
    setIsProfileLocked(true);
    const activeQrId = qrId || 'mq-784512';
    localStorage.setItem('mediqr_locked_' + activeQrId, 'true');
  };

  // Refs for camera scanning
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // QR canvas refs
  const headerQrCanvasRef = useRef<HTMLCanvasElement>(null);
  const dossierQrCanvasRef = useRef<HTMLCanvasElement>(null);
  const modalQrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch record on mount
  useEffect(() => {
    const fetchRecord = async () => {
      const activeQrId = qrId || 'mq-784512';
      try {
        const response = await fetch(`/api/records/${activeQrId}`);
        if (response.ok) {
          const data = await response.json();
          // Load exactly what the database has, DO NOT merge with static defaults
          setRecordData({
            patientRecord: data.patientRecord as ExtendedPatientRecord,
            privacySettings: data.privacySettings || MOCK_DHONI_DATA.privacySettings
          });
        } else {
          // Select mock data based on scanned QR ID to avoid fake patient details mixup
          if (activeQrId.toLowerCase() === 'mq-784512') {
            setRecordData(MOCK_DHONI_DATA);
          } else if (activeQrId.toLowerCase() === 'mqr-david-8823') {
            setRecordData(MOCK_DAVID_DATA);
          } else {
            setRecordData(null);
          }
        }
      } catch (err) {
        console.error('Error fetching clinical record', err);
        if (activeQrId.toLowerCase() === 'mq-784512') {
          setRecordData(MOCK_DHONI_DATA);
        } else if (activeQrId.toLowerCase() === 'mqr-david-8823') {
          setRecordData(MOCK_DAVID_DATA);
        } else {
          setRecordData(null);
        }
      }
      setLoading(false);
    };

    fetchRecord();
  }, [qrId]);

  // Generate QR Code inside card header & dossier when record is ready and gate is passed
  useEffect(() => {
    if (gatePassed && recordData) {
      const pageUrl = window.location.href;
      
      if (headerQrCanvasRef.current) {
        QRCode.toCanvas(headerQrCanvasRef.current, pageUrl, {
          width: 80,
          margin: 1,
          color: {
            dark: '#1B3A6B',
            light: '#FFFFFF'
          }
        }, (err) => {
          if (err) console.error('Error generating header QR Code', err);
        });
      }
      
      if (dossierQrCanvasRef.current) {
        QRCode.toCanvas(dossierQrCanvasRef.current, pageUrl, {
          width: 120,
          margin: 1,
          color: {
            dark: '#1B3A6B',
            light: '#FFFFFF'
          }
        }, (err) => {
          if (err) console.error('Error generating dossier QR Code', err);
        });
      }
    }
  }, [gatePassed, recordData]);

  // Generate QR Code inside zoom modal when opened
  useEffect(() => {
    if (showQrModal && modalQrCanvasRef.current) {
      const pageUrl = window.location.href;
      QRCode.toCanvas(modalQrCanvasRef.current, pageUrl, {
        width: 300,
        margin: 1,
        color: {
          dark: '#1B3A6B',
          light: '#FFFFFF'
        }
      }, (err) => {
        if (err) console.error('Error generating modal QR Code', err);
      });
    }
  }, [showQrModal]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Play scanning/verification logs dynamically matched to patient record
  const runDecryptionSimulation = useCallback(() => {
    if (!recordData) return;
    setIsScanning(true);
    setScanLogs([]);

    const patientName = recordData.patientRecord.name;
    const patientId = recordData.patientRecord.qrId || qrId || 'MQ-784512';
    const doctorName = recordData.patientRecord.authorization?.doctor || 'Authorized Physician';

    const logs = [
      `[INIT] Handshake initiated with MediQR Decryption Node...`,
      `[HANDSHAKE] Verification Token: MQ-${Math.floor(100000 + Math.random() * 900000)}`,
      `[SECURITY] Applying 256-bit AES cryptographic keys...`,
      `[DATABASE] Decrypting clinical summary tables...`,
      `[AUTHENTICATED] Access authorized for Emergency Medical Services.`,
      `[SUCCESS] Signature verified: ${doctorName}`,
      `[SUCCESS] Verified Patient Record: ${patientName} (MediQR ID: ${patientId.toUpperCase()})`,
      `[INFO] Constructing healthcare report card dashboard...`
    ];

    logs.forEach((log, index) => {
      setTimeout(() => {
        setScanLogs(prev => [...prev, log]);
        if (index === logs.length - 1) {
          setTimeout(() => {
            setGatePassed(true);
            setIsScanning(false);
            setUseCamera(false);
          }, 600);
        }
      }, (index + 1) * 350);
    });
  }, [recordData, qrId]);

  // QR Scanning from camera logic
  const scanFrame = useCallback(function scanFrameInner() {
    if (videoRef.current && canvasRef.current && useCamera) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code) {
          // Found a code! Play simulation and decrypt
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }
          runDecryptionSimulation();
          return;
        }
      }
      animationFrameRef.current = requestAnimationFrame(scanFrameInner);
    }
  }, [useCamera, runDecryptionSimulation]);

  // Start Camera Scan
  const startCamera = async () => {
    setCameraError(null);
    setUseCamera(true);
    
    // Timeout promise to prevent hanging in headless testing environments
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Camera initialization timeout')), 2000)
    );

    try {
      const getUserMediaPromise = navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const stream = await Promise.race([getUserMediaPromise, timeoutPromise]) as MediaStream;
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        animationFrameRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err) {
      console.error('Failed to access camera', err);
      setCameraError('Camera access denied or unavailable. Falling back to simulator.');
      setUseCamera(false);
      // Fallback to simulation automatically
      setTimeout(() => {
        runDecryptionSimulation();
      }, 1000);
    }
  };

  // Start camera scanner automatically on mount once loading finishes
  useEffect(() => {
    if (!loading && !gatePassed) {
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, gatePassed]);

  const handleDownloadPDF = () => {
    if (!recordData) return;
    window.print();
  };

  if (loading) {
    return (
      <div className="bg-[#F4F6FB] min-h-screen flex flex-col items-center justify-center font-sans antialiased text-[#1A2340]">
        <div className="w-16 h-16 border-4 border-[#2ABFBF] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[#6B7A99] font-medium tracking-wide">Fetching secure MediQR record...</p>
      </div>
    );
  }

  if (!recordData) {
    return (
      <div className="bg-[#F4F6FB] min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-xl shadow-md border border-[#E0E6EF] max-w-md">
          <div className="w-16 h-16 bg-red-100 text-[#E53935] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">error</span>
          </div>
          <h1 className="text-xl font-bold text-[#1A2340]">Clinical Record Missing</h1>
          <p className="text-sm text-[#6B7A99] mt-2 leading-relaxed">
            The requested emergency profile could not be retrieved from the server. Please verify the QR code and scan again.
          </p>
        </div>
      </div>
    );
  }

  const record = recordData.patientRecord;
  const patientId = record.qrId || qrId || 'MQ-784512';

  // Section content presence flags
  const hasMedicalInfo = !!(
    (record.allergies && record.allergies.length > 0) ||
    (record.conditions && record.conditions.some(c => c.name !== 'None')) ||
    record.bp ||
    record.diabetes ||
    record.smoking ||
    record.alcohol ||
    record.organDonor ||
    record.physicallyActive
  );
  const hasMedications = !!(record.medications && record.medications.length > 0);
  const hasHistory = !!(record.medicalHistory && record.medicalHistory.length > 0);
  const hasSurgeries = !!(record.previousSurgeries && record.previousSurgeries.length > 0);
  const hasLabResults = !!(record.labResults && record.labResults.length > 0);
  const hasLastVisit = !!(record.lastVisit);
  const hasDocuments = !!(record.documents && record.documents.length > 0);

  return (
    <div className="bg-[#F4F6FB] min-h-screen font-sans text-[#1A2340] pb-12 antialiased relative">
      
      {/* Dynamic Fonts & Styling Injector */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,600;0,700;1,400&family=Dancing+Script:wght@700&display=swap');
        
        :root {
          --primary-blue: #1B3A6B;
          --accent-teal: #2ABFBF;
          --emergency-red: #E53935;
          --bg-color: #F4F6FB;
          --card-white: #FFFFFF;
          --border-gray: #E0E6EF;
          --text-dark: #1A2340;
          --text-muted: #6B7A99;
        }

        .headings-font {
          font-family: 'Poppins', 'Inter', sans-serif;
        }

        .cursive-font {
          font-family: 'Dancing Script', cursive;
        }

        .report-card-outer {
          background: var(--card-white);
          border: 1px solid var(--border-gray);
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(27, 58, 107, 0.08);
          overflow: hidden;
        }

        .report-card-section {
          border: 1px solid var(--border-gray);
          border-radius: 8px;
          background: #FFFFFF;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .report-card-section:hover {
          box-shadow: 0 4px 12px rgba(27, 58, 107, 0.06);
        }

        .report-card-header-badge {
          background: var(--primary-blue);
          color: #ffffff;
          font-weight: 700;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .data-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .data-value {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-dark);
        }

        .report-table {
          width: 100%;
          border-collapse: collapse;
        }

        .report-table th {
          background: var(--primary-blue);
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          text-align: left;
          padding: 0.65rem 0.75rem;
        }

        .report-table td {
          padding: 0.65rem 0.75rem;
          border-bottom: 1px solid var(--border-gray);
          font-size: 0.85rem;
          color: var(--text-dark);
        }

        .report-table tr:last-child td {
          border-bottom: none;
        }

        .report-table tr:nth-child(even) td {
          background: #F8FAFD;
        }

        /* Scan line animation */
        @keyframes laser-sweep {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }

        .laser-line {
          height: 3px;
          background: linear-gradient(90deg, transparent, #2ABFBF, transparent);
          box-shadow: 0 0 10px #2ABFBF;
          position: absolute;
          left: 0;
          width: 100%;
          z-index: 10;
          animation: laser-sweep 3s infinite linear;
        }

        /* Pulse for emergency red alert */
        @keyframes alert-pulse {
          0% { box-shadow: 0 0 0 0 rgba(229, 57, 21, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(229, 57, 21, 0); }
          100% { box-shadow: 0 0 0 0 rgba(229, 57, 21, 0); }
        }
        .emergency-pulse-btn {
          animation: alert-pulse 2s infinite;
        }

        /* Ambulance Light Border & Shadow pulse (Red & Blue hover strobe) */
        @keyframes ambulance-strobe-border {
          0%, 100% {
            border-color: #ef4444 !important;
            box-shadow: 0 0 16px rgba(239, 68, 68, 0.75) !important;
          }
          50% {
            border-color: #3b82f6 !important;
            box-shadow: 0 0 16px rgba(59, 130, 246, 0.75) !important;
          }
        }
        .ambulance-alert-box {
          border-color: #fca5a5;
          border-width: 2.5px !important;
          transition: all 0.3s ease;
        }
        .ambulance-alert-box:hover {
          animation: ambulance-strobe-border 0.6s infinite steps(2);
        }

        /* Ambulance Header Flashing (Red & Blue hover strobe) */
        @keyframes ambulance-strobe-bg {
          0%, 100% {
            background-color: #ef4444 !important;
          }
          50% {
            background-color: #3b82f6 !important;
          }
        }
        .ambulance-alert-header {
          background-color: #dc2626;
          transition: all 0.3s ease;
        }
        .ambulance-alert-box:hover .ambulance-alert-header {
          animation: ambulance-strobe-bg 0.6s infinite steps(2);
        }

        /* Document modal scrollbar */
        .doc-preview-body::-webkit-scrollbar {
          width: 6px;
        }
        .doc-preview-body::-webkit-scrollbar-thumb {
          background-color: var(--border-gray);
          border-radius: 4px;
        }

        /* Print Override */
        @media print {
          body {
            background: #ffffff !important;
            color: #1A2340 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .report-card-outer {
            box-shadow: none !important;
            border: 1px solid #1A2340 !important;
            border-radius: 0 !important;
            max-width: 100% !important;
            margin: 0 !important;
          }
          .report-card-section {
            box-shadow: none !important;
            border: 1px solid var(--border-gray) !important;
            page-break-inside: avoid !important;
          }
          .report-table th {
            background-color: #1B3A6B !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .report-table tr:nth-child(even) td {
            background-color: #F4F6FB !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .bg-red-alert {
            background-color: #E53935 !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* BACKGROUND FLOATING DECORATIONS (Hidden on Print) */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#2ABFBF]/5 rounded-full filter blur-3xl pointer-events-none no-print"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#1B3A6B]/5 rounded-full filter blur-3xl pointer-events-none no-print"></div>

      {/* ========================================================= */}
      {/* 1. LOCK / SECURITY ACCESS GATE SCREEN                   */}
      {/* ========================================================= */}
      {!gatePassed && (
        <div className="min-h-screen flex items-center justify-center px-4 py-8 relative z-50 no-print">
          <div className="bg-white/80 backdrop-blur-md max-w-lg w-full border border-[#E0E6EF] rounded-2xl shadow-2xl p-6 sm:p-8 text-center space-y-6">
            
            {/* Header branding */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#1B3A6B]/10 rounded-full flex items-center justify-center text-[#1B3A6B]">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L3 6V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V6L12 2Z" fill="#1B3A6B"/>
                  <path d="M12 8.5C10.5 7 8 8.5 8 10.5C8 12.5 10.5 15 12 16.5C13.5 15 16 12.5 16 10.5C16 8.5 13.5 7 12 8.5Z" fill="#2ABFBF"/>
                </svg>
              </div>
              <h1 className="headings-font text-xl sm:text-2xl font-bold text-[#1B3A6B] tracking-tight mt-1">MediQR SECURE PORTAL</h1>
              <p className="text-[10px] text-[#6B7A99] font-semibold tracking-wide uppercase">Encrypted Patient Information Gateway</p>
            </div>

            {/* Simulated Viewfinder / Scanning window */}
            <div className="relative border-2 border-dashed border-[#2ABFBF]/40 rounded-2xl p-4 sm:p-6 bg-slate-900 overflow-hidden flex flex-col items-center justify-center min-h-[220px] sm:min-h-[260px] shadow-inner">
              
              {/* Laser beam */}
              {(isScanning || useCamera) && <div className="laser-line"></div>}

              {/* Viewfinder brackets */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#2ABFBF]"></div>
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#2ABFBF]"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#2ABFBF]"></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#2ABFBF]"></div>

              {useCamera ? (
                <div className="w-full h-full relative">
                  <video ref={videoRef} muted playsInline className="w-full h-[180px] sm:h-[220px] object-cover rounded-lg"></video>
                  <canvas ref={canvasRef} className="hidden"></canvas>
                  <p className="absolute bottom-2 left-2 right-2 text-center text-[10px] text-white bg-black/60 py-1 rounded">
                    Align printed QR code in viewport
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-4">
                  {/* Lock / QR logo icon */}
                  <div className="relative p-3 bg-white/5 rounded-xl border border-white/10 group">
                    <span className="material-symbols-outlined text-4xl sm:text-5xl text-[#2ABFBF] font-light animate-pulse">qr_code_scanner</span>
                    <div className="absolute -top-1.5 -right-1.5 bg-[#E53935] text-white rounded-full p-1 leading-none shadow">
                      <span className="material-symbols-outlined text-[10px] font-bold leading-none">lock</span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-white font-mono text-xs sm:text-sm tracking-wide">SECURE KEY MATCH: {patientId.toUpperCase()}</p>
                    <p className="text-[10px] text-[#2ABFBF] mt-0.5">Pending validation sweep...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Simulation Logger console output */}
            {scanLogs.length > 0 && (
              <div className="bg-black/95 text-[#2ABFBF] p-3 rounded-xl text-left font-mono text-[10px] sm:text-xs space-y-1 overflow-y-auto max-h-[100px] shadow-2xl border border-slate-800">
                {scanLogs.map((log, i) => (
                  <div key={i} className="animate-fade-in truncate">
                    <span className="text-[#6B7A99] mr-1">&gt;</span>
                    {log}
                  </div>
                ))}
              </div>
            )}

            {cameraError && (
              <p className="text-[11px] text-[#E53935] bg-red-50 p-2 rounded-lg border border-red-100 font-medium">
                {cameraError}
              </p>
            )}

            {/* Control buttons */}
            <div className="flex flex-col gap-2 pt-1 text-center">
              {!isScanning && (
                <>
                  {useCamera ? (
                    <Button 
                      variant="secondary"
                      onClick={() => {
                        if (streamRef.current) {
                          streamRef.current.getTracks().forEach(track => track.stop());
                        }
                        setUseCamera(false);
                      }}
                      className="w-full py-2.5 text-xs text-[#1B3A6B] font-bold"
                    >
                      Cancel Camera Scan
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={startCamera}
                      icon="photo_camera"
                      iconPosition="left"
                      className="w-full py-3 text-xs bg-gradient-to-r from-[#1B3A6B] to-[#122545] hover:shadow-lg justify-center font-bold"
                    >
                      Start Camera Scanner
                    </Button>
                  )}
                </>
              )}
              {isScanning && (
                <div className="text-center py-2">
                  <div className="inline-block w-5 h-5 border-2 border-[#2ABFBF] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[10px] text-[#6B7A99] font-medium mt-1">Performing cryptographic handshake...</p>
                </div>
              )}
            </div>

            {/* Secure warning banner */}
            <div className="flex items-start gap-2 p-3 bg-[#1B3A6B]/5 border border-[#1B3A6B]/15 rounded-xl text-left">
              <span className="material-symbols-outlined text-[#1B3A6B] text-[16px] mt-0.5 filled-icon">lock_open</span>
              <p className="text-[10px] text-[#6B7A99] leading-relaxed">
                <strong>Responder Note:</strong> This health card contains protected clinical data. Access is logged in compliance with HIPAA privacy standards.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. THE PROFESSIONAL MEDICAL EMERGENCY CARD REPORT        */}
      {/* ========================================================= */}
      {gatePassed && (
        <main className="max-w-[900px] mx-auto px-2 sm:px-6 pt-4 sm:pt-6 relative z-10 space-y-4 sm:space-y-6">
          
          {/* SECURE DECRYPTION TOP ALERT BAR (Hidden on Print) */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-teal-50 border border-[#2ABFBF]/30 rounded-xl px-4 py-2.5 gap-2 no-print shadow-sm">
            <div className="flex items-center gap-2 text-[#1B3A6B] text-xs">
              <span className="material-symbols-outlined text-[#2ABFBF] filled-icon text-base">verified</span>
              <span className="font-semibold">Verified MediQR Handshake Active &bull; ID: {patientId.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleLockProfile}
                className="text-xs text-[#6B7A99] font-bold hover:underline hover:text-[#1B3A6B] cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">lock</span>
                Lock Access
              </button>
            </div>
          </div>

          {/* REPORT CARD OUTER BOUNDARY */}
          <div className="relative">
            {/* Lock Overlay (Frosted glass blur + security shield + verification input) */}
            {isProfileLocked && (
              <div className="fixed inset-0 bg-[#F4F6FB]/95 backdrop-blur-md z-50 flex items-center justify-center p-4 text-center animate-fade-in no-print overflow-y-auto">
                <div className="bg-white border border-[#E0E6EF] rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full my-auto space-y-6 animate-zoom-in">
                  
                  {/* Icon */}
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <span className="material-symbols-outlined text-3xl font-bold animate-pulse">lock_person</span>
                  </div>

                  {/* Text */}
                  <div className="space-y-2">
                    <h3 className="headings-font text-lg font-bold text-slate-800 uppercase tracking-wide">Emergency Access Locked</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      This clinical report card has been secured by the patient. To verify identity and decrypt records, please enter the patient's full name.
                    </p>
                    <p className="text-[11px] text-teal-700 bg-teal-50 border border-teal-200 rounded px-3 py-1.5 font-bold inline-block">
                      💡 Identity Hint: Ends with <span className="font-mono text-xs font-black underline">"...{record.name.substring(Math.max(0, record.name.length - 3))}"</span>
                    </p>
                  </div>

                  {/* Input field */}
                  <div className="space-y-3">
                    <input 
                      type="text"
                      placeholder="Enter patient name..."
                      className="w-full text-center text-sm font-semibold rounded-xl py-3 px-4 bg-slate-50 border border-slate-200 focus:bg-white focus:border-red-500 focus:ring-0 outline-none transition-all text-slate-800"
                      value={verificationName}
                      onChange={(e) => {
                        setVerificationName(e.target.value);
                        setVerificationError('');
                      }}
                    />
                    
                    {verificationError && (
                      <p className="text-[11px] text-red-600 font-semibold">{verificationError}</p>
                    )}

                    {isUnlocking ? (
                      <div className="py-2.5 flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[11px] text-slate-500 font-bold">Decrypting records...</span>
                      </div>
                    ) : (
                      <Button 
                        variant="primary"
                        onClick={handleVerifyUnlock}
                        className="w-full py-3 justify-center bg-red-600 hover:bg-red-700 hover:shadow-lg font-bold text-xs"
                      >
                        Authorize &amp; Decrypt
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className={`report-card-outer p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 transition-all duration-500 ${isProfileLocked ? 'filter blur-sm select-none pointer-events-none' : ''}`}>
            
            {/* 2.1 HEADER BAR */}
            <header className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 border-b border-[#E0E6EF] pb-4 sm:pb-6">
              
              {/* Logo / Left Side */}
              <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#1B3A6B]/5 rounded-lg flex items-center justify-center text-[#2ABFBF] border border-[#2ABFBF]/25 shadow-sm">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L3 6V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V6L12 2Z" fill="#1B3A6B"/>
                    <path d="M12 8.5C10.5 7 8 8.5 8 10.5C8 12.5 10.5 15 12 16.5C13.5 15 16 12.5 16 10.5C16 8.5 13.5 7 12 8.5Z" fill="#2ABFBF"/>
                  </svg>
                </div>
                <div>
                  <h1 className="headings-font text-base sm:text-lg font-bold text-[#1B3A6B] tracking-wide leading-tight">MediQR HEALTHCARE</h1>
                  <p className="text-[9px] sm:text-[10px] text-[#2ABFBF] font-semibold uppercase tracking-wider">Your Health, Our Priority</p>
                </div>
              </div>

              {/* Center Title */}
              <div className="text-center w-full sm:w-auto">
                <h2 className="headings-font text-xl sm:text-2xl font-bold text-[#1B3A6B] tracking-widest leading-none">MEDICAL REPORT</h2>
                <h3 className="text-[10px] sm:text-[11px] font-bold text-[#2ABFBF] uppercase tracking-wider mt-1">EMERGENCY MEDICAL CARD</h3>
              </div>

              {/* Right Side: QR Code Verification */}
              <div className="flex items-center gap-3 border border-[#E0E6EF] p-2 rounded-xl bg-[#F8FAFD] w-full sm:w-auto justify-between sm:justify-start shrink-0">
                <div className="text-right shrink-0">
                  <span className="text-[8px] font-bold text-[#6B7A99] block uppercase tracking-wider">MediQR ID</span>
                  <span className="font-mono text-xs font-bold text-[#1B3A6B]">{patientId.toUpperCase()}</span>
                </div>
                <div 
                  onClick={() => setShowQrModal(true)}
                  className="relative w-12 h-12 sm:w-14 sm:h-14 bg-white border border-dashed border-[#6B7A99]/40 rounded-lg flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-[#2ABFBF] transition-colors"
                  title="Click to Zoom QR Code"
                >
                  <canvas ref={headerQrCanvasRef} className="w-full h-full"></canvas>
                </div>
              </div>

            </header>

            {/* 2.2 PATIENT PROFILE CARD (full-width) */}
            <section className="report-card-section border border-[#E0E6EF] rounded-xl p-5 bg-white grid grid-cols-1 md:grid-cols-12 gap-6 relative shadow-sm">
              
              {/* Profile Card Left Dossier (8 columns) */}
              <div className="md:col-span-8 flex flex-col gap-4 md:border-r border-[#E0E6EF]/70 md:pr-6">
                
                {/* Header Profile Details */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#1B3A6B]/5 flex items-center justify-center text-[#1B3A6B]/70 border border-[#E0E6EF] shrink-0 shadow-inner overflow-hidden">
                    {record.photo ? (
                      <img src={record.photo} alt={record.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-3xl sm:text-4xl font-light select-none">account_circle</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h2 className="headings-font text-xl sm:text-2xl font-bold text-[#1B3A6B] leading-none">{record.name}</h2>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1.5">
                      <span className="bg-[#1B3A6B]/10 text-[#1B3A6B] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Patient Profile
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">
                        ID: {patientId.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Structured Dossier Grid (Organised, larger fonts) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
                  {/* DOB */}
                  {record.dob && (
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 hover:bg-slate-100/50 transition-colors">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>📅</span>
                        <span>Date of Birth</span>
                      </div>
                      <span className="font-bold text-slate-800 mt-1 block text-sm">{record.dob}</span>
                    </div>
                  )}

                  {/* Age */}
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 hover:bg-slate-100/50 transition-colors">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>🎂</span>
                      <span>Age</span>
                    </div>
                    <span className="font-bold text-slate-800 mt-1 block text-sm">{record.age} Years</span>
                  </div>

                  {/* Gender */}
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 hover:bg-slate-100/50 transition-colors">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>👤</span>
                      <span>Gender</span>
                    </div>
                    <span className="font-bold text-slate-800 mt-1 block text-sm">{record.gender}</span>
                  </div>

                  {/* Blood Group */}
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3 hover:bg-red-50/70 transition-colors">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-500/80 uppercase tracking-wider">
                      <span>🩸</span>
                      <span>Blood Group</span>
                    </div>
                    <span className="font-black text-red-600 mt-1 block text-base leading-none">{record.bloodGroup}</span>
                  </div>

                  {/* Height & Weight */}
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 hover:bg-slate-100/50 transition-colors">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>📏</span>
                      <span>Height &amp; Weight</span>
                    </div>
                    <span className="font-bold text-slate-800 mt-1 block text-sm">{record.height} cm / {record.weight} kg</span>
                  </div>

                  {/* Phone */}
                  {record.phone && (
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 hover:bg-slate-100/50 transition-colors">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>📞</span>
                        <span>Phone Number</span>
                      </div>
                      <span className="font-bold text-slate-800 mt-1 block text-sm">{record.phone}</span>
                    </div>
                  )}

                  {/* Email */}
                  {record.email && (
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 hover:bg-slate-100/50 transition-colors">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>✉️</span>
                        <span>Email Address</span>
                      </div>
                      <span className="font-bold text-slate-800 mt-1 block text-sm truncate" title={record.email}>{record.email}</span>
                    </div>
                  )}

                  {/* Address */}
                  {record.address && (
                    <div className="col-span-1 sm:col-span-2 md:col-span-1 bg-slate-50 border border-slate-100 rounded-lg p-3 hover:bg-slate-100/50 transition-colors">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>🏠</span>
                        <span>Residential Address</span>
                      </div>
                      <span className="font-bold text-slate-800 mt-1 block text-xs leading-relaxed">{record.address}</span>
                    </div>
                  )}

                  {/* QR Code Image Card in Report Card (Clickable to zoom) */}
                  <div 
                    onClick={() => setShowQrModal(true)}
                    className="col-span-1 sm:col-span-2 md:col-span-1 bg-white border-2 border-dashed border-[#2ABFBF]/50 rounded-lg p-3 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-1.5 shadow-sm hover:shadow group text-center"
                  >
                    <div className="flex items-center gap-1 text-[10px] font-bold text-[#2ABFBF] uppercase tracking-wider">
                      <span className="material-symbols-outlined text-xs">qr_code_2</span>
                      <span>Click to Zoom</span>
                    </div>
                    <div className="relative w-14 h-14 bg-white border border-[#E0E6EF] rounded flex items-center justify-center overflow-hidden">
                      <canvas ref={dossierQrCanvasRef} className="w-full h-full"></canvas>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider leading-none">EMERGENCY QR</span>
                  </div>
                </div>

              </div>

              {/* Profile Card Right Column - EMERGENCY CONTACTS (4 columns, Blinking ambulance styling on hover) */}
              <div className="md:col-span-4 bg-gradient-to-br from-rose-50 to-red-50/10 border-2 rounded-xl overflow-hidden flex flex-col shadow-sm ambulance-alert-box">
                <div className="text-white px-3 py-2.5 flex items-center gap-2 font-bold shadow-[0_2px_4px_rgba(0,0,0,0.1)] shrink-0 ambulance-alert-header">
                  <span className="material-symbols-outlined text-[16px] text-white filled-icon animate-pulse select-none">warning</span>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-white">Emergency Contacts (ICE)</span>
                </div>
                <div className="p-3.5 space-y-2.5 flex-grow flex flex-col justify-center">
                  {record.contacts && record.contacts.map((contact, idx) => (
                    <div key={idx} className="bg-white border border-red-200 rounded-lg p-3 flex justify-between items-center gap-2 shadow-sm">
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{contact.name}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-700">
                          <span className="font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded uppercase tracking-wider text-[9px]">{contact.relationship}</span>
                          <span className="font-mono font-black text-slate-900">{contact.phone}</span>
                        </div>
                      </div>
                      <a 
                        href={`tel:${contact.phone}`}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition-all duration-200 shrink-0 flex items-center justify-center shadow hover:shadow-md active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[12px] filled-icon font-bold">call</span>
                      </a>
                    </div>
                  ))}
                  {(!record.contacts || record.contacts.length === 0) && (
                    <p className="text-xs text-red-600 font-semibold italic text-center py-2">No contacts listed</p>
                  )}
                </div>
              </div>

            </section>

            {/* 2.3 ROW 1: MEDICAL INFO & MEDICATIONS */}
            {(hasMedicalInfo || hasMedications) && (
              <div className={`grid grid-cols-1 ${hasMedicalInfo && hasMedications ? 'md:grid-cols-2' : ''} gap-5 sm:gap-6`}>
                
                {/* MEDICAL INFORMATION */}
                {hasMedicalInfo && (
                  <section className="report-card-section">
                    <div className="bg-[#F8FAFD] px-4 py-2.5 border-b border-[#E0E6EF]">
                      <span className="report-card-header-badge">
                        <span className="material-symbols-outlined text-[12px] filled-icon">stethoscope</span>
                        Medical Information
                      </span>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-3">
                      {record.allergies && record.allergies.length > 0 && (
                        <div className="col-span-2 bg-rose-50/40 p-2.5 rounded-md border border-rose-100/40">
                          <span className="data-label text-[#D32F2F] block">Allergies</span>
                          <span className="data-value text-xs text-[#C62828] font-bold block pt-0.5">
                            {record.allergies.map(a => `${a.name} (${a.severity})`).join(', ')}
                          </span>
                        </div>
                      )}
                      {record.conditions && record.conditions.some(c => c.name !== 'None') && (
                        <div className="col-span-2">
                          <span className="data-label block">Chronic Conditions</span>
                          <span className="data-value text-xs">
                            {record.conditions.map(c => `${c.name} (${c.severity})`).join(', ')}
                          </span>
                        </div>
                      )}
                      {record.bp && (
                        <div>
                          <span className="data-label block">Blood Pressure</span>
                          <span className="data-value text-xs">{record.bp}</span>
                        </div>
                      )}
                      {record.diabetes && (
                        <div>
                          <span className="data-label block">Diabetes</span>
                          <span className="data-value text-xs">{record.diabetes}</span>
                        </div>
                      )}
                      {record.smoking && (
                        <div>
                          <span className="data-label block">Smoking</span>
                          <span className="data-value text-xs">{record.smoking}</span>
                        </div>
                      )}
                      {record.alcohol && (
                        <div>
                          <span className="data-label block">Alcohol</span>
                          <span className="data-value text-xs">{record.alcohol}</span>
                        </div>
                      )}
                      {record.organDonor && (
                        <div>
                          <span className="data-label block">Organ Donor</span>
                          <span className="data-value text-xs text-teal-700 font-bold">{record.organDonor}</span>
                        </div>
                      )}
                      {record.physicallyActive && (
                        <div>
                          <span className="data-label block">Physically Active</span>
                          <span className="data-value text-xs">{record.physicallyActive}</span>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* CURRENT MEDICATIONS */}
                {hasMedications && (
                  <section className="report-card-section flex flex-col">
                    <div className="bg-[#F8FAFD] px-4 py-2.5 border-b border-[#E0E6EF]">
                      <span className="report-card-header-badge">
                        <span className="material-symbols-outlined text-[12px] filled-icon">pill</span>
                        Current Medications
                      </span>
                    </div>
                    <div className="flex-grow overflow-x-auto w-full">
                      <table className="report-table min-w-[320px]">
                        <thead>
                          <tr>
                            <th>Medication</th>
                            <th>Dosage</th>
                            <th>Frequency</th>
                            <th>Purpose</th>
                          </tr>
                        </thead>
                        <tbody>
                          {record.medications.map((med, index) => (
                            <tr key={index}>
                              <td className="font-semibold text-[#1B3A6B]"> <div>{med.name}</div> {(med.reminderMorning || med.reminderAfternoon || med.reminderNight) && ( <div className="flex gap-1 mt-1 flex-wrap"> {med.reminderMorning && ( <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-50 text-amber-700 border border-amber-200"> ☀️ Morning ({formatTime(med.reminderMorningTime)}) </span> )} {med.reminderAfternoon && ( <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-orange-50 text-orange-700 border border-orange-200"> 🌤️ Afternoon ({formatTime(med.reminderAfternoonTime)}) </span> )} {med.reminderNight && ( <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"> 🌙 Night ({formatTime(med.reminderNightTime)}) </span> )} </div> )} </td>
                              <td className="font-mono text-xs">{med.dosage}</td>
                              <td className="text-xs">{med.frequency}</td>
                              <td className="text-xs">{med.purpose || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

              </div>
            )}

            {/* 2.4 ROW 2: HISTORY & SURGERIES */}
            {(hasHistory || hasSurgeries) && (
              <div className={`grid grid-cols-1 ${hasHistory && hasSurgeries ? 'md:grid-cols-2' : ''} gap-5 sm:gap-6`}>
                
                {/* MEDICAL HISTORY */}
                {hasHistory && (
                  <section className="report-card-section">
                    <div className="bg-[#F8FAFD] px-4 py-2.5 border-b border-[#E0E6EF]">
                      <span className="report-card-header-badge">
                        <span className="material-symbols-outlined text-[12px] filled-icon">history_edu</span>
                        Medical History
                      </span>
                    </div>
                    <div className="p-4">
                      <ul className="space-y-2">
                        {record.medicalHistory?.map((hist, i) => (
                          <li key={i} className="text-xs flex items-start gap-2 leading-relaxed text-[#1A2340]">
                            <span className="text-[#2ABFBF] text-sm leading-none shrink-0">•</span>
                            <span>{hist}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>
                )}

                {/* PREVIOUS SURGERIES / TREATMENTS */}
                {hasSurgeries && (
                  <section className="report-card-section">
                    <div className="bg-[#F8FAFD] px-4 py-2.5 border-b border-[#E0E6EF]">
                      <span className="report-card-header-badge">
                        <span className="material-symbols-outlined text-[12px] filled-icon">add_circle</span>
                        Previous Surgeries / Treatments
                      </span>
                    </div>
                    <div className="p-4">
                      <ul className="space-y-2">
                        {record.previousSurgeries?.map((surg, i) => (
                          <li key={i} className="text-xs flex items-start gap-2 leading-relaxed text-[#1A2340]">
                            <span className="text-[#2ABFBF] text-sm leading-none shrink-0">•</span>
                            <span>{surg}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>
                )}

              </div>
            )}

            {/* 2.5 ROW 3: LAB RESULTS & LAST VISIT */}
            {(hasLabResults || hasLastVisit) && (
              <div className={`grid grid-cols-1 ${hasLabResults && hasLastVisit ? 'md:grid-cols-2' : ''} gap-5 sm:gap-6`}>
                
                {/* LAB RESULTS */}
                {hasLabResults && (
                  <section className="report-card-section flex flex-col">
                    <div className="bg-[#F8FAFD] px-4 py-2.5 border-b border-[#E0E6EF]">
                      <span className="report-card-header-badge">
                        <span className="material-symbols-outlined text-[12px] filled-icon">biotech</span>
                        Lab Results (Latest)
                      </span>
                    </div>
                    <div className="flex-grow overflow-x-auto w-full">
                      <table className="report-table min-w-[320px]">
                        <thead>
                          <tr>
                            <th>Test</th>
                            <th>Result</th>
                            <th>Range</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {record.labResults?.map((lab, index) => (
                            <tr key={index}>
                              <td className="font-semibold">{lab.test}</td>
                              <td className="font-mono text-xs font-bold text-[#1B3A6B]">{lab.result}</td>
                              <td className="text-[10px] text-[#6B7A99] font-mono leading-tight">{lab.range}</td>
                              <td className="text-[10px] font-medium">{lab.date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                {/* LAST VISIT DETAILS */}
                {hasLastVisit && (
                  <section className="report-card-section">
                    <div className="bg-[#F8FAFD] px-4 py-2.5 border-b border-[#E0E6EF]">
                      <span className="report-card-header-badge">
                        <span className="material-symbols-outlined text-[12px] filled-icon">calendar_today</span>
                        Last Visit Details
                      </span>
                    </div>
                    <div className="p-4 sm:p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <span className="data-label block text-[8px] sm:text-[9px]">Date</span>
                          <span className="data-value text-xs">{record.lastVisit?.date}</span>
                        </div>
                        <div>
                          <span className="data-label block text-[8px] sm:text-[9px]">Doctor</span>
                          <span className="data-value text-xs">{record.lastVisit?.doctor}</span>
                        </div>
                        <div>
                          <span className="data-label block text-[8px] sm:text-[9px]">Specialization</span>
                          <span className="data-value text-xs">{record.lastVisit?.specialization}</span>
                        </div>
                        <div>
                          <span className="data-label block text-[8px] sm:text-[9px]">Clinic/Hospital</span>
                          <span className="data-value text-xs">{record.lastVisit?.clinic}</span>
                        </div>
                      </div>
                      {record.lastVisit?.notes && (
                        <div className="border-t border-[#E0E6EF]/70 pt-2.5">
                          <span className="data-label block text-[8px] sm:text-[9px]">Clinical Notes</span>
                          <p className="text-xs text-[#1A2340] leading-relaxed mt-1 font-medium italic">
                            "{record.lastVisit?.notes}"
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                )}

              </div>
            )}

            {/* 2.6 ADDITIONAL NOTES SECTION (full-width) */}
            {record.additionalNotes && (
              <section className="report-card-section border-l-4 border-l-[#1B3A6B]">
                <div className="bg-[#F8FAFD] px-4 py-2 border-b border-[#E0E6EF] flex items-center gap-2">
                  <span className="report-card-header-badge">
                    <span className="material-symbols-outlined text-[12px] filled-icon">description</span>
                    Additional Notes
                  </span>
                </div>
                <div className="p-4 flex gap-2.5">
                  <span className="material-symbols-outlined text-[#1B3A6B] text-xl shrink-0 mt-0.5">info</span>
                  <p className="text-xs text-[#1A2340] leading-relaxed font-semibold">
                    {record.additionalNotes}
                  </p>
                </div>
              </section>
            )}

            {/* 2.7 ATTACHED DOCUMENTS & AUTHORIZATION ROW */}
            <section className="report-card-section">
              <div className="bg-[#F8FAFD] px-4 py-2.5 border-b border-[#E0E6EF]">
                <span className="report-card-header-badge">
                  <span className="material-symbols-outlined text-[12px] filled-icon">
                    verified_user
                  </span>
                  Clinical Verification &amp; Certification
                </span>
              </div>
              <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
                
                {/* Document tiles */}
                {hasDocuments ? (
                  <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {record.documents.map((doc) => {
                      const docStyle = getDocStyle(doc.category || '');
                      return (
                        <div 
                          key={doc.id}
                          onClick={() => setSelectedDoc(doc)}
                          className="border border-[#E0E6EF] rounded-lg p-2.5 text-center bg-[#F8FAFD] hover:bg-white hover:border-[#2ABFBF] hover:shadow-md active:scale-95 transition-all cursor-pointer flex flex-col justify-between items-center h-[115px] sm:h-[125px]"
                        >
                          <div className="w-full">
                            <h4 className="text-[10px] sm:text-[11px] font-bold tracking-tight text-[#1B3A6B] truncate w-full" title={doc.name}>{doc.name}</h4>
                            <span className="text-[8px] sm:text-[9px] text-[#6B7A99] block mt-0.5">{doc.date}</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <span className={`material-symbols-outlined ${docStyle.iconColor} text-2xl sm:text-3xl font-light`}>{docStyle.icon}</span>
                            <span className={`text-[8px] ${docStyle.badgeStyle} px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider`}>{doc.category || 'PDF'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="lg:col-span-8 flex flex-col justify-center items-center p-6 border border-dashed border-[#E0E6EF] rounded-lg bg-slate-50/50">
                    <span className="material-symbols-outlined text-[#6B7A99] text-3xl font-light">folder_off</span>
                    <span className="text-xs text-[#6B7A99] mt-2 font-medium">No additional documents uploaded</span>
                  </div>
                )}

                {/* Doctor Authorization Box (Always visible) */}
                <div className={`${hasDocuments ? 'lg:col-span-4' : 'lg:col-span-12 max-w-md mx-auto w-full'} border border-[#E0E6EF] rounded-lg p-4 bg-[#F8FAFD] flex flex-col justify-between relative overflow-hidden min-h-[170px]`}>
                  
                  <div className="relative z-10">
                    <span className="data-label text-[8px] sm:text-[9px] block">Authorization Certification</span>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></div>
                      <span className="text-[9px] font-bold text-teal-600 tracking-wide uppercase">Digitally Certified</span>
                    </div>
                  </div>
                  
                  {/* Signature and Stamp Overlap Area */}
                  <div className="my-3 py-1 flex items-center justify-center border-b border-dashed border-[#E0E6EF] h-[64px] relative z-20">
                    
                    {/* Round Company Blue Ink Seal Stamp - placed underneath the signature but mixed using blend-mode */}
                    <div 
                      style={{ fontFamily: "'Poppins', 'Outfit', sans-serif" }}
                      className="absolute right-4 -top-8 w-26 h-26 rounded-full border-4 border-double border-blue-600/85 flex flex-col items-center justify-center select-none transform rotate-[-15deg] pointer-events-none p-1.5 z-10 bg-white/15 mix-blend-multiply shadow-[0_0_4px_rgba(29,78,216,0.15),_inset_0_0_4px_rgba(29,78,216,0.25)]"
                    >
                      <div className="absolute inset-1 rounded-full border border-dashed border-blue-600/65" />
                      <span className="text-[8px] text-blue-600 font-black uppercase tracking-wider text-center mt-1 leading-none">MEDIQR CLINIC</span>
                      <span className="border-y-2 border-dashed border-blue-600/85 text-blue-700 font-extrabold text-[10px] px-2 py-0.5 my-1.5 tracking-widest uppercase leading-none rounded">VERIFIED</span>
                      <span className="text-[7px] font-mono font-bold text-blue-600/90 uppercase tracking-wider leading-none">
                        {todayDate}
                      </span>
                    </div>

                    {/* Green Ink Velan Cursive Signature - rendered OVER the stamp */}
                    <svg width="150" height="48" className="opacity-95 transform rotate-[-4deg] relative z-25 pointer-events-none">
                      <text x="25" y="32" className="cursive-font text-[28px] fill-[#059669] font-bold select-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                        Velan
                      </text>
                    </svg>

                  </div>
                  
                  <div className="space-y-0.5 text-right relative z-10">
                    <p className="text-xs font-bold text-[#1B3A6B]">Dr. Velan</p>
                    <p className="text-[8px] sm:text-[9px] text-[#6B7A99] font-semibold">{record.authorization?.credentials || 'MBBS, MD (General Medicine)'}</p>
                    <p className="text-[8px] sm:text-[9px] text-[#6B7A99] font-mono leading-none">{record.authorization?.regNo || 'Reg. No: TN-98431'}</p>
                  </div>
                </div>

              </div>
            </section>

          </div>

        </div>

        {/* ========================================================= */}
        {/* 2.8 FOOTER BAR                                           */}
          {/* ========================================================= */}
          <footer className="bg-[#1B3A6B]/5 border border-[#E0E6EF] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
            
            {/* Left Column */}
            <div className="flex items-center gap-2 text-[#6B7A99] text-center sm:text-left">
              <span className="material-symbols-outlined text-[16px] shrink-0 font-light select-none">lock</span>
              <p className="text-[10px] font-medium leading-relaxed max-w-sm">
                This is a digitally generated medical report. For security verification scan the header QR code.
              </p>
            </div>

            {/* Center: Download Link */}
            <div className="no-print w-full sm:w-auto">
              <Button
                variant="primary"
                onClick={handleDownloadPDF}
                icon="picture_as_pdf"
                iconPosition="left"
                className="py-2.5 px-5 text-xs bg-gradient-to-r from-[#1B3A6B] to-[#122545] hover:shadow-md font-bold rounded-full border border-transparent emergency-pulse-btn w-full sm:w-auto justify-center"
              >
                Download Report (PDF)
              </Button>
            </div>

            {/* Right Column */}
            <div className="text-right text-[#6B7A99] text-center sm:text-right">
              <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">Report Generated On</p>
              <p className="text-xs font-semibold text-[#1A2340] mt-0.5">
                {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })} | {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </p>
            </div>

          </footer>

        </main>
      )}

      {/* ========================================================= */}
      {/* 4. EMERGENCY QR CODE ZOOM MODAL OVERLAY                   */}
      {/* ========================================================= */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-fade-in no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E0E6EF] w-full max-w-sm overflow-hidden flex flex-col p-6 items-center text-center space-y-6">
            
            <div className="flex justify-between items-center w-full border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-[#1B3A6B]">
                <span className="material-symbols-outlined text-[#2ABFBF] filled-icon">qr_code_2</span>
                <span className="font-bold text-sm uppercase tracking-wide">Emergency QR Code</span>
              </div>
              <button 
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 p-1 flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg font-bold">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Scan this code using any smartphone or medical scanner to instantly open {record.name}'s secure emergency medical card.
            </p>

            {/* QR Canvas */}
            <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-[#2ABFBF]/30 shadow-inner">
              <canvas ref={modalQrCanvasRef} className="rounded" style={{ width: '220px', height: '220px' }} />
            </div>

            <div className="flex items-center gap-2 text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-wider">
              <span className="material-symbols-outlined text-xs filled-icon animate-pulse">verified_user</span>
              <span>Secure Health Link</span>
            </div>

            <Button 
              variant="secondary" 
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 text-xs text-[#1B3A6B] font-bold"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. INTERACTIVE DOCUMENT PREVIEW MODAL OVERLAY            */}
      {/* ========================================================= */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[999] flex items-center justify-center p-3 sm:p-4 animate-fade-in no-print">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E0E6EF] w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-[#1B3A6B] text-white px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center border-b border-[#E0E6EF]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] sm:text-[20px] text-[#2ABFBF] filled-icon">description</span>
                <h3 className="font-bold text-xs sm:text-sm headings-font uppercase tracking-wide truncate max-w-[240px] sm:max-w-md">
                  Document Preview: {selectedDoc.name}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedDoc(null)}
                className="text-white/80 hover:text-white rounded-full hover:bg-white/10 p-1 flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg sm:text-xl font-bold">close</span>
              </button>
            </div>

            {/* Modal Body (Realistic mock document contents) */}
            <div className="p-4 sm:p-8 overflow-y-auto doc-preview-body flex-grow bg-slate-50 space-y-6">
              
              {/* Card White Panel */}
              <div className="bg-white border border-[#E0E6EF] rounded-lg p-4 sm:p-6 shadow-sm font-sans text-[11px] sm:text-xs space-y-4 sm:space-y-6 relative overflow-hidden">
                
                {/* Hospital/Lab Branding Banner inside modal */}
                <div className="flex justify-between items-start border-b border-[#E0E6EF] pb-3 sm:pb-4">
                  <div>
                    <h4 className="text-[#1B3A6B] font-bold text-xs sm:text-sm headings-font uppercase leading-tight">
                      {record.lastVisit?.clinic || 'CITY CLINICAL LABS'}
                    </h4>
                    <p className="text-[9px] sm:text-[10px] text-[#6B7A99] mt-0.5">Verified Medical Center Access Network</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] sm:text-[9px] font-bold text-teal-600 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded uppercase">Verified PDF</span>
                    <p className="text-[9px] text-[#6B7A99] mt-1">Date: {selectedDoc.date}</p>
                  </div>
                </div>

                {/* Patient / doctor context */}
                <div className="grid grid-cols-2 gap-3 bg-[#F8FAFD] p-3 rounded-lg border border-[#E0E6EF]">
                  <div>
                    <span className="text-[9px] text-[#6B7A99] block font-bold uppercase">Patient Name</span>
                    <span className="font-bold text-[#1B3A6B] text-xs">{record.name}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#6B7A99] block font-bold uppercase">Requested By</span>
                    <span className="font-bold text-[#1B3A6B] text-xs">
                      {record.lastVisit?.doctor || record.authorization?.doctor || 'Clinical Physician'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#6B7A99] block font-bold uppercase">Age / Gender</span>
                    <span>{record.age} Years / {record.gender}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#6B7A99] block font-bold uppercase">MediQR Record ID</span>
                    <span className="font-mono text-xs">{patientId.toUpperCase()}</span>
                  </div>
                </div>

                {/* Document Conditional Content */}
                {selectedDoc.url ? (
                  (() => {
                    const docUrl = selectedDoc.url;
                    return (
                      <div className="space-y-3">
                        <h5 className="font-bold text-[#1B3A6B] text-[10px] sm:text-[11px] uppercase tracking-wider border-b border-[#E0E6EF] pb-1">
                          File Attachment: {selectedDoc.name}
                        </h5>
                        
                        <div className="flex justify-end gap-2 mb-2">
                          <button
                            type="button"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = docUrl;
                              const isPdf = docUrl.includes('application/pdf');
                              const ext = isPdf ? '.pdf' : '.jpg';
                              link.download = selectedDoc.name.toLowerCase().endsWith(ext) 
                                ? selectedDoc.name 
                                : `${selectedDoc.name}${ext}`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold bg-[#2ABFBF] text-white rounded-lg shadow hover:bg-teal-600 transition-all cursor-pointer border-0"
                          >
                            <span className="material-symbols-outlined text-[14px]">download</span>
                            Download Document
                          </button>
                          <button 
                            onClick={handleOpenDoc}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold bg-[#1B3A6B] text-white rounded-lg shadow hover:bg-slate-800 transition-all cursor-pointer border-0"
                          >
                            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                            Open / Preview
                          </button>
                        </div>

                        {(docUrl.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) || docUrl.startsWith('data:image/')) ? (
                          <div className="flex justify-center p-2 border border-slate-200 rounded-lg overflow-hidden bg-slate-900 max-h-[350px]">
                            <img src={docUrl} alt={selectedDoc.name} className="max-h-[330px] object-contain rounded" />
                          </div>
                        ) : (
                          <div className="border border-slate-200 rounded-lg overflow-hidden h-[350px] bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                            <span className="material-symbols-outlined text-rose-500 text-5xl filled-icon animate-pulse mb-3">picture_as_pdf</span>
                            <h6 className="font-semibold text-sm text-[#1B3A6B]">{selectedDoc.name}</h6>
                            <p className="text-[11px] text-[#6B7A99] mt-1.5 max-w-xs">PDF Document is ready. Click below to view the document with zoom, scroll, and print controls.</p>
                            
                            <button
                              type="button"
                              onClick={handleOpenDoc}
                              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-[#1B3A6B] text-white rounded-full shadow hover:shadow-md hover:bg-slate-800 transition-all cursor-pointer border-0"
                            >
                              <span className="material-symbols-outlined text-[16px]">visibility</span>
                              Open PDF Viewer
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <>
                    {selectedDoc.name === "Prescription" && (
                      <div className="space-y-3">
                        <h5 className="font-bold text-[#1B3A6B] text-[10px] sm:text-[11px] uppercase tracking-wider border-b border-[#E0E6EF] pb-1">Rx - Prescription Details</h5>
                        <div className="space-y-3">
                          {record.medications && record.medications.map((med, idx) => (
                            <div key={idx} className="flex justify-between items-center border-b border-dashed border-slate-100 pb-2 last:border-b-0">
                              <div>
                                <strong className="text-xs sm:text-sm font-semibold">{idx + 1}. {med.name} {med.dosage}</strong>
                                <p className="text-[#6B7A99] mt-0.5 text-[10px] sm:text-xs">Take {med.frequency} {med.purpose ? `for ${med.purpose}` : ''}.</p>
                              </div>
                              <span className="text-[9px] sm:text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold uppercase">Oral</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedDoc.name === "Blood Report" && (
                      <div className="space-y-3">
                        <h5 className="font-bold text-[#1B3A6B] text-[10px] sm:text-[11px] uppercase tracking-wider border-b border-[#E0E6EF] pb-1">Clinical Chemistry Summary Panel</h5>
                        <table className="w-full text-left border-collapse text-[10px] sm:text-xs">
                          <thead>
                            <tr className="border-b border-[#E0E6EF] text-[#6B7A99] text-[9px] uppercase">
                              <th className="py-1">Test Component</th>
                              <th className="py-1">Result</th>
                              <th className="py-1">Reference intervals</th>
                              <th className="py-1">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E0E6EF]/50">
                            {record.labResults && record.labResults.map((lab, index) => (
                              <tr key={index}>
                                <td className="py-2 font-medium">{lab.test}</td>
                                <td className="py-2 font-mono font-bold text-[#1B3A6B]">{lab.result}</td>
                                <td className="py-2 text-[#6B7A99] font-mono text-[10px] leading-tight">{lab.range}</td>
                                <td className="py-2 text-green-600 font-bold">NORMAL</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {selectedDoc.name === "ECG Report" && (
                      <div className="space-y-3">
                        <h5 className="font-bold text-[#1B3A6B] text-[10px] sm:text-[11px] uppercase tracking-wider border-b border-[#E0E6EF] pb-1">12-Lead Electrocardiogram Summary</h5>
                        <div className="bg-red-50/60 p-3 sm:p-4 rounded-xl border border-red-100 flex flex-col items-center justify-center space-y-3">
                          <span className="text-[9px] sm:text-[10px] text-red-800 font-extrabold uppercase bg-red-100 border border-red-200 px-2.5 py-0.5 rounded-full">Normal Sinus Rhythm</span>
                          
                          {/* Animated/Styled ECG wave line */}
                          <svg width="100%" height="60" viewBox="0 0 400 80" className="stroke-[#E53935] stroke-2 fill-none stroke-round">
                            <path d="M0,40 H40 L50,30 L60,50 L70,40 H100 L110,20 L125,70 L135,10 L145,45 L155,40 H200 L210,30 L220,50 L230,40 H260 L270,20 L285,70 L295,10 L305,45 L315,40 H360 L370,30 L380,50 L390,40 H400" />
                          </svg>
                          
                          <div className="grid grid-cols-3 gap-3 text-center w-full pt-1 text-[9px] sm:text-[10px]">
                            <div>
                              <strong className="block text-slate-700">Heart Rate</strong>
                              <span className="font-bold text-[#1B3A6B]">72 bpm</span>
                            </div>
                            <div>
                              <strong className="block text-slate-700">PR Interval</strong>
                              <span className="font-bold text-[#1B3A6B]">142 ms</span>
                            </div>
                            <div>
                              <strong className="block text-slate-700">QRS Duration</strong>
                              <span className="font-bold text-[#1B3A6B]">88 ms</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedDoc.name === "X-Ray Chest" && (
                      <div className="space-y-3">
                        <h5 className="font-bold text-[#1B3A6B] text-[10px] sm:text-[11px] uppercase tracking-wider border-b border-[#E0E6EF] pb-1">Diagnostic Chest Radiograph (X-Ray)</h5>
                        <div className="bg-slate-900 rounded-xl p-4 flex flex-col items-center justify-center space-y-3 min-h-[160px] text-white">
                          
                          <svg width="100" height="100" viewBox="0 0 100 100" className="opacity-80 fill-none stroke-white stroke-[1.5]">
                            <line x1="50" y1="10" x2="50" y2="90" strokeDasharray="3,3" />
                            <path d="M48,25 C30,25 25,40 25,55 C25,70 35,80 48,80" />
                            <path d="M48,35 C33,35 30,48 30,60 C30,72 38,75 48,75" />
                            <path d="M48,45 C35,45 33,55 33,65 C33,70 40,70 48,70" />
                            <path d="M52,25 C70,25 75,40 75,55 C75,70 65,80 52,80" />
                            <path d="M52,35 C67,35 70,48 70,60 C70,72 62,75 52,75" />
                            <path d="M52,45 C65,45 67,55 67,65 C67,70 60,70 52,70" />
                            <path d="M50,15 C40,15 25,18 20,22" />
                            <path d="M50,15 C60,15 75,18 80,22" />
                          </svg>
                          
                          <div className="text-center">
                            <span className="text-[9px] text-teal-400 font-bold uppercase">DIAGNOSTIC FINDING</span>
                            <p className="text-[10px] text-slate-300 font-medium leading-relaxed max-w-xs mt-1">
                              Lungs are clear bilaterally. No consolidations, effusions, or cardiomegaly. Lungs fields are normal.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Certified Digital Doctor stamp */}
                <div className="flex justify-between items-end border-t border-[#E0E6EF] pt-3 mt-4">
                  <div className="space-y-0.5">
                    <p className="text-[#6B7A99] text-[8px] uppercase font-bold">Digitally Certified By</p>
                    <p className="font-bold text-[#1B3A6B] text-[11px]">
                      {record.authorization?.doctor || 'Certified Doctor'}
                    </p>
                    <p className="text-[#6B7A99] font-mono text-[8px] leading-none">
                      {record.authorization?.regNo || 'Reg. Certified'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="inline-block border-2 border-teal-500 text-teal-500 rounded px-1.5 py-0.5 uppercase font-extrabold text-[8px] tracking-widest leading-none rotate-[-4deg] select-none">
                      Clinical Verified
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-[#F8FAFD] px-4 py-3 sm:px-6 sm:py-4 flex justify-end gap-2 border-t border-[#E0E6EF]">
              <Button 
                variant="secondary" 
                onClick={() => setSelectedDoc(null)}
                className="py-2.5 px-4 text-xs text-[#1B3A6B]"
              >
                Close Preview
              </Button>
              <Button 
                variant="primary" 
                onClick={() => window.print()}
                icon="print"
                iconPosition="left"
                className="py-2.5 px-4 text-xs bg-[#1B3A6B]"
              >
                Print Document
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PublicEmergencyProfile;
