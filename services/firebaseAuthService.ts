import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { auth, saveEmployeeToFirestore } from './firestoreService';
import { Employee } from '../types';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const signInWithGoogle = async (): Promise<{ user: User | null; error?: string }> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user };
  } catch (err: any) {
    console.error('Google Sign In Error:', err);
    
    if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
      const domain = window.location.hostname;
      return { 
        user: null, 
        error: `Domain "${domain}" is not authorized in Firebase Auth.\n\nTo enable Google Sign-In on Vercel/Custom Domain:\n1. Open Firebase Console (https://console.firebase.google.com)\n2. Go to project "convex-hrms" -> Authentication -> Settings -> Authorized domains\n3. Click "Add domain" and add "${domain}"\n\nIn the meantime, you can log in below using Passcode Login (Select Admin Director & enter "admin123").` 
      };
    }
    
    return { user: null, error: err?.message || 'Google sign-in failed' };
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (err) {
    console.error('Sign out error:', err);
  }
};

export const subscribeAuthUser = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Matches a Google logged in email against existing employees or creates a new Employee account.
 */
export const matchOrCreateEmployeeFromGoogleUser = (
  user: User, 
  existingEmployees: Employee[]
): { roleId: string; employee?: Employee; isNewAccount: boolean } => {
  const userEmail = (user.email || '').toLowerCase().trim();
  
  if (!userEmail) {
    return { roleId: 'admin', isNewAccount: false };
  }

  const isSuperAdminEmail = userEmail === 'me.anandhutr@gmail.com';

  // 1. Check if email matches existing employee
  const matchedEmp = existingEmployees.find(e => (e.email || '').toLowerCase().trim() === userEmail);
  
  if (matchedEmp) {
    if (isSuperAdminEmail && matchedEmp.accessLevel !== 'admin') {
      matchedEmp.accessLevel = 'admin';
      saveEmployeeToFirestore(matchedEmp);
    }
    return {
      roleId: isSuperAdminEmail ? 'admin' : matchedEmp.id,
      employee: matchedEmp,
      isNewAccount: false
    };
  }

  // 2. Default initial admin or primary user
  if (isSuperAdminEmail || existingEmployees.length === 0 || userEmail.includes('admin')) {
    if (isSuperAdminEmail) {
      const adminEmp: Employee = {
        id: 'admin_anandhu',
        name: user.displayName || 'Anandhu (Admin)',
        email: userEmail,
        role: 'Studio Operations Director',
        department: 'Management',
        salary: 120000,
        dateJoined: new Date().toISOString().split('T')[0],
        status: 'Active',
        performanceScore: 10.0,
        profilePicture: user.photoURL || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200`,
        bio: `System Super Admin account (${userEmail})`,
        accessLevel: 'admin'
      };
      saveEmployeeToFirestore(adminEmp);
      return { roleId: 'admin', employee: adminEmp, isNewAccount: true };
    }
    return {
      roleId: 'admin',
      isNewAccount: false
    };
  }

  // 3. Create a new Employee record in Firestore for this Gmail user so they have access!
  const newEmp: Employee = {
    id: user.uid.substring(0, 10) || Math.random().toString(36).substr(2, 9),
    name: user.displayName || userEmail.split('@')[0],
    email: userEmail,
    role: 'Studio Operations Crew',
    department: 'Photography & Editing',
    salary: 25000,
    dateJoined: new Date().toISOString().split('T')[0],
    status: 'Active',
    performanceScore: 5.0,
    profilePicture: user.photoURL || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200`,
    bio: `Registered via Google Authentication (${userEmail})`
  };

  // Auto save new employee profile into Firestore
  saveEmployeeToFirestore(newEmp);

  return {
    roleId: newEmp.id,
    employee: newEmp,
    isNewAccount: true
  };
};
