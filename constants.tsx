
import { Employee, Client, Assignment } from './types';

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: '5',
    name: 'Rajesh Gupte',
    email: 'rajesh.g@convexent.com',
    role: 'CFO',
    department: 'Executive Board',
    salary: 180000,
    dateJoined: '2019-05-15',
    status: 'Active',
    performanceScore: 9.0,
    bio: 'Managing the financial ecosystem of high-budget productions.'
  },
  {
    id: 'admin_anandhu',
    name: 'Anandhu (Super Admin)',
    email: 'me.anandhutr@gmail.com',
    role: 'Studio Operations Director',
    department: 'Management',
    salary: 150000,
    dateJoined: '2020-01-01',
    status: 'Active',
    performanceScore: 10.0,
    bio: 'System Administrator and Operations Director',
    accessLevel: 'admin'
  }
];

export const MOCK_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'Rohan & Ananya Verma',
    email: 'rohan.verma@example.com',
    phone: '+91 98765 43210',
    religion: 'Hindu',
    workScope: 'Both',
    packageAmount: 450000,
    advancePaid: 200000,
    paymentNotes: 'Received ₹2,00,000 via NEFT advance. Balance ₹2,50,000 to be paid on wedding day.',
    status: 'Booked',
    events: [
      {
        id: 'e1',
        type: 'Wedding',
        date: '2026-11-15',
        venue: 'Leela Palace, Udaipur',
        notes: 'Royal traditional wedding, traditional Shehnai live performance and 4K multi-cam setup required.',
        sideType: 'Both',
        crew: [
          { id: 'cr1', name: 'Aakash Patel', phone: '+91 98111 22334', role: 'Photographer', side: 'Bride', employeeId: '1' },
          { id: 'cr2', name: 'Rohan Sharma', phone: '+91 98111 55667', role: 'Videographer', side: 'Bride' },
          { id: 'cr3', name: 'Sanjay Kumar', phone: '+91 98222 33445', role: 'Photographer', side: 'Groom' },
          { id: 'cr4', name: 'Deepak Verma', phone: '+91 98222 77889', role: 'Videographer', side: 'Groom' },
          { id: 'cr5', name: 'Arjun Mehta', phone: '+91 98765 11111', role: 'Drone Operator', side: 'Both', employeeId: '1' }
        ],
        hddStorage: [
          {
            id: 'hdd1',
            hddName: 'WD MyPassport 4TB Red (#A1)',
            folderPath: '/RAW_BACKUPS/2026_ROHAN_ANANYA/BRIDE_SIDE_CAM1_CAM2',
            copiedBy: 'Arjun Mehta',
            copiedDate: '2026-11-16',
            notes: 'Sony A7IV RAW photos & FX3 4K 10-bit video files'
          },
          {
            id: 'hdd2',
            hddName: 'SanDisk Extreme SSD 2TB (#SSD02)',
            folderPath: '/RAW_BACKUPS/2026_ROHAN_ANANYA/GROOM_SIDE_CINEMA',
            copiedBy: 'Sarah Khan',
            copiedDate: '2026-11-16',
            notes: 'Candid Groom side ritual 60fps MOV files'
          }
        ]
      },
      {
        id: 'e2',
        type: 'Engagement',
        date: '2026-10-20',
        venue: 'Taj Lands End, Mumbai',
        notes: 'Sunset cocktail engagement party, candid cinematography.',
        sideType: 'Single',
        crew: [
          { id: 'cr6', name: 'Aakash Patel', phone: '+91 98111 22334', role: 'Photographer', side: 'General' },
          { id: 'cr7', name: 'Sarah Khan', phone: '+91 98999 12345', role: 'Videographer', side: 'General', employeeId: '2' }
        ],
        hddStorage: [
          {
            id: 'hdd3',
            hddName: 'Seagate Expansion 5TB (#B4)',
            folderPath: '/ENGAGEMENTS/2026_ROHAN_TAJ_LANDS_END/ALL_RAW',
            copiedBy: 'Sarah Khan',
            copiedDate: '2026-10-21',
            notes: 'Full dump of 128GB SD cards'
          }
        ]
      }
    ]
  },
  {
    id: 'c2',
    name: 'David & Sarah Miller',
    email: 'david.m@example.com',
    phone: '+1 415 555 0199',
    religion: 'Christian',
    workScope: 'Both',
    packageAmount: 350000,
    advancePaid: 150000,
    paymentNotes: '₹1,50,000 token advance received.',
    status: 'Booked',
    events: [
      {
        id: 'e3',
        type: 'Wedding',
        date: '2026-12-05',
        venue: 'St. Patrick Cathedral & Grand Resort, Goa',
        notes: 'White wedding service followed by beachside reception. Drone coverage requested.',
        sideType: 'Both',
        crew: [
          { id: 'cr8', name: 'John D\'Souza', phone: '+91 97654 32100', role: 'Photographer', side: 'Bride' },
          { id: 'cr9', name: 'Mark Anthony', phone: '+91 97654 88990', role: 'Videographer', side: 'Groom' }
        ],
        hddStorage: [
          {
            id: 'hdd4',
            hddName: 'Lacie Rugged 2TB SSD (#GOA_01)',
            folderPath: '/PROJECTS_2026/DAVID_SARAH_GOA/CATHEDRAL_RAW',
            copiedBy: 'Vikram Singh',
            copiedDate: '2026-12-06',
            notes: 'Main camera feeds and audio recorder dumps'
          }
        ]
      },
      {
        id: 'e4',
        type: 'Pre-Wedding Shoot',
        date: '2026-11-01',
        venue: 'Fontainhas Heritage Quarter, Panaji',
        notes: 'Vintage cinematic feel with vintage color profiles.',
        sideType: 'Single',
        crew: [
          { id: 'cr10', name: 'Arjun Mehta', phone: '+91 98765 11111', role: 'Photographer', side: 'General', employeeId: '1' }
        ],
        hddStorage: []
      }
    ]
  },
  {
    id: 'c3',
    name: 'Kabir & Aisha Khan',
    email: 'kabir.k@example.com',
    phone: '+91 91234 56789',
    religion: 'Muslim',
    status: 'Booked',
    events: [
      {
        id: 'e5',
        type: 'Wedding',
        date: '2026-12-28',
        venue: 'ITC Grand Central, Hyderabad',
        notes: 'Grand Nikkah ceremony and Walima reception with traditional lighting.',
        sideType: 'Both',
        crew: [
          { id: 'cr11', name: 'Tariq Hussain', phone: '+91 94400 11223', role: 'Photographer', side: 'Bride' },
          { id: 'cr12', name: 'Faisal Ali', phone: '+91 94400 33445', role: 'Videographer', side: 'Groom' }
        ],
        hddStorage: []
      }
    ]
  },
  {
    id: 'c4',
    name: 'Vikram & Neha Malhotra',
    email: 'vikram.m@example.com',
    phone: '+91 99887 76655',
    religion: 'Hindu',
    status: 'Lead',
    events: [
      {
        id: 'e6',
        type: 'Engagement',
        date: '2027-01-10',
        venue: 'JW Marriott, New Delhi',
        notes: 'Inquiry received for full coverage. Pending quote approval.',
        sideType: 'Single',
        crew: [],
        hddStorage: []
      }
    ]
  }
];

export const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: 'a1',
    title: 'Cinematography Equipment Allocation & Crew Briefing',
    description: 'Coordinate multi-cam 4K equipment, drone permissions, and crew allocation for Rohan & Ananya Verma Udaipur wedding ceremony.',
    assigneeId: '1',
    status: 'In Progress',
    priority: 'Urgent',
    dueDate: '2026-08-03', // Overdue relative to current date (2026-08-05)
    createdAt: '2026-07-25',
    clientId: 'c1',
    eventId: 'e1',
    subtasks: [
      { id: 'st1', title: 'Confirm multi-cam 4K equipment packing list', completed: true },
      { id: 'st2', title: 'Obtain Udaipur palace drone permit', completed: true },
      { id: 'st3', title: 'Conduct pre-shoot briefing with lead camera crew', completed: true },
      { id: 'st4', title: 'Sync audio wireless mic frequencies', completed: false }
    ]
  },
  {
    id: 'a2',
    title: 'Pre-Wedding Shoot Teaser Color Grading',
    description: 'Edit and color grade 60-second teaser for David & Sarah Miller Goa heritage pre-wedding shoot.',
    assigneeId: '2',
    status: 'Review',
    priority: 'High',
    dueDate: '2026-08-05', // Due Today
    createdAt: '2026-08-01',
    clientId: 'c2',
    eventId: 'e4',
    subtasks: [
      { id: 'st21', title: 'Select top 15 cinematic raw clips', completed: true },
      { id: 'st22', title: 'Apply DaVinci golden hour LUTs', completed: true },
      { id: 'st23', title: 'Render 4K 60sec teaser preview', completed: true },
      { id: 'st24', title: 'Client final review approval', completed: false }
    ]
  },
  {
    id: 'a3',
    title: 'Creative Moodboard & Nikkah Theme Direction',
    description: 'Prepare lighting setup and traditional aesthetic guidelines for Kabir & Aisha Khan Nikkah in Hyderabad.',
    assigneeId: '3',
    status: 'To Do',
    priority: 'Medium',
    dueDate: '2026-08-10', // Due soon
    createdAt: '2026-08-03',
    clientId: 'c3',
    eventId: 'e5',
    subtasks: [
      { id: 'st31', title: 'Gather traditional color palette references', completed: true },
      { id: 'st32', title: 'Design stage lighting plan', completed: false },
      { id: 'st33', title: 'Send moodboard PDF to client', completed: false }
    ]
  },
  {
    id: 'a4',
    title: 'Engagement Party Candid Edits & Delivery',
    description: 'Finalize high-res album export and delivery for Rohan & Ananya Verma Taj Lands End engagement.',
    assigneeId: '2',
    status: 'To Do',
    priority: 'High',
    dueDate: '2026-08-02', // Overdue
    createdAt: '2026-07-28',
    clientId: 'c1',
    eventId: 'e2',
    subtasks: [
      { id: 'st41', title: 'Candid photo culling (200 selected)', completed: true },
      { id: 'st42', title: 'High-res Lightroom retouching', completed: false },
      { id: 'st43', title: 'Upload online gallery link for family', completed: false }
    ]
  }
];

export const DEPARTMENTS: Department[] = ['HR', 'Video Editor', 'Photo Editor', 'Creative Designer', 'Management', 'Executive Board'];

