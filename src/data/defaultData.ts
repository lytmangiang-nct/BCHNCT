import { 
  BCHUnit, 
  SupportStudent, 
  WeekSchedule, 
  WeekGrid, 
  GradeLevel, 
  DayOfWeek, 
  AppState, 
  SHDCLocationConfig, 
  SHDCSchedule,
  MondayDutyClasses
} from '../types';

export const ORDERED_GRADES: GradeLevel[] = ['12', '11', '10'];

// Tất cả các ngày trong tuần (có Thứ 7)
export const ALL_DAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

// Các ngày mặc định (Thứ 2 đến Thứ 6)
export const ORDERED_DAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri'];

export const DAYS_INFO: { key: DayOfWeek; label: string; short: string }[] = [
  { key: 'mon', label: 'THỨ HAI', short: 'T2' },
  { key: 'tue', label: 'THỨ BA', short: 'T3' },
  { key: 'wed', label: 'THỨ TƯ', short: 'T4' },
  { key: 'thu', label: 'THỨ NĂM', short: 'T5' },
  { key: 'fri', label: 'THỨ SÁU', short: 'T6' },
  { key: 'sat', label: 'THỨ BẢY', short: 'T7' },
];

export function getActiveDays(includeSaturday = false): { key: DayOfWeek; label: string; short: string }[] {
  return includeSaturday ? DAYS_INFO : DAYS_INFO.slice(0, 5);
}

export function getActiveDayKeys(includeSaturday = false): DayOfWeek[] {
  return includeSaturday ? ALL_DAYS : ORDERED_DAYS;
}

/**
 * Mốc thời gian thực:
 * - Tuần 4 bắt đầu vào Thứ Hai, ngày 28/09/2026
 * - Nối tiếp Tuần 5 bắt đầu vào Thứ Hai, ngày 05/10/2026
 * => Tuần 1 bắt đầu vào Thứ Hai, ngày 07/09/2026 (28/09 - 21 ngày = 07/09)
 */
export const BASE_WEEK_1_START_DATE = '2026-09-07';

/**
 * Tính ngày bắt đầu (Thứ Hai, định dạng YYYY-MM-DD) cho tuần thứ weekNumber
 */
export function getStartDateForWeek(weekNumber: number, baseDate = BASE_WEEK_1_START_DATE): string {
  const parts = baseDate.split('-').map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() + (weekNumber - 1) * 7);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Tính ngày kết thúc tuần (Thứ Sáu nếu 5 ngày, Thứ Bảy nếu có Thứ 7), trả về DD/MM/YYYY
 */
export function getEndDateForWeek(startDate: string, includeSaturday = false): string {
  try {
    const parts = startDate.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + (includeSaturday ? 5 : 4));
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  } catch {
    return '';
  }
}

/**
 * Định dạng ngày YYYY-MM-DD thành DD/MM/YYYY chuẩn xác không lệch timezone
 */
export function formatDateDMY(dateStr: string): string {
  try {
    const parts = dateStr.split('-').map(Number);
    if (parts.length === 3) {
      const dd = String(parts[2]).padStart(2, '0');
      const mm = String(parts[1]).padStart(2, '0');
      return `${dd}/${mm}/${parts[0]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

/**
 * Lấy Thứ Hai của tuần chứa một ngày bất kỳ (định dạng YYYY-MM-DD)
 */
export function getMondayOfDate(d: Date): string {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay(); // 0 is Sunday, 1 is Monday, ...
  const diff = (day === 0 ? -6 : 1) - day; // khoảng cách đến Thứ Hai
  date.setDate(date.getDate() + diff);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Tính thời gian thực tế từ đồng hồ hệ thống:
 * Xác định hôm nay là ngày mấy, thứ mấy và thuộc tuần học thứ mấy theo thời gian thực
 */
export function getRealTimeInfo(baseDate = BASE_WEEK_1_START_DATE): {
  realWeekNumber: number;
  todayFormatted: string;
  dayOfWeekName: string;
  fullDateText: string;
  currentMondayDate: string;
} {
  const now = new Date();
  const daysMap = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayOfWeekName = daysMap[now.getDay()];
  
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const todayFormatted = `${dd}/${mm}/${yyyy}`;

  // Thứ Hai của tuần hiện tại trong thực tế
  const currentMondayDate = getMondayOfDate(now);

  // Tính số ngày chênh lệch từ ngày bắt đầu Tuần 1 (07/09/2026) đến Thứ Hai tuần này
  const parts = baseDate.split('-').map(Number);
  const startMonday = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
  const thisMondayParts = currentMondayDate.split('-').map(Number);
  const thisMonday = new Date(thisMondayParts[0], thisMondayParts[1] - 1, thisMondayParts[2], 0, 0, 0, 0);

  const diffMs = thisMonday.getTime() - startMonday.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  let realWeekNumber = Math.floor(diffDays / 7) + 1;
  if (realWeekNumber < 1) realWeekNumber = 1;
  if (realWeekNumber > 52) realWeekNumber = 52;

  return {
    realWeekNumber,
    todayFormatted,
    dayOfWeekName,
    fullDateText: `${dayOfWeekName}, ngày ${todayFormatted}`,
    currentMondayDate,
  };
}

export const SHDC_LOCATIONS: SHDCLocationConfig[] = [
  { key: 'khu_c', name: 'Khu vực khu C (12C8)', shortName: 'Khu C (12C8)' },
  { key: 'thu_vien', name: 'Khu vực Thư viện', shortName: 'Thư viện' },
  { key: 'cong_truoc', name: 'Khu vực cổng trước', shortName: 'Cổng trước' },
];

export const DEFAULT_BCH_CLASSES: BCHUnit[] = [
  // Đối tượng đặc biệt: BCH ĐT (Ban Chấp Hành Đoàn Trường)
  { id: 'bch-dt', name: 'BCH ĐT', grade: 'all', enabled: true, order: 0 },

  // Khối 12: 12C1 -> 12C10
  { id: 'bch-12c1', name: 'BCH 12C1', grade: '12', enabled: true, order: 1 },
  { id: 'bch-12c2', name: 'BCH 12C2', grade: '12', enabled: true, order: 2 },
  { id: 'bch-12c3', name: 'BCH 12C3', grade: '12', enabled: true, order: 3 },
  { id: 'bch-12c4', name: 'BCH 12C4', grade: '12', enabled: true, order: 4 },
  { id: 'bch-12c5', name: 'BCH 12C5', grade: '12', enabled: true, order: 5 },
  { id: 'bch-12c6', name: 'BCH 12C6', grade: '12', enabled: true, order: 6 },
  { id: 'bch-12c7', name: 'BCH 12C7', grade: '12', enabled: true, order: 7 },
  { id: 'bch-12c8', name: 'BCH 12C8', grade: '12', enabled: true, order: 8 },
  { id: 'bch-12c9', name: 'BCH 12C9', grade: '12', enabled: true, order: 9 },
  { id: 'bch-12c10', name: 'BCH 12C10', grade: '12', enabled: true, order: 10 },

  // Khối 11: 11C1 -> 11C9
  { id: 'bch-11c1', name: 'BCH 11C1', grade: '11', enabled: true, order: 11 },
  { id: 'bch-11c2', name: 'BCH 11C2', grade: '11', enabled: true, order: 12 },
  { id: 'bch-11c3', name: 'BCH 11C3', grade: '11', enabled: true, order: 13 },
  { id: 'bch-11c4', name: 'BCH 11C4', grade: '11', enabled: true, order: 14 },
  { id: 'bch-11c5', name: 'BCH 11C5', grade: '11', enabled: true, order: 15 },
  { id: 'bch-11c6', name: 'BCH 11C6', grade: '11', enabled: true, order: 16 },
  { id: 'bch-11c7', name: 'BCH 11C7', grade: '11', enabled: true, order: 17 },
  { id: 'bch-11c8', name: 'BCH 11C8', grade: '11', enabled: true, order: 18 },
  { id: 'bch-11c9', name: 'BCH 11C9', grade: '11', enabled: true, order: 19 },

  // Khối 10: 10C1 -> 10C9
  { id: 'bch-10c1', name: 'BCH 10C1', grade: '10', enabled: true, order: 20 },
  { id: 'bch-10c2', name: 'BCH 10C2', grade: '10', enabled: true, order: 21 },
  { id: 'bch-10c3', name: 'BCH 10C3', grade: '10', enabled: true, order: 22 },
  { id: 'bch-10c4', name: 'BCH 10C4', grade: '10', enabled: true, order: 23 },
  { id: 'bch-10c5', name: 'BCH 10C5', grade: '10', enabled: true, order: 24 },
  { id: 'bch-10c6', name: 'BCH 10C6', grade: '10', enabled: true, order: 25 },
  { id: 'bch-10c7', name: 'BCH 10C7', grade: '10', enabled: true, order: 26 },
  { id: 'bch-10c8', name: 'BCH 10C8', grade: '10', enabled: true, order: 27 },
  { id: 'bch-10c9', name: 'BCH 10C9', grade: '10', enabled: true, order: 28 },
];

export const DEFAULT_STUDENTS: SupportStudent[] = [
  { id: 'st-1', fullName: 'Ngô Phương Linh', className: '12C2', grade: '12' },
  { id: 'st-2', fullName: 'Bùi Quốc Bảo', className: '12C5', grade: '12' },
  { id: 'st-3', fullName: 'Đinh Diệu Ánh', className: '12C7', grade: '12' },
  { id: 'st-4', fullName: 'Phạm Thu Thảo', className: '11C2', grade: '11' },
  { id: 'st-5', fullName: 'Vũ Đức Minh', className: '11C4', grade: '11' },
  { id: 'st-6', fullName: 'Hoàng Kim Chi', className: '11C6', grade: '11' },
  { id: 'st-7', fullName: 'Đặng Tuấn Kiệt', className: '11C8', grade: '11' },
  { id: 'st-8', fullName: 'Nguyễn Văn An', className: '10C1', grade: '10' },
  { id: 'st-9', fullName: 'Trần Thị Mai', className: '10C3', grade: '10' },
  { id: 'st-10', fullName: 'Lê Hoàng Nam', className: '10C5', grade: '10' },
];

export function createEmptyGrid(): WeekGrid {
  const grid: any = {};
  for (const grade of ORDERED_GRADES) {
    grid[grade] = {};
    for (const day of ALL_DAYS) {
      grid[grade][day] = {
        students: [],
        bch: { bchId: undefined, isLocked: false },
      };
    }
  }
  return grid as WeekGrid;
}

export function createInitialWeek1Grid(): WeekGrid {
  const grid = createEmptyGrid();
  // Khởi tạo sẵn tuần 1 tăng dần chuẩn (kèm Thứ 7)
  grid['12']['mon'].bch.bchId = 'bch-12c1';
  grid['12']['tue'].bch.bchId = 'bch-12c2';
  grid['12']['wed'].bch.bchId = 'bch-12c3';
  grid['12']['thu'].bch.bchId = 'bch-12c4';
  grid['12']['fri'].bch.bchId = 'bch-12c5';
  grid['12']['sat'].bch.bchId = 'bch-12c6';

  grid['11']['mon'].bch.bchId = 'bch-11c1';
  grid['11']['tue'].bch.bchId = 'bch-11c2';
  grid['11']['wed'].bch.bchId = 'bch-11c3';
  grid['11']['thu'].bch.bchId = 'bch-11c4';
  grid['11']['fri'].bch.bchId = 'bch-11c5';
  grid['11']['sat'].bch.bchId = 'bch-11c6';

  grid['10']['mon'].bch.bchId = 'bch-10c1';
  grid['10']['tue'].bch.bchId = 'bch-10c2';
  grid['10']['wed'].bch.bchId = 'bch-10c3';
  grid['10']['thu'].bch.bchId = 'bch-10c4';
  grid['10']['fri'].bch.bchId = 'bch-10c5';
  grid['10']['sat'].bch.bchId = 'bch-10c6';

  return grid;
}

export function createInitialWeek4Grid(): WeekGrid {
  const grid = createEmptyGrid();
  grid['12']['mon'].bch.bchId = 'bch-12c1';
  grid['12']['tue'].bch.bchId = 'bch-12c2';
  grid['12']['wed'].bch.bchId = 'bch-12c3';
  grid['12']['thu'].bch.bchId = 'bch-12c4';
  grid['12']['fri'].bch.bchId = 'bch-12c5';
  grid['12']['sat'].bch.bchId = 'bch-12c6';

  grid['11']['mon'].bch.bchId = 'bch-11c1';
  grid['11']['tue'].bch.bchId = 'bch-11c2';
  grid['11']['wed'].bch.bchId = 'bch-11c3';
  grid['11']['thu'].bch.bchId = 'bch-11c4';
  grid['11']['fri'].bch.bchId = 'bch-11c5';
  grid['11']['sat'].bch.bchId = 'bch-11c6';

  grid['10']['mon'].bch.bchId = 'bch-10c1';
  grid['10']['tue'].bch.bchId = 'bch-10c2';
  grid['10']['wed'].bch.bchId = 'bch-10c3';
  grid['10']['thu'].bch.bchId = 'bch-10c4';
  grid['10']['fri'].bch.bchId = 'bch-10c5';
  grid['10']['sat'].bch.bchId = 'bch-10c6';

  return grid;
}

export function createInitialWeek5Grid(): WeekGrid {
  const grid = createEmptyGrid();
  // Tuần 5 nối tiếp từ tuần 4
  grid['12']['mon'].bch.bchId = 'bch-12c6';
  grid['12']['tue'].bch.bchId = 'bch-12c7';
  grid['12']['wed'].bch.bchId = 'bch-12c8';
  grid['12']['thu'].bch.bchId = 'bch-12c9';
  grid['12']['fri'].bch.bchId = 'bch-12c10';
  grid['12']['sat'].bch.bchId = 'bch-12c1';

  grid['11']['mon'].bch.bchId = 'bch-11c6';
  grid['11']['tue'].bch.bchId = 'bch-11c7';
  grid['11']['wed'].bch.bchId = 'bch-11c8';
  grid['11']['thu'].bch.bchId = 'bch-11c9';
  grid['11']['fri'].bch.bchId = 'bch-11c1';
  grid['11']['sat'].bch.bchId = 'bch-11c2';

  grid['10']['mon'].bch.bchId = 'bch-10c6';
  grid['10']['tue'].bch.bchId = 'bch-10c7';
  grid['10']['wed'].bch.bchId = 'bch-10c8';
  grid['10']['thu'].bch.bchId = 'bch-10c9';
  grid['10']['fri'].bch.bchId = 'bch-10c1';
  grid['10']['sat'].bch.bchId = 'bch-10c2';

  return grid;
}

export function createEmptySHDC(): SHDCSchedule {
  return {
    mode: '3_per_location',
    locations: {
      khu_c: { locationKey: 'khu_c', students: [] },
      thu_vien: { locationKey: 'thu_vien', students: [] },
      cong_truoc: { locationKey: 'cong_truoc', students: [] },
    },
    lockedStudents: [],
  };
}

export function createInitialWeek1SHDC(): SHDCSchedule {
  return {
    mode: '3_per_location',
    locations: {
      khu_c: {
        locationKey: 'khu_c',
        students: ['st-1', 'st-2', 'st-3'],
      },
      thu_vien: {
        locationKey: 'thu_vien',
        students: ['st-4', 'st-5', 'st-6'],
      },
      cong_truoc: {
        locationKey: 'cong_truoc',
        students: ['st-7', 'st-8', 'st-9', 'st-10'],
      },
    },
    lockedStudents: [],
  };
}

export function getDefaultMondayDuty(_weekNumber = 4): MondayDutyClasses {
  return {
    morning: {
      gateDutyClass: '12C4',
      stagePrepClass: '11C4',
      stageCleanClass: '10C4',
    },
    afternoon: {
      gateDutyClass: '11C5',
      stagePrepClass: '12C4',
      stageCleanClass: '10C6',
    },
    weekDuty: {
      morning: '11C4',
      afternoon: '10C4',
    },
    stairCleaning: {
      morning: {
        khuA: '12C4',
        khuB_cong: '11C5',
        khuB_thuvien: '11C6',
        khuC1: '11C4',
        khuD: '11TX',
      },
      afternoon: {
        khuA: '12C4',
        khuB_cong: '10C6',
        khuB_thuvien: '10C7',
        khuC1: '10C4',
        khuD: '12TX',
      },
    },
    notes: 'Học sinh có mặt trước giờ quy định 15 phút. Vệ sinh sạch sẽ khu vực cầu thang trước giờ vào lớp.',
  };
}

export function createEmptyWeek(weekNumber = 1, startDate?: string): WeekSchedule {
  const actualStartDate = startDate || getStartDateForWeek(weekNumber);
  let grid = createEmptyGrid();
  if (weekNumber === 1) grid = createInitialWeek1Grid();
  else if (weekNumber === 4) grid = createInitialWeek4Grid();
  else if (weekNumber === 5) grid = createInitialWeek5Grid();

  // Mẫu phân công lớp trực ban đầu chuẩn xác theo quy định
  const defaultMondayDuty: MondayDutyClasses = getDefaultMondayDuty(weekNumber);

  return {
    weekNumber,
    startDate: actualStartDate,
    academicYear: '2026 - 2027',
    bchMode: 'increasing',
    grid,
    shdc: weekNumber === 1 ? createInitialWeek1SHDC() : createEmptySHDC(),
    mondayDutyClasses: defaultMondayDuty,
  };
}

export function getDefaultAppState(): AppState {
  const realTime = getRealTimeInfo();
  const currentWeekNumber = realTime.realWeekNumber;
  const currentStartDate = getStartDateForWeek(currentWeekNumber);

  const week1StartDate = getStartDateForWeek(1); // '2026-09-07'
  const week4StartDate = getStartDateForWeek(4); // '2026-09-28'
  const week5StartDate = getStartDateForWeek(5); // '2026-10-05'

  const week1 = createEmptyWeek(1, week1StartDate);
  const week4 = createEmptyWeek(4, week4StartDate);
  const week5 = createEmptyWeek(5, week5StartDate);

  const weeksRecord: Record<number, WeekSchedule> = {
    1: week1,
    4: week4,
    5: week5,
  };

  if (!weeksRecord[currentWeekNumber]) {
    weeksRecord[currentWeekNumber] = createEmptyWeek(currentWeekNumber, currentStartDate);
  }

  return {
    currentWeekNumber,
    startDate: currentStartDate,
    academicYear: '2026 - 2027',
    bchMode: 'increasing',
    includeSaturday: false,
    weeks: weeksRecord,
    bchList: DEFAULT_BCH_CLASSES,
    students: DEFAULT_STUDENTS,
    shdcLocations: SHDC_LOCATIONS,
    rotationState: {
      lastBCH: { '12': 'bch-12c10', '11': 'bch-11c1', '10': 'bch-10c1' },
      lastWeekScheduled: currentWeekNumber,
    },
    schoolName: 'TRƯỜNG THPT NGUYỄN CHÍ THANH',
    secretaryName: 'Trần Minh Lý',
  };
}
