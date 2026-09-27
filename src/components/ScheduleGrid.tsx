import React, { useState, useRef, useEffect } from 'react';
import { 
  WeekSchedule, 
  BCHUnit, 
  SupportStudent, 
  GradeLevel, 
  DayOfWeek, 
  BCHSlot 
} from '../types';
import { ORDERED_GRADES, getActiveDays, getActiveDayKeys } from '../data/defaultData';

interface Props {
  week: WeekSchedule;
  bchList: BCHUnit[];
  students: SupportStudent[];
  includeSaturday?: boolean;
  onUpdateBCHSlot: (grade: GradeLevel, day: DayOfWeek, bchId: string | undefined, isLocked?: boolean) => void;
  onToggleLock: (grade: GradeLevel, day: DayOfWeek) => void;
  onToggleStudentsLock: (grade: GradeLevel, day: DayOfWeek) => void;
  onAddStudent: (grade: GradeLevel, day: DayOfWeek, studentId: string) => void;
  onRemoveStudent: (grade: GradeLevel, day: DayOfWeek, studentId: string) => void;
}

export const ScheduleGrid: React.FC<Props> = ({
  week,
  bchList,
  students,
  includeSaturday = false,
  onUpdateBCHSlot,
  onToggleLock,
  onToggleStudentsLock,
  onAddStudent,
  onRemoveStudent,
}) => {
  // Dropdown popover state
  const [activeCell, setActiveCell] = useState<{
    grade: GradeLevel;
    day: DayOfWeek;
    type: 'student' | 'bch';
  } | null>(null);

  const [studentErrorMsg, setStudentErrorMsg] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeDays = getActiveDays(includeSaturday);
  const activeDayKeys = getActiveDayKeys(includeSaturday);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveCell(null);
        setStudentErrorMsg(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Tính danh sách học sinh đã được phân công trong cả tuần
  const assignedStudentIds = new Set<string>();
  for (const g of ORDERED_GRADES) {
    for (const d of activeDayKeys) {
      const cellStudents = week.grid[g]?.[d]?.students || [];
      cellStudents.forEach((id) => assignedStudentIds.add(id));
    }
  }

  // Lấy tên BCH từ id
  const getBCHName = (id?: string): string => {
    if (!id) return '';
    if (id === 'bch-dt') return 'BCH ĐT';
    const b = bchList.find((item) => item.id === id);
    return b ? b.name : id;
  };

  // Lấy thông tin học sinh từ id
  const getStudent = (id: string): SupportStudent | undefined => {
    return students.find((s) => s.id === id);
  };

  // Màu nền cho từng khối - Đậm đà, phân biệt rõ ràng
  const getGradeHeaderColor = (grade: GradeLevel) => {
    if (grade === '12') return 'bg-emerald-200 text-emerald-950';
    if (grade === '11') return 'bg-amber-200 text-amber-950';
    return 'bg-purple-200 text-purple-950';
  };

  const getBCHRowBgColor = (grade: GradeLevel) => {
    if (grade === '12') return 'bg-[#ecfdf5] hover:bg-[#d1fae5]';
    if (grade === '11') return 'bg-[#fefce8] hover:bg-[#fef08a]/60';
    return 'bg-[#faf5ff] hover:bg-[#f3e8ff]';
  };

  return (
    <div className="w-full overflow-x-auto bg-white border-2 border-gray-700 shadow-md">
      <table className="w-full border-collapse text-center font-sans border-spacing-0">
        <thead>
          <tr className="bg-teal-800 text-white font-black border-b-2 border-gray-700">
            <th className="border-r-2 border-gray-700 p-2.5 w-24 text-center font-black text-xs sm:text-sm tracking-wider uppercase" colSpan={2}>
              KHỐI
            </th>
            {activeDays.map((d) => (
              <th key={d.key} className="border-r-2 border-gray-700 last:border-r-0 p-2.5 min-w-[130px]">
                <div className="font-black text-xs sm:text-sm uppercase tracking-wide text-white">{d.label}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ORDERED_GRADES.map((grade) => {
            const gradeName = `KHỐI ${grade}`;
            const headerColorClass = getGradeHeaderColor(grade);
            const bchRowBg = getBCHRowBgColor(grade);

            return (
              <React.Fragment key={grade}>
                {/* HÀNG 1: HỌC SINH TRỰC */}
                <tr className="border-b border-gray-400">
                  {/* Ô tên khối gộp theo chiều dọc cho 2 hàng (rowspan = 2) */}
                  <td
                    rowSpan={2}
                    className={`border-r-2 border-b-2 border-gray-700 p-2 font-black text-sm sm:text-base w-20 align-middle uppercase tracking-wide ${headerColorClass}`}
                  >
                    {gradeName}
                  </td>
                  <td className="border-r-2 border-gray-600 p-2 font-black text-gray-900 bg-gray-100 text-xs sm:text-[13px] w-32 whitespace-nowrap align-middle uppercase">
                    HỌC SINH TRỰC
                  </td>

                  {/* Các ngày cho Học sinh trực */}
                  {activeDayKeys.map((day) => {
                    const cellData = week.grid[grade]?.[day];
                    const studentIds = cellData?.students || [];
                    const isStudentsLocked = !!cellData?.isStudentsLocked;
                    const isSelected =
                      activeCell?.grade === grade && activeCell?.day === day && activeCell?.type === 'student';

                    return (
                      <td
                        key={day}
                        onClick={() => {
                          if (isStudentsLocked) return;
                          setStudentErrorMsg(null);
                          setActiveCell({ grade, day, type: 'student' });
                        }}
                        className={`relative border-r border-gray-400 last:border-r-0 p-1.5 cursor-pointer align-middle transition-colors h-[56px] min-h-[56px] ${
                          isStudentsLocked ? 'bg-amber-100/40 border-amber-300' : 'bg-white hover:bg-blue-50/50'
                        } ${
                          isSelected ? 'outline-2 outline-blue-600 bg-blue-50/70 z-10' : ''
                        }`}
                      >
                        {/* Lock Icon toggle in top-right for students */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleStudentsLock(grade, day);
                          }}
                          title={isStudentsLocked ? 'Đang khóa học sinh (Sẽ tự động giữ sang các tuần tiếp theo)' : 'Đang mở (Bấm để khóa học sinh và giữ sang tuần sau)'}
                          className={`absolute right-1 top-1 text-[12px] p-0.5 select-none transition-colors z-10 ${
                            isStudentsLocked ? 'text-amber-700 font-bold bg-amber-200/90 rounded-xs px-1' : 'text-gray-300 hover:text-gray-600'
                          }`}
                        >
                          {isStudentsLocked ? '🔒' : '🔓'}
                        </button>

                        {studentIds.length === 0 ? (
                          <div className="flex items-center justify-center h-full pr-4">
                            <span className="text-gray-400 font-semibold italic text-xs select-none hover:text-blue-700">
                              {isStudentsLocked ? '(Đã khóa trống)' : '+ Chọn học sinh'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1 justify-center items-center h-full pr-4">
                            {studentIds.map((stId) => {
                              const st = getStudent(stId);
                              if (!st) return null;
                              return (
                                <div
                                  key={stId}
                                  className={`w-full flex items-center justify-between gap-1.5 px-2 py-0.5 rounded-xs leading-snug text-gray-950 border ${
                                    isStudentsLocked
                                      ? 'bg-amber-100/80 border-amber-300'
                                      : 'bg-gray-100 border-gray-300 hover:border-gray-400'
                                  }`}
                                >
                                  <span className="font-bold text-xs sm:text-[13px] truncate text-left" title={`${st.fullName} (${st.className})`}>
                                    {st.fullName}{' '}
                                    <span className="text-[11px] font-extrabold text-blue-900 bg-blue-100 px-1 py-0.2 rounded-xs border border-blue-200">
                                      {st.className}
                                    </span>
                                  </span>
                                  {!isStudentsLocked && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveStudent(grade, day, stId);
                                      }}
                                      title="Xóa học sinh này"
                                      className="text-gray-400 hover:text-red-700 font-black px-1 text-sm shrink-0 leading-none"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Dropdown danh sách học sinh */}
                        {isSelected && !isStudentsLocked && (
                          <div
                            ref={dropdownRef}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute left-0 top-full mt-1 w-72 bg-white border-2 border-gray-600 shadow-2xl z-30 p-2.5 text-left text-xs"
                          >
                            <div className="flex justify-between items-center pb-2 mb-2 border-b border-gray-300">
                              <span className="font-black text-gray-900 text-xs uppercase tracking-wide">
                                Chọn học sinh ({studentIds.length}/2)
                              </span>
                              <button
                                type="button"
                                onClick={() => setActiveCell(null)}
                                className="text-gray-400 hover:text-gray-800 text-sm font-bold px-1"
                              >
                                ✕
                              </button>
                            </div>

                            {studentErrorMsg && (
                              <div className="mb-2 p-1.5 bg-red-100 border border-red-300 text-red-900 text-xs font-bold rounded-xs">
                                {studentErrorMsg}
                              </div>
                            )}

                            {/* Danh sách học sinh chưa xếp từ TẤT CẢ các khối */}
                            {(() => {
                              const availableStudents = students.filter((s) => !assignedStudentIds.has(s.id));

                              if (availableStudents.length === 0) {
                                return (
                                  <div className="text-gray-600 text-xs font-semibold italic py-2.5 text-center bg-gray-50 border border-gray-200 rounded-xs">
                                    Tất cả {students.length} học sinh đã được phân công trong tuần này.
                                  </div>
                                );
                              }

                              return (
                                <div>
                                  <div className="text-[11px] text-gray-700 font-bold px-1 pb-1">
                                    Còn {availableStudents.length}/{students.length} học sinh chưa xếp:
                                  </div>
                                  <div className="max-h-56 overflow-y-auto space-y-1">
                                    {availableStudents.map((st) => (
                                      <button
                                        key={st.id}
                                        type="button"
                                        onClick={() => {
                                          if (studentIds.length >= 2) {
                                            setStudentErrorMsg('Mỗi buổi chỉ được phân công tối đa 2 học sinh.');
                                            return;
                                          }
                                          onAddStudent(grade, day, st.id);
                                          setStudentErrorMsg(null);
                                          if (studentIds.length + 1 >= 2) {
                                            setActiveCell(null);
                                          }
                                        }}
                                        className="w-full text-left px-2.5 py-1.5 hover:bg-blue-100 flex items-center justify-between text-xs border border-gray-200 rounded-xs transition-colors"
                                      >
                                        <span className="font-bold text-gray-950">{st.fullName}</span>
                                        <span className="text-[11px] font-bold text-blue-900 bg-blue-100 px-1.5 py-0.5 rounded-xs border border-blue-200">
                                          {st.className} (K{st.grade})
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* HÀNG 2: BCH TRỰC */}
                <tr className="border-b-2 border-gray-700">
                  <td
                    className={`border-r-2 border-gray-600 p-2 font-black text-gray-900 text-xs sm:text-[13px] w-32 whitespace-nowrap align-middle uppercase ${bchRowBg}`}
                  >
                    BCH TRỰC
                  </td>

                  {/* Kiểm tra các lớp bị trùng trong tuần của khối này */}
                  {(() => {
                    const gradeBCHCounts: Record<string, number> = {};
                    activeDayKeys.forEach((d) => {
                      const id = week.grid[grade]?.[d]?.bch?.bchId;
                      if (id && id !== 'bch-dt') {
                        gradeBCHCounts[id] = (gradeBCHCounts[id] || 0) + 1;
                      }
                    });

                    return activeDayKeys.map((day) => {
                      const slot: BCHSlot = week.grid[grade]?.[day]?.bch || { bchId: undefined, isLocked: false };
                      const bchName = getBCHName(slot.bchId);
                      const isSelected =
                        activeCell?.grade === grade && activeCell?.day === day && activeCell?.type === 'bch';
                      const isDuplicated = slot.bchId && slot.bchId !== 'bch-dt' && (gradeBCHCounts[slot.bchId] || 0) > 1;

                      return (
                        <td
                          key={day}
                          onClick={() => {
                            setStudentErrorMsg(null);
                            setActiveCell({ grade, day, type: 'bch' });
                          }}
                          className={`relative border-r border-gray-400 last:border-r-0 p-1.5 cursor-pointer align-middle transition-colors h-[46px] min-h-[46px] ${bchRowBg} ${
                            isSelected ? 'outline-2 outline-blue-600 z-10' : ''
                          }`}
                        >
                          {/* Lock Icon toggle in top-right */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleLock(grade, day);
                            }}
                            title={slot.isLocked ? 'Đang khóa BCH (Tự động giữ sang tuần tiếp theo và làm mốc tăng tới)' : 'Đang mở (Bấm để khóa BCH và giữ sang tuần sau)'}
                            className={`absolute right-1 top-1 text-[12px] p-0.5 select-none transition-colors ${
                              slot.isLocked ? 'text-amber-700 font-bold bg-amber-200/90 rounded-xs px-1' : 'text-gray-300 hover:text-gray-600'
                            }`}
                          >
                            {slot.isLocked ? '🔒' : '🔓'}
                          </button>

                          {/* Cell text */}
                          <div className="flex items-center justify-center h-full pr-4">
                            {bchName ? (
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`tracking-tight ${
                                    slot.bchId === 'bch-dt'
                                      ? 'font-black text-xs sm:text-sm text-blue-950 bg-blue-100 px-2 py-0.5 rounded-xs border border-blue-400 shadow-2xs'
                                      : 'font-black text-xs sm:text-sm text-gray-950'
                                  }`}
                                >
                                  {bchName}
                                </span>
                                {isDuplicated && (
                                  <span
                                    className="text-[10px] text-red-800 bg-red-100 px-1 font-bold rounded-xs border border-red-300"
                                    title="Lưu ý: Lớp này bị trùng trong tuần!"
                                  >
                                    Trùng
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 font-semibold italic text-xs select-none hover:text-blue-700">
                                - Chọn BCH -
                              </span>
                            )}
                          </div>

                          {/* Dropdown danh sách BCH của khối này */}
                          {isSelected && (
                            <div
                              ref={dropdownRef}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute left-0 top-full mt-1 w-64 bg-white border-2 border-gray-600 shadow-2xl z-30 p-2.5 text-left text-xs"
                            >
                              <div className="flex justify-between items-center pb-2 mb-2 border-b border-gray-300">
                                <span className="font-black text-gray-900 text-xs uppercase tracking-wide">
                                  Chọn BCH {gradeName}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setActiveCell(null)}
                                  className="text-gray-400 hover:text-gray-800 text-sm font-bold px-1"
                                >
                                  ✕
                                </button>
                              </div>

                              <div className="max-h-56 overflow-y-auto space-y-1">
                                {/* Option xóa BCH */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    onUpdateBCHSlot(grade, day, undefined);
                                    setActiveCell(null);
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 text-red-700 font-bold hover:bg-red-50 text-xs border border-dashed border-red-300 mb-1 rounded-xs"
                                >
                                  ✕ Để trống ô này
                                </button>

                                {/* Option chọn BCH ĐT */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    onUpdateBCHSlot(grade, day, 'bch-dt');
                                    setActiveCell(null);
                                  }}
                                  className={`w-full text-left px-2.5 py-2 hover:bg-blue-100 flex items-center justify-between text-xs font-black border border-blue-400 mb-2 rounded-xs shadow-2xs ${
                                    slot.bchId === 'bch-dt' ? 'bg-blue-100 text-blue-950 ring-2 ring-blue-600' : 'bg-blue-50 text-blue-900'
                                  }`}
                                >
                                  <span className="flex items-center gap-1.5">
                                    <span className="text-red-600 text-sm">⭐</span> BCH ĐT (Đoàn Trường)
                                  </span>
                                  {slot.bchId === 'bch-dt' && <span className="text-blue-700 font-black text-sm">✓</span>}
                                </button>

                                <div className="text-[11px] text-gray-700 font-bold px-1 pt-1 pb-0.5 border-t border-gray-200 uppercase">
                                  Các lớp thuộc {gradeName}
                                </div>

                                {/* Danh sách lớp BCH của khối */}
                                {bchList
                                  .filter((b) => b.grade === grade && b.enabled && b.id !== 'bch-dt')
                                  .map((b) => {
                                    const isUsedInOtherDay = activeDayKeys.some(
                                      (d) => d !== day && week.grid[grade]?.[d]?.bch?.bchId === b.id
                                    );

                                    return (
                                      <button
                                        key={b.id}
                                        type="button"
                                        onClick={() => {
                                          onUpdateBCHSlot(grade, day, b.id);
                                          setActiveCell(null);
                                        }}
                                        className={`w-full text-left px-2.5 py-1.5 hover:bg-blue-100 flex items-center justify-between text-xs rounded-xs ${
                                          slot.bchId === b.id
                                            ? 'bg-blue-100 font-black text-blue-950'
                                            : isUsedInOtherDay
                                            ? 'text-gray-500 bg-gray-50'
                                            : 'text-gray-950 font-bold'
                                        }`}
                                      >
                                        <span className="flex items-center gap-1.5">
                                          <span>{b.name}</span>
                                          {isUsedInOtherDay && (
                                            <span className="text-[10px] text-amber-800 bg-amber-100 border border-amber-300 px-1 rounded-2xs font-semibold">
                                              Đã xếp
                                            </span>
                                          )}
                                        </span>
                                        {slot.bchId === b.id && <span className="text-blue-700 font-black text-sm">✓</span>}
                                      </button>
                                    );
                                  })}
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    });
                  })()}
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
