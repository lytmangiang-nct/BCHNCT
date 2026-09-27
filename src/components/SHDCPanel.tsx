import React, { useState, useRef, useEffect } from 'react';
import { 
  WeekSchedule, 
  SupportStudent, 
  SHDCLocationConfig,
  SHDCDistributionMode 
} from '../types';

interface Props {
  week: WeekSchedule;
  students: SupportStudent[];
  locations: SHDCLocationConfig[];
  onGenerateSHDC: (mode: SHDCDistributionMode) => void;
  onToggleStudentLock: (studentId: string) => void;
  onAddSHDCStudent: (locationKey: string, studentId: string) => void;
  onRemoveSHDCStudent: (locationKey: string, studentId: string) => void;
  onClearSHDC: () => void;
  onAddLocation: (name: string, shortName?: string) => void;
  onDeleteLocation: (key: string) => void;
  onEditLocation: (key: string, name: string, shortName?: string) => void;
  onOpenMondayDutyModal?: () => void;
  onToggleLockMondayDuty?: () => void;
  onApplyMondayDutyToNextWeek?: () => void;
}

export const SHDCPanel: React.FC<Props> = ({
  week,
  students,
  locations,
  onGenerateSHDC,
  onToggleStudentLock,
  onAddSHDCStudent,
  onRemoveSHDCStudent,
  onClearSHDC,
  onAddLocation,
  onDeleteLocation,
  onEditLocation,
  onOpenMondayDutyModal,
  onToggleLockMondayDuty,
  onApplyMondayDutyToNextWeek,
}) => {
  const [selectedMode, setSelectedMode] = useState<SHDCDistributionMode>(
    week.shdc?.mode || '3_per_location'
  );
  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Trạng thái modal Thêm khu vực
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLocName, setNewLocName] = useState('');
  const [newLocShort, setNewLocShort] = useState('');

  // Trạng thái modal Sửa khu vực
  const [editingLoc, setEditingLoc] = useState<SHDCLocationConfig | null>(null);
  const [editLocName, setEditLocName] = useState('');
  const [editLocShort, setEditLocShort] = useState('');

  // Trạng thái modal Xác nhận Xóa khu vực (thay thế window.confirm để chạy tốt trong iframe)
  const [deletingLoc, setDeletingLoc] = useState<SHDCLocationConfig | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Bảng màu phân biệt cho các khu vực
  const THEMES = [
    { border: 'border-sky-500 bg-sky-50/40', header: 'bg-sky-700 text-white' },
    { border: 'border-amber-500 bg-amber-50/40', header: 'bg-amber-700 text-white' },
    { border: 'border-emerald-500 bg-emerald-50/40', header: 'bg-emerald-700 text-white' },
    { border: 'border-purple-500 bg-purple-50/40', header: 'bg-purple-700 text-white' },
    { border: 'border-rose-500 bg-rose-50/40', header: 'bg-rose-700 text-white' },
    { border: 'border-indigo-500 bg-indigo-50/40', header: 'bg-indigo-700 text-white' },
    { border: 'border-teal-500 bg-teal-50/40', header: 'bg-teal-700 text-white' },
    { border: 'border-orange-500 bg-orange-50/40', header: 'bg-orange-700 text-white' },
  ];

  // Đồng bộ mode khi week thay đổi
  useEffect(() => {
    if (week.shdc?.mode) {
      setSelectedMode(week.shdc.mode);
    }
  }, [week.shdc?.mode]);

  // Đóng dropdown khi bấm ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveLocation(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getStudent = (id: string) => students.find((s) => s.id === id);

  const lockedStudentsSet = new Set<string>(week.shdc?.lockedStudents || []);

  // Tập hợp danh sách học sinh đã được xếp vào SHDC tuần này
  const assignedSHDCIds = new Set<string>();
  if (week.shdc?.locations) {
    Object.values(week.shdc.locations).forEach((loc) => {
      loc.students.forEach((id) => assignedSHDCIds.add(id));
    });
  }

  // Danh sách học sinh CHƯA được xếp tuần này (sẽ ưu tiên cho đợt tiếp theo)
  const unassignedStudents = students.filter((s) => !assignedSHDCIds.has(s.id));

  const handleModeSelectChange = (newMode: SHDCDistributionMode) => {
    setSelectedMode(newMode);
    if (newMode !== 'custom') {
      onGenerateSHDC(newMode);
    }
  };

  const handleOpenAddModal = () => {
    setNewLocName('');
    setNewLocShort('');
    setShowAddModal(true);
  };

  const handleConfirmAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newLocName.trim();
    if (!trimmed) return;
    onAddLocation(trimmed, newLocShort.trim() || trimmed);
    setShowAddModal(false);
    setNewLocName('');
    setNewLocShort('');
  };

  const handleOpenEditModal = (loc: SHDCLocationConfig) => {
    setEditingLoc(loc);
    setEditLocName(loc.name);
    setEditLocShort(loc.shortName);
  };

  const handleConfirmEditLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLoc) return;
    const trimmed = editLocName.trim();
    if (!trimmed) return;
    onEditLocation(editingLoc.key, trimmed, editLocShort.trim() || trimmed);
    setEditingLoc(null);
  };

  const handleClickDelete = (loc: SHDCLocationConfig) => {
    if (locations.length <= 1) {
      setDeleteWarning('Cần giữ lại ít nhất 1 khu vực trực cho sáng Thứ Hai.');
      return;
    }
    setDeletingLoc(loc);
  };

  // Xác định số cột hiển thị linh hoạt theo số khu vực và độ rộng màn hình
  const gridColsClass = 
    locations.length === 1 
      ? 'grid-cols-1 max-w-md mx-auto'
      : locations.length === 2 
      ? 'grid-cols-1 sm:grid-cols-2'
      : locations.length === 3 
      ? 'grid-cols-1 md:grid-cols-3'
      : locations.length === 4
      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4'
      : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';

  return (
    <div className="bg-white border-2 border-blue-900 shadow-md mb-4 rounded-xs overflow-hidden">
      {/* Thanh tiêu đề & điều khiển panel */}
      <div className="bg-blue-900 text-white px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-amber-400 text-base">🚩</span>
          <span className="font-black text-xs sm:text-sm uppercase tracking-wide">
            LỊCH TRỰC SÁNG THỨ HAI (SINH HOẠT DƯỚI CỜ - HỌC SINH HỖ TRỢ)
          </span>
          <span className="text-[11px] bg-blue-800 text-blue-100 font-bold px-2 py-0.5 rounded-full border border-blue-600">
            {locations.length} khu vực
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs flex-wrap">
          {/* Nút THÊM KHU VỰC */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xs shadow-2xs transition-colors flex items-center gap-1"
            title="Thêm khu vực trực mới cho sáng Thứ Hai"
          >
            <span>➕</span>
            <span>Thêm khu vực</span>
          </button>

          {/* Chọn chế độ phân bổ */}
          <div className="flex items-center gap-1 bg-blue-950 px-2 py-1 rounded-xs border border-blue-700">
            <span className="text-gray-300 font-semibold text-[11px]">Chế độ:</span>
            <select
              value={selectedMode}
              onChange={(e) => handleModeSelectChange(e.target.value as SHDCDistributionMode)}
              className="bg-transparent text-white font-bold text-xs focus:outline-hidden cursor-pointer"
            >
              <option value="3_per_location" className="text-black font-semibold">
                3 bạn / 1 vị trí
              </option>
              <option value="2_per_location" className="text-black font-semibold">
                2 bạn / 1 vị trí (Đúng 2 bạn - Xoay tua)
              </option>
              <option value="custom" className="text-black font-semibold">
                Tùy chỉnh thủ công
              </option>
            </select>
          </div>

          {/* Nút Phân công Lớp Trực sáng & chiều Thứ Hai */}
          {onOpenMondayDutyModal && (
            <button
              type="button"
              onClick={onOpenMondayDutyModal}
              title="Phân công lớp Trực cổng, Chuẩn bị sân khấu, Dọn dẹp sân khấu sáng & chiều"
              className="px-2.5 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black rounded-xs shadow-2xs transition-all flex items-center gap-1.5 border border-cyan-400"
            >
              <span>🏛️</span>
              <span>Phân công lớp trực (Sáng/Chiều)</span>
            </button>
          )}

          {/* Nút Sắp lịch SHDC */}
          <button
            type="button"
            onClick={() => onGenerateSHDC(selectedMode)}
            title="Tự động xếp học sinh vào các khu vực (bảo lưu các học sinh đang khóa 🔒)"
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xs shadow-2xs transition-colors flex items-center gap-1"
          >
            <span>⚡</span>
            <span>Sắp lịch SHDC</span>
          </button>

          {/* Nút Xóa lịch SHDC */}
          <button
            type="button"
            onClick={onClearSHDC}
            title="Xóa phân công SHDC tuần này (giữ lại các học sinh đã khóa)"
            className="px-2 py-1 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xs shadow-2xs transition-colors"
          >
            Xóa
          </button>

          {/* Nút thu gọn / mở rộng */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="px-1.5 py-1 bg-blue-800 hover:bg-blue-700 text-white font-black rounded-xs ml-0.5"
            title={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
        </div>
      </div>

      {/* Nội dung các khu vực trực */}
      {!isCollapsed && (
        <div className="p-3 sm:p-4 bg-slate-50">
          <div className={`grid ${gridColsClass} gap-3`}>
            {locations.map((loc, idx) => {
              const locationData = week.shdc?.locations?.[loc.key];
              const studentIds = locationData?.students || [];
              const isDropdownOpen = activeLocation === loc.key;

              // Màu sắc phân biệt luân phiên
              const theme = THEMES[idx % THEMES.length];

              return (
                <div
                  key={loc.key}
                  className={`border-2 rounded-xs shadow-xs transition-shadow relative flex flex-col justify-between ${theme.border}`}
                >
                  {/* Tiêu đề vị trí & Các nút Thao tác (Sửa/Xóa) */}
                  <div className={`${theme.header} p-2 flex items-center justify-between gap-1`}>
                    <div className="flex items-center gap-1.5 overflow-hidden min-w-0">
                      <span className="text-xs font-black bg-white/20 px-1.5 py-0.5 rounded-2xs shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-black text-xs sm:text-sm tracking-wide truncate" title={loc.name}>
                        {loc.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[11px] font-black bg-white/20 px-1.5 py-0.5 rounded-2xs">
                        {studentIds.length} bạn
                      </span>

                      {/* Nút sửa tên khu vực */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(loc)}
                        title="Đổi tên khu vực này"
                        className="text-white/80 hover:text-white bg-white/10 hover:bg-white/25 px-1.5 py-0.5 rounded-2xs text-xs font-bold transition-colors"
                      >
                        ✏️
                      </button>

                      {/* Nút xóa khu vực */}
                      <button
                        type="button"
                        onClick={() => handleClickDelete(loc)}
                        title="Xóa khu vực này"
                        className="text-white/80 hover:text-red-200 bg-white/10 hover:bg-red-600/80 px-1.5 py-0.5 rounded-2xs text-xs font-bold transition-colors cursor-pointer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Danh sách học sinh đảm nhận vị trí với chức năng KHÓA HỌC SINH */}
                  <div className="p-2.5 min-h-[100px] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-gray-700 font-bold mb-1.5 pb-1 border-b border-gray-300">
                        <span>Học sinh trực:</span>
                        <span className="text-gray-500 text-[10px] font-medium">Bấm 🔓 để khóa bạn này</span>
                      </div>

                      {studentIds.length === 0 ? (
                        <div className="text-gray-400 italic text-xs py-3 text-center">
                          Chưa phân công học sinh
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {studentIds.map((stId, sIdx) => {
                            const st = getStudent(stId);
                            if (!st) return null;
                            const isStudentLocked = lockedStudentsSet.has(stId);

                            return (
                              <div
                                key={stId}
                                className={`flex items-center justify-between px-2 py-1.5 rounded-2xs text-xs font-bold border transition-colors ${
                                  isStudentLocked
                                    ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-2xs'
                                    : 'bg-white border-gray-300 text-gray-900 shadow-2xs hover:border-gray-400'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="text-gray-500 font-semibold text-[10px]">
                                    {sIdx + 1}.
                                  </span>
                                  <span className="font-black text-black truncate">{st.fullName}</span>
                                  <span className="text-blue-900 font-extrabold text-[11px] shrink-0">
                                    ({st.className})
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0 ml-1">
                                  {/* Nút KHÓA HỌC SINH NÀY */}
                                  <button
                                    type="button"
                                    onClick={() => onToggleStudentLock(stId)}
                                    title={
                                      isStudentLocked
                                        ? 'Đang khóa học sinh này (Sẽ giữ nguyên sang các tuần tiếp theo)'
                                        : 'Đang mở (Bấm để khóa học sinh này tại vị trí và giữ sang tuần sau)'
                                    }
                                    className={`px-1.5 py-0.5 text-[11px] rounded-xs font-black transition-colors ${
                                      isStudentLocked
                                        ? 'bg-amber-300 text-amber-950 hover:bg-amber-400 ring-1 ring-amber-500'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                                    }`}
                                  >
                                    {isStudentLocked ? '🔒 Khóa' : '🔓'}
                                  </button>

                                  {/* Nút gỡ học sinh khỏi vị trí */}
                                  {!isStudentLocked && (
                                    <button
                                      type="button"
                                      onClick={() => onRemoveSHDCStudent(loc.key, stId)}
                                      title="Gỡ bạn này khỏi vị trí"
                                      className="text-gray-400 hover:text-red-700 font-black text-sm px-1 leading-none"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Nút thêm học sinh vào vị trí */}
                    <div className="mt-2.5 pt-2 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => setActiveLocation(isDropdownOpen ? null : loc.key)}
                        className="w-full text-center py-1 bg-white hover:bg-blue-50 border border-blue-400 text-blue-950 font-bold text-xs rounded-2xs shadow-2xs transition-colors flex items-center justify-center gap-1"
                      >
                        <span>+</span>
                        <span>Thêm học sinh vào {loc.shortName || loc.name}</span>
                      </button>
                    </div>

                    {/* Dropdown chọn học sinh */}
                    {isDropdownOpen && (
                      <div
                        ref={dropdownRef}
                        className="absolute left-2 right-2 top-12 bg-white border-2 border-gray-700 shadow-2xl z-30 p-2 text-xs rounded-xs"
                      >
                        <div className="flex justify-between items-center pb-1.5 mb-1.5 border-b border-gray-300">
                          <span className="font-black text-gray-900 text-xs truncate">
                            Chọn học sinh cho {loc.shortName || loc.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveLocation(null)}
                            className="text-gray-400 hover:text-gray-800 text-sm font-bold px-1"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="max-h-52 overflow-y-auto space-y-1">
                          {students.map((st) => {
                            const isAssignedHere = studentIds.includes(st.id);
                            const isAssignedOtherLocation =
                              !isAssignedHere && assignedSHDCIds.has(st.id);

                            return (
                              <button
                                key={st.id}
                                type="button"
                                disabled={isAssignedHere}
                                onClick={() => {
                                  onAddSHDCStudent(loc.key, st.id);
                                  setActiveLocation(null);
                                }}
                                className={`w-full text-left px-2 py-1.5 flex items-center justify-between text-xs rounded-2xs border ${
                                  isAssignedHere
                                    ? 'bg-blue-100 border-blue-300 text-blue-950 font-bold opacity-60'
                                    : isAssignedOtherLocation
                                    ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold hover:bg-amber-100'
                                    : 'bg-white border-gray-200 text-gray-950 font-semibold hover:bg-blue-50'
                                }`}
                              >
                                <span className="truncate">
                                  <span className="font-black">{st.fullName}</span>{' '}
                                  <span className="text-gray-600 font-bold">({st.className})</span>
                                </span>
                                {isAssignedHere ? (
                                  <span className="text-blue-700 font-bold text-[10px]">Đã có ở đây</span>
                                ) : isAssignedOtherLocation ? (
                                  <span className="text-amber-800 font-bold text-[10px]">Đổi vị trí</span>
                                ) : (
                                  <span className="text-emerald-700 font-black text-xs">+ Chọn</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dòng trạng thái: Hiển thị các bạn chưa được sắp xếp (được ưu tiên cho đợt tiếp theo) */}
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-2.5 border border-gray-300 rounded-2xs text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black text-gray-900">
                🔄 Học sinh chưa trực tuần này ({unassignedStudents.length} bạn):
              </span>
              {unassignedStudents.length === 0 ? (
                <span className="text-emerald-700 font-bold">
                  Đã phân công đủ tất cả {students.length} bạn!
                </span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {unassignedStudents.map((st) => (
                    <span
                      key={st.id}
                      className="bg-amber-100 text-amber-900 font-extrabold px-1.5 py-0.5 rounded-2xs text-[11px] border border-amber-300"
                    >
                      {st.fullName} ({st.className})
                    </span>
                  ))}
                  <span className="text-gray-500 italic text-[11px]">
                    (Sẽ được ưu tiên xếp đầu tiên ở đợt xếp kế tiếp)
                  </span>
                </div>
              )}
            </div>

            <div className="text-[11px] text-gray-600 shrink-0 font-medium flex items-center gap-2">
              <span>Đã khóa: <strong className="text-amber-900">{lockedStudentsSet.size}</strong> bạn</span>
              <span>•</span>
              <span>Khu vực: <strong className="text-blue-950">{locations.length}</strong></span>
              <span>•</span>
              <span>Tổng: <strong className="text-blue-900">{students.length}</strong> bạn</span>
            </div>
          </div>

          {/* Dòng tóm tắt Phân công lớp trực Thứ Hai, Trực tuần & Vệ sinh cầu thang */}
          {(() => {
            const isDutyLocked = Boolean(week.mondayDutyClasses?.isLocked);
            const isFieldLocked = (fieldKey: string) =>
              isDutyLocked || Boolean(week.mondayDutyClasses?.lockedFields?.[fieldKey]);

            return (
              <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 via-indigo-50 to-cyan-50 border-2 border-blue-400 rounded-xs shadow-2xs">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2 pb-1.5 border-b border-blue-200">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg">🏛️</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-xs sm:text-sm uppercase text-blue-950 tracking-wide">
                          Phân Công Trực Theo Tuần & Vệ Sinh Cầu Thang
                        </span>
                        {isDutyLocked ? (
                          <span className="bg-emerald-100 text-emerald-900 border border-emerald-400 px-2 py-0.5 rounded-full font-black text-[11px] flex items-center gap-1 shadow-2xs">
                            <span>🔒</span>
                            <span>ĐÃ KHÓA (Giữ nguyên sang tuần sau)</span>
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-bold text-[11px] flex items-center gap-1">
                            <span>🔓</span>
                            <span>Chưa khóa</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-blue-700 font-semibold block">
                        Trực cổng, Sân khấu, Trực tuần & Vệ sinh cầu thang Sáng - Chiều
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {onToggleLockMondayDuty && (
                      <button
                        type="button"
                        onClick={onToggleLockMondayDuty}
                        className={`px-2.5 py-1 text-xs font-bold rounded-2xs border shadow-2xs transition-colors flex items-center gap-1 cursor-pointer ${
                          isDutyLocked
                            ? 'bg-white hover:bg-emerald-50 text-emerald-900 border-emerald-400'
                            : 'bg-amber-200 hover:bg-amber-300 text-amber-950 border-amber-400'
                        }`}
                        title={
                          isDutyLocked
                            ? 'Bấm để mở khóa phân công lớp trực'
                            : 'Khóa phân công lớp trực này và tự động giữ nguyên sang tuần sau'
                        }
                      >
                        <span>{isDutyLocked ? '🔓 Mở khóa' : '🔒 Khóa lớp trực'}</span>
                      </button>
                    )}
                    {onApplyMondayDutyToNextWeek && (
                      <button
                        type="button"
                        onClick={onApplyMondayDutyToNextWeek}
                        className="px-2.5 py-1 text-xs font-bold bg-indigo-700 hover:bg-indigo-800 text-white rounded-2xs shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                        title={`Lưu và giữ nguyên sang Tuần ${(week.weekNumber || 1) + 1}`}
                      >
                        <span>⏩</span>
                        <span>Giữ sang Tuần {(week.weekNumber || 1) + 1}</span>
                      </button>
                    )}
                    {onOpenMondayDutyModal && (
                      <button
                        type="button"
                        onClick={onOpenMondayDutyModal}
                        className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-2xs shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>✏️</span>
                        <span>Chỉnh sửa lớp trực & Vệ sinh</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Hàng 1: Trực tuần */}
                <div className="mb-2.5 p-2 bg-indigo-100/60 border border-indigo-300 rounded-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-indigo-950 flex items-center gap-1 uppercase">
                      <span>📅</span> Lớp Trực tuần:
                    </span>
                    <span className="bg-white px-2 py-0.5 rounded-2xs border border-indigo-200 font-bold text-gray-800 flex items-center gap-1">
                      <span>☀️ Sáng:</span>
                      <strong className="text-indigo-900 font-black">
                        Lớp {week.mondayDutyClasses?.weekDuty?.morning || '---'}
                      </strong>
                      {isFieldLocked('weekDuty.morning') && <span title="Đã khóa cố định">🔒</span>}
                    </span>
                    <span className="bg-white px-2 py-0.5 rounded-2xs border border-indigo-200 font-bold text-gray-800 flex items-center gap-1">
                      <span>🌆 Chiều:</span>
                      <strong className="text-indigo-900 font-black">
                        Lớp {week.mondayDutyClasses?.weekDuty?.afternoon || '---'}
                      </strong>
                      {isFieldLocked('weekDuty.afternoon') && <span title="Đã khóa cố định">🔒</span>}
                    </span>
                  </div>
                  <span className="text-[10px] text-indigo-800 italic font-semibold">
                    * Trực xuyên suốt các buổi trong tuần
                  </span>
                </div>

                {/* Hàng 2: Vệ sinh cầu thang */}
                <div className="mb-2.5 p-2.5 bg-teal-50 border border-teal-300 rounded-2xs text-xs space-y-1.5">
                  <div className="font-black text-teal-950 uppercase flex items-center gap-1">
                    <span>🪜</span> Vệ sinh cầu thang:
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                    {/* Sáng */}
                    <div className="bg-white/90 p-2 rounded-2xs border border-teal-200">
                      <div className="font-black text-amber-900 mb-1 flex items-center gap-1">
                        <span>☀️ Buổi Sáng:</span>
                      </div>
                      <div className="space-y-0.5 text-gray-800 font-medium">
                        <div>
                          • Khu A:{' '}
                          <strong className="text-teal-950 font-black">
                            {week.mondayDutyClasses?.stairCleaning?.morning?.khuA || '---'}
                          </strong>
                          {isFieldLocked('stairCleaning.morning.khuA') && ' 🔒'}
                        </div>
                        <div>
                          • Khu B (phía cổng):{' '}
                          <strong className="text-teal-950 font-black">
                            {week.mondayDutyClasses?.stairCleaning?.morning?.khuB_cong || '---'}
                          </strong>
                          {isFieldLocked('stairCleaning.morning.khuB_cong') && ' 🔒'}; (gần thư viện):{' '}
                          <strong className="text-teal-950 font-black">
                            {week.mondayDutyClasses?.stairCleaning?.morning?.khuB_thuvien || '---'}
                          </strong>
                          {isFieldLocked('stairCleaning.morning.khuB_thuvien') && ' 🔒'}
                        </div>
                        <div>
                          • Khu C1 (phía cổng):{' '}
                          <strong className="text-teal-950 font-black">
                            {week.mondayDutyClasses?.stairCleaning?.morning?.khuC1 || '---'}
                          </strong>
                          {isFieldLocked('stairCleaning.morning.khuC1') && ' 🔒'}
                        </div>
                        <div>
                          • Khu D:{' '}
                          <strong className="text-teal-950 font-black">
                            {week.mondayDutyClasses?.stairCleaning?.morning?.khuD || '---'}
                          </strong>
                          {isFieldLocked('stairCleaning.morning.khuD') && ' 🔒'}
                        </div>
                      </div>
                    </div>

                    {/* Chiều */}
                    <div className="bg-white/90 p-2 rounded-2xs border border-teal-200">
                      <div className="font-black text-indigo-900 mb-1 flex items-center gap-1">
                        <span>🌆 Buổi Chiều:</span>
                      </div>
                      <div className="space-y-0.5 text-gray-800 font-medium">
                        <div>
                          • Khu A:{' '}
                          <strong className="text-teal-950 font-black">
                            {week.mondayDutyClasses?.stairCleaning?.afternoon?.khuA || '---'}
                          </strong>
                          {isFieldLocked('stairCleaning.afternoon.khuA') && ' 🔒'}
                        </div>
                        <div>
                          • Khu B (phía cổng):{' '}
                          <strong className="text-teal-950 font-black">
                            {week.mondayDutyClasses?.stairCleaning?.afternoon?.khuB_cong || '---'}
                          </strong>
                          {isFieldLocked('stairCleaning.afternoon.khuB_cong') && ' 🔒'}; (gần thư viện):{' '}
                          <strong className="text-teal-950 font-black">
                            {week.mondayDutyClasses?.stairCleaning?.afternoon?.khuB_thuvien || '---'}
                          </strong>
                          {isFieldLocked('stairCleaning.afternoon.khuB_thuvien') && ' 🔒'}
                        </div>
                        <div>
                          • Khu C1:{' '}
                          <strong className="text-teal-950 font-black">
                            {week.mondayDutyClasses?.stairCleaning?.afternoon?.khuC1 || '---'}
                          </strong>
                          {isFieldLocked('stairCleaning.afternoon.khuC1') && ' 🔒'}
                        </div>
                        <div>
                          • Khu D:{' '}
                          <strong className="text-teal-950 font-black">
                            {week.mondayDutyClasses?.stairCleaning?.afternoon?.khuD || '---'}
                          </strong>
                          {isFieldLocked('stairCleaning.afternoon.khuD') && ' 🔒'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hàng 3: Cổng & Sân khấu */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Sáng */}
                  <div className="bg-white/80 p-2.5 rounded-2xs border border-amber-300 shadow-2xs">
                    <div className="font-black text-amber-900 flex items-center gap-1 mb-1.5 uppercase text-[11px]">
                      <span>☀️ Buổi Sáng: Cổng & Sân khấu</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-semibold">1. Trực cổng:</span>
                        <span className="font-black text-blue-800 bg-blue-50 px-2 py-0.5 rounded-2xs border border-blue-200 flex items-center gap-1">
                          {week.mondayDutyClasses?.morning?.gateDutyClass
                            ? `Lớp ${week.mondayDutyClasses.morning.gateDutyClass}`
                            : 'Chưa phân công'}
                          {isFieldLocked('morning.gateDutyClass') && <span>🔒</span>}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-semibold">2. Chuẩn bị sân khấu:</span>
                        <span className="font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-2xs border border-amber-200 flex items-center gap-1">
                          {week.mondayDutyClasses?.morning?.stagePrepClass
                            ? `Lớp ${week.mondayDutyClasses.morning.stagePrepClass}`
                            : 'Chưa phân công'}
                          {isFieldLocked('morning.stagePrepClass') && <span>🔒</span>}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-semibold">3. Dọn dẹp sân khấu:</span>
                        <span className="font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-2xs border border-emerald-200 flex items-center gap-1">
                          {week.mondayDutyClasses?.morning?.stageCleanClass
                            ? `Lớp ${week.mondayDutyClasses.morning.stageCleanClass}`
                            : 'Chưa phân công'}
                          {isFieldLocked('morning.stageCleanClass') && <span>🔒</span>}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Chiều */}
                  <div className="bg-white/80 p-2.5 rounded-2xs border border-indigo-300 shadow-2xs">
                    <div className="font-black text-indigo-900 flex items-center gap-1 mb-1.5 uppercase text-[11px]">
                      <span>🌆 Buổi Chiều: Cổng & Sân khấu</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-semibold">1. Trực cổng:</span>
                        <span className="font-black text-blue-800 bg-blue-50 px-2 py-0.5 rounded-2xs border border-blue-200 flex items-center gap-1">
                          {week.mondayDutyClasses?.afternoon?.gateDutyClass
                            ? `Lớp ${week.mondayDutyClasses.afternoon.gateDutyClass}`
                            : 'Chưa phân công'}
                          {isFieldLocked('afternoon.gateDutyClass') && <span>🔒</span>}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-semibold">2. Chuẩn bị sân khấu:</span>
                        <span className="font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-2xs border border-amber-200 flex items-center gap-1">
                          {week.mondayDutyClasses?.afternoon?.stagePrepClass
                            ? `Lớp ${week.mondayDutyClasses.afternoon.stagePrepClass}`
                            : 'Chưa phân công'}
                          {isFieldLocked('afternoon.stagePrepClass') && <span>🔒</span>}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-semibold">3. Dọn dẹp sân khấu:</span>
                        <span className="font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-2xs border border-emerald-200 flex items-center gap-1">
                          {week.mondayDutyClasses?.afternoon?.stageCleanClass
                            ? `Lớp ${week.mondayDutyClasses.afternoon.stageCleanClass}`
                            : 'Chưa phân công'}
                          {isFieldLocked('afternoon.stageCleanClass') && <span>🔒</span>}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {week.mondayDutyClasses?.notes && (
                  <div className="mt-2 text-[11px] font-semibold italic text-blue-900 bg-white/70 p-1.5 rounded-2xs border border-blue-200">
                    📌 Ghi chú: {week.mondayDutyClasses.notes}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* MODAL THÊM KHU VỰC MỚI */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border-2 border-emerald-700 rounded-xs shadow-2xl max-w-md w-full p-4">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-300">
              <h4 className="font-black text-sm text-gray-900 flex items-center gap-1.5 uppercase">
                <span>➕</span> Thêm khu vực trực sáng Thứ Hai
              </h4>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-700 font-bold text-base px-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmAddLocation} className="space-y-3">
              <div>
                <label className="block text-xs font-black text-gray-800 mb-1">
                  Tên khu vực đầy đủ <span className="text-red-600">*</span>:
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  placeholder="Ví dụ: Khu vực Sân khấu, Khu căn tin..."
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-400 rounded-2xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-800 mb-1">
                  Tên hiển thị rút gọn (tùy chọn):
                </label>
                <input
                  type="text"
                  value={newLocShort}
                  onChange={(e) => setNewLocShort(e.target.value)}
                  placeholder="Ví dụ: Sân khấu, Căn tin..."
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-400 rounded-2xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-2xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xs shadow-xs"
                >
                  ✓ Lưu khu vực
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SỬA TÊN KHU VỰC */}
      {editingLoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border-2 border-blue-800 rounded-xs shadow-2xl max-w-md w-full p-4">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-300">
              <h4 className="font-black text-sm text-gray-900 flex items-center gap-1.5 uppercase">
                <span>✏️</span> Chỉnh sửa tên khu vực
              </h4>
              <button
                type="button"
                onClick={() => setEditingLoc(null)}
                className="text-gray-400 hover:text-gray-700 font-bold text-base px-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmEditLocation} className="space-y-3">
              <div>
                <label className="block text-xs font-black text-gray-800 mb-1">
                  Tên khu vực đầy đủ <span className="text-red-600">*</span>:
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={editLocName}
                  onChange={(e) => setEditLocName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-400 rounded-2xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-800 mb-1">
                  Tên hiển thị rút gọn:
                </label>
                <input
                  type="text"
                  value={editLocShort}
                  onChange={(e) => setEditLocShort(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-400 rounded-2xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setEditingLoc(null)}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-2xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs rounded-2xs shadow-xs"
                >
                  ✓ Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA KHU VỰC (IN-APP THAY THẾ CHO WINDOW.CONFIRM) */}
      {deletingLoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white border-2 border-red-700 rounded-xs shadow-2xl max-w-md w-full p-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-200">
              <h4 className="font-black text-sm text-red-700 flex items-center gap-1.5 uppercase">
                <span>⚠️</span> Xác nhận xóa khu vực
              </h4>
              <button
                type="button"
                onClick={() => setDeletingLoc(null)}
                className="text-gray-400 hover:text-gray-700 font-bold text-base px-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-800">
              <p>
                Bạn có chắc chắn muốn xóa khu vực: <strong className="text-red-900 text-sm">"{deletingLoc.name}"</strong> không?
              </p>

              {(() => {
                const studentIds = week.shdc?.locations?.[deletingLoc.key]?.students || [];
                if (studentIds.length > 0) {
                  return (
                    <div className="bg-amber-50 border border-amber-300 p-2.5 rounded-2xs text-amber-950 font-semibold space-y-1">
                      <div className="font-bold text-amber-900 flex items-center gap-1">
                        <span>ℹ️</span> Lưu ý: Khu vực đang có {studentIds.length} học sinh:
                      </div>
                      <div className="text-[11px] text-gray-800">
                        {studentIds
                          .map((stId) => {
                            const st = getStudent(stId);
                            return st ? `${st.fullName} (${st.className})` : null;
                          })
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                      <div className="text-[10px] text-gray-500 italic pt-0.5">
                        Khi xóa, các học sinh này sẽ trở lại danh sách chưa phân công và được ưu tiên xếp ở đợt tiếp theo.
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setDeletingLoc(null)}
                className="px-3.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-2xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteLocation(deletingLoc.key);
                  setDeletingLoc(null);
                }}
                className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white font-black text-xs rounded-2xs shadow-xs cursor-pointer flex items-center gap-1"
              >
                <span>🗑️</span>
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CẢNH BÁO KHI CHỈ CÒN 1 KHU VỰC */}
      {deleteWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border-2 border-amber-600 rounded-xs shadow-2xl max-w-sm w-full p-4">
            <div className="flex items-center gap-2 text-amber-700 font-black text-sm mb-2">
              <span>⚠️</span>
              <span>Thông báo</span>
            </div>
            <p className="text-xs text-gray-700 mb-4 font-semibold">{deleteWarning}</p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setDeleteWarning(null)}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-2xs cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
