import React from 'react';
import { WeekSchedule } from '../types';

interface Props {
  week: WeekSchedule;
  weekNumber: number;
  onOpenModal: () => void;
  onToggleLock: () => void;
  onApplyToNextWeek: () => void;
}

export const WeeklyDutySection: React.FC<Props> = ({
  week,
  weekNumber,
  onOpenModal,
  onToggleLock,
  onApplyToNextWeek,
}) => {
  const isDutyLocked = Boolean(week.mondayDutyClasses?.isLocked);
  const isFieldLocked = (fieldKey: string) =>
    isDutyLocked || Boolean(week.mondayDutyClasses?.lockedFields?.[fieldKey]);

  const duty = week.mondayDutyClasses;

  return (
    <div className="bg-white border-2 border-indigo-900 shadow-md rounded-xs overflow-hidden mb-4 animate-fade-in">
      {/* Tiêu đề thanh tác vụ */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xl">🏛️</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-xs sm:text-sm uppercase tracking-wide">
                PHÂN CÔNG TRỰC THEO TUẦN (SÁNG & CHIỀU THỨ HAI)
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
            <p className="text-[11px] text-blue-200 mt-0.5">
              Nhiệm vụ trực cổng trường, chuẩn bị sân khấu và dọn dẹp sân khấu các buổi sáng & chiều Thứ Hai
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
            <span>{isDutyLocked ? '🔓 Mở khóa' : '🔒 Khóa lớp trực'}</span>
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
            className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs rounded-xs shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>✏️</span>
            <span>Chỉnh sửa chi tiết</span>
          </button>
        </div>
      </div>

      {/* Nội dung bảng phân công trực theo tuần */}
      <div className="p-3 sm:p-4 bg-slate-50 space-y-4">
        {/* LỚP TRỰC TUẦN (XUYÊN SUỐT) */}
        <div className="bg-indigo-50/80 border-2 border-indigo-400 rounded-xs p-3 shadow-2xs">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-indigo-300">
            <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-indigo-950 uppercase tracking-wide">
              <span>📅</span>
              <span>LỚP TRỰC TUẦN (PHÂN CÔNG XUYÊN SUỐT CẢ TUẦN)</span>
            </div>
            <span className="text-[11px] font-semibold text-indigo-800 bg-white px-2 py-0.5 rounded-2xs border border-indigo-200">
              Thực hiện cả tuần
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="bg-white p-3 rounded-xs border border-indigo-200 shadow-2xs flex items-center justify-between">
              <span className="font-bold text-gray-800 flex items-center gap-1.5">
                <span className="text-amber-600 font-extrabold">☀️</span> Buổi Sáng:
              </span>
              <span className="bg-indigo-100 text-indigo-950 px-3 py-1 rounded-xs border border-indigo-300 font-black text-sm flex items-center gap-1">
                <span>Lớp {duty?.weekDuty?.morning || '---'}</span>
                {isFieldLocked('weekDuty.morning') && <span title="Đã khóa">🔒</span>}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xs border border-indigo-200 shadow-2xs flex items-center justify-between">
              <span className="font-bold text-gray-800 flex items-center gap-1.5">
                <span className="text-indigo-600 font-extrabold">🌆</span> Buổi Chiều:
              </span>
              <span className="bg-indigo-100 text-indigo-950 px-3 py-1 rounded-xs border border-indigo-300 font-black text-sm flex items-center gap-1">
                <span>Lớp {duty?.weekDuty?.afternoon || '---'}</span>
                {isFieldLocked('weekDuty.afternoon') && <span title="Đã khóa">🔒</span>}
              </span>
            </div>
          </div>
        </div>

        {/* 2 CỘT BUỔI SÁNG & BUỔI CHIỀU (CỔNG & SÂN KHẤU) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* BUỔI SÁNG */}
          <div className="bg-white border-2 border-amber-400 rounded-xs p-3.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b-2 border-amber-300">
              <div className="flex items-center gap-1.5 font-black text-xs sm:text-sm text-amber-950 uppercase tracking-wide">
                <span>☀️</span>
                <span>BUỔI SÁNG THỨ HAI (CỔNG & SÂN KHẤU)</span>
              </div>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-2xs border border-amber-300">
                SHDC Buổi Sáng
              </span>
            </div>

            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-center justify-between p-2 bg-blue-50/70 border border-blue-200 rounded-xs">
                <span className="font-bold text-gray-800 flex items-center gap-1.5">
                  <span className="font-black text-blue-800">1.</span> Trực cổng:
                </span>
                <span className="font-black text-blue-950 bg-white px-2.5 py-0.5 rounded-xs border border-blue-300 flex items-center gap-1">
                  <span>{duty?.morning?.gateDutyClass ? `Lớp ${duty.morning.gateDutyClass}` : 'Chưa phân công'}</span>
                  {isFieldLocked('morning.gateDutyClass') && <span>🔒</span>}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-amber-50/70 border border-amber-200 rounded-xs">
                <span className="font-bold text-gray-800 flex items-center gap-1.5">
                  <span className="font-black text-amber-800">2.</span> Chuẩn bị sân khấu:
                </span>
                <span className="font-black text-amber-950 bg-white px-2.5 py-0.5 rounded-xs border border-amber-300 flex items-center gap-1">
                  <span>{duty?.morning?.stagePrepClass ? `Lớp ${duty.morning.stagePrepClass}` : 'Chưa phân công'}</span>
                  {isFieldLocked('morning.stagePrepClass') && <span>🔒</span>}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-emerald-50/70 border border-emerald-200 rounded-xs">
                <span className="font-bold text-gray-800 flex items-center gap-1.5">
                  <span className="font-black text-emerald-800">3.</span> Dọn dẹp sân khấu:
                </span>
                <span className="font-black text-emerald-950 bg-white px-2.5 py-0.5 rounded-xs border border-emerald-300 flex items-center gap-1">
                  <span>{duty?.morning?.stageCleanClass ? `Lớp ${duty.morning.stageCleanClass}` : 'Chưa phân công'}</span>
                  {isFieldLocked('morning.stageCleanClass') && <span>🔒</span>}
                </span>
              </div>
            </div>
          </div>

          {/* BUỔI CHIỀU */}
          <div className="bg-white border-2 border-indigo-400 rounded-xs p-3.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b-2 border-indigo-300">
              <div className="flex items-center gap-1.5 font-black text-xs sm:text-sm text-indigo-950 uppercase tracking-wide">
                <span>🌆</span>
                <span>BUỔI CHIỀU THỨ HAI (CỔNG & SÂN KHẤU)</span>
              </div>
              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded-2xs border border-indigo-300">
                SHDC Buổi Chiều
              </span>
            </div>

            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-center justify-between p-2 bg-blue-50/70 border border-blue-200 rounded-xs">
                <span className="font-bold text-gray-800 flex items-center gap-1.5">
                  <span className="font-black text-blue-800">1.</span> Trực cổng:
                </span>
                <span className="font-black text-blue-950 bg-white px-2.5 py-0.5 rounded-xs border border-blue-300 flex items-center gap-1">
                  <span>{duty?.afternoon?.gateDutyClass ? `Lớp ${duty.afternoon.gateDutyClass}` : 'Chưa phân công'}</span>
                  {isFieldLocked('afternoon.gateDutyClass') && <span>🔒</span>}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-amber-50/70 border border-amber-200 rounded-xs">
                <span className="font-bold text-gray-800 flex items-center gap-1.5">
                  <span className="font-black text-amber-800">2.</span> Chuẩn bị sân khấu:
                </span>
                <span className="font-black text-amber-950 bg-white px-2.5 py-0.5 rounded-xs border border-amber-300 flex items-center gap-1">
                  <span>{duty?.afternoon?.stagePrepClass ? `Lớp ${duty.afternoon.stagePrepClass}` : 'Chưa phân công'}</span>
                  {isFieldLocked('afternoon.stagePrepClass') && <span>🔒</span>}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-emerald-50/70 border border-emerald-200 rounded-xs">
                <span className="font-bold text-gray-800 flex items-center gap-1.5">
                  <span className="font-black text-emerald-800">3.</span> Dọn dẹp sân khấu:
                </span>
                <span className="font-black text-emerald-950 bg-white px-2.5 py-0.5 rounded-xs border border-emerald-300 flex items-center gap-1">
                  <span>{duty?.afternoon?.stageCleanClass ? `Lớp ${duty.afternoon.stageCleanClass}` : 'Chưa phân công'}</span>
                  {isFieldLocked('afternoon.stageCleanClass') && <span>🔒</span>}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* GHI CHÚ */}
        {duty?.notes && (
          <div className="p-2.5 bg-blue-50 border border-blue-300 rounded-xs text-xs font-semibold text-blue-950 flex items-center gap-2">
            <span className="text-base">📌</span>
            <span>
              <strong>Ghi chú:</strong> {duty.notes}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
