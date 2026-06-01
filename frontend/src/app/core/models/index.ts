// ── Auth ─────────────────────────────────────────────────────────
export type UserRole = 'ADMIN' | 'SELLER' | 'BUYER';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';
export type NoteStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: number;
  email: string;
  fullName: string;
  role: UserRole;
  isVerified: boolean;
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  profileImageUrl?: string;
  classLevel?: string;
  institution?: string;
  bio?: string;
  isVerified?: boolean;
  testPassed?: boolean;
  testScore?: number;
  marksheetApproved?: boolean;
  createdAt?: string;
}

// ── Note ─────────────────────────────────────────────────────────
export interface SellerProfile {
  id: number;
  fullName: string;
  classLevel?: string;
  institution?: string;
  bio?: string;
  profileImageUrl?: string;
  totalNotes?: number;
  totalSales?: number;
}

export interface Note {
  id: number;
  title: string;
  description: string;
  classLevel?: string;
  subject?: string;
  examType?: string;
  price: number;
  thumbnailUrl?: string;
  previewUrl?: string;
  totalPages?: number;
  status?: NoteStatus;
  purchaseCount?: number;
  averageRating?: number;
  reviewCount?: number;
  seller?: SellerProfile;
  createdAt?: string;
  isPurchased?: boolean;
}

// ── Purchase & Review ─────────────────────────────────────────────
export interface Purchase {
  id: number;
  note?: Note;
  amount: number;
  platformShare?: number;
  sellerShare?: number;
  transactionId?: string;
  invoiceNumber?: string;
  status?: PaymentStatus;
  purchasedAt?: string;
}

export interface PaymentOrder {
  provider: 'RAZORPAY' | 'DEMO';
  keyId?: string;
  orderId: string;
  amountPaise: number;
  amount: number;
  currency: string;
  noteId: number;
  noteTitle: string;
  buyerName?: string;
  buyerEmail?: string;
}

export interface Review {
  id: number;
  buyerName?: string;
  rating: number;
  comment?: string;
  createdAt?: string;
}

// ── Dashboard ─────────────────────────────────────────────────────
export interface AdminDashboard {
  totalRevenue: number;
  platformRevenue: number;
  sellerRevenue: number;
  totalUsers: number;
  totalSellers: number;
  totalBuyers: number;
  totalNotes: number;
  totalPurchases: number;
  todayRevenue: number;
  monthRevenue: number;
  yearRevenue: number;
  dailyRevenue: ChartPoint[];
  monthlyRevenue: ChartPoint[];
  pendingSellerApprovals: number;
}

export interface SellerDashboard {
  totalEarnings: number;
  monthEarnings: number;
  todayEarnings: number;
  totalNotes: number;
  totalSales: number;
  averageRating: number;
  salesChart: ChartPoint[];
  recentNotes: Note[];
  isVerified: boolean;
  testPassed: boolean;
  marksheetUploaded: boolean;
}

export interface ChartPoint {
  date?: string;
  month?: string;
  year?: string;
  revenue: number;
}

// ── API Envelope ──────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ── Test ──────────────────────────────────────────────────────────
export interface TestConfig {
  id?: number;
  passScorePercent: number;
  timeLimitMinutes: number;
  maxAttempts: number;
  questionsPerTest: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  isActive: boolean;
  totalActiveQuestions?: number;
  updatedAt?: string;
}

export interface TestOptionAdmin {
  id?: number;
  optionKey: string;
  optionText: string;
  isCorrect: boolean;
}

export interface TestQuestionAdmin {
  id?: number;
  questionText: string;
  subject?: string;
  displayOrder?: number;
  isActive: boolean;
  correctAnswerKey: string;
  options: TestOptionAdmin[];
  createdAt?: string;
}
