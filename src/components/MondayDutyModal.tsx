import React, { useState } from 'react';
import { MondayDutyClasses, BCHUnit } from '../types';

interface Props {
  dutyClasses?: MondayDutyClasses;
  bchList: BCHUnit[];
  weekNumber: number;
  onSave: (
    duty: MondayDutyClasses,
    applyToNextWeek?: boolean,
    applyToAllFutureWeeks?: boolean
  ) => void;
  onClose: () => void;
}

interface FieldItemProps {
  label: string;
  subLabel?: string;
  icon?: string;
  value: string;
  fieldKey: string;
  onChange: (val: string) => void;
  allClasses: string[];
  isGloballyLocked: boolean;
  isFieldLocked: boolean;
  onToggleLock: () => void;
  placeholder?: string;
  accentColor?: 'indigo' | 'teal' | 'amber' | 'blue';
}

const DutyClassField: React.FC<FieldItemProps> = ({
  label,
  subLabel,
  icon,
  value,
  onChange,
  allClasses,
  isGloballyLocked,
  isFieldLocked,
  onToggleLock,
  placeholder = 'VD: 11C4',
  accentColor = 'indigo',
}) => {
  const isLocked = isGloballyLocked || isFieldLocked;

  const colorStyles = {
    indigo: {
      border: isLocked ? 'border-amber-400 bg-amber-50/40' : 'border-indigo-200 bg-white',
      badge: 'text-indigo-800 bg-indigo-50 border-indigo-200',
    },
    teal: {
      border: isLocked ? 'border-amber-400 bg-amber-50/40' : 'border-teal-200 bg-white',
      badge: 'text-teal-800 bg-teal-50 border-teal-200',
    },
    amber: {
      border: isLocked ? 'border-amber-400 bg-amber-50/40' : 'border-amber-200 bg-white',
      badge: 'text-amber-800 bg-amber-50 border-amber-200',
    },
    blue: {
      border: isLocked ? 'border-amber-400 bg-amber-50/40' : 'border-blue-200 bg-white',
      badge: 'text-blue-800 bg-blue-50 border-blue-200',
    },
  }[accentColor];

  return (
    <div className={`p-2.5 sm:p-3 border rounded-xs shadow-2xs flex flex-col justify-between transition-all ${colorStyles.border}`}>
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <label className="text-xs font-black text-gray-900 flex items-center gap-1.5 truncate">
          {icon && <span>{icon}</span>}
          <span className="truncate">{label}</span>
        </label>
        <div className="flex items-center gap-1 shrink-0">
          {subLabel && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-2xs border hidden sm:inline-block ${colorStyles.badge}`}>
              {subLabel}
            </span>
          )}
          {isLocked && (
            <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-black px-1.5 py-0.5 rounded-2xs">
              🔒 Đã khóa
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-1.5 items-center">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`flex-1 px-2.5 py-1.5 text-xs sm:text-sm font-black border rounded-xs uppercase tracking-wider transition-colors ${
            isLocked
              ? 'border-amber-400 bg-amber-50 text-amber-950 focus:border-amber-600'
              : 'border-gray-400 bg-white text-blue-950 focus:border-indigo-600'
          }`}
        />
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) onChange(e.target.value);
          }}
          className="px-2 py-1.5 text-xs border border-gray-300 rounded-xs bg-gray-100 font-bold hover:bg-gray-200 cursor-pointer"
          title="Chọn nhanh lớp"
        >
          <option value="">Chọn</option>
          {allClasses.map((cls) => (
            <option key={cls} value={cls}>
              {cls}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onToggleLock}
          title={
            isLocked
              ? 'Vị trí này đang bị KHÓA (Bảo lưu sang tuần tiếp theo). Bấm để mở khóa.'
              : 'Bấm để KHÓA riêng vị trí này (Bảo lưu sang tuần tiếp theo).'
          }
          className={`px-2 py-1.5 text-xs font-bold rounded-xs border transition-all flex items-center justify-center shrink-0 cursor-pointer ${
            isLocked
              ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-400 shadow-2xs'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-500 border-gray-300'
          }`}
        >
          <span>{isLocked ? '🔒' : '🔓'}</span>
        </button>
      </div>
    </div>
  );
};

export const MondayDutyModal: React.FC<Props> = ({
  dutyClasses,
  bchList,
  weekNumber,
  onSave,
  onClose,
}) => {
  // Danh sách các lớp thông thường + bổ sung các lớp TX (Thường xuyên)
  const standardClasses = bchList
    .filter((b) => b.id !== 'bch-dt' && b.enabled)
    .map((b) => b.name.replace(/^BCH\s+/i, '').trim());

  const extraClasses = ['10TX', '11TX', '12TX'];
  const allClasses = Array.from(new Set([...standardClasses, ...extraClasses])).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  const [activeTab, setActiveTab] = useState<'all' | 'weekDuty' | 'stairs' | 'stage'>('all');
  const [applyToNextWeek, setApplyToNextWeek] = useState<boolean>(true);
  const [applyToAllFuture, setApplyToAllFuture] = useState<boolean>(false);

  const [formData, setFormData] = useState<MondayDutyClasses>({
    isLocked: dutyClasses?.isLocked ?? true, // Mặc định bật khóa để bảo lưu sang tuần sau theo yêu cầu
    lockedFields: dutyClasses?.lockedFields || {},
    morning: {
      gateDutyClass: dutyClasses?.morning?.gateDutyClass || '12C4',
      stagePrepClass: dutyClasses?.morning?.stagePrepClass || '11C4',
      stageCleanClass: dutyClasses?.morning?.stageCleanClass || '10C4',
    },
    afternoon: {
      gateDutyClass: dutyClasses?.afternoon?.gateDutyClass || '11C5',
      stagePrepClass: dutyClasses?.afternoon?.stagePrepClass || '12C4',
      stageCleanClass: dutyClasses?.afternoon?.stageCleanClass || '10C6',
    },
    weekDuty: {
      morning: dutyClasses?.weekDuty?.morning || '11C4',
      afternoon: dutyClasses?.weekDuty?.afternoon || '10C4',
    },
    stairCleaning: {
      morning: {
        khuA: dutyClasses?.stairCleaning?.morning?.khuA || '12C4',
        khuB_cong: dutyClasses?.stairCleaning?.morning?.khuB_cong || '11C5',
        khuB_thuvien: dutyClasses?.stairCleaning?.morning?.khuB_thuvien || '11C6',
        khuC1: dutyClasses?.stairCleaning?.morning?.khuC1 || '11C4',
        khuD: dutyClasses?.stairCleaning?.morning?.khuD || '11TX',
      },
      afternoon: {
        khuA: dutyClasses?.stairCleaning?.afternoon?.khuA || '12C4',
        khuB_cong: dutyClasses?.stairCleaning?.afternoon?.khuB_cong || '10C6',
        khuB_thuvien: dutyClasses?.stairCleaning?.afternoon?.khuB_thuvien || '10C7',
        khuC1: dutyClasses?.stairCleaning?.afternoon?.khuC1 || '10C4',
        khuD: dutyClasses?.stairCleaning?.afternoon?.khuD || '12TX',
      },
    },
    notes:
      dutyClasses?.notes ||
      'Học sinh có mặt trước giờ quy định 15 phút. Vệ sinh sạch sẽ khu vực cầu thang trước giờ vào lớp.',
  });

  // Toggle Khóa chung toàn bộ
  const handleToggleGlobalLock = () => {
    setFormData((prev) => ({
      ...prev,
      isLocked: !prev.isLocked,
    }));
  };

  // Toggle Khóa từng vị trí cụ thể
  const handleToggleFieldLock = (fieldKey: string) => {
    setFormData((prev) => {
      const nextLockedFields = { ...(prev.lockedFields || {}) };
      if (prev.isLocked) {
        // Nếu đang bật khóa toàn bộ, người dùng bấm nút ổ khóa trên field -> chuyển sang chế độ khóa chọn lọc
        // Đánh dấu tất cả là khóa ngoại trừ field này
        const allKeys = [
          'weekDuty.morning',
          'weekDuty.afternoon',
          'stairCleaning.morning.khuA',
          'stairCleaning.morning.khuB_cong',
          'stairCleaning.morning.khuB_thuvien',
          'stairCleaning.morning.khuC1',
          'stairCleaning.morning.khuD',
          'stairCleaning.afternoon.khuA',
          'stairCleaning.afternoon.khuB_cong',
          'stairCleaning.afternoon.khuB_thuvien',
          'stairCleaning.afternoon.khuC1',
          'stairCleaning.afternoon.khuD',
          'morning.gateDutyClass',
          'morning.stagePrepClass',
          'morning.stageCleanClass',
          'afternoon.gateDutyClass',
          'afternoon.stagePrepClass',
          'afternoon.stageCleanClass',
        ];
        allKeys.forEach((k) => {
          if (k !== fieldKey) nextLockedFields[k] = true;
        });
        return {
          ...prev,
          isLocked: false,
          lockedFields: nextLockedFields,
        };
      }

      if (nextLockedFields[fieldKey]) {
        delete nextLockedFields[fieldKey];
      } else {
        nextLockedFields[fieldKey] = true;
      }
      return {
        ...prev,
        lockedFields: nextLockedFields,
      };
    });
  };

  // Khóa tất cả
  const handleLockAll = () => {
    const allKeys = [
      'weekDuty.morning',
      'weekDuty.afternoon',
      'stairCleaning.morning.khuA',
      'stairCleaning.morning.khuB_cong',
      'stairCleaning.morning.khuB_thuvien',
      'stairCleaning.morning.khuC1',
      'stairCleaning.morning.khuD',
      'stairCleaning.afternoon.khuA',
      'stairCleaning.afternoon.khuB_cong',
      'stairCleaning.afternoon.khuB_thuvien',
      'stairCleaning.afternoon.khuC1',
      'stairCleaning.afternoon.khuD',
      'morning.gateDutyClass',
      'morning.stagePrepClass',
      'morning.stageCleanClass',
      'afternoon.gateDutyClass',
      'afternoon.stagePrepClass',
      'afternoon.stageCleanClass',
    ];
    const newLockedFields: Record<string, boolean> = {};
    allKeys.forEach((k) => (newLockedFields[k] = true));

    setFormData((prev) => ({
      ...prev,
      isLocked: true,
      lockedFields: newLockedFields,
    }));
  };

  // Mở khóa tất cả
  const handleUnlockAll = () => {
    setFormData((prev) => ({
      ...prev,
      isLocked: false,
      lockedFields: {},
    }));
  };

  // Thay đổi trực sân khấu / cổng
  const handleStageChange = (
    session: 'morning' | 'afternoon',
    field: 'gateDutyClass' | 'stagePrepClass' | 'stageCleanClass',
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [session]: {
        ...prev[session],
        [field]: value,
      },
    }));
  };

  // Thay đổi trực tuần
  const handleWeekDutyChange = (session: 'morning' | 'afternoon', value: string) => {
    setFormData((prev) => ({
      ...prev,
      weekDuty: {
        ...prev.weekDuty,
        [session]: value,
      },
    }));
  };

  // Thay đổi vệ sinh cầu thang
  const handleStairCleanChange = (
    session: 'morning' | 'afternoon',
    area: 'khuA' | 'khuB_cong' | 'khuB_thuvien' | 'khuC1' | 'khuD',
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      stairCleaning: {
        ...prev.stairCleaning,
        [session]: {
          ...(prev.stairCleaning?.[session] || {}),
          [area]: value,
        },
      },
    }));
  };

  // Điền đúng dữ liệu mẫu chuẩn theo yêu cầu của người dùng
  const handleApplyStandardSample = () => {
    setFormData((prev) => ({
      ...prev,
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
      notes:
        'Học sinh có mặt trước giờ quy định 15 phút. Vệ sinh sạch sẽ khu vực cầu thang trước giờ vào lớp.',
    }));
  };

  // Gợi ý thông minh luân phiên theo tuần
  const handleQuickSuggest = () => {
    const grade12 = allClasses.filter((c) => c.startsWith('12') && !c.includes('TX'));
    const grade11 = allClasses.filter((c) => c.startsWith('11') && !c.includes('TX'));
    const grade10 = allClasses.filter((c) => c.startsWith('10') && !c.includes('TX'));

    const c12 = grade12[(weekNumber - 1) % (grade12.length || 1)] || '12C4';
    const c11 = grade11[(weekNumber - 1) % (grade11.length || 1)] || '11C4';
    const c10 = grade10[(weekNumber - 1) % (grade10.length || 1)] || '10C4';

    const c11_next = grade11[weekNumber % (grade11.length || 1)] || '11C5';
    const c11_next2 = grade11[(weekNumber + 1) % (grade11.length || 1)] || '11C6';
    const c10_next = grade10[weekNumber % (grade10.length || 1)] || '10C6';
    const c10_next2 = grade10[(weekNumber + 1) % (grade10.length || 1)] || '10C7';

    setFormData((prev) => ({
      ...prev,
      morning: {
        gateDutyClass: c12,
        stagePrepClass: c11,
        stageCleanClass: c10,
      },
      afternoon: {
        gateDutyClass: c11_next,
        stagePrepClass: c12,
        stageCleanClass: c10_next,
      },
      weekDuty: {
        morning: c11,
        afternoon: c10,
      },
      stairCleaning: {
        morning: {
          khuA: c12,
          khuB_cong: c11_next,
          khuB_thuvien: c11_next2,
          khuC1: c11,
          khuD: '11TX',
        },
        afternoon: {
          khuA: c12,
          khuB_cong: c10_next,
          khuB_thuvien: c10_next2,
          khuC1: c10,
          khuD: '12TX',
        },
      },
      notes:
        prev.notes ||
        'Học sinh có mặt trước giờ quy định 15 phút. Vệ sinh sạch sẽ khu vực cầu thang trước giờ vào lớp.',
    }));
  };

  const handleClear = () => {
    setFormData((prev) => ({
      ...prev,
      morning: { gateDutyClass: '', stagePrepClass: '', stageCleanClass: '' },
      afternoon: { gateDutyClass: '', stagePrepClass: '', stageCleanClass: '' },
      weekDuty: { morning: '', afternoon: '' },
      stairCleaning: {
        morning: { khuA: '', khuB_cong: '', khuB_thuvien: '', khuC1: '', khuD: '' },
        afternoon: { khuA: '', khuB_cong: '', khuB_thuvien: '', khuC1: '', khuD: '' },
      },
      notes: '',
    }));
  };

  const handleFormSubmit = (e?: React.FormEvent, forceApplyNext = false) => {
    if (e) e.preventDefault();
    onSave(formData, forceApplyNext || applyToNextWeek, applyToAllFuture);
    onClose();
  };

  const isGloballyLocked = Boolean(formData.isLocked);
  const lockedCount = isGloballyLocked
    ? 18
    : Object.keys(formData.lockedFields || {}).filter((k) => formData.lockedFields?.[k]).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="bg-white border-2 border-gray-800 rounded-xs shadow-2xl max-w-4xl w-full flex flex-col max-h-[94vh] overflow-hidden animate-fade-in">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white border-b border-blue-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🏛️</span>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base uppercase tracking-wide flex items-center gap-2">
                <span>Phân Công Trực Theo Tuần & Vệ Sinh Cầu Thang (Tuần {weekNumber.toString().padStart(2, '0')})</span>
                {isGloballyLocked ? (
                  <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                    🔒 ĐÃ KHÓA
                  </span>
                ) : lockedCount > 0 ? (
                  <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                    🔒 Khóa {lockedCount}/18
                  </span>
                ) : (
                  <span className="bg-gray-700 text-gray-200 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                    🔓 Mở
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-blue-200">
                Trực cổng, Sân khấu, Trực tuần & Vệ sinh cầu thang Sáng - Chiều • Tự động giữ nguyên sang tuần tiếp theo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1 font-black text-lg leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* BANNER THÔNG TIN KHÓA PHÂN CÔNG */}
        <div className="px-4 py-2.5 shrink-0 border-b border-gray-300 bg-slate-50">
          {isGloballyLocked ? (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-500 p-2.5 sm:p-3 rounded-xs flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🔒</span>
                <div>
                  <div className="font-black text-xs sm:text-sm text-emerald-950 uppercase flex items-center gap-2">
                    <span>ĐÃ KHÓA PHÂN CÔNG LỚP TRỰC & VỆ SINH CẦU THANG</span>
                    <span className="bg-emerald-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      Cố định
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                    Các lớp đã được cố định và <strong>tự động giữ nguyên sang Tuần {weekNumber + 1}</strong> và các tuần tiếp theo.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleGlobalLock}
                  className="px-3 py-1 bg-white hover:bg-emerald-100 text-emerald-900 font-black text-xs rounded-xs border border-emerald-400 shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>🔓</span>
                  <span>Mở khóa</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-400 p-2.5 sm:p-3 rounded-xs flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🔓</span>
                <div>
                  <div className="font-black text-xs sm:text-sm text-amber-950 uppercase flex items-center gap-2">
                    <span>CHƯA KHÓA PHÂN CÔNG TOÀN BỘ</span>
                    {lockedCount > 0 && (
                      <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Đang khóa {lockedCount} vị trí
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                    Bấm <strong>"Khóa phân công"</strong> để cố định tất cả lớp và <strong>giữ nguyên sang tuần tiếp theo</strong>.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLockAll}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xs shadow-md transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>🔒</span>
                  <span>Khóa toàn bộ (Giữ sang tuần sau)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Thanh tác vụ nhanh & Lọc Tabs */}
        <div className="px-4 py-2 bg-slate-100 border-b border-gray-300 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          {/* Tabs chuyển đổi góc nhìn */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-blue-800 text-white shadow-2xs'
                  : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              📋 Tất cả
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('weekDuty')}
              className={`px-2.5 py-1 rounded-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'weekDuty'
                  ? 'bg-indigo-700 text-white shadow-2xs'
                  : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              📅 1. Trực tuần
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stairs')}
              className={`px-2.5 py-1 rounded-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'stairs'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              🪜 2. Vệ sinh cầu thang
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stage')}
              className={`px-2.5 py-1 rounded-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'stage'
                  ? 'bg-amber-700 text-white shadow-2xs'
                  : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              🎪 3. Sân khấu & Cổng
            </button>
          </div>

          {/* Phím bấm tác vụ nhanh */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleLockAll}
              className="px-2 py-1 text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-400 rounded-xs transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
              title="Khóa toàn bộ tất cả vị trí"
            >
              <span>🔒</span> Khóa hết
            </button>
            <button
              type="button"
              onClick={handleUnlockAll}
              className="px-2 py-1 text-xs font-bold bg-white hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-xs transition-colors cursor-pointer"
              title="Mở khóa tất cả vị trí"
            >
              <span>🔓</span> Mở hết
            </button>
            <button
              type="button"
              onClick={handleApplyStandardSample}
              className="px-2.5 py-1 text-xs font-black bg-emerald-700 hover:bg-emerald-800 text-white rounded-xs transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
              title="Điền mẫu chuẩn theo yêu cầu: Trực tuần Sáng 11C4, Chiều 10C4; Cầu thang Sáng & Chiều..."
            >
              <span>⚡</span> Mẫu chuẩn (11C4, 10C4)
            </button>
            <button
              type="button"
              onClick={handleQuickSuggest}
              className="px-2 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xs transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
              title="Tự động luân phiên các lớp theo số tuần"
            >
              <span>🔄</span> Luân phiên
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-2 py-1 text-xs font-bold bg-white hover:bg-red-50 text-red-700 border border-red-300 rounded-xs cursor-pointer"
            >
              Xóa trắng
            </button>
          </div>
        </div>

        {/* Nội dung Form Cuộn */}
        <form onSubmit={(e) => handleFormSubmit(e)} className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* PHẦN 1: TRỰC TUẦN (SÁNG & CHIỀU) */}
          {(activeTab === 'all' || activeTab === 'weekDuty') && (
            <div className="border-2 border-indigo-500 bg-indigo-50/40 rounded-xs p-3.5 shadow-2xs">
              <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-indigo-400">
                <div className="flex items-center gap-2 text-indigo-950 font-black text-xs sm:text-sm uppercase tracking-wide">
                  <span className="text-base">📅</span>
                  <span>1. LỚP TRỰC TUẦN (SÁNG & CHIỀU)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-2xs border border-indigo-300">
                    Trực suốt tuần
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <DutyClassField
                  label="Lớp Trực tuần Buổi Sáng"
                  subLabel="Mặc định: 11C4"
                  icon="☀️"
                  value={formData.weekDuty?.morning || ''}
                  fieldKey="weekDuty.morning"
                  onChange={(val) => handleWeekDutyChange('morning', val)}
                  allClasses={allClasses}
                  isGloballyLocked={isGloballyLocked}
                  isFieldLocked={Boolean(formData.lockedFields?.['weekDuty.morning'])}
                  onToggleLock={() => handleToggleFieldLock('weekDuty.morning')}
                  accentColor="indigo"
                />

                <DutyClassField
                  label="Lớp Trực tuần Buổi Chiều"
                  subLabel="Mặc định: 10C4"
                  icon="🌆"
                  value={formData.weekDuty?.afternoon || ''}
                  fieldKey="weekDuty.afternoon"
                  onChange={(val) => handleWeekDutyChange('afternoon', val)}
                  allClasses={allClasses}
                  isGloballyLocked={isGloballyLocked}
                  isFieldLocked={Boolean(formData.lockedFields?.['weekDuty.afternoon'])}
                  onToggleLock={() => handleToggleFieldLock('weekDuty.afternoon')}
                  accentColor="indigo"
                />
              </div>
            </div>
          )}

          {/* PHẦN 2: VỆ SINH CẦU THANG (SÁNG & CHIỀU) */}
          {(activeTab === 'all' || activeTab === 'stairs') && (
            <div className="border-2 border-teal-600 bg-teal-50/40 rounded-xs p-3.5 shadow-2xs">
              <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-teal-500">
                <div className="flex items-center gap-2 text-teal-950 font-black text-xs sm:text-sm uppercase tracking-wide">
                  <span className="text-base">🪜</span>
                  <span>2. PHÂN CÔNG VỆ SINH CẦU THANG (KHU A, B, C1, D)</span>
                </div>
                <span className="text-[11px] font-bold text-teal-900 bg-teal-100 px-2 py-0.5 rounded-2xs border border-teal-300">
                  Sáng & Chiều
                </span>
              </div>

              {/* BUỔI SÁNG */}
              <div className="mb-4">
                <div className="font-black text-xs uppercase text-amber-950 mb-2 flex items-center gap-1.5 pb-1 border-b border-teal-300">
                  <span>☀️ BUỔI SÁNG:</span>
                  <span className="text-gray-600 font-semibold normal-case text-[11px]">
                    (Khu A: 12C4; Khu B cổng: 11C5, thư viện: 11C6; Khu C1: 11C4; Khu D: 11TX)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <DutyClassField
                    label="Khu A"
                    subLabel="12C4"
                    value={formData.stairCleaning?.morning?.khuA || ''}
                    fieldKey="stairCleaning.morning.khuA"
                    onChange={(val) => handleStairCleanChange('morning', 'khuA', val)}
                    allClasses={allClasses}
                    isGloballyLocked={isGloballyLocked}
                    isFieldLocked={Boolean(formData.lockedFields?.['stairCleaning.morning.khuA'])}
                    onToggleLock={() => handleToggleFieldLock('stairCleaning.morning.khuA')}
                    accentColor="teal"
                  />

                  <DutyClassField
                    label="Khu B (phía cổng)"
                    subLabel="11C5"
                    value={formData.stairCleaning?.morning?.khuB_cong || ''}
                    fieldKey="stairCleaning.morning.khuB_cong"
                    onChange={(val) => handleStairCleanChange('morning', 'khuB_cong', val)}
                    allClasses={allClasses}
                    isGloballyLocked={isGloballyLocked}
                    isFieldLocked={Boolean(formData.lockedFields?.['stairCleaning.morning.khuB_cong'])}
                    onToggleLock={() => handleToggleFieldLock('stairCleaning.morning.khuB_cong')}
                    accentColor="teal"
                  />

                  <DutyClassField
                    label="Khu B (gần thư viện)"
                    subLabel="11C6"
                    value={formData.stairCleaning?.morning?.khuB_thuvien || ''}
                    fieldKey="stairCleaning.morning.khuB_thuvien"
                    onChange={(val) => handleStairCleanChange('morning', 'khuB_thuvien', val)}
                    allClasses={allClasses}
                    isGloballyLocked={isGloballyLocked}
                    isFieldLocked={Boolean(formData.lockedFields?.['stairCleaning.morning.khuB_thuvien'])}
                    onToggleLock={() => handleToggleFieldLock('stairCleaning.morning.khuB_thuvien')}
                    accentColor="teal"
                  />

                  <DutyClassField
                    label="Khu C1 (phía cổng)"
                    subLabel="11C4"
                    value={formData.stairCleaning?.morning?.khuC1 || ''}
                    fieldKey="stairCleaning.morning.khuC1"
                    onChange={(val) => handleStairCleanChange('morning', 'khuC1', val)}
                    allClasses={allClasses}
                    isGloballyLocked={isGloballyLocked}
                    isFieldLocked={Boolean(formData.lockedFields?.['stairCleaning.morning.khuC1'])}
                    onToggleLock={() => handleToggleFieldLock('stairCleaning.morning.khuC1')}
                    accentColor="teal"
                  />

                  <DutyClassField
                    label="Khu D"
                    subLabel="11TX"
                    value={formData.stairCleaning?.morning?.khuD || ''}
                    fieldKey="stairCleaning.morning.khuD"
                    onChange={(val) => handleStairCleanChange('morning', 'khuD', val)}
                    allClasses={allClasses}
                    isGloballyLocked={isGloballyLocked}
                    isFieldLocked={Boolean(formData.lockedFields?.['stairCleaning.morning.khuD'])}
                    onToggleLock={() => handleToggleFieldLock('stairCleaning.morning.khuD')}
                    accentColor="teal"
                  />
                </div>
              </div>

              {/* BUỔI CHIỀU */}
              <div>
                <div className="font-black text-xs uppercase text-indigo-950 mb-2 flex items-center gap-1.5 pb-1 border-b border-teal-300">
                  <span>🌆 BUỔI CHIỀU:</span>
                  <span className="text-gray-600 font-semibold normal-case text-[11px]">
                    (Khu A: 12C4; Khu B cổng: 10C6, thư viện: 10C7; Khu C1: 10C4; Khu D: 12TX)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <DutyClassField
                    label="Khu A"
                    subLabel="12C4"
                    value={formData.stairCleaning?.afternoon?.khuA || ''}
                    fieldKey="stairCleaning.afternoon.khuA"
                    onChange={(val) => handleStairCleanChange('afternoon', 'khuA', val)}
                    allClasses={allClasses}
                    isGloballyLocked={isGloballyLocked}
                    isFieldLocked={Boolean(formData.lockedFields?.['stairCleaning.afternoon.khuA'])}
                    onToggleLock={() => handleToggleFieldLock('stairCleaning.afternoon.khuA')}
                    accentColor="teal"
                  />

                  <DutyClassField
                    label="Khu B (phía cổng)"
                    subLabel="10C6"
                    value={formData.stairCleaning?.afternoon?.khuB_cong || ''}
                    fieldKey="stairCleaning.afternoon.khuB_cong"
                    onChange={(val) => handleStairCleanChange('afternoon', 'khuB_cong', val)}
                    allClasses={allClasses}
                    isGloballyLocked={isGloballyLocked}
                    isFieldLocked={Boolean(formData.lockedFields?.['stairCleaning.afternoon.khuB_cong'])}
                    onToggleLock={() => handleToggleFieldLock('stairCleaning.afternoon.khuB_cong')}
                    accentColor="teal"
                  />

                  <DutyClassField
                    label="Khu B (gần thư viện)"
                    subLabel="10C7"
                    value={formData.stairCleaning?.afternoon?.khuB_thuvien || ''}
                    fieldKey="stairCleaning.afternoon.khuB_thuvien"
                    onChange={(val) => handleStairCleanChange('afternoon', 'khuB_thuvien', val)}
                    allClasses={allClasses}
                    isGloballyLocked={isGloballyLocked}
                    isFieldLocked={Boolean(formData.lockedFields?.['stairCleaning.afternoon.khuB_thuvien'])}
                    onToggleLock={() => handleToggleFieldLock('stairCleaning.afternoon.khuB_thuvien')}
                    accentColor="teal"
                  />

                  <DutyClassField
                    label="Khu C1"
                    subLabel="10C4"
                    value={formData.stairCleaning?.afternoon?.khuC1 || ''}
                    fieldKey="stairCleaning.afternoon.khuC1"
                    onChange={(val) => handleStairCleanChange('afternoon', 'khuC1', val)}
                    allClasses={allClasses}
                    isGloballyLocked={isGloballyLocked}
                    isFieldLocked={Boolean(formData.lockedFields?.['stairCleaning.afternoon.khuC1'])}
                    onToggleLock={() => handleToggleFieldLock('stairCleaning.afternoon.khuC1')}
                    accentColor="teal"
                  />

                  <DutyClassField
                    label="Khu D"
                    subLabel="12TX"
                    value={formData.stairCleaning?.afternoon?.khuD || ''}
                    fieldKey="stairCleaning.afternoon.khuD"
                    onChange={(val) => handleStairCleanChange('afternoon', 'khuD', val)}
                    allClasses={allClasses}
                    isGloballyLocked={isGloballyLocked}
                    isFieldLocked={Boolean(formData.lockedFields?.['stairCleaning.afternoon.khuD'])}
                    onToggleLock={() => handleToggleFieldLock('stairCleaning.afternoon.khuD')}
                    accentColor="teal"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PHẦN 3: CỔNG & SÂN KHẤU (SÁNG & CHIỀU) */}
          {(activeTab === 'all' || activeTab === 'stage') && (
            <div className="border-2 border-amber-500 bg-amber-50/40 rounded-xs p-3.5 shadow-2xs">
              <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-amber-400">
                <div className="flex items-center gap-2 text-amber-950 font-black text-xs sm:text-sm uppercase tracking-wide">
                  <span className="text-base">🎪</span>
                  <span>3. TRỰC CỔNG, CHUẨN BỊ & DỌN DẸP SÂN KHẤU THỨ HAI</span>
                </div>
                <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-2xs border border-amber-300">
                  SHDC Thứ Hai
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sáng */}
                <div className="bg-white/90 p-3 border border-amber-300 rounded-xs shadow-2xs space-y-3">
                  <div className="font-black text-amber-900 flex items-center gap-1 uppercase text-xs pb-1 border-b border-amber-200">
                    <span>☀️ Buổi Sáng</span>
                  </div>

                  <DutyClassField
                    label="1. Trực cổng"
                    subLabel="Mặc định: 12C4"
                    value={formData.morning?.gateDutyClass || ''}
                    fieldKey="morning.gateDutyClass"
                    onChange={(val) => handleStageChange('morning', 'gateDutyClass', val)}
                    allClasses={allClasses}
                    isGloballyLocked={isGloballyLocked}
                    isFieldLocked={Boolean(formData.lockedFields?.['morning.gateDutyClass'])}
                    onToggleLock={() => handleToggleFieldLock('morning.gateDutyClass')}
                    accentColor="amber"
                  />

                  <DutyClassField
                    label="2. Chuẩn bị sân khấu"
                    subLabel="Mặc định: 11C4"
                    value={formData.morning?.stagePrepClass || ''}
                    fieldKey="morning.stagePrepClass"
                    onChange={(val) => handleStageChange('morning', 'stagePrepClass', val)}
                    allClasses={allClasses}
                    isGloballyLocked={isGloballyLocked}
                    isFieldLocked={Boolean(formData.lockedFields?.['morning.stagePrepClass'])}
                    onToggleLock={() => handleToggleFieldLock('morning.stagePrepClass')}
                    accentColor="amber"
                  />

                  <DutyClassField
                    label="3. Dọn dẹp sân khấu"
                    subLabel="Mặc định: 10C4"
                    value={formData.morning?.stageCleanClass || ''}
                    fieldKey="morning.stageCleanClass"
                    onChange={(val) => handleStageChange('morning', 'stageCleanClass', val)}
                    allClasses={allClasses}
                    isGloballyLocked={isGloballyLocked}
                    isFieldLocked={Boolean(formData.lockedFields?.['morning.stageCleanClass'])}
                    onToggleLock={() => handleToggleFieldLock('morning.stageCleanClass')}
                    accentColor="amber"
                  />
                </div>

                {/* Chiều */}
                <div className="bg-white/90 p-3 border border-indigo-300 rounded-xs shadow-2xs space-y-3">
                  <div className="font-black text-indigo-900 flex items-center gap-1 uppercase text-xs pb-1 border-b border-indigo-200">
                    <span>🌆 Buổi Chiều</span>
                  </div>

                  <DutyClassField
                    label="1. Trực cổng"
                    subLabel="Mặc định: 11C5"
                    value={formData.afternoon?.gateDutyClass || ''}
                    fieldKey="afternoon.gateDutyClass"
                    onChange={(val) => handleStageChange('afternoon', 'gateDutyClass', val)}
                    allClasses={allClasses}
                    isGloballyLocked={isGloballyLocked}
                    isFieldLocked={Boolean(formData.lockedFields?.['afternoon.gateDutyClass'])}
                    onToggleLock={() => handleToggleFieldLock('afternoon.gateDutyClass')}
                    accentColor="blue"
                  />

                  <DutyClassField
                    label="2. Chuẩn bị sân khấu"
                    subLabel="Mặc định: 12C4"
                    value={formData.afternoon?.stagePrepClass || ''}
                    fieldKey="afternoon.stagePrepClass"
                    onChange={(val) => handleStageChange('afternoon', 'stagePrepClass', val)}
                    allClasses={allClasses}
                    isGloballyLocked={isGloballyLocked}
                    isFieldLocked={Boolean(formData.lockedFields?.['afternoon.stagePrepClass'])}
                    onToggleLock={() => handleToggleFieldLock('afternoon.stagePrepClass')}
                    accentColor="blue"
                  />

                  <DutyClassField
                    label="3. Dọn dẹp sân khấu"
                    subLabel="Mặc định: 10C6"
                    value={formData.afternoon?.stageCleanClass || ''}
                    fieldKey="afternoon.stageCleanClass"
                    onChange={(val) => handleStageChange('afternoon', 'stageCleanClass', val)}
                    allClasses={allClasses}
                    isGloballyLocked={isGloballyLocked}
                    isFieldLocked={Boolean(formData.lockedFields?.['afternoon.stageCleanClass'])}
                    onToggleLock={() => handleToggleFieldLock('afternoon.stageCleanClass')}
                    accentColor="blue"
                  />
                </div>
              </div>
            </div>
          )}

          {/* GHI CHÚ / YÊU CẦU */}
          <div className="bg-slate-50 border border-gray-300 p-3 rounded-xs">
            <label className="block text-xs font-bold text-gray-800 mb-1">
              📝 Ghi chú / Lời dặn đối với các lớp thực hiện nhiệm vụ:
            </label>
            <input
              type="text"
              placeholder="VD: Học sinh có mặt trước giờ quy định 15 phút. Vệ sinh sạch sẽ khu vực cầu thang..."
              value={formData.notes || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 text-xs font-medium border border-gray-400 rounded-xs bg-white text-gray-900 focus:outline-hidden focus:border-blue-600"
            />
          </div>

          {/* CÁC TÙY CHỌN BẢO LƯU / GIỮ NGUYÊN SANG TUẦN TIẾP THEO */}
          <div className="p-3 bg-amber-50/70 border border-amber-300 rounded-xs space-y-2 text-xs">
            <div className="font-bold text-amber-950 uppercase flex items-center gap-1.5">
              <span>🔒</span>
              <span>Tùy chọn Khóa lớp trực & Bảo lưu sang các tuần tiếp theo:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-800 font-medium">
              <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-xs border border-amber-200 hover:bg-amber-100/50">
                <input
                  type="checkbox"
                  checked={Boolean(formData.isLocked)}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isLocked: e.target.checked }))}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <span>
                  <strong>Khóa phân công này</strong> (tự động giữ nguyên khi chuyển tuần)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-xs border border-amber-200 hover:bg-amber-100/50">
                <input
                  type="checkbox"
                  checked={applyToNextWeek}
                  onChange={(e) => setApplyToNextWeek(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span>
                  Đồng thời sao chép sang <strong>Tuần {weekNumber + 1}</strong> ngay
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-xs border border-amber-200 hover:bg-amber-100/50 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={applyToAllFuture}
                  onChange={(e) => setApplyToAllFuture(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                />
                <span>
                  Áp dụng & giữ nguyên cho <strong>tất cả các tuần đã tạo tiếp theo</strong> trong học kỳ
                </span>
              </label>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-300">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleFormSubmit(undefined, true)}
                className="px-3.5 py-2 text-xs font-black bg-indigo-700 hover:bg-indigo-800 text-white rounded-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                title={`Lưu và lập tức giữ nguyên sang Tuần ${weekNumber + 1}`}
              >
                <span>⏩</span>
                <span>Lưu & Giữ nguyên sang Tuần {weekNumber + 1}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xs transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-black bg-blue-700 hover:bg-blue-800 text-white rounded-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>💾</span>
                <span>Lưu phân công</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
