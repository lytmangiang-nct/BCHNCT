import React, { useState, useRef } from 'react';
import { WeekSchedule, BCHUnit, SupportStudent, SHDCLocationConfig, PrintContentFilter } from '../types';
import { PrintPreview } from './PrintPreview';
import { exportToImage, exportToPDF } from '../utils/exportUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  week: WeekSchedule;
  bchList: BCHUnit[];
  students: SupportStudent[];
  shdcLocations?: SHDCLocationConfig[];
  schoolName: string;
  secretaryName: string;
  includeSaturday?: boolean;
}

export const ExportPreviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  week,
  bchList,
  students,
  shdcLocations,
  schoolName,
  secretaryName,
  includeSaturday = false,
}) => {
  const [isExporting, setIsExporting] = useState<'image' | 'pdf' | null>(null);
  const [contentFilter, setContentFilter] = useState<PrintContentFilter>('all');
  const [showNationalHeader, setShowNationalHeader] = useState<boolean>(true);
  const contentRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const fileNameBase = `Lich_Truc_Tuan_${week.weekNumber.toString().padStart(2, '0')}_THPT_Nguyen_Chi_Thanh`;

  const handleExportImage = async () => {
    const el = document.getElementById('export-modal-document');
    if (!el) return;
    try {
      setIsExporting('image');
      await exportToImage(el, `${fileNameBase}.png`);
    } catch (err) {
      console.error('Lỗi xuất hình ảnh:', err);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPDF = async () => {
    const el = document.getElementById('export-modal-document');
    if (!el) return;
    try {
      setIsExporting('pdf');
      await exportToPDF(el, `${fileNameBase}.pdf`);
    } catch (err) {
      console.error('Lỗi xuất PDF:', err);
    } finally {
      setIsExporting(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border-2 border-gray-800 shadow-2xl w-[96%] max-w-[1400px] max-h-[92vh] flex flex-col rounded-xs">
        {/* Header modal */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gray-900 text-white border-b border-gray-700">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base uppercase tracking-wide flex items-center gap-2">
              <span>📄</span> Xem trước & Xuất Lịch Trực (Tuần {week.weekNumber.toString().padStart(2, '0')})
            </h3>
            <p className="text-[11px] text-gray-300 mt-0.5">
              Đã tự động loại bỏ toàn bộ biểu tượng khóa • Giao diện to rõ, độ tương phản cao
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportImage}
              disabled={isExporting !== null}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span>🖼️</span>
              {isExporting === 'image' ? 'Đang tạo ảnh...' : 'Tải file ảnh (PNG)'}
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExporting !== null}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold rounded-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span>📑</span>
              {isExporting === 'pdf' ? 'Đang tạo PDF...' : 'Tải file PDF (A4 Dọc)'}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span>🖨️</span> In trực tiếp
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 hover:text-white text-xs font-bold rounded-xs ml-1"
            >
              ✕ Đóng
            </button>
          </div>
        </div>

        {/* Thanh radio button chọn nội dung hiển thị trong bản in / xuất */}
        <div className="bg-slate-800 text-white px-4 py-2 border-b border-slate-700 text-xs flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-amber-400 font-bold">🔘 Chọn nội dung in / xuất:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer bg-slate-900/60 hover:bg-slate-700/80 px-2 py-1 rounded-2xs border border-slate-600">
              <input
                type="radio"
                name="printFilter"
                value="all"
                checked={contentFilter === 'all'}
                onChange={() => setContentFilter('all')}
                className="cursor-pointer accent-emerald-500 w-3.5 h-3.5"
              />
              <span className={`font-semibold ${contentFilter === 'all' ? 'text-emerald-300 font-black' : 'text-gray-300'}`}>
                Toàn bộ nội dung
              </span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer bg-slate-900/60 hover:bg-slate-700/80 px-2 py-1 rounded-2xs border border-slate-600">
              <input
                type="radio"
                name="printFilter"
                value="grid_only"
                checked={contentFilter === 'grid_only'}
                onChange={() => setContentFilter('grid_only')}
                className="cursor-pointer accent-emerald-500 w-3.5 h-3.5"
              />
              <span className={`font-semibold ${contentFilter === 'grid_only' ? 'text-emerald-300 font-black' : 'text-gray-300'}`}>
                Chỉ Lịch tuần (K10, 11, 12)
              </span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer bg-slate-900/60 hover:bg-slate-700/80 px-2 py-1 rounded-2xs border border-slate-600">
              <input
                type="radio"
                name="printFilter"
                value="monday_duty_only"
                checked={contentFilter === 'monday_duty_only'}
                onChange={() => setContentFilter('monday_duty_only')}
                className="cursor-pointer accent-emerald-500 w-3.5 h-3.5"
              />
              <span className={`font-semibold ${contentFilter === 'monday_duty_only' ? 'text-emerald-300 font-black' : 'text-gray-300'}`}>
                Chỉ Lớp trực & Cầu thang
              </span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer bg-slate-900/60 hover:bg-slate-700/80 px-2 py-1 rounded-2xs border border-slate-600">
              <input
                type="radio"
                name="printFilter"
                value="shdc_only"
                checked={contentFilter === 'shdc_only'}
                onChange={() => setContentFilter('shdc_only')}
                className="cursor-pointer accent-emerald-500 w-3.5 h-3.5"
              />
              <span className={`font-semibold ${contentFilter === 'shdc_only' ? 'text-emerald-300 font-black' : 'text-gray-300'}`}>
                Chỉ SHDC (HS hỗ trợ)
              </span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer bg-slate-900/60 hover:bg-slate-700/80 px-2 py-1 rounded-2xs border border-slate-600">
              <input
                type="radio"
                name="printFilter"
                value="grid_and_monday_duty"
                checked={contentFilter === 'grid_and_monday_duty'}
                onChange={() => setContentFilter('grid_and_monday_duty')}
                className="cursor-pointer accent-emerald-500 w-3.5 h-3.5"
              />
              <span className={`font-semibold ${contentFilter === 'grid_and_monday_duty' ? 'text-emerald-300 font-black' : 'text-gray-300'}`}>
                Lịch tuần + Lớp trực & Cầu thang
              </span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer bg-slate-900/60 hover:bg-slate-700/80 px-2 py-1 rounded-2xs border border-slate-600">
              <input
                type="radio"
                name="printFilter"
                value="monday_all"
                checked={contentFilter === 'monday_all'}
                onChange={() => setContentFilter('monday_all')}
                className="cursor-pointer accent-emerald-500 w-3.5 h-3.5"
              />
              <span className={`font-semibold ${contentFilter === 'monday_all' ? 'text-emerald-300 font-black' : 'text-gray-300'}`}>
                Mục Thứ Hai (SHDC + Lớp trực & Cầu thang)
              </span>
            </label>
          </div>
        </div>

        {/* Thanh radio button chọn Ẩn / Hiện tiêu đề SỞ, Trường, Quốc hiệu */}
        <div className="bg-slate-900 text-white px-4 py-1.5 border-b border-slate-700 text-xs flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-cyan-400 font-bold">🏛️ Tiêu đề SỞ, Trường & Quốc hiệu:</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-2xs border border-slate-600">
              <input
                type="radio"
                name="headerVisibility"
                value="show"
                checked={showNationalHeader === true}
                onChange={() => setShowNationalHeader(true)}
                className="cursor-pointer accent-cyan-400 w-3.5 h-3.5"
              />
              <span className={`font-semibold ${showNationalHeader ? 'text-cyan-300 font-black' : 'text-gray-300'}`}>
                Hiện đầy đủ tiêu đề (Sở, Trường, Biểu ngữ Quốc hiệu)
              </span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-2xs border border-slate-600">
              <input
                type="radio"
                name="headerVisibility"
                value="hide"
                checked={showNationalHeader === false}
                onChange={() => setShowNationalHeader(false)}
                className="cursor-pointer accent-cyan-400 w-3.5 h-3.5"
              />
              <span className={`font-semibold ${!showNationalHeader ? 'text-cyan-300 font-black' : 'text-gray-300'}`}>
                Ẩn tiêu đề (Tiết kiệm diện tích trang in)
              </span>
            </label>
          </div>
        </div>

        {/* Nội dung bản in/xuất */}
        <div ref={contentRef} className="p-2 sm:p-6 overflow-y-auto overflow-x-auto bg-gray-100 flex justify-center">
          <div className="w-[1120px] min-w-[1120px] bg-white shadow-md border border-gray-300">
            <PrintPreview
              week={week}
              bchList={bchList}
              students={students}
              shdcLocations={shdcLocations}
              schoolName={schoolName}
              secretaryName={secretaryName}
              includeSaturday={includeSaturday}
              contentFilter={contentFilter}
              showNationalHeader={showNationalHeader}
              containerId="export-modal-document"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
