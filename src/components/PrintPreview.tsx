import React from 'react';
import { WeekSchedule, BCHUnit, SupportStudent, GradeLevel, SHDCLocationConfig, PrintContentFilter } from '../types';
import { ORDERED_GRADES, getActiveDays, getActiveDayKeys, SHDC_LOCATIONS } from '../data/defaultData';

interface Props {
  week: WeekSchedule;
  bchList: BCHUnit[];
  students: SupportStudent[];
  shdcLocations?: SHDCLocationConfig[];
  schoolName: string;
  secretaryName: string;
  includeSaturday?: boolean;
  contentFilter?: PrintContentFilter;
  showNationalHeader?: boolean;
  containerId?: string;
  onClose?: () => void;
}

export const PrintPreview: React.FC<Props> = ({
  week,
  bchList,
  students,
  shdcLocations,
  schoolName,
  secretaryName,
  includeSaturday = false,
  contentFilter = 'all',
  showNationalHeader = true,
  containerId = 'printable-content',
}) => {
  const activeDays = getActiveDays(includeSaturday);
  const activeDayKeys = getActiveDayKeys(includeSaturday);

  // Điều kiện hiển thị từng phần
  const showGrid =
    contentFilter === 'all' ||
    contentFilter === 'grid_only' ||
    contentFilter === 'grid_and_monday_duty';

  const showSHDC =
    contentFilter === 'all' ||
    contentFilter === 'shdc_only' ||
    contentFilter === 'monday_all';

  const showMondayDuty =
    contentFilter === 'all' ||
    contentFilter === 'monday_duty_only' ||
    contentFilter === 'grid_and_monday_duty' ||
    contentFilter === 'monday_all';

  const getBCHName = (id?: string): string => {
    if (!id) return '';
    if (id === 'bch-dt') return 'BCH ĐT';
    const b = bchList.find((item) => item.id === id);
    return b ? b.name : id;
  };

  const getStudent = (id: string): SupportStudent | undefined => {
    return students.find((s) => s.id === id);
  };

  // Tính ngày kết thúc (Thứ Sáu nếu 5 ngày, Thứ Bảy nếu có Thứ 7)
  const calcEndDate = (start: string) => {
    try {
      const parts = start.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      d.setDate(d.getDate() + (includeSaturday ? 5 : 4));
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      return `${dd}/${mm}/${d.getFullYear()}`;
    } catch {
      return '';
    }
  };

  const formatStartDate = (start: string) => {
    try {
      const parts = start.split('-').map(Number);
      if (parts.length === 3) {
        const dd = String(parts[2]).padStart(2, '0');
        const mm = String(parts[1]).padStart(2, '0');
        return `${dd}/${mm}/${parts[0]}`;
      }
      return start;
    } catch {
      return start;
    }
  };

  // Định dạng ngày ký lấy ngày đầu tiên theo tuần (Thứ Hai)
  const getSigningDateText = (start: string) => {
    try {
      if (!start) return 'Ngày ...... tháng ...... năm 2026';
      // Tách YYYY-MM-DD để tránh lệch múi giờ
      const parts = start.split('-');
      if (parts.length === 3) {
        const y = parts[0];
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        return `Ngày ${d.toString().padStart(2, '0')} tháng ${m.toString().padStart(2, '0')} năm ${y}`;
      }
      const dt = new Date(start);
      return `Ngày ${dt.getDate().toString().padStart(2, '0')} tháng ${(dt.getMonth() + 1).toString().padStart(2, '0')} năm ${dt.getFullYear()}`;
    } catch {
      return 'Ngày ...... tháng ...... năm 2026';
    }
  };

  // Màu sắc phân biệt các khối: sinh động, rõ nét, trang trọng, tương phản cao
  const getGradeTheme = (grade: GradeLevel) => {
    switch (grade) {
      case '12':
        return {
          gradeHeader: 'bg-emerald-600 text-white',
          studentHeader: 'bg-emerald-100 text-emerald-950',
          studentCell: 'bg-emerald-50/50',
          bchHeader: 'bg-emerald-200 text-emerald-950',
          bchCell: 'bg-emerald-100/60 text-emerald-950',
        };
      case '11':
        return {
          gradeHeader: 'bg-amber-600 text-white',
          studentHeader: 'bg-amber-100 text-amber-950',
          studentCell: 'bg-amber-50/50',
          bchHeader: 'bg-amber-200 text-amber-950',
          bchCell: 'bg-amber-100/60 text-amber-950',
        };
      case '10':
      default:
        return {
          gradeHeader: 'bg-purple-600 text-white',
          studentHeader: 'bg-purple-100 text-purple-950',
          studentCell: 'bg-purple-50/50',
          bchHeader: 'bg-purple-200 text-purple-950',
          bchCell: 'bg-purple-100/60 text-purple-950',
        };
    }
  };

  return (
    <div
      id={containerId}
      className="bg-white p-4 sm:p-6 md:p-8 w-full max-w-6xl mx-auto text-black font-sans select-text border border-gray-300 shadow-sm print:shadow-none print:border-none print:p-2 print:max-w-none print:w-full"
    >
      {/* Tiêu đề bản in trang trọng: SỞ GD&ĐT, Tên trường và Biểu ngữ Quốc hiệu (có thể ẩn/hiện) */}
      {showNationalHeader && (
        <div className="flex justify-between items-start border-b-2 border-black pb-3 mb-4">
          <div className="text-center w-5/12">
            <p className="text-xs font-black uppercase tracking-wider text-gray-900">SỞ GIÁO DỤC VÀ ĐÀO TẠO AN GIANG</p>
            <p className="text-sm font-black uppercase text-black mt-0.5">{schoolName}</p>
            <p className="text-xs font-black uppercase tracking-wide text-black mt-0.5">BCH ĐOÀN TRƯỜNG</p>
            <div className="w-24 h-0.5 bg-black mx-auto mt-1.5"></div>
          </div>

          <div className="text-center w-5/12">
            <p className="text-xs font-black uppercase tracking-wide text-black">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </p>
            <p className="text-xs font-bold italic text-gray-900 mt-0.5">Độc lập - Tự do - Hạnh phúc</p>
            <div className="w-32 h-0.5 bg-black mx-auto mt-1.5"></div>
          </div>
        </div>
      )}

      <div className="text-center my-4">
        <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-gray-950">
          BCH ĐOÀN TRƯỜNG THPT NGUYỄN CHÍ THANH
        </h1>
        <h2 className="text-xl sm:text-2xl font-black uppercase text-red-600 mt-1 tracking-wide">
          LỊCH TRỰC TUẦN {week.weekNumber.toString().padStart(2, '0')}
        </h2>
        <p className="text-xs sm:text-sm font-semibold italic text-gray-800 mt-1">
          (Áp dụng từ ngày <span className="font-black text-black">{formatStartDate(week.startDate)}</span> đến ngày{' '}
          <span className="font-black text-black">{calcEndDate(week.startDate)}</span> — Năm học{' '}
          <span className="font-bold text-black">{week.academicYear}</span>)
        </p>
      </div>

      {/* Bảng in Excel: Đường viền rõ nét, có màu sắc phân biệt sinh động giữa các khối */}
      {showGrid && (
        <table className="w-full border-collapse border-2 border-gray-900 text-center mt-4 mb-6">
          <thead>
            <tr className="bg-teal-800 text-white font-black border-b-2 border-gray-900">
              <th className="border-2 border-gray-900 p-2.5 w-24 text-center font-black text-xs sm:text-sm uppercase tracking-wider text-white" colSpan={2}>
                KHỐI
              </th>
              {activeDays.map((d) => (
                <th key={d.key} className="border-2 border-gray-900 p-2 text-white">
                  <div className="font-black text-xs sm:text-sm uppercase tracking-wide text-white">
                    {d.label}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ORDERED_GRADES.map((grade) => {
              const theme = getGradeTheme(grade);
              return (
                <React.Fragment key={grade}>
                  {/* Học sinh trực */}
                  <tr className="border-b border-gray-900">
                    <td
                      rowSpan={2}
                      className={`border-2 border-gray-900 p-2 font-black text-sm sm:text-base align-middle ${theme.gradeHeader}`}
                    >
                      KHỐI {grade}
                    </td>
                    <td className={`border-2 border-gray-900 p-2 font-black text-xs sm:text-sm w-28 align-middle uppercase ${theme.studentHeader}`}>
                      HỌC SINH TRỰC
                    </td>
                    {activeDayKeys.map((day) => {
                      const studentIds = week.grid[grade]?.[day]?.students || [];
                      return (
                        <td
                          key={day}
                          className={`border border-gray-900 p-1.5 align-middle h-14 min-w-[100px] ${theme.studentCell}`}
                        >
                          {studentIds.length === 0 ? (
                            <span className="text-gray-400 italic text-xs font-medium">---</span>
                          ) : (
                            <div className="flex flex-col gap-1 justify-center items-center text-center leading-snug">
                              {studentIds.map((stId) => {
                                const st = getStudent(stId);
                                if (!st) return null;
                                return (
                                  <div
                                    key={stId}
                                    className="font-bold text-xs sm:text-sm text-black"
                                  >
                                    {st.fullName}{' '}
                                    <span className="font-black text-gray-800 text-[11px] sm:text-xs">
                                      ({st.className})
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* BCH trực */}
                  <tr className="border-b-2 border-gray-900">
                    <td className={`border-2 border-gray-900 p-2 font-black text-xs sm:text-sm w-28 align-middle uppercase ${theme.bchHeader}`}>
                      BCH TRỰC
                    </td>
                    {activeDayKeys.map((day) => {
                      const bchId = week.grid[grade]?.[day]?.bch?.bchId;
                      const name = getBCHName(bchId);
                      return (
                        <td
                          key={day}
                          className={`border border-gray-900 p-1.5 font-black text-xs sm:text-sm align-middle h-10 ${theme.bchCell}`}
                        >
                          {name || <span className="text-gray-400 font-normal italic text-xs">---</span>}
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      )}

      {/* BẢNG PHÂN CÔNG TRỰC SÁNG THỨ HAI (SINH HOẠT DƯỚI CỜ - SHDC) */}
      {showSHDC && (
        <div className="mt-6 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-3 w-1.5 bg-blue-700 inline-block"></span>
            <h3 className="font-black text-xs sm:text-sm uppercase tracking-wide text-gray-950">
              PHÂN CÔNG TRỰC SÁNG THỨ HAI (SINH HOẠT DƯỚI CỜ - HỌC SINH HỖ TRỢ)
            </h3>
          </div>

          <table className="w-full border-collapse border-2 border-gray-900 text-center">
            <thead>
              <tr className="bg-slate-800 text-white font-black border-b-2 border-gray-900 text-xs sm:text-sm">
                <th className="border-2 border-gray-900 p-2 w-12 text-center text-white">STT</th>
                <th className="border-2 border-gray-900 p-2 w-1/3 text-center uppercase tracking-wide text-white">
                  VỊ TRÍ / KHU VỰC PHÂN CÔNG
                </th>
                <th className="border-2 border-gray-900 p-2 text-center uppercase tracking-wide text-white">
                  HỌC SINH ĐẢM NHẬN TRỰC
                </th>
              </tr>
            </thead>
            <tbody>
              {(shdcLocations && shdcLocations.length > 0 ? shdcLocations : SHDC_LOCATIONS).map((loc, idx) => {
                const locationData = week.shdc?.locations?.[loc.key];
                const studentIds = locationData?.students || [];

                // Màu nền nhẹ nhàng luân phiên cho từng khu vực để dễ phân biệt
                const bgColors = ['bg-sky-50/70', 'bg-amber-50/70', 'bg-emerald-50/70', 'bg-purple-50/70', 'bg-rose-50/70'];
                const rowBg = bgColors[idx % bgColors.length];

                return (
                  <tr key={loc.key} className={`border-b border-gray-900 ${rowBg}`}>
                    <td className="border-2 border-gray-900 p-2 font-black text-xs sm:text-sm text-center text-gray-900">
                      {idx + 1}
                    </td>
                    <td className="border-2 border-gray-900 p-2 text-left font-black text-xs sm:text-sm text-gray-950">
                      <div className="flex items-center gap-1.5">
                        <span className="text-blue-700 font-bold">📍</span>
                        <span>{loc.name}</span>
                      </div>
                    </td>
                    <td className="border-2 border-gray-900 p-2 text-left">
                      {studentIds.length === 0 ? (
                        <span className="text-gray-400 italic text-xs font-medium">Chưa phân công</span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          {studentIds.map((stId, sIdx) => {
                            const st = getStudent(stId);
                            if (!st) return null;
                            return (
                              <span
                                key={stId}
                                className="font-bold text-xs sm:text-sm text-gray-950 inline-flex items-center gap-1"
                              >
                                <span className="text-gray-600 font-semibold">{sIdx + 1}.</span>
                                <span className="font-black text-black">{st.fullName}</span>
                                <span className="text-blue-900 font-extrabold text-[11px] sm:text-xs">
                                  ({st.className})
                                </span>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* BẢNG PHÂN CÔNG LỚP TRỰC SÁNG & CHIỀU THỨ HAI (TRỰC CỔNG, CHUẨN BỊ VÀ DỌN DẸP SÂN KHẤU) */}
      {/* BẢNG PHÂN CÔNG TRỰC THEO TUẦN & VỆ SINH CẦU THANG */}
      {showMondayDuty && (
        <div className="mt-5 mb-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-3 w-1.5 bg-indigo-700 inline-block"></span>
            <h3 className="font-black text-xs sm:text-sm uppercase tracking-wide text-gray-950">
              PHÂN CÔNG TRỰC THEO TUẦN
            </h3>
          </div>

          {/* BẢNG 1: TRỰC CỔNG, SÂN KHẤU */}
          <table className="w-full border-collapse border-2 border-gray-900 text-center">
            <thead>
              <tr className="bg-indigo-900 text-white font-black border-b-2 border-gray-900 text-xs sm:text-sm">
                <th className="border-2 border-gray-900 p-2 w-28 text-center text-white uppercase">BUỔI</th>
                <th className="border-2 border-gray-900 p-2 text-center uppercase tracking-wide text-white">TRỰC CỔNG</th>
                <th className="border-2 border-gray-900 p-2 text-center uppercase tracking-wide text-white">CHUẨN BỊ SÂN KHẤU</th>
                <th className="border-2 border-gray-900 p-2 text-center uppercase tracking-wide text-white">DỌN DẸP SÂN KHẤU</th>
              </tr>
            </thead>
            <tbody>
              {/* Buổi Sáng */}
              <tr className="border-b border-gray-900 bg-amber-50/60">
                <td className="border-2 border-gray-900 p-2 font-black text-xs sm:text-sm text-center uppercase text-amber-950 bg-amber-100/70">
                  ☀️ SÁNG
                </td>
                <td className="border-2 border-gray-900 p-2 text-center font-black text-xs sm:text-sm text-blue-900">
                  {week.mondayDutyClasses?.morning?.gateDutyClass ? (
                    <span className="inline-block bg-blue-100 text-blue-950 px-2 py-0.5 rounded-xs border border-blue-300">
                      Lớp {week.mondayDutyClasses.morning.gateDutyClass}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic text-xs font-normal">Chưa phân công</span>
                  )}
                </td>
                <td className="border-2 border-gray-900 p-2 text-center font-black text-xs sm:text-sm text-amber-900">
                  {week.mondayDutyClasses?.morning?.stagePrepClass ? (
                    <span className="inline-block bg-amber-100 text-amber-950 px-2 py-0.5 rounded-xs border border-amber-300">
                      Lớp {week.mondayDutyClasses.morning.stagePrepClass}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic text-xs font-normal">Chưa phân công</span>
                  )}
                </td>
                <td className="border-2 border-gray-900 p-2 text-center font-black text-xs sm:text-sm text-emerald-900">
                  {week.mondayDutyClasses?.morning?.stageCleanClass ? (
                    <span className="inline-block bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded-xs border border-emerald-300">
                      Lớp {week.mondayDutyClasses.morning.stageCleanClass}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic text-xs font-normal">Chưa phân công</span>
                  )}
                </td>
              </tr>

              {/* Buổi Chiều */}
              <tr className="border-b-2 border-gray-900 bg-indigo-50/60">
                <td className="border-2 border-gray-900 p-2 font-black text-xs sm:text-sm text-center uppercase text-indigo-950 bg-indigo-100/70">
                  🌆 CHIỀU
                </td>
                <td className="border-2 border-gray-900 p-2 text-center font-black text-xs sm:text-sm text-blue-900">
                  {week.mondayDutyClasses?.afternoon?.gateDutyClass ? (
                    <span className="inline-block bg-blue-100 text-blue-950 px-2 py-0.5 rounded-xs border border-blue-300">
                      Lớp {week.mondayDutyClasses.afternoon.gateDutyClass}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic text-xs font-normal">Chưa phân công</span>
                  )}
                </td>
                <td className="border-2 border-gray-900 p-2 text-center font-black text-xs sm:text-sm text-amber-900">
                  {week.mondayDutyClasses?.afternoon?.stagePrepClass ? (
                    <span className="inline-block bg-amber-100 text-amber-950 px-2 py-0.5 rounded-xs border border-amber-300">
                      Lớp {week.mondayDutyClasses.afternoon.stagePrepClass}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic text-xs font-normal">Chưa phân công</span>
                  )}
                </td>
                <td className="border-2 border-gray-900 p-2 text-center font-black text-xs sm:text-sm text-emerald-900">
                  {week.mondayDutyClasses?.afternoon?.stageCleanClass ? (
                    <span className="inline-block bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded-xs border border-emerald-300">
                      Lớp {week.mondayDutyClasses.afternoon.stageCleanClass}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic text-xs font-normal">Chưa phân công</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          {/* BẢNG 2: VỆ SINH CẦU THANG (KHU A, B, C1, D) */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-3 w-1.5 bg-teal-700 inline-block"></span>
              <h4 className="font-black text-xs sm:text-sm uppercase tracking-wide text-gray-950">
                PHÂN CÔNG VỆ SINH CẦU THANG (SÁNG & CHIỀU)
              </h4>
            </div>

            <table className="w-full border-collapse border-2 border-gray-900 text-center">
              <thead>
                <tr className="bg-teal-900 text-white font-black border-b-2 border-gray-900 text-xs sm:text-sm">
                  <th className="border-2 border-gray-900 p-2 w-24 text-center text-white uppercase">BUỔI</th>
                  <th className="border-2 border-gray-900 p-2 text-center uppercase tracking-wide text-white">KHU A</th>
                  <th className="border-2 border-gray-900 p-2 text-center uppercase tracking-wide text-white">KHU B (PHÍA CỔNG)</th>
                  <th className="border-2 border-gray-900 p-2 text-center uppercase tracking-wide text-white">KHU B (GẦN THƯ VIỆN)</th>
                  <th className="border-2 border-gray-900 p-2 text-center uppercase tracking-wide text-white">KHU C1 (PHÍA CỔNG)</th>
                  <th className="border-2 border-gray-900 p-2 text-center uppercase tracking-wide text-white">KHU D</th>
                </tr>
              </thead>
              <tbody>
                {/* Buổi Sáng */}
                <tr className="border-b border-gray-900 bg-teal-50/40">
                  <td className="border-2 border-gray-900 p-2 font-black text-xs sm:text-sm text-center uppercase text-amber-950 bg-amber-100/70">
                    ☀️ SÁNG
                  </td>
                  <td className="border-2 border-gray-900 p-2 text-center font-black text-xs sm:text-sm text-gray-950">
                    {week.mondayDutyClasses?.stairCleaning?.morning?.khuA ? (
                      <span className="inline-block bg-teal-100 text-teal-950 px-2 py-0.5 rounded-xs border border-teal-300">
                        Lớp {week.mondayDutyClasses.stairCleaning.morning.khuA}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs font-normal">---</span>
                    )}
                  </td>
                  <td className="border-2 border-gray-900 p-2 text-center font-black text-xs sm:text-sm text-gray-950">
                    {week.mondayDutyClasses?.stairCleaning?.morning?.khuB_cong ? (
                      <span className="inline-block bg-teal-100 text-teal-950 px-2 py-0.5 rounded-xs border border-teal-300">
                        Lớp {week.mondayDutyClasses.stairCleaning.morning.khuB_cong}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs font-normal">---</span>
                    )}
                  </td>
                  <td className="border-2 border-gray-900 p-2 text-center font-black text-xs sm:text-sm text-gray-950">
                    {week.mondayDutyClasses?.stairCleaning?.morning?.khuB_thuvien ? (
                      <span className="inline-block bg-teal-100 text-teal-950 px-2 py-0.5 rounded-xs border border-teal-300">
                        Lớp {week.mondayDutyClasses.stairCleaning.morning.khuB_thuvien}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs font-normal">---</span>
                    )}
                  </td>
                  <td className="border-2 border-gray-900 p-2 text-center font-black text-xs sm:text-sm text-gray-950">
                    {week.mondayDutyClasses?.stairCleaning?.morning?.khuC1 ? (
                      <span className="inline-block bg-teal-100 text-teal-950 px-2 py-0.5 rounded-xs border border-teal-300">
                        Lớp {week.mondayDutyClasses.stairCleaning.morning.khuC1}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs font-normal">---</span>
                    )}
                  </td>
                  <td className="border-2 border-gray-900 p-2 text-center font-black text-xs sm:text-sm text-gray-950">
                    {week.mondayDutyClasses?.stairCleaning?.morning?.khuD ? (
                      <span className="inline-block bg-teal-100 text-teal-950 px-2 py-0.5 rounded-xs border border-teal-300">
                        Lớp {week.mondayDutyClasses.stairCleaning.morning.khuD}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs font-normal">---</span>
                    )}
                  </td>
                </tr>

                {/* Buổi Chiều */}
                <tr className="border-b-2 border-gray-900 bg-indigo-50/40">
                  <td className="border-2 border-gray-900 p-2 font-black text-xs sm:text-sm text-center uppercase text-indigo-950 bg-indigo-100/70">
                    🌆 CHIỀU
                  </td>
                  <td className="border-2 border-gray-900 p-2 text-center font-black text-xs sm:text-sm text-gray-950">
                    {week.mondayDutyClasses?.stairCleaning?.afternoon?.khuA ? (
                      <span className="inline-block bg-indigo-100 text-indigo-950 px-2 py-0.5 rounded-xs border border-indigo-300">
                        Lớp {week.mondayDutyClasses.stairCleaning.afternoon.khuA}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs font-normal">---</span>
                    )}
                  </td>
                  <td className="border-2 border-gray-900 p-2 text-center font-black text-xs sm:text-sm text-gray-950">
                    {week.mondayDutyClasses?.stairCleaning?.afternoon?.khuB_cong ? (
                      <span className="inline-block bg-indigo-100 text-indigo-950 px-2 py-0.5 rounded-xs border border-indigo-300">
                        Lớp {week.mondayDutyClasses.stairCleaning.afternoon.khuB_cong}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs font-normal">---</span>
                    )}
                  </td>
                  <td className="border-2 border-gray-900 p-2 text-center font-black text-xs sm:text-sm text-gray-950">
                    {week.mondayDutyClasses?.stairCleaning?.afternoon?.khuB_thuvien ? (
                      <span className="inline-block bg-indigo-100 text-indigo-950 px-2 py-0.5 rounded-xs border border-indigo-300">
                        Lớp {week.mondayDutyClasses.stairCleaning.afternoon.khuB_thuvien}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs font-normal">---</span>
                    )}
                  </td>
                  <td className="border-2 border-gray-900 p-2 text-center font-black text-xs sm:text-sm text-gray-950">
                    {week.mondayDutyClasses?.stairCleaning?.afternoon?.khuC1 ? (
                      <span className="inline-block bg-indigo-100 text-indigo-950 px-2 py-0.5 rounded-xs border border-indigo-300">
                        Lớp {week.mondayDutyClasses.stairCleaning.afternoon.khuC1}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs font-normal">---</span>
                    )}
                  </td>
                  <td className="border-2 border-gray-900 p-2 text-center font-black text-xs sm:text-sm text-gray-950">
                    {week.mondayDutyClasses?.stairCleaning?.afternoon?.khuD ? (
                      <span className="inline-block bg-indigo-100 text-indigo-950 px-2 py-0.5 rounded-xs border border-indigo-300">
                        Lớp {week.mondayDutyClasses.stairCleaning.afternoon.khuD}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs font-normal">---</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {week.mondayDutyClasses?.notes && (
            <div className="mt-1.5 text-xs text-gray-800 italic">
              * <strong className="font-semibold text-gray-900">Yêu cầu/Ghi chú:</strong> {week.mondayDutyClasses.notes}
            </div>
          )}
        </div>
      )}

      {/* Dòng ký xác nhận của Ban Chấp Hành */}
      <div className="flex justify-between items-start mt-8 text-xs sm:text-sm">
        <div className="text-center w-5/12">
          <p className="font-black uppercase tracking-wide text-gray-900">NGƯỜI LẬP LỊCH</p>
          <p className="italic text-xs text-gray-700 mt-0.5">(Ký và ghi rõ họ tên)</p>
          <div className="h-24"></div>
        </div>

        <div className="text-center w-5/12">
          <p className="italic text-gray-800 text-xs sm:text-sm mb-1 font-medium">
            {getSigningDateText(week.startDate)}
          </p>
          <p className="font-black uppercase tracking-wide text-gray-950">
            TM. BAN CHẤP HÀNH ĐOÀN TRƯỜNG
          </p>
          <p className="font-black uppercase text-xs sm:text-sm text-gray-900 mt-0.5">
            BÍ THƯ ĐOÀN TRƯỜNG
          </p>
          <p className="italic text-xs text-gray-700 mt-0.5">(Ký, đóng dấu và ghi rõ họ tên)</p>
          <div className="h-20"></div>
          <p className="font-black uppercase text-sm sm:text-base text-black tracking-wide">
            {secretaryName}
          </p>
        </div>
      </div>
    </div>
  );
};
