export interface WindowPane {
  id: string;
  name: string;
  width: number; // inches
  height: number; // inches
  quantity: number;
  filmType?: string;
  notes?: string;
  photoUrl?: string;
  aiAnalyzed?: boolean;
  aiConfidence?: "low" | "medium" | "high";
}

export interface Customer {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export interface PaymentRecord {
  method: "stripe" | "zelle" | "cash" | "check";
  amount: number;
  date: string;
  reference?: string;
  notes?: string;
}

export type JobStatus = "draft" | "scheduled" | "in_progress" | "completed" | "invoiced" | "paid";

export interface Job {
  id: string;
  jobNumber: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;

  customer: Customer;
  description: string;
  location: string; // e.g. residential / commercial

  // Material settings
  materialWidth: 60 | 72;
  defaultFilmType: string;
  pricePerSqFt: number;
  laborRate: number;
  laborHours: number;
  taxRate: number; // percent, e.g. 8.5
  discount: number; // dollars

  windows: WindowPane[];

  beforePhotos: string[];
  afterPhotos: string[];

  payments: PaymentRecord[];
  stripePaymentIntentId?: string;

  notes: string;
}

// Cut sheet types
export interface CutPiece {
  windowId: string;
  windowName: string;
  pieceWidth: number; // inches (includes overlap)
  pieceHeight: number; // inches (includes overlap)
  rotated: boolean;
  quantity: number;
}

export interface CutStrip {
  stripLength: number; // inches
  pieces: Array<{ piece: CutPiece; xOffset: number }>;
  usedWidth: number;
  wasteWidth: number;
}

export interface CutSheet {
  materialWidth: number;
  totalLength: number; // inches
  totalLengthFt: number;
  strips: CutStrip[];
  totalSqFt: number;
  totalLinFt: number;
  efficiency: number; // percent
}

export type QuoteLineItem = {
  description: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
};
