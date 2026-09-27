/**
 * Kiểu dữ liệu cho Ứng dụng Sắp lịch trực BCH Đoàn trường THPT Nguyễn Chí Thanh
 * Thiết kế tối giản theo phong cách Bảng tính Excel
 */

export type GradeLevel = '12' | '11' | '10';

export interface BCHUnit {
  id: string; // e.g. "bch-10c1" or "bch-dt"
  name: string; // e.g. "BCH 10C1" or "BCH ĐT"
  grade: GradeLevel | 'all';
  representativeName?: string;
  enabled: boolean;
  order: number;
}

export interface SupportStudent {
  id: string;
  fullName: string;
  className: string;
  grade: GradeLevel;
}

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export type BCHScheduleMode = 'increasing' | 'decreasing' | 'custom' | 'auto';

export interface BCHSlot {
  bchId?: string;
  isLocked?: boolean;
}

export interface GradeDaySchedule {
  students: string[]; // student ids (tối đa 2 học sinh)
  isStudentsLocked?: boolean;
  bch: BCHSlot;
}

// Bảng lịch tuần gồm 3 khối (12, 11, 10), mỗi khối gồm 5 ngày (mon..fri)
export type WeekGrid = Record<GradeLevel, Record<DayOfWeek, GradeDaySchedule>>;

// Vị trí trực sáng Thứ Hai Sinh Hoạt Dưới Cờ (SHDC)
export type SHDCLocationKey = string;

export interface SHDCLocationConfig {
  key: string;
  name: string; // e.g. "Khu vực khu C (12C8)"
  shortName: string;
}

export interface SHDCLocationSlot {
  locationKey: string;
  students: string[]; // student ids
}

export type SHDCDistributionMode = '2_per_location' | '3_per_location' | 'custom';

export interface SHDCSchedule {
  mode?: SHDCDistributionMode;
  locations: Record<string, SHDCLocationSlot>;
  lockedStudents?: string[]; // student ids được khóa cố định tại vị trí hiện tại
}

// Phân công lớp trực sáng & chiều Thứ Hai: Trực cổng, Chuẩn bị sân khấu, Dọn dẹp sân khấu
export interface MondayDutyDutyItem {
  gateDutyClass?: string;       // Lớp trực cổng
  stagePrepClass?: string;      // Lớp chuẩn bị sân khấu
  stageCleanClass?: string;     // Lớp dọn dẹp sân khấu
}

// Phân công Trực tuần
export interface WeekDutyItem {
  morning?: string;             // Trực tuần Sáng (VD: 11C4)
  afternoon?: string;           // Trực tuần Chiều (VD: 10C4)
}

// Vệ sinh cầu thang (Khu A, Khu B, Khu C1, Khu D)
export interface StairCleanItem {
  khuA?: string;                // Khu A (VD: 12C4)
  khuB_cong?: string;           // Khu B (phía cổng) (VD: 11C5 / 10C6)
  khuB_thuvien?: string;        // Khu B (gần thư viện) (VD: 11C6 / 10C7)
  khuC1?: string;               // Khu C1 (phía cổng) (VD: 11C4 / 10C4)
  khuD?: string;                // Khu D (VD: 11TX / 12TX)
}

export interface MondayDutyClasses {
  isLocked?: boolean;             // Khóa phân công lớp trực & vệ sinh cầu thang tuần này (tự động giữ nguyên sang tuần tiếp theo)
  lockedFields?: Record<string, boolean>; // Khóa chi tiết từng vị trí / lớp cụ thể
  morning?: MondayDutyDutyItem;   // Buổi sáng: Cổng, Chuẩn bị sân khấu, Dọn dẹp sân khấu
  afternoon?: MondayDutyDutyItem; // Buổi chiều: Cổng, Chuẩn bị sân khấu, Dọn dẹp sân khấu
  weekDuty?: WeekDutyItem;        // Trực tuần: Sáng & Chiều
  stairCleaning?: {               // Vệ sinh cầu thang
    morning?: StairCleanItem;
    afternoon?: StairCleanItem;
  };
  notes?: string;                 // Ghi chú thêm nếu có
}

export interface WeekSchedule {
  weekNumber: number;
  startDate: string; // YYYY-MM-DD (ngày Thứ Hai)
  academicYear: string;
  bchMode: BCHScheduleMode;
  grid: WeekGrid;
  shdc?: SHDCSchedule;
  mondayDutyClasses?: MondayDutyClasses;
}

export interface RotationState {
  lastBCH: Record<GradeLevel, string | null>; // Lớp BCH cuối cùng được xếp của mỗi khối
  lastWeekScheduled: number;
}

export interface AppState {
  currentWeekNumber: number;
  startDate: string; // YYYY-MM-DD
  academicYear: string;
  bchMode: BCHScheduleMode;
  includeSaturday?: boolean; // Tích chọn hiển thị thêm cột Thứ 7
  weeks: Record<number, WeekSchedule>;
  bchList: BCHUnit[];
  students: SupportStudent[];
  shdcLocations: SHDCLocationConfig[];
  rotationState: RotationState;
  schoolName: string;
  secretaryName: string;
}

// Lựa chọn nội dung hiển thị trong In & Xem trước
export type PrintContentFilter =
  | 'all'                 // Đầy đủ tất cả nội dung
  | 'grid_only'           // Chỉ bảng lịch trực tuần (Khối 10, 11, 12)
  | 'shdc_only'           // Chỉ bảng SHDC (Học sinh hỗ trợ sáng Thứ Hai)
  | 'monday_duty_only'    // Chỉ phân công Lớp trực sáng & chiều Thứ Hai
  | 'grid_and_monday_duty'// Lịch tuần + Phân công lớp trực
  | 'monday_all';         // Tất cả các mục sáng Thứ Hai (SHDC + Phân công lớp trực)

