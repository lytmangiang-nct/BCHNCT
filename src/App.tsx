import React, { useState, useEffect, useRef } from 'react';
import { 
  AppState, 
  WeekSchedule, 
  GradeLevel, 
  DayOfWeek, 
  BCHScheduleMode, 
  SupportStudent,
  SHDCDistributionMode,
  SHDCLocationKey,
  SHDCLocationConfig,
  SHDCLocationSlot,
  SHDCSchedule
} from './types';
import { 
  loadAppState, 
  saveAppState, 
  exportBackupJSON, 
  parseImportJSON 
} from './utils/storage';
import { 
  generateBCHSchedule, 
  getLastBCHBeforeWeek, 
  generateSHDCSchedule,
  carryLockedElementsFromPriorWeek
} from './utils/scheduler';
import { 
  createEmptyWeek, 
  createInitialWeek1SHDC,
  getDefaultMondayDuty,
  DEFAULT_BCH_CLASSES, 
  ORDERED_GRADES, 
  ORDERED_DAYS,
  ALL_DAYS,
  getStartDateForWeek,
  getEndDateForWeek,
  getRealTimeInfo,
  formatDateDMY
} from './data/defaultData';
import { ScheduleGrid } from './components/ScheduleGrid';
import { SHDCPanel } from './components/SHDCPanel';
import { StudentListModal } from './components/StudentListModal';
import { PrintPreview } from './components/PrintPreview';
import { ExportPreviewModal } from './components/ExportPreviewModal';
import { MondayDutyModal } from './components/MondayDutyModal';
import { exportToImage, exportToPDF } from './utils/exportUtils';
import { MondayDutyClasses } from './types';

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const loaded = loadAppState();
    const realTime = getRealTimeInfo();
    const realWeek = realTime.realWeekNumber;
    const realStartDate = getStartDateForWeek(realWeek);

    // Luôn ưu tiên mở đúng tuần học theo thời gian thực tế từ đồng hồ hệ thống
    loaded.currentWeekNumber = realWeek;
    loaded.startDate = loaded.weeks[realWeek]?.startDate || realStartDate;

    // Nếu tuần thực tế chưa có trong record weeks thì tạo mới
    if (!loaded.weeks[realWeek]) {
      loaded.weeks[realWeek] = createEmptyWeek(realWeek, realStartDate);
    }

    // Đảm bảo bch-dt luôn có mặt trong bchList cho người dùng
    if (!loaded.bchList.some((b) => b.id === 'bch-dt')) {
      loaded.bchList = [
        { id: 'bch-dt', name: 'BCH ĐT', grade: 'all', enabled: true, order: 0 },
        ...loaded.bchList,
      ];
    }
    // Cập nhật người ký tên mặc định thành Trần Minh Lý nếu trước đó là giá trị cũ
    if (!loaded.secretaryName || loaded.secretaryName === 'BÍ THƯ ĐOÀN TRƯỜNG' || loaded.secretaryName === 'TRẦN MINH LÝ') {
      loaded.secretaryName = 'Trần Minh Lý';
    }
    return loaded;
  });
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showMondayDutyModal, setShowMondayDutyModal] = useState(false);
  const [isExporting, setIsExporting] = useState<'image' | 'pdf' | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Tự động lưu vào localStorage mỗi khi state thay đổi
  useEffect(() => {
    saveAppState(state);
  }, [state]);

  // Đóng menu "⋮" khi bấm ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  function getModeLabel(mode: BCHScheduleMode) {
    if (mode === 'increasing') return 'Tăng dần';
    if (mode === 'decreasing') return 'Giảm dần';
    if (mode === 'custom') return 'Tùy chỉnh';
    return 'Tự động sắp';
  }

  // Lấy dữ liệu tuần hiện tại
  const rawWeek: WeekSchedule =
    state.weeks[state.currentWeekNumber] ||
    createEmptyWeek(state.currentWeekNumber, state.startDate);

  // Đảm bảo luôn có dữ liệu SHDC (phân công sáng Thứ Hai) đồng bộ với các vị trí hiện có
  const initialShdc = rawWeek.shdc || (state.currentWeekNumber === 1 ? createInitialWeek1SHDC() : {
    mode: '3_per_location',
    locations: {},
    lockedStudents: [],
  });

  const mergedLocations: Record<string, SHDCLocationSlot> = {};
  (state.shdcLocations || []).forEach((loc) => {
    mergedLocations[loc.key] = initialShdc.locations?.[loc.key] || {
      locationKey: loc.key,
      students: [],
    };
  });

  const currentWeek: WeekSchedule = {
    ...rawWeek,
    shdc: {
      ...initialShdc,
      locations: mergedLocations,
    },
  };

  // 1. TẠO LỊCH THEO TÙY CHỌN & THAY ĐỔI NGAY TẠI TUẦN ĐANG CHỌN
  const handleGenerateSchedule = (targetMode?: BCHScheduleMode) => {
    const modeToUse = targetMode || state.bchMode;

    // Lấy lớp cuối cùng của tuần trước để nối tiếp chính xác
    const lastBCHMap = getLastBCHBeforeWeek(
      state.currentWeekNumber, 
      state.weeks, 
      Boolean(state.includeSaturday)
    );

    const result = generateBCHSchedule(
      currentWeek,
      state.bchList,
      lastBCHMap,
      modeToUse,
      state.weeks,
      Boolean(state.includeSaturday)
    );

    const updatedWeek: WeekSchedule = {
      ...currentWeek,
      bchMode: modeToUse,
      grid: result.updatedGrid,
    };

    setState((prev) => ({
      ...prev,
      bchMode: modeToUse,
      weeks: {
        ...prev.weeks,
        [prev.currentWeekNumber]: updatedWeek,
      },
      rotationState: {
        lastBCH: result.updatedLastBCH,
        lastWeekScheduled: prev.currentWeekNumber,
      },
    }));

    showToast(`Đã tạo lịch BCH theo tùy chọn "${getModeLabel(modeToUse)}"`);
  };

  // 2. CHỌN CHẾ ĐỘ SẮP BCH (Áp dụng và thay đổi ngay tuần đang chọn)
  const handleModeChange = (mode: BCHScheduleMode) => {
    handleGenerateSchedule(mode);
  };

  // 3. CHUYỂN TUẦN (TUẦN TRƯỚC / TUẦN SAU / NHẬP SỐ TUẦN)
  // Mốc chuẩn: Tuần 4 bắt đầu vào Thứ Hai 28/09/2026, Tuần 5 bắt đầu vào Thứ Hai 05/10/2026
  const handleChangeWeek = (targetWeekNum: number) => {
    if (targetWeekNum < 1) return;

    // Lưu tuần hiện tại
    const updatedWeeks = {
      ...state.weeks,
      [state.currentWeekNumber]: currentWeek,
    };

    if (updatedWeeks[targetWeekNum]) {
      // Tuần đã tồn tại -> nạp lại
      let existingWeek = updatedWeeks[targetWeekNum];
      const standardDate = getStartDateForWeek(targetWeekNum);
      
      // Đảm bảo tuần có ngày bắt đầu chuẩn theo năm học
      if (!existingWeek.startDate) {
        existingWeek.startDate = standardDate;
      }
      const actualStartDate = existingWeek.startDate;

      // Giữ sang tuần tiếp theo các phân công đã bị khóa (BCH, Học sinh, SHDC) từ tuần trước
      existingWeek = carryLockedElementsFromPriorWeek(existingWeek, targetWeekNum, updatedWeeks);

      // Nếu tuần này chưa có BCH nào được xếp, tự động xếp lịch BCH nối tiếp từ tuần trước
      const hasAnyBCH = ORDERED_GRADES.some((g) =>
        ALL_DAYS.some((d) => existingWeek.grid?.[g]?.[d]?.bch?.bchId)
      );
      if (!hasAnyBCH) {
        const lastBCHMap = getLastBCHBeforeWeek(
          targetWeekNum, 
          updatedWeeks, 
          Boolean(state.includeSaturday)
        );
        const scheduled = generateBCHSchedule(
          existingWeek,
          state.bchList,
          lastBCHMap,
          state.bchMode,
          updatedWeeks,
          Boolean(state.includeSaturday)
        );
        existingWeek.grid = scheduled.updatedGrid;
      }

      updatedWeeks[targetWeekNum] = existingWeek;

      setState((prev) => ({
        ...prev,
        weeks: updatedWeeks,
        currentWeekNumber: targetWeekNum,
        startDate: actualStartDate,
        bchMode: existingWeek.bchMode || prev.bchMode,
      }));
    } else {
      // Tuần mới: tính ngày bắt đầu chuẩn theo năm học
      const newStartDateStr = getStartDateForWeek(targetWeekNum);

      let newWeek = createEmptyWeek(targetWeekNum, newStartDateStr);
      newWeek.bchMode = state.bchMode;

      // Kế thừa các ô BCH và Học sinh đã bị khóa từ tuần trước đó
      newWeek = carryLockedElementsFromPriorWeek(newWeek, targetWeekNum, updatedWeeks);

      // Nối tiếp từ tuần trước
      const lastBCHMap = getLastBCHBeforeWeek(
        targetWeekNum, 
        updatedWeeks, 
        Boolean(state.includeSaturday)
      );

      const scheduled = generateBCHSchedule(
        newWeek,
        state.bchList,
        lastBCHMap,
        state.bchMode,
        updatedWeeks,
        Boolean(state.includeSaturday)
      );
      newWeek.grid = scheduled.updatedGrid;

      setState((prev) => ({
        ...prev,
        weeks: {
          ...updatedWeeks,
          [targetWeekNum]: newWeek,
        },
        currentWeekNumber: targetWeekNum,
        startDate: newStartDateStr,
        rotationState: {
          lastBCH: scheduled.updatedLastBCH,
          lastWeekScheduled: targetWeekNum,
        },
      }));
    }
  };

  // Đổi ngày bắt đầu của tuần
  const handleStartDateChange = (newDate: string) => {
    setState((prev) => ({
      ...prev,
      startDate: newDate,
      weeks: {
        ...prev.weeks,
        [prev.currentWeekNumber]: {
          ...currentWeek,
          startDate: newDate,
        },
      },
    }));
  };

  // Bật/tắt cột Thứ Bảy trong lịch trực
  const handleToggleSaturday = (includeSat: boolean) => {
    setState((prev) => ({
      ...prev,
      includeSaturday: includeSat,
    }));
    showToast(includeSat ? 'Đã thêm cột Thứ 7 vào lịch trực' : 'Đã ẩn cột Thứ 7 (Lịch Thứ 2 đến Thứ 6)');
  };

  // 4. XÓA LỊCH TUẦN HIỆN TẠI (Giữ lại các ô BCH hoặc Học sinh đã khóa)
  const handleClearWeek = () => {
    const updatedGrid = JSON.parse(JSON.stringify(currentWeek.grid));

    // Xóa các ô không khóa trên tất cả các ngày (gồm cả Thứ 7)
    for (const g of ORDERED_GRADES) {
      for (const d of ALL_DAYS) {
        if (!updatedGrid[g][d]?.bch?.isLocked) {
          updatedGrid[g][d].bch = { bchId: undefined, isLocked: false };
        }
        if (!updatedGrid[g][d]?.isStudentsLocked) {
          updatedGrid[g][d].students = [];
        }
      }
    }

    setState((prev) => ({
      ...prev,
      weeks: {
        ...prev.weeks,
        [prev.currentWeekNumber]: {
          ...currentWeek,
          grid: updatedGrid,
        },
      },
    }));

    showToast('Đã xóa lịch tuần này (giữ lại các ô đã khóa)');
  };

  // 5. LƯU THỦ CÔNG
  const handleManualSave = () => {
    saveAppState(state);
    showToast('Đã lưu');
  };

  // 6. XUẤT HÌNH ẢNH (PNG) TRỰC TIẾP
  const handleDirectExportImage = async () => {
    const el = document.getElementById('direct-export-document');
    if (!el) return;
    try {
      setIsExporting('image');
      showToast('Đang tạo ảnh chất lượng cao (đã loại bỏ các ổ khóa)...');
      const fileName = `Lich_Truc_Tuan_${currentWeek.weekNumber.toString().padStart(2, '0')}_THPT_Nguyen_Chi_Thanh.png`;
      await exportToImage(el, fileName);
      showToast('Đã tải xuống file ảnh PNG thành công! 🖼️');
    } catch (err) {
      console.error('Lỗi xuất ảnh:', err);
      showToast('Có lỗi khi xuất hình ảnh!');
    } finally {
      setIsExporting(null);
    }
  };

  // 7. XUẤT FILE PDF TRỰC TIẾP
  const handleDirectExportPDF = async () => {
    const el = document.getElementById('direct-export-document');
    if (!el) return;
    try {
      setIsExporting('pdf');
      showToast('Đang tạo file PDF A4 (đã loại bỏ các ổ khóa)...');
      const fileName = `Lich_Truc_Tuan_${currentWeek.weekNumber.toString().padStart(2, '0')}_THPT_Nguyen_Chi_Thanh.pdf`;
      await exportToPDF(el, fileName);
      showToast('Đã tải xuống file PDF thành công! 📑');
    } catch (err) {
      console.error('Lỗi xuất PDF:', err);
      showToast('Có lỗi khi xuất file PDF!');
    } finally {
      setIsExporting(null);
    }
  };

  // 8. IN LỊCH
  const handlePrint = () => {
    window.print();
  };

  // 9. CẬP NHẬT Ô BCH
  const handleUpdateBCHSlot = (grade: GradeLevel, day: DayOfWeek, bchId: string | undefined) => {
    const updatedGrid = JSON.parse(JSON.stringify(currentWeek.grid));
    updatedGrid[grade][day].bch.bchId = bchId;

    setState((prev) => ({
      ...prev,
      weeks: {
        ...prev.weeks,
        [prev.currentWeekNumber]: {
          ...currentWeek,
          grid: updatedGrid,
        },
      },
    }));
  };

  // Khóa / Mở khóa ô BCH
  const handleToggleLock = (grade: GradeLevel, day: DayOfWeek) => {
    const updatedGrid = JSON.parse(JSON.stringify(currentWeek.grid));
    const currentLock = updatedGrid[grade][day].bch.isLocked;
    updatedGrid[grade][day].bch.isLocked = !currentLock;

    setState((prev) => ({
      ...prev,
      weeks: {
        ...prev.weeks,
        [prev.currentWeekNumber]: {
          ...currentWeek,
          grid: updatedGrid,
        },
      },
    }));

    showToast(currentLock ? 'Đã mở khóa ô BCH' : 'Đã khóa ô BCH (sẽ giữ sang tuần tiếp theo) 🔒');
  };

  // Khóa / Mở khóa ô Học sinh
  const handleToggleStudentsLock = (grade: GradeLevel, day: DayOfWeek) => {
    const updatedGrid = JSON.parse(JSON.stringify(currentWeek.grid));
    const currentLock = !!updatedGrid[grade][day].isStudentsLocked;
    updatedGrid[grade][day].isStudentsLocked = !currentLock;

    setState((prev) => ({
      ...prev,
      weeks: {
        ...prev.weeks,
        [prev.currentWeekNumber]: {
          ...currentWeek,
          grid: updatedGrid,
        },
      },
    }));

    showToast(currentLock ? 'Đã mở khóa học sinh ô này' : 'Đã khóa học sinh ô này (sẽ giữ sang tuần tiếp theo) 🔒');
  };

  // 8. THÊM / XÓA HỌC SINH VÀO Ô
  const handleAddStudent = (grade: GradeLevel, day: DayOfWeek, studentId: string) => {
    if (currentWeek.grid[grade][day].isStudentsLocked) {
      showToast('Ô học sinh này đang bị khóa. Vui lòng mở khóa trước.');
      return;
    }

    const updatedGrid = JSON.parse(JSON.stringify(currentWeek.grid));
    const currentList: string[] = updatedGrid[grade][day].students || [];

    if (currentList.length >= 2) {
      showToast('Mỗi buổi chỉ được phân công tối đa 2 học sinh.');
      return;
    }

    if (currentList.includes(studentId)) return;

    updatedGrid[grade][day].students = [...currentList, studentId];

    setState((prev) => ({
      ...prev,
      weeks: {
        ...prev.weeks,
        [prev.currentWeekNumber]: {
          ...currentWeek,
          grid: updatedGrid,
        },
      },
    }));
  };

  const handleRemoveStudent = (grade: GradeLevel, day: DayOfWeek, studentId: string) => {
    if (currentWeek.grid[grade][day].isStudentsLocked) {
      showToast('Ô học sinh này đang bị khóa. Vui lòng mở khóa trước.');
      return;
    }

    const updatedGrid = JSON.parse(JSON.stringify(currentWeek.grid));
    updatedGrid[grade][day].students = (updatedGrid[grade][day].students || []).filter(
      (id: string) => id !== studentId
    );

    setState((prev) => ({
      ...prev,
      weeks: {
        ...prev.weeks,
        [prev.currentWeekNumber]: {
          ...currentWeek,
          grid: updatedGrid,
        },
      },
    }));
  };

  // 8.1. PHÂN CÔNG SHDC (SÁNG THỨ HAI)
  const handleGenerateSHDC = (mode?: SHDCDistributionMode) => {
    const modeToUse = mode || currentWeek.shdc?.mode || '3_per_location';
    const updatedSHDC = generateSHDCSchedule(
      currentWeek.shdc,
      state.students,
      modeToUse,
      state.currentWeekNumber,
      state.weeks,
      state.shdcLocations
    );

    setState((prev) => ({
      ...prev,
      weeks: {
        ...prev.weeks,
        [prev.currentWeekNumber]: {
          ...currentWeek,
          shdc: updatedSHDC,
        },
      },
    }));

    const modeLabels: Record<SHDCDistributionMode, string> = {
      '3_per_location': '3 bạn / 1 vị trí',
      '2_per_location': '2 bạn / 1 vị trí (Đúng 2 bạn - Ưu tiên đợt sau)',
      custom: 'Tùy chỉnh',
    };

    showToast(`Đã sắp lịch SHDC: ${modeLabels[modeToUse]}`);
  };

  // Quản lý danh sách Khu vực trực sáng Thứ Hai
  const handleAddSHDCLocation = (name: string, shortName?: string) => {
    const key = 'loc_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    const newLocationConfig: SHDCLocationConfig = {
      key,
      name,
      shortName: shortName || name,
    };

    const newLocationsList = [...(state.shdcLocations || []), newLocationConfig];

    const currentSHDC = currentWeek.shdc || createInitialWeek1SHDC();
    const updatedWeekSHDC: SHDCSchedule = {
      ...currentSHDC,
      locations: {
        ...(currentSHDC.locations || {}),
        [key]: { locationKey: key, students: [] },
      },
    };

    setState((prev) => ({
      ...prev,
      shdcLocations: newLocationsList,
      weeks: {
        ...prev.weeks,
        [prev.currentWeekNumber]: {
          ...currentWeek,
          shdc: updatedWeekSHDC,
        },
      },
    }));

    showToast(`Đã thêm khu vực: "${name}"`);
  };

  const handleDeleteSHDCLocation = (key: string) => {
    if ((state.shdcLocations || []).length <= 1) {
      showToast('Cần giữ lại ít nhất 1 khu vực trực.');
      return;
    }

    const locToDelete = (state.shdcLocations || []).find((l) => l.key === key);
    const newLocationsList = (state.shdcLocations || []).filter((l) => l.key !== key);

    // Cập nhật tất cả các tuần, xóa key khu vực bị xóa
    const updatedWeeks: Record<number, WeekSchedule> = {};
    Object.keys(state.weeks).forEach((wNumStr) => {
      const wNum = Number(wNumStr);
      const weekItem = state.weeks[wNum];
      if (weekItem?.shdc?.locations && weekItem.shdc.locations[key]) {
        const newLocSlots = { ...weekItem.shdc.locations };
        const removedStudentIds = new Set(newLocSlots[key]?.students || []);
        delete newLocSlots[key];

        const updatedLocked = (weekItem.shdc.lockedStudents || []).filter(
          (stId) => !removedStudentIds.has(stId)
        );

        updatedWeeks[wNum] = {
          ...weekItem,
          shdc: {
            ...weekItem.shdc,
            locations: newLocSlots,
            lockedStudents: updatedLocked,
          },
        };
      } else {
        updatedWeeks[wNum] = weekItem;
      }
    });

    setState((prev) => ({
      ...prev,
      shdcLocations: newLocationsList,
      weeks: updatedWeeks,
    }));

    showToast(`Đã xóa thành công khu vực "${locToDelete?.name || ''}"`);
  };

  const handleEditSHDCLocation = (key: string, name: string, shortName?: string) => {
    const newLocationsList = (state.shdcLocations || []).map((l) => {
      if (l.key === key) {
        return {
          ...l,
          name,
          shortName: shortName || name,
        };
      }
      return l;
    });

    setState((prev) => ({
      ...prev,
      shdcLocations: newLocationsList,
    }));

    showToast(`Đã cập nhật khu vực: "${name}"`);
  };

  // Khóa hoặc mở khóa riêng cho từng học sinh tại SHDC
  const handleToggleStudentLock = (studentId: string) => {
    const currentSHDC = currentWeek.shdc || createInitialWeek1SHDC();
    const currentLocked = new Set<string>(currentSHDC.lockedStudents || []);
    let isNowLocked = false;

    if (currentLocked.has(studentId)) {
      currentLocked.delete(studentId);
      isNowLocked = false;
    } else {
      currentLocked.add(studentId);
      isNowLocked = true;
    }

    const updatedSHDC = {
      ...currentSHDC,
      lockedStudents: Array.from(currentLocked),
    };

    setState((prev) => ({
      ...prev,
      weeks: {
        ...prev.weeks,
        [prev.currentWeekNumber]: {
          ...currentWeek,
          shdc: updatedSHDC,
        },
      },
    }));

    const studentObj = state.students.find((s) => s.id === studentId);
    const name = studentObj ? studentObj.fullName : 'học sinh';
    showToast(isNowLocked ? `Đã khóa ${name} (sẽ giữ sang tuần tiếp theo) 🔒` : `Đã mở khóa cho ${name}`);
  };

  const handleAddSHDCStudent = (locationKey: SHDCLocationKey, studentId: string) => {
    const currentSHDC = currentWeek.shdc || createInitialWeek1SHDC();

    // Xóa bạn này ở các vị trí khác nếu có (để tránh 1 bạn trực 2 nơi cùng sáng Thứ Hai)
    const newLocations = { ...currentSHDC.locations };
    Object.keys(newLocations).forEach((k) => {
      const key = k as SHDCLocationKey;
      newLocations[key] = {
        ...newLocations[key],
        students: newLocations[key].students.filter((id) => id !== studentId),
      };
    });

    // Thêm vào vị trí được chọn
    newLocations[locationKey] = {
      ...newLocations[locationKey],
      students: [...newLocations[locationKey].students, studentId],
    };

    setState((prev) => ({
      ...prev,
      weeks: {
        ...prev.weeks,
        [prev.currentWeekNumber]: {
          ...currentWeek,
          shdc: {
            ...currentSHDC,
            locations: newLocations,
          },
        },
      },
    }));
  };

  const handleRemoveSHDCStudent = (locationKey: SHDCLocationKey, studentId: string) => {
    const currentSHDC = currentWeek.shdc || createInitialWeek1SHDC();
    const loc = currentSHDC.locations[locationKey];

    // Nếu bạn này đang bị khóa, tự động bỏ khóa luôn khi người dùng cố ý xóa
    const newLocked = (currentSHDC.lockedStudents || []).filter((id) => id !== studentId);

    const newLocations = {
      ...currentSHDC.locations,
      [locationKey]: {
        ...loc,
        students: loc.students.filter((id) => id !== studentId),
      },
    };

    setState((prev) => ({
      ...prev,
      weeks: {
        ...prev.weeks,
        [prev.currentWeekNumber]: {
          ...currentWeek,
          shdc: {
            ...currentSHDC,
            locations: newLocations,
            lockedStudents: newLocked,
          },
        },
      },
    }));
  };

  const handleClearSHDC = () => {
    const currentSHDC = currentWeek.shdc || createInitialWeek1SHDC();
    const lockedSet = new Set<string>(currentSHDC.lockedStudents || []);
    const newLocations = { ...currentSHDC.locations };

    // Chỉ giữ lại những bạn đang bị khóa (locked)
    Object.keys(newLocations).forEach((k) => {
      const key = k as SHDCLocationKey;
      newLocations[key] = {
        ...newLocations[key],
        students: newLocations[key].students.filter((id) => lockedSet.has(id)),
      };
    });

    setState((prev) => ({
      ...prev,
      weeks: {
        ...prev.weeks,
        [prev.currentWeekNumber]: {
          ...currentWeek,
          shdc: {
            ...currentSHDC,
            locations: newLocations,
          },
        },
      },
    }));

    showToast('Đã xóa phân công SHDC (giữ lại các học sinh đã khóa)');
  };

  // Lưu phân công lớp trực sáng & chiều Thứ Hai kèm theo tùy chọn khóa và giữ sang tuần sau
  const handleSaveMondayDuty = (
    duty: MondayDutyClasses,
    applyToNextWeek = false,
    applyToAllFuture = false
  ) => {
    setState((prev) => {
      const updatedWeeks = { ...prev.weeks };
      // 1. Cập nhật tuần hiện tại
      updatedWeeks[prev.currentWeekNumber] = {
        ...currentWeek,
        mondayDutyClasses: duty,
      };

      // 2. Nếu người dùng chọn giữ nguyên sang tuần tiếp theo
      if (applyToNextWeek) {
        const nextWeekNum = prev.currentWeekNumber + 1;
        const existingNext = updatedWeeks[nextWeekNum];
        if (existingNext) {
          updatedWeeks[nextWeekNum] = {
            ...existingNext,
            mondayDutyClasses: JSON.parse(JSON.stringify(duty)),
          };
        } else {
          const nextStartDate = getStartDateForWeek(nextWeekNum);
          const newNextWeek = createEmptyWeek(nextWeekNum, nextStartDate);
          newNextWeek.mondayDutyClasses = JSON.parse(JSON.stringify(duty));
          updatedWeeks[nextWeekNum] = newNextWeek;
        }
      }

      // 3. Nếu người dùng chọn áp dụng cho tất cả các tuần tiếp theo
      if (applyToAllFuture) {
        Object.keys(updatedWeeks).forEach((wKey) => {
          const wNum = Number(wKey);
          if (wNum > prev.currentWeekNumber && updatedWeeks[wNum]) {
            updatedWeeks[wNum] = {
              ...updatedWeeks[wNum],
              mondayDutyClasses: JSON.parse(JSON.stringify(duty)),
            };
          }
        });
      }

      return {
        ...prev,
        weeks: updatedWeeks,
      };
    });

    if (applyToAllFuture) {
      showToast(
        duty.isLocked
          ? 'Đã lưu & KHÓA giữ nguyên phân công cho tất cả các tuần tiếp theo! 🔒'
          : 'Đã lưu và áp dụng phân công cho tất cả các tuần tiếp theo!'
      );
    } else if (applyToNextWeek) {
      showToast(
        duty.isLocked
          ? `Đã lưu & KHÓA giữ nguyên sang Tuần ${state.currentWeekNumber + 1}! 🔒`
          : `Đã lưu và giữ nguyên sang Tuần ${state.currentWeekNumber + 1}!`
      );
    } else {
      showToast(
        duty.isLocked
          ? 'Đã lưu & KHÓA phân công lớp trực & vệ sinh (Tự động giữ sang tuần sau) 🔒'
          : 'Đã lưu phân công lớp trực & vệ sinh cầu thang! 🏛️'
      );
    }
  };

  // Bật/tắt nhanh Khóa lớp trực & Vệ sinh cầu thang tuần này
  const handleToggleLockMondayDuty = () => {
    const currDuty = currentWeek.mondayDutyClasses || getDefaultMondayDuty(state.currentWeekNumber);
    const isNowLocked = !currDuty.isLocked;
    const updatedDuty: MondayDutyClasses = {
      ...currDuty,
      isLocked: isNowLocked,
    };

    setState((prev) => {
      const updatedWeeks = { ...prev.weeks };
      updatedWeeks[prev.currentWeekNumber] = {
        ...currentWeek,
        mondayDutyClasses: updatedDuty,
      };

      // Nếu bật khóa và tuần tiếp theo chưa có khóa riêng, lập tức chuyển giao giữ nguyên sang tuần tiếp theo
      if (isNowLocked) {
        const nextWeekNum = prev.currentWeekNumber + 1;
        if (updatedWeeks[nextWeekNum] && !updatedWeeks[nextWeekNum].mondayDutyClasses?.isLocked) {
          updatedWeeks[nextWeekNum] = {
            ...updatedWeeks[nextWeekNum],
            mondayDutyClasses: JSON.parse(JSON.stringify(updatedDuty)),
          };
        }
      }

      return {
        ...prev,
        weeks: updatedWeeks,
      };
    });

    showToast(
      isNowLocked
        ? 'Đã KHÓA phân công lớp trực & vệ sinh (Tự động giữ nguyên sang tuần sau) 🔒'
        : 'Đã mở khóa phân công lớp trực & vệ sinh 🔓'
    );
  };

  // Giữ nguyên sang tuần tiếp theo ngay lập tức
  const handleApplyMondayDutyToNextWeek = () => {
    const nextWeekNum = state.currentWeekNumber + 1;
    const currDuty = currentWeek.mondayDutyClasses || getDefaultMondayDuty(state.currentWeekNumber);
    const lockedDuty: MondayDutyClasses = {
      ...currDuty,
      isLocked: true,
    };

    setState((prev) => {
      const updatedWeeks = { ...prev.weeks };
      updatedWeeks[prev.currentWeekNumber] = {
        ...currentWeek,
        mondayDutyClasses: lockedDuty,
      };

      const existingNext = updatedWeeks[nextWeekNum];
      if (existingNext) {
        updatedWeeks[nextWeekNum] = {
          ...existingNext,
          mondayDutyClasses: JSON.parse(JSON.stringify(lockedDuty)),
        };
      } else {
        const nextStartDate = getStartDateForWeek(nextWeekNum);
        const newNextWeek = createEmptyWeek(nextWeekNum, nextStartDate);
        newNextWeek.mondayDutyClasses = JSON.parse(JSON.stringify(lockedDuty));
        updatedWeeks[nextWeekNum] = newNextWeek;
      }

      return {
        ...prev,
        weeks: updatedWeeks,
      };
    });

    showToast(`Đã khóa & giữ nguyên phân công sang Tuần ${nextWeekNum} ⏩🔒`);
  };

  // 9. BẮT ĐẦU VÒNG HỌC SINH MỚI
  const handleResetStudentRound = () => {
    const updatedGrid = JSON.parse(JSON.stringify(currentWeek.grid));
    for (const g of ORDERED_GRADES) {
      for (const d of ALL_DAYS) {
        if (!updatedGrid[g][d]?.isStudentsLocked) {
          updatedGrid[g][d].students = [];
        }
      }
    }

    setState((prev) => ({
      ...prev,
      weeks: {
        ...prev.weeks,
        [prev.currentWeekNumber]: {
          ...currentWeek,
          grid: updatedGrid,
        },
      },
    }));

    setShowMoreMenu(false);
    showToast('Đã bắt đầu vòng học sinh mới (giữ lại các ô đã khóa)');
  };

  // 10. SAO LƯU & KHÔI PHỤC JSON
  const handleExportJSON = () => {
    exportBackupJSON(state);
    setShowMoreMenu(false);
    showToast('Đã tải xuống tệp sao lưu');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = parseImportJSON(event.target?.result as string);
        setState(parsed);
        showToast('Khôi phục dữ liệu thành công');
      } catch (err) {
        showToast('Tệp dữ liệu không hợp lệ!');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowMoreMenu(false);
  };

  // 11. KHÔI PHỤC DANH SÁCH BCH MẶC ĐỊNH
  const handleRestoreBCHDefaults = () => {
    setState((prev) => ({
      ...prev,
      bchList: DEFAULT_BCH_CLASSES,
    }));
    setShowMoreMenu(false);
    showToast('Đã khôi phục 28 lớp BCH mặc định');
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans p-2 sm:p-4 select-text">
      {/* Toast thông báo */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-black text-white px-3 py-1.5 text-xs font-bold rounded-xs shadow-md border border-gray-600 animate-fade-in">
          ✓ {toastMessage}
        </div>
      )}

      {/* KHU VỰC TIÊU ĐỀ & THANH ĐIỀU KHIỂN (Ẩn khi in) */}
      <div className="no-print w-[96%] max-w-[1800px] mx-auto mb-4">
        {/* Banner tính thời gian thực & tuần học thực tế */}
        {(() => {
          const realTime = getRealTimeInfo();
          const isAtRealWeek = state.currentWeekNumber === realTime.realWeekNumber;
          const standardStart = getStartDateForWeek(state.currentWeekNumber);
          const isStartDateSynced = state.startDate === standardStart;

          return (
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 mb-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xs text-xs text-blue-950 shadow-2xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                <span className="font-extrabold text-blue-900">
                  Thời gian thực: {realTime.fullDateText}
                </span>
                <span className="text-gray-500">•</span>
                <span className="font-bold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-xs">
                  Tuần thực tế: Tuần {realTime.realWeekNumber}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {!isAtRealWeek && (
                  <button
                    type="button"
                    onClick={() => handleChangeWeek(realTime.realWeekNumber)}
                    className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xs transition-colors shadow-2xs"
                  >
                    Đến tuần thực tế (Tuần {realTime.realWeekNumber})
                  </button>
                )}
                {!isStartDateSynced && (
                  <button
                    type="button"
                    onClick={() => handleStartDateChange(standardStart)}
                    title={`Đồng bộ Thứ Hai chuẩn cho Tuần ${state.currentWeekNumber}: ngày ${formatDateDMY(standardStart)}`}
                    className="px-2 py-0.5 bg-white hover:bg-blue-50 text-blue-800 border border-blue-300 font-bold rounded-xs transition-colors"
                  >
                    ↺ Đồng bộ ngày ({formatDateDMY(standardStart)})
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* Tiêu đề căn giữa: To hơn, rõ ràng hơn, màu sắc đậm hơn */}
        <div className="text-center my-3">
          <p className="font-extrabold text-xs sm:text-sm text-gray-700 uppercase tracking-widest">
            SỞ GIÁO DỤC VÀ ĐÀO TẠO AN GIANG
          </p>
          <h1 className="font-black text-lg sm:text-2xl text-gray-950 uppercase tracking-tight mt-0.5">
            BCH ĐOÀN TRƯỜNG THPT NGUYỄN CHÍ THANH
          </h1>
          <h2 className="font-black text-base sm:text-xl text-red-600 uppercase mt-1 tracking-wide">
            LỊCH TRỰC TUẦN {currentWeek.weekNumber.toString().padStart(2, '0')}
          </h2>
          <p className="text-xs sm:text-sm font-semibold italic text-gray-700 mt-0.5">
            (Áp dụng từ Thứ Hai, ngày <span className="font-black text-black">{formatDateDMY(currentWeek.startDate)}</span> đến ngày{' '}
            <span className="font-black text-black">{getEndDateForWeek(currentWeek.startDate, Boolean(state.includeSaturday))}</span> — Năm học{' '}
            <span className="font-bold text-black">{currentWeek.academicYear}</span>)
          </p>
        </div>

        {/* Thanh công cụ: To hơn, rõ ràng hơn, màu sắc đậm hơn */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 border-2 border-gray-400 bg-gray-100 shadow-xs text-xs sm:text-sm rounded-xs">
          {/* Cụm điều khiển Tuần */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleChangeWeek(state.currentWeekNumber - 1)}
              disabled={state.currentWeekNumber <= 1}
              title="Tuần trước"
              className="px-2.5 py-1.5 bg-white hover:bg-gray-100 disabled:opacity-30 border border-gray-400 font-black rounded-xs shadow-2xs"
            >
              ◀
            </button>

            <div className="flex items-center gap-1 bg-white px-2 py-1 border border-gray-400 rounded-xs">
              <span className="font-black text-gray-900">Tuần:</span>
              <input
                type="number"
                min={1}
                max={54}
                value={state.currentWeekNumber}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 1) handleChangeWeek(val);
                }}
                className="w-12 px-1 text-center font-black bg-transparent focus:outline-hidden text-blue-900"
              />
            </div>

            <div className="flex items-center gap-1.5 ml-1 bg-white px-2 py-1 border border-gray-400 rounded-xs">
              <span className="text-gray-700 font-bold">Từ:</span>
              <input
                type="date"
                value={state.startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="text-xs sm:text-sm font-semibold bg-transparent focus:outline-hidden"
              />
            </div>

            <button
              type="button"
              onClick={() => handleChangeWeek(state.currentWeekNumber + 1)}
              title="Tuần sau"
              className="px-2.5 py-1.5 bg-white hover:bg-gray-100 border border-gray-400 font-black rounded-xs shadow-2xs"
            >
              ▶
            </button>

            {/* Phím tắt đến Tuần thực tế & Tuần liền kề */}
            <div className="hidden sm:flex items-center gap-1 ml-1 pl-1 border-l border-gray-300">
              {(() => {
                const rt = getRealTimeInfo();
                const realWeek = rt.realWeekNumber;
                return (
                  <button
                    type="button"
                    onClick={() => handleChangeWeek(realWeek)}
                    className={`px-2 py-1 text-xs font-bold rounded-xs transition-colors border ${
                      state.currentWeekNumber === realWeek
                        ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                    }`}
                    title={`Chuyển đến Tuần thực tế: Tuần ${realWeek} (bắt đầu ngày ${formatDateDMY(getStartDateForWeek(realWeek))})`}
                  >
                    ★ Tuần thực tế ({realWeek})
                  </button>
                );
              })()}
            </div>
          </div>

          {/* Cụm chức năng chính & Xuất tài liệu */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Tích chọn Thêm cột Thứ 7 */}
            <label 
              className={`flex items-center gap-1.5 px-2.5 py-1 border rounded-xs cursor-pointer select-none transition-colors shadow-2xs ${
                state.includeSaturday 
                  ? 'bg-teal-50 border-teal-600 text-teal-950 font-black' 
                  : 'bg-white border-gray-400 text-gray-700 hover:bg-gray-50 font-bold'
              }`}
              title="Tích chọn để thêm cột Thứ 7 vào bảng lịch, bỏ tích thì chỉ xếp từ Thứ 2 đến Thứ 6"
            >
              <input
                type="checkbox"
                checked={Boolean(state.includeSaturday)}
                onChange={(e) => handleToggleSaturday(e.target.checked)}
                className="w-4 h-4 text-teal-700 rounded border-gray-400 focus:ring-teal-500 cursor-pointer"
              />
              <span>+ Cột Thứ 7 {state.includeSaturday ? '(Có T7)' : '(T2 - T6)'}</span>
            </label>

            {/* Nút Danh sách học sinh */}
            <button
              type="button"
              onClick={() => setShowStudentModal(true)}
              className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-900 border border-gray-400 font-bold rounded-xs shadow-2xs"
            >
              👥 Học sinh (10)
            </button>

            {/* Ô chọn Cách sắp BCH */}
            <div className="flex items-center gap-1 bg-white px-2 py-1 border border-gray-400 rounded-xs">
              <span className="font-bold text-gray-800">Cách sắp BCH:</span>
              <select
                value={state.bchMode}
                onChange={(e) => handleModeChange(e.target.value as BCHScheduleMode)}
                className="bg-transparent font-black text-gray-900 focus:outline-hidden cursor-pointer"
              >
                <option value="increasing">Tăng dần</option>
                <option value="decreasing">Giảm dần</option>
                <option value="custom">Tùy chỉnh</option>
                <option value="auto">Tự động sắp</option>
              </select>
            </div>

            {/* Nút Tạo lịch */}
            <button
              type="button"
              onClick={() => handleGenerateSchedule()}
              title="Tạo lịch theo tùy chọn đã chọn và cập nhật ngay lập tức"
              className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-black rounded-xs shadow-xs transition-colors"
            >
              ⚡ Tạo lịch
            </button>

            {/* Nút Xuất hình ảnh PNG (đã loại bỏ khóa) */}
            <button
              type="button"
              onClick={handleDirectExportImage}
              disabled={isExporting !== null}
              title="Tải về ngay file hình ảnh PNG sắc nét (không có biểu tượng khóa)"
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black rounded-xs shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <span>🖼️</span>
              {isExporting === 'image' ? 'Đang xuất...' : 'Xuất ảnh'}
            </button>

            {/* Nút Xuất PDF (đã loại bỏ khóa) */}
            <button
              type="button"
              onClick={handleDirectExportPDF}
              disabled={isExporting !== null}
              title="Tải về ngay file tài liệu PDF A4 chuẩn in ấn (không có biểu tượng khóa)"
              className="px-3 py-1.5 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-black rounded-xs shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <span>📑</span>
              {isExporting === 'pdf' ? 'Đang xuất...' : 'Xuất PDF'}
            </button>

            {/* Nút In / Xem trước */}
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              title="Xem trước bản in to rõ, sắc nét và tùy chọn xuất"
              className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-950 border-2 border-gray-500 font-black rounded-xs shadow-2xs flex items-center gap-1.5"
            >
              <span>🖨️</span>
              In / Xem trước
            </button>

            {/* Xóa lịch */}
            <button
              type="button"
              onClick={handleClearWeek}
              className="px-2 py-1.5 bg-white hover:bg-red-50 text-red-700 hover:text-red-800 border border-red-300 font-bold rounded-xs"
              title="Xóa phân công tuần này (giữ nguyên các ô đã khóa)"
            >
              Xóa lịch
            </button>

            {/* Nút "⋮" Thêm chức năng */}
            <div className="relative" ref={moreMenuRef}>
              <button
                type="button"
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                title="Chức năng mở rộng"
                className="px-2 py-1.5 bg-white hover:bg-gray-100 border border-gray-400 font-black text-gray-800 rounded-xs shadow-2xs"
              >
                ⋮
              </button>

              {showMoreMenu && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white border-2 border-gray-600 shadow-2xl z-40 py-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      handleDirectExportImage();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-emerald-50 text-emerald-800 font-bold flex items-center gap-2"
                  >
                    <span>🖼️</span> Tải ảnh PNG (Độ phân giải cao)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      handleDirectExportPDF();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-800 font-bold flex items-center gap-2"
                  >
                    <span>📑</span> Tải tài liệu PDF (Khổ A4 dọc - Tối đa lề)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      setShowExportModal(true);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-blue-900 font-bold flex items-center gap-2 border-b border-gray-200 pb-2"
                  >
                    <span>👁️</span> Xem trước bản in & xuất
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      handleManualSave();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-gray-100 text-gray-800 font-semibold"
                  >
                    💾 Lưu vào bộ nhớ máy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      handleResetStudentRound();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-gray-100 text-gray-800 font-semibold"
                  >
                    🔄 Bắt đầu vòng học sinh mới
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      handleExportJSON();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-gray-100 text-gray-800 font-semibold"
                  >
                    📥 Sao lưu dữ liệu (Tải JSON)
                  </button>
                  <label className="w-full block text-left px-3 py-1.5 hover:bg-gray-100 text-gray-800 font-semibold cursor-pointer">
                    <span>📤 Khôi phục dữ liệu (Nhập JSON)</span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImportJSON}
                      accept=".json"
                      className="hidden"
                    />
                  </label>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      handleRestoreBCHDefaults();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 font-bold"
                  >
                    ⚠️ Khôi phục danh sách BCH mặc định
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PHÂN CÔNG TRỰC SÁNG THỨ HAI (SHDC) RIÊNG CHO CÁC HỌC SINH */}
      <div className="no-print w-[96%] max-w-[1800px] mx-auto">
        <SHDCPanel
          week={currentWeek}
          students={state.students}
          locations={state.shdcLocations}
          onGenerateSHDC={handleGenerateSHDC}
          onToggleStudentLock={handleToggleStudentLock}
          onAddSHDCStudent={handleAddSHDCStudent}
          onRemoveSHDCStudent={handleRemoveSHDCStudent}
          onClearSHDC={handleClearSHDC}
          onAddLocation={handleAddSHDCLocation}
          onDeleteLocation={handleDeleteSHDCLocation}
          onEditLocation={handleEditSHDCLocation}
          onOpenMondayDutyModal={() => setShowMondayDutyModal(true)}
          onToggleLockMondayDuty={handleToggleLockMondayDuty}
          onApplyMondayDutyToNextWeek={handleApplyMondayDutyToNextWeek}
        />
      </div>

      {/* BẢNG LỊCH CHÍNH (Hiển thị trực quan trên màn hình) */}
      <div className="no-print w-[96%] max-w-[1800px] mx-auto">
        <ScheduleGrid
          week={currentWeek}
          bchList={state.bchList}
          students={state.students}
          includeSaturday={Boolean(state.includeSaturday)}
          onUpdateBCHSlot={handleUpdateBCHSlot}
          onToggleLock={handleToggleLock}
          onToggleStudentsLock={handleToggleStudentsLock}
          onAddStudent={handleAddStudent}
          onRemoveStudent={handleRemoveStudent}
        />

        <div className="mt-3 text-xs sm:text-sm font-semibold text-gray-700 flex flex-wrap justify-between items-center bg-gray-50 p-2 border border-gray-300 rounded-xs">
          <span>* Bấm vào ô để chọn học sinh hoặc BCH • Biểu tượng 🔒 để khóa ô học sinh hoặc BCH khi xếp lại • Khi xuất ảnh / PDF các khóa sẽ tự động ẩn đi</span>
          <span className="font-bold text-gray-900">Đoàn trường THPT Nguyễn Chí Thanh</span>
        </div>
      </div>

      {/* KHU VỰC BẢN IN (Chỉ hiển thị khi in thực tế từ trình duyệt) */}
      <div className="hidden print:block">
        <PrintPreview
          week={currentWeek}
          bchList={state.bchList}
          students={state.students}
          shdcLocations={state.shdcLocations}
          schoolName={state.schoolName}
          secretaryName={state.secretaryName}
          includeSaturday={Boolean(state.includeSaturday)}
        />
      </div>

      {/* KHU VỰC OFF-SCREEN CHO XUẤT ẢNH & PDF (Chuẩn kích thước máy in, chữ to, viền nét, KHÔNG KHÓA) */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '1120px',
          zIndex: -9999,
          pointerEvents: 'none',
          opacity: 0,
        }}
      >
        <div style={{ width: '1120px', background: '#ffffff' }}>
          <PrintPreview
            week={currentWeek}
            bchList={state.bchList}
            students={state.students}
            shdcLocations={state.shdcLocations}
            schoolName={state.schoolName}
            secretaryName={state.secretaryName}
            includeSaturday={Boolean(state.includeSaturday)}
            containerId="direct-export-document"
          />
        </div>
      </div>

      {/* MODAL: XEM TRƯỚC VÀ XUẤT BẢN IN / ẢNH / PDF */}
      <ExportPreviewModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        week={currentWeek}
        bchList={state.bchList}
        students={state.students}
        shdcLocations={state.shdcLocations}
        schoolName={state.schoolName}
        secretaryName={state.secretaryName}
        includeSaturday={Boolean(state.includeSaturday)}
      />

      {/* MODAL: QUẢN LÝ 10 HỌC SINH */}
      <StudentListModal
        isOpen={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        students={state.students}
        onSaveStudents={(updatedStudents) => {
          setState((prev) => ({
            ...prev,
            students: updatedStudents,
          }));
          showToast('Đã lưu danh sách học sinh');
        }}
      />

      {/* MODAL: PHÂN CÔNG LỚP TRỰC SÁNG & CHIỀU THỨ HAI */}
      {showMondayDutyModal && (
        <MondayDutyModal
          dutyClasses={currentWeek.mondayDutyClasses}
          bchList={state.bchList}
          weekNumber={state.currentWeekNumber}
          onSave={handleSaveMondayDuty}
          onClose={() => setShowMondayDutyModal(false)}
        />
      )}
    </div>
  );
}
