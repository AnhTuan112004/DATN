export interface FaceConsentInfo {
  hasConsent: boolean;
  consentTimestamp: string;
  consentPolicyVersion: string;
  registeredAt: string;
  enrolledBy: {
    _id: string;
    fullName: string;
    employeeCode: string;
    role: string;
  } | null;
}

export interface FaceStatusResponse {
  hasFaceRegistered: boolean;
  sampleCount: number;
  vectorDimension: number;
  modelName?: string;
  modelVersion?: string;
  consent: FaceConsentInfo | null;
}

export interface EnrollFacePayload {
  descriptors: number[][];
  hasConsent: true;
  consentPolicyVersion?: string;
  modelName?: string;
  modelVersion?: string;
}

export interface EnrollFaceResponse {
  success: boolean;
  message: string;
  data: {
    hasFaceRegistered: boolean;
    sampleCount: number;
    consentPolicyVersion: string;
    registeredAt: string;
  };
}
