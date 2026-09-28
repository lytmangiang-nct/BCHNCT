import React from 'react';
import { WeekSchedule } from '../types';

interface Props {
  week: WeekSchedule;
  weekNumber: number;
  onOpenModal: () => void;
  onToggleLock: () => void;
  onApplyToNextWeek: () => void;
}

export const StairCleaningSection: React.FC<Props> = ({
  week,
  weekNumber,
  onOpenModal,
  onToggleLock,
  onApplyToNextWeek,
}) => {
  const isDutyLocked = Boolean(week.mondayDutyClasses?.isLocked);
  const isFieldLocked = (fieldKey: string) =>
    isDutyLocked || Boolean(week.mondayDutyClasses?.lockedFields?.[fieldKey]);

  const stairs = week.mondayDutyClasses?.stairCleaning;

  return (
    <div className="bg-white border-2 border-teal-800 shadow-md rounded-xs overflow-hidden mb-4 animate-fade-in">
      {/* Tiêu đề thanh tác vụ */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xl">🪜</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-xs sm:text-sm uppercase tracking-wide">
                PHÂN CÔNG VỆ SINH CẦU THANG (KHU A, B, C1, D)
              </h3>
              {isDutyLocked ? (
                <span className="bg-emerald-100 text-emerald-950 border border-emerald-400 font-black text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                  <span>🔒</span>
                  <span>ĐÃ KHÓA (Tự động giữ sang tuần sau)</span>
                </span>
              ) : (
                <span className="bg-amber-100 text-amber-950 border border-amber-300 font-bold text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span>🔓</span>
                  <span>Chưa khóa toàn bộ</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-teal-200 mt-0.5">
              Phân công lớp trực phụ trách vệ sinh cầu thang các khu vực Sáng & Chiều
            </p>
          </div>
        </div>

        {/* Các nút bấm chức năng */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={onToggleLock}
            className={`px-3 py-1.5 text-xs font-black rounded-xs border shadow-2xs transition-colors flex items-center gap-1 cursor-pointer ${
              isDutyLocked
                ? 'bg-white hover:bg-emerald-50 text-emerald-900 border-emerald-400'
                : 'bg-amber-300 hover:bg-amber-400 text-amber-950 border-amber-500'
            }`}
            title={
              isDutyLocked
                ? 'Bấm để mở khóa phân công'
                : 'Khóa phân công này và tự động giữ nguyên sang tuần tiếp theo'
            }
          >
            <span>{isDutyLocked ? '🔓 Mở khóa' : '🔒 Khóa phân công'}</span>
          </button>

          <button
            type="button"
            onClick={onApplyToNextWeek}
            className="px-3 py-1.5 text-xs font-black bg-indigo-700 hover:bg-indigo-800 text-white rounded-xs shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
            title={`Khóa và giữ nguyên phân công sang Tuần ${weekNumber + 1}`}
          >
            <span>⏩</span>
            <span>Giữ sang Tuần {weekNumber + 1}</span>
          </button>

          <button
            type="button"
            onClick={onOpenModal}
            className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-black text-xs rounded-xs shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>✏️</span>
            <span>Chỉnh sửa chi tiết</span>
          </button>
        </div>
      </div>

      {/* Nội dung phân công 2 buổi: Sáng & Chiều */}
      <div className="p-3 sm:p-4 bg-slate-50 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* BUỔI SÁNG */}
          <div className="bg-white border-2 border-teal-500 rounded-xs p-3.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b-2 border-teal-300">
              <div className="flex items-center gap-1.5 font-black text-xs sm:text-sm text-teal-950 uppercase tracking-wide">
                <span className="text-amber-600">☀️</span>
                <span>BUỔI SÁNG (5 KHU VỰC CẦU THANG)</span>
              </div>
              <span className="text-[10px] font-bold bg-teal-100 text-teal-900 px-2 py-0.5 rounded-2xs border border-teal-300">
                Ca Sáng
              </span>
            </div>

            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-center justify-between p-2 bg-teal-50/60 border border-teal-200 rounded-xs">
                <span className="font-bold text-gray-800">1. Cầu thang Khu A:</span>
                <span className="font-black text-teal-950 bg-white px-2.5 py-0.5 rounded-xs border border-teal-300 flex items-center gap-1">
                  <span>{stairs?.morning?.khuA ? `Lớp ${stairs.morning.khuA}` : '---'}</span>
                  {isFieldLocked('stairCleaning.morning.khuA') && <span>🔒</span>}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-teal-50/60 border border-teal-200 rounded-xs">
                <span className="font-bold text-gray-800">2. Khu B (phía cổng):</span>
                <span className="font-black text-teal-950 bg-white px-2.5 py-0.5 rounded-xs border border-teal-300 flex items-center gap-1">
                  <span>{stairs?.morning?.khuB_cong ? `Lớp ${stairs.morning.khuB_cong}` : '---'}</span>
                  {isFieldLocked('stairCleaning.morning.khuB_cong') && <span>🔒</span>}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-teal-50/60 border border-teal-200 rounded-xs">
                <span className="font-bold text-gray-800">3. Khu B (gần thư viện):</span>
                <span className="font-black text-teal-950 bg-white px-2.5 py-0.5 rounded-xs border border-teal-300 flex items-center gap-1">
                  <span>{stairs?.morning?.khuB_thuvien ? `Lớp ${stairs.morning.khuB_thuvien}` : '---'}</span>
                  {isFieldLocked('stairCleaning.morning.khuB_thuvien') && <span>🔒</span>}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-teal-50/60 border border-teal-200 rounded-xs">
                <span className="font-bold text-gray-800">4. Khu C1 (phía cổng):</span>
                <span className="font-black text-teal-950 bg-white px-2.5 py-0.5 rounded-xs border border-teal-300 flex items-center gap-1">
                  <span>{stairs?.morning?.khuC1 ? `Lớp ${stairs.morning.khuC1}` : '---'}</span>
                  {isFieldLocked('stairCleaning.morning.khuC1') && <span>🔒</span>}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-teal-50/60 border border-teal-200 rounded-xs">
                <span className="font-bold text-gray-800">5. Khu D:</span>
                <span className="font-black text-teal-950 bg-white px-2.5 py-0.5 rounded-xs border border-teal-300 flex items-center gap-1">
                  <span>{stairs?.morning?.khuD ? `Lớp ${stairs.morning.khuD}` : '---'}</span>
                  {isFieldLocked('stairCleaning.morning.khuD') && <span>🔒</span>}
                </span>
              </div>
            </div>
          </div>

          {/* BUỔI CHIỀU */}
          <div className="bg-white border-2 border-indigo-500 rounded-xs p-3.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b-2 border-indigo-300">
              <div className="flex items-center gap-1.5 font-black text-xs sm:text-sm text-indigo-950 uppercase tracking-wide">
                <span className="text-indigo-600">🌆</span>
                <span>BUỔI CHIỀU (5 KHU VỰC CẦU THANG)</span>
              </div>
              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded-2xs border border-indigo-300">
                Ca Chiều
              </span>
            </div>

            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-center justify-between p-2 bg-indigo-50/60 border border-indigo-200 rounded-xs">
                <span className="font-bold text-gray-800">1. Cầu thang Khu A:</span>
                <span className="font-black text-indigo-950 bg-white px-2.5 py-0.5 rounded-xs border border-indigo-300 flex items-center gap-1">
                  <span>{stairs?.afternoon?.khuA ? `Lớp ${stairs.afternoon.khuA}` : '---'}</span>
                  {isFieldLocked('stairCleaning.afternoon.khuA') && <span>🔒</span>}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-indigo-50/60 border border-indigo-200 rounded-xs">
                <span className="font-bold text-gray-800">2. Khu B (phía cổng):</span>
                <span className="font-black text-indigo-950 bg-white px-2.5 py-0.5 rounded-xs border border-indigo-300 flex items-center gap-1">
                  <span>{stairs?.afternoon?.khuB_cong ? `Lớp ${stairs.afternoon.khuB_cong}` : '---'}</span>
                  {isFieldLocked('stairCleaning.afternoon.khuB_cong') && <span>🔒</span>}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-indigo-50/60 border border-indigo-200 rounded-xs">
                <span className="font-bold text-gray-800">3. Khu B (gần thư viện):</span>
                <span className="font-black text-indigo-950 bg-white px-2.5 py-0.5 rounded-xs border border-indigo-300 flex items-center gap-1">
                  <span>{stairs?.afternoon?.khuB_thuvien ? `Lớp ${stairs.afternoon.khuB_thuvien}` : '---'}</span>
                  {isFieldLocked('stairCleaning.afternoon.khuB_thuvien') && <span>🔒</span>}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-indigo-50/60 border border-indigo-200 rounded-xs">
                <span className="font-bold text-gray-800">4. Khu C1 (phía cổng):</span>
                <span className="font-black text-indigo-950 bg-white px-2.5 py-0.5 rounded-xs border border-indigo-300 flex items-center gap-1">
                  <span>{stairs?.afternoon?.khuC1 ? `Lớp ${stairs.afternoon.khuC1}` : '---'}</span>
                  {isFieldLocked('stairCleaning.afternoon.khuC1') && <span>🔒</span>}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-indigo-50/60 border border-indigo-200 rounded-xs">
                <span className="font-bold text-gray-800">5. Khu D:</span>
                <span className="font-black text-indigo-950 bg-white px-2.5 py-0.5 rounded-xs border border-indigo-300 flex items-center gap-1">
                  <span>{stairs?.afternoon?.khuD ? `Lớp ${stairs.afternoon.khuD}` : '---'}</span>
                  {isFieldLocked('stairCleaning.afternoon.khuD') && <span>🔒</span>}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* LƯU Ý VỆ SINH */}
        <div className="p-2.5 bg-teal-50 border border-teal-300 rounded-xs text-xs font-semibold text-teal-950 flex items-center gap-2">
          <span className="text-base">🧹</span>
          <span>
            <strong>Quy định:</strong> Các lớp được phân công có mặt trước giờ quy định 15 phút, vệ sinh sạch sẽ khu vực cầu thang trước giờ vào lớp.
          </span>
        </div>
      </div>
    </div>
  );
};
