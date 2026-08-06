
export type Department = 'Production' | 'Post-Production' | 'Marketing' | 'HR' | 'Finance' | 'Creative' | 'Management';

export type EmployeeStatus = 'Active' | 'On Leave' | 'Terminated' | 'Contract';

export type AccessLevel = 'admin' | 'employee';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: Department;
  salary: number;
  dateJoined: string;
  status: EmployeeStatus;
  performanceScore: number; // 1-10
  bio: string;
  profilePicture?: string; // Base64 encoded string
  accessLevel?: AccessLevel;
  password?: string;
}

export type AssignmentStatus = 'To Do' | 'In Progress' | 'Review' | 'Done';
export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  status: AssignmentStatus;
  priority: Priority;
  dueDate: string;
  createdAt: string;
  clientId?: string;
  eventId?: string;
  subtasks?: SubTask[];
}

// Client Management Types
export type Religion = 'Christian' | 'Hindu' | 'Muslim' | 'Others';
export type EventType = 'Wedding' | 'Engagement' | 'Save the Date' | 'Pre-Wedding Shoot' | 'Other';

export type CrewRole = 'Photographer' | 'Videographer' | 'Drone Operator' | 'Assistant';
export type SideType = 'Bride' | 'Groom' | 'Both' | 'General';

export interface EventCrewMember {
  id: string;
  name: string;
  phone: string;
  role: CrewRole;
  side: SideType;
  employeeId?: string;
}

export interface EventHddStorage {
  id: string;
  hddName: string;
  folderPath: string;
  copiedBy: string;
  copiedDate?: string;
  notes?: string;
}

export interface ClientEvent {
  id: string;
  type: EventType;
  date: string;
  venue: string;
  notes: string;
  sideType?: 'Single' | 'Both';
  crew?: EventCrewMember[];
  hddStorage?: EventHddStorage[];
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  religion: Religion;
  workScope?: 'Both' | 'Single';
  packageAmount?: number;
  advancePaid?: number;
  paymentNotes?: string;
  events: ClientEvent[];
  status: 'Lead' | 'Booked' | 'Completed';
}

// Leave Management Types
export type LeaveType = string;
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail?: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  isSingleDay: boolean;
  daysCount: number;
  reason: string;
  status: LeaveStatus;
  appliedOn: string;
  reviewedBy?: string;
  reviewedOn?: string;
  adminComment?: string;
}

export interface LeavePolicyConfig {
  monthlyQuota: number;
  categories: string[];
}

export interface AppState {
  employees: Employee[];
  assignments: Assignment[];
  clients: Client[];
  selectedEmployee: Employee | null;
  selectedAssignment: Assignment | null;
  selectedClient: Client | null;
  selectedClientId?: string | null;
  isModalOpen: boolean;
  isAssignmentModalOpen: boolean;
  isClientModalOpen: boolean;
  view: 'dashboard' | 'directory' | 'ai-insights' | 'assignments' | 'clients' | 'leaves';
}
