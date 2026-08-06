import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Client, Assignment, Employee, LeaveRequest, LeavePolicyConfig } from '../types';

const effectiveConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (firebaseConfig as any).apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (firebaseConfig as any).authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (firebaseConfig as any).projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (firebaseConfig as any).storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || (firebaseConfig as any).messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || (firebaseConfig as any).appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || (firebaseConfig as any).firestoreDatabaseId
};

const app = getApps().length > 0 ? getApp() : initializeApp(effectiveConfig);
export const db = (effectiveConfig.firestoreDatabaseId && effectiveConfig.firestoreDatabaseId !== '(default)')
  ? getFirestore(app, effectiveConfig.firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);

// Attempt anonymous authentication if no user is signed in
try {
  if (!auth.currentUser) {
    signInAnonymously(auth).catch(() => {
      // Anonymous auth disabled or not needed
    });
  }
} catch {
  // Ignored
}

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
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

// Test Connection on startup as mandated
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

// Client Operations
export function subscribeClients(onData: (clients: Client[]) => void) {
  const path = 'clients';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: Client[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as Client);
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveClientToFirestore(client: Client) {
  const path = `clients/${client.id}`;
  try {
    await setDoc(doc(db, 'clients', client.id), client);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteClientFromFirestore(clientId: string) {
  const path = `clients/${clientId}`;
  try {
    await deleteDoc(doc(db, 'clients', clientId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Assignment Operations
export function subscribeAssignments(onData: (assignments: Assignment[]) => void) {
  const path = 'assignments';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: Assignment[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as Assignment);
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveAssignmentToFirestore(assignment: Assignment) {
  const path = `assignments/${assignment.id}`;
  try {
    await setDoc(doc(db, 'assignments', assignment.id), assignment);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteAssignmentFromFirestore(assignmentId: string) {
  const path = `assignments/${assignmentId}`;
  try {
    await deleteDoc(doc(db, 'assignments', assignmentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Employee Operations
export function subscribeEmployees(onData: (employees: Employee[]) => void) {
  const path = 'employees';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: Employee[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as Employee);
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveEmployeeToFirestore(employee: Employee) {
  const path = `employees/${employee.id}`;
  try {
    await setDoc(doc(db, 'employees', employee.id), employee);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteEmployeeFromFirestore(employeeId: string) {
  const path = `employees/${employeeId}`;
  try {
    await deleteDoc(doc(db, 'employees', employeeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export const DEFAULT_LEAVE_POLICY: LeavePolicyConfig = {
  monthlyQuota: 2,
  categories: ['Casual Leave', 'Sick Leave', 'Paid Leave', 'Unpaid Leave', 'Maternity/Paternity Leave']
};

// Leave Requests Operations
export function subscribeLeaveRequests(onData: (requests: LeaveRequest[]) => void) {
  const path = 'leaveRequests';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: LeaveRequest[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as LeaveRequest);
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveLeaveRequestToFirestore(request: LeaveRequest) {
  const path = `leaveRequests/${request.id}`;
  try {
    await setDoc(doc(db, 'leaveRequests', request.id), request);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteLeaveRequestFromFirestore(requestId: string) {
  const path = `leaveRequests/${requestId}`;
  try {
    await deleteDoc(doc(db, 'leaveRequests', requestId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Leave Policy Settings Operations
export function subscribeLeavePolicy(onData: (policy: LeavePolicyConfig) => void) {
  const path = 'settings/leavePolicy';
  return onSnapshot(
    doc(db, 'settings', 'leavePolicy'),
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data() as LeavePolicyConfig);
      } else {
        onData(DEFAULT_LEAVE_POLICY);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveLeavePolicyToFirestore(policy: LeavePolicyConfig) {
  const path = 'settings/leavePolicy';
  try {
    await setDoc(doc(db, 'settings', 'leavePolicy'), policy);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Initial Seeding
export async function seedInitialFirestoreData(
  initialClients: Client[], 
  initialAssignments: Assignment[], 
  initialEmployees: Employee[]
) {
  try {
    const clientsSnap = await getDocs(collection(db, 'clients'));
    if (clientsSnap.empty && initialClients.length > 0) {
      for (const client of initialClients) {
        await setDoc(doc(db, 'clients', client.id), client);
      }
    }

    const assignmentsSnap = await getDocs(collection(db, 'assignments'));
    if (assignmentsSnap.empty && initialAssignments.length > 0) {
      for (const assignment of initialAssignments) {
        await setDoc(doc(db, 'assignments', assignment.id), assignment);
      }
    }

    const employeesSnap = await getDocs(collection(db, 'employees'));
    if (employeesSnap.empty && initialEmployees.length > 0) {
      for (const emp of initialEmployees) {
        await setDoc(doc(db, 'employees', emp.id), emp);
      }
    }

    const policyDoc = await getDocs(collection(db, 'settings'));
    if (policyDoc.empty) {
      await saveLeavePolicyToFirestore(DEFAULT_LEAVE_POLICY);
    }
  } catch (err) {
    console.error('Error seeding initial Firestore data:', err);
  }
}
