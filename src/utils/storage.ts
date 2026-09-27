import { AppState } from '../types';
import { getDefaultAppState, getStartDateForWeek, createEmptyWeek, getRealTimeInfo, getDefaultMondayDuty } from '../data/defaultData';

const STORAGE_KEY = 'BCH_THPT_NCT_EXCEL_STATE_V2';

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultAppState();
    const parsed = JSON.parse(raw);
    if (parsed && parsed.weeks && parsed.students) {
      if (!parsed.shdcLocations || !Array.isArray(parsed.shdcLocations) || parsed.shdcLocations.length === 0) {
        parsed.shdcLocations = getDefaultAppState().shdcLocations;
      }
      if (parsed.includeSaturday === undefined) {
        parsed.includeSaturday = false;
      }

      // Đảm bảo cấu trúc grid luôn có ô 'sat' (Thứ 7) và đồng bộ ngày theo chuẩn tuần:
      if (parsed.weeks) {
        Object.keys(parsed.weeks).forEach((wKey) => {
          const wNum = Number(wKey);
          const w = parsed.weeks[wNum];
          if (w) {
            const expectedDate = getStartDateForWeek(wNum);
            if (!w.startDate || w.startDate === '2026-09-21') {
              w.startDate = expectedDate;
            }

            if (w.grid) {
              (['12', '11', '10'] as const).forEach((g) => {
                if (w.grid[g] && !w.grid[g]['sat']) {
                  w.grid[g]['sat'] = { students: [], bch: { bchId: undefined, isLocked: false } };
                }
              });
            }

            // Đảm bảo cấu trúc phân công lớp trực & vệ sinh cầu thang
            if (!w.mondayDutyClasses || !w.mondayDutyClasses.stairCleaning || !w.mondayDutyClasses.weekDuty) {
              w.mondayDutyClasses = {
                ...getDefaultMondayDuty(wNum),
                ...(w.mondayDutyClasses || {}),
                weekDuty: w.mondayDutyClasses?.weekDuty || getDefaultMondayDuty(wNum).weekDuty,
                stairCleaning: w.mondayDutyClasses?.stairCleaning || getDefaultMondayDuty(wNum).stairCleaning,
              };
            }
          }
        });
      }

      // Lấy tuần học thực tế từ đồng hồ hệ thống thay vì cố định tuần mặc định
      const realTime = getRealTimeInfo();
      const realWeekNum = realTime.realWeekNumber;
      const realStartDate = getStartDateForWeek(realWeekNum);

      // Nếu đã lưu một số tuần trước đó hợp lệ thì tôn trọng lựa chọn của người dùng,
      // nhưng nếu chưa có hoặc tuần bị thiếu startDate thì tự động lấy tuần thực tế
      if (!parsed.currentWeekNumber || typeof parsed.currentWeekNumber !== 'number') {
        parsed.currentWeekNumber = realWeekNum;
        parsed.startDate = realStartDate;
      }

      // Đảm bảo tuần hiện tại có dữ liệu trong danh sách weeks
      if (!parsed.weeks[parsed.currentWeekNumber]) {
        parsed.weeks[parsed.currentWeekNumber] = createEmptyWeek(
          parsed.currentWeekNumber, 
          getStartDateForWeek(parsed.currentWeekNumber)
        );
      }

      // Cập nhật ngày bắt đầu theo tuần hiện tại
      parsed.startDate = parsed.weeks[parsed.currentWeekNumber].startDate || getStartDateForWeek(parsed.currentWeekNumber);

      return parsed as AppState;
    }
    return getDefaultAppState();
  } catch (e) {
    console.error('Error loading app state from localStorage:', e);
    return getDefaultAppState();
  }
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving app state to localStorage:', e);
  }
}

export function exportBackupJSON(state: AppState): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute(
    'download',
    `Sao_luu_Lich_truc_BCH_THPT_NCT_Tuan_${state.currentWeekNumber}.json`
  );
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function parseImportJSON(jsonStr: string): AppState {
  const parsed = JSON.parse(jsonStr);
  if (!parsed || !parsed.weeks || !parsed.bchList || !parsed.students) {
    throw new Error('Định dạng tệp không hợp lệ!');
  }
  return parsed as AppState;
}
