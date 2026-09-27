import { BCHUnit, GradeLevel, DayOfWeek, WeekSchedule, BCHScheduleMode } from '../types';
import { ORDERED_GRADES, ORDERED_DAYS, ALL_DAYS, getActiveDayKeys } from '../data/defaultData';

export interface ScheduleResult {
  updatedGrid: WeekSchedule['grid'];
  updatedLastBCH: Record<GradeLevel, string | null>;
}

/**
 * Tìm lớp BCH cuối cùng đã được xếp ở các tuần trước đó (< weekNumber)
 * để làm mốc tiếp tục cho tuần hiện tại.
 */
export function getLastBCHBeforeWeek(
  weekNumber: number,
  weeks: Record<number, WeekSchedule>,
  includeSaturday = false
): Record<GradeLevel, string | null> {
  const result: Record<GradeLevel, string | null> = { '12': null, '11': null, '10': null };
  const activeDays = getActiveDayKeys(includeSaturday);

  const priorWeekNums = Object.keys(weeks)
    .map(Number)
    .filter((num) => num < weekNumber && weeks[num]?.grid)
    .sort((a, b) => b - a);

  for (const grade of ORDERED_GRADES) {
    for (const wNum of priorWeekNums) {
      const wGrid = weeks[wNum]?.grid;
      if (!wGrid || !wGrid[grade]) continue;
      for (let i = activeDays.length - 1; i >= 0; i--) {
        const d = activeDays[i];
        const bchId = wGrid[grade][d]?.bch?.bchId;
        // Bỏ qua nếu là bch-dt (chỉ lấy lớp học làm mốc xoay tua)
        if (bchId && bchId !== 'bch-dt') {
          result[grade] = bchId;
          break;
        }
      }
      if (result[grade]) break;
    }
  }

  return result;
}

/**
 * Tạo lịch BCH cho tuần theo chế độ được chọn:
 * 1. Không trùng BCH trong cùng một tuần.
 * 2. Khi có ô BCH bị khóa, ở chế độ "Tăng dần", các ngày tiếp theo sẽ tăng dần từ thứ tự của ô bị khóa đó.
 * 3. Hỗ trợ đối tượng đặc biệt "BCH ĐT".
 * 4. Tùy chọn linh hoạt gồm Thứ Bảy (includeSaturday).
 */
export function generateBCHSchedule(
  currentWeek: WeekSchedule,
  bchList: BCHUnit[],
  lastBCHMap: Record<GradeLevel, string | null>,
  mode: BCHScheduleMode,
  allWeeks: Record<number, WeekSchedule> = {},
  includeSaturday = false
): ScheduleResult {
  const newGrid: WeekSchedule['grid'] = JSON.parse(JSON.stringify(currentWeek.grid));
  const newLastBCH: Record<GradeLevel, string | null> = { ...lastBCHMap };
  const activeDays = getActiveDayKeys(includeSaturday);

  for (const grade of ORDERED_GRADES) {
    // Lấy danh sách lớp BCH của khối này (loại trừ bch-dt vì bch-dt là đối tượng đặc biệt)
    const gradeBCH = bchList
      .filter((b) => b.grade === grade && b.enabled && b.id !== 'bch-dt')
      .sort((a, b) => a.order - b.order);

    if (gradeBCH.length === 0) continue;

    // Tập hợp các BCH đã dùng trong tuần này để đảm bảo KHÔNG TRÙNG trong tuần
    const usedThisWeek = new Set<string>();

    // Đếm các ô bị khóa trong tuần
    const lockedInfo: { dayIdx: number; day: DayOfWeek; bchId: string; classIdx: number }[] = [];

    activeDays.forEach((day, idx) => {
      const slot = newGrid[grade][day]?.bch;
      if (slot?.isLocked && slot.bchId) {
        usedThisWeek.add(slot.bchId);
        const classIdx = gradeBCH.findIndex((b) => b.id === slot.bchId);
        lockedInfo.push({ dayIdx: idx, day, bchId: slot.bchId, classIdx });
      }
    });

    if (mode === 'increasing' || mode === 'custom') {
      // 1. NẾU CÓ Ô BỊ KHÓA LÀM MỐC
      if (lockedInfo.length > 0 && lockedInfo.some((l) => l.classIdx !== -1)) {
        // Tìm ô khóa đầu tiên có trong danh sách lớp
        const firstValidLocked = lockedInfo.find((l) => l.classIdx !== -1)!;

        // Đi từ ngày bị khóa về phía trước
        let currIdx = firstValidLocked.classIdx;
        for (let i = firstValidLocked.dayIdx + 1; i < activeDays.length; i++) {
          const d = activeDays[i];
          const slot = newGrid[grade][d].bch;
          if (slot.isLocked && slot.bchId) {
            const nextLockedIdx = gradeBCH.findIndex((b) => b.id === slot.bchId);
            if (nextLockedIdx !== -1) {
              currIdx = nextLockedIdx;
            }
            continue;
          }

          if (mode === 'custom' && slot.bchId) continue;

          // Tìm lớp tiếp theo chưa dùng trong tuần
          let step = 1;
          while (step <= gradeBCH.length) {
            const candidateIdx = (currIdx + step) % gradeBCH.length;
            const candidate = gradeBCH[candidateIdx];
            if (!usedThisWeek.has(candidate.id)) {
              slot.bchId = candidate.id;
              usedThisWeek.add(candidate.id);
              currIdx = candidateIdx;
              break;
            }
            step++;
          }
        }

        // Đi từ ngày bị khóa ngược về các ngày trước đó (nếu có, ví dụ Thứ Ba bị khóa thì lùi về Thứ Hai)
        let backIdx = firstValidLocked.classIdx;
        for (let i = firstValidLocked.dayIdx - 1; i >= 0; i--) {
          const d = activeDays[i];
          const slot = newGrid[grade][d].bch;
          if (slot.isLocked && slot.bchId) {
            continue;
          }

          if (mode === 'custom' && slot.bchId) continue;

          // Tìm lớp lùi về trước chưa dùng trong tuần
          let step = 1;
          while (step <= gradeBCH.length) {
            const candidateIdx = (backIdx - step + gradeBCH.length) % gradeBCH.length;
            const candidate = gradeBCH[candidateIdx];
            if (!usedThisWeek.has(candidate.id)) {
              slot.bchId = candidate.id;
              usedThisWeek.add(candidate.id);
              backIdx = candidateIdx;
              break;
            }
            step++;
          }
        }
      } else {
        // 2. NẾU KHÔNG CÓ Ô BỊ KHÓA LÀM MỐC: BẮT ĐẦU TỪ TUẦN TRƯỚC HOẶC TỪ ĐẦU
        const prevBCHId = lastBCHMap[grade];
        let nextIndex = 0;
        if (prevBCHId) {
          const foundIdx = gradeBCH.findIndex((b) => b.id === prevBCHId);
          if (foundIdx !== -1) {
            nextIndex = (foundIdx + 1) % gradeBCH.length;
          }
        }

        let currIdx = nextIndex;

        for (const day of activeDays) {
          const slot = newGrid[grade][day].bch;
          if (slot.isLocked) continue;

          if (mode === 'custom' && slot.bchId) {
            usedThisWeek.add(slot.bchId);
            continue;
          }

          // Chọn lớp tiếp theo chưa có trong tuần này
          let attempts = 0;
          while (attempts < gradeBCH.length) {
            const candidate = gradeBCH[currIdx];
            currIdx = (currIdx + 1) % gradeBCH.length;
            if (!usedThisWeek.has(candidate.id)) {
              slot.bchId = candidate.id;
              usedThisWeek.add(candidate.id);
              break;
            }
            attempts++;
          }
        }
      }

      // Cập nhật lớp cuối cùng của tuần
      for (let i = activeDays.length - 1; i >= 0; i--) {
        const d = activeDays[i];
        const id = newGrid[grade][d].bch.bchId;
        if (id && id !== 'bch-dt') {
          newLastBCH[grade] = id;
          break;
        }
      }
    } else if (mode === 'decreasing') {
      // GIẢM DẦN
      if (lockedInfo.length > 0 && lockedInfo.some((l) => l.classIdx !== -1)) {
        const firstValidLocked = lockedInfo.find((l) => l.classIdx !== -1)!;

        // Đi xuôi về cuối tuần: giảm dần từ ô bị khóa
        let currIdx = firstValidLocked.classIdx;
        for (let i = firstValidLocked.dayIdx + 1; i < activeDays.length; i++) {
          const d = activeDays[i];
          const slot = newGrid[grade][d].bch;
          if (slot.isLocked && slot.bchId) {
            const nextLockedIdx = gradeBCH.findIndex((b) => b.id === slot.bchId);
            if (nextLockedIdx !== -1) currIdx = nextLockedIdx;
            continue;
          }

          let step = 1;
          while (step <= gradeBCH.length) {
            const candidateIdx = (currIdx - step + gradeBCH.length) % gradeBCH.length;
            const candidate = gradeBCH[candidateIdx];
            if (!usedThisWeek.has(candidate.id)) {
              slot.bchId = candidate.id;
              usedThisWeek.add(candidate.id);
              currIdx = candidateIdx;
              break;
            }
            step++;
          }
        }

        // Lùi về các ngày trước ô bị khóa: tăng dần để khi xuôi theo thời gian sẽ giảm dần
        let backIdx = firstValidLocked.classIdx;
        for (let i = firstValidLocked.dayIdx - 1; i >= 0; i--) {
          const d = activeDays[i];
          const slot = newGrid[grade][d].bch;
          if (slot.isLocked && slot.bchId) continue;

          let step = 1;
          while (step <= gradeBCH.length) {
            const candidateIdx = (backIdx + step) % gradeBCH.length;
            const candidate = gradeBCH[candidateIdx];
            if (!usedThisWeek.has(candidate.id)) {
              slot.bchId = candidate.id;
              usedThisWeek.add(candidate.id);
              backIdx = candidateIdx;
              break;
            }
            step++;
          }
        }
      } else {
        const prevBCHId = lastBCHMap[grade];
        let nextIndex = gradeBCH.length - 1;
        if (prevBCHId) {
          const foundIdx = gradeBCH.findIndex((b) => b.id === prevBCHId);
          if (foundIdx !== -1) {
            nextIndex = (foundIdx - 1 + gradeBCH.length) % gradeBCH.length;
          }
        }

        let currIdx = nextIndex;

        for (const day of activeDays) {
          const slot = newGrid[grade][day].bch;
          if (slot.isLocked) continue;

          let attempts = 0;
          while (attempts < gradeBCH.length) {
            const candidate = gradeBCH[currIdx];
            currIdx = (currIdx - 1 + gradeBCH.length) % gradeBCH.length;
            if (!usedThisWeek.has(candidate.id)) {
              slot.bchId = candidate.id;
              usedThisWeek.add(candidate.id);
              break;
            }
            attempts++;
          }
        }
      }

      for (let i = activeDays.length - 1; i >= 0; i--) {
        const d = activeDays[i];
        const id = newGrid[grade][d].bch.bchId;
        if (id && id !== 'bch-dt') {
          newLastBCH[grade] = id;
          break;
        }
      }
    } else if (mode === 'auto') {
      // TỰ ĐỘNG SẮP: Công bằng và tuyệt đối không trùng trong tuần
      const shiftCounts: Record<string, number> = {};
      const lastWeekSeen: Record<string, number> = {};

      gradeBCH.forEach((b) => {
        shiftCounts[b.id] = 0;
        lastWeekSeen[b.id] = -1;
      });

      Object.entries(allWeeks).forEach(([wNumStr, w]) => {
        const wNum = Number(wNumStr);
        if (wNum === currentWeek.weekNumber) return;
        if (!w.grid || !w.grid[grade]) return;

        activeDays.forEach((d) => {
          const id = w.grid[grade][d]?.bch?.bchId;
          if (id && shiftCounts[id] !== undefined) {
            shiftCounts[id]++;
            if (w.weekNumber > lastWeekSeen[id]) {
              lastWeekSeen[id] = w.weekNumber;
            }
          }
        });
      });

      for (const day of activeDays) {
        const slot = newGrid[grade][day].bch;
        if (slot.isLocked) continue;

        // Ưu tiên các lớp chưa dùng trong tuần này
        const availableCandidates = gradeBCH.filter((b) => !usedThisWeek.has(b.id));
        const listToPick = availableCandidates.length > 0 ? availableCandidates : gradeBCH;

        const sorted = [...listToPick].sort((a, b) => {
          const countA = shiftCounts[a.id] || 0;
          const countB = shiftCounts[b.id] || 0;
          if (countA !== countB) return countA - countB;
          return (lastWeekSeen[a.id] || 0) - (lastWeekSeen[b.id] || 0);
        });

        const chosen = sorted[0];
        slot.bchId = chosen.id;
        usedThisWeek.add(chosen.id);
        shiftCounts[chosen.id] = (shiftCounts[chosen.id] || 0) + 1;
        lastWeekSeen[chosen.id] = currentWeek.weekNumber;
      }

      for (let i = activeDays.length - 1; i >= 0; i--) {
        const d = activeDays[i];
        const id = newGrid[grade][d].bch.bchId;
        if (id && id !== 'bch-dt') {
          newLastBCH[grade] = id;
          break;
        }
      }
    }
  }

  return { updatedGrid: newGrid, updatedLastBCH: newLastBCH };
}

/**
 * Phân công sắp xếp học sinh vào 3 vị trí trực sáng Thứ Hai (SHDC):
 * 1. Chức năng KHÓA THEO HỌC SINH (lockedStudents):
 *    - Học sinh bị khóa sẽ được giữ nguyên tại vị trí hiện tại của họ.
 *    - Các học sinh chưa bị khóa sẽ được sắp xếp/xoay tua.
 * 2. Lựa chọn "2 bạn 1 vị trí":
 *    - Lấy ĐÚNG 2 bạn cho mỗi vị trí (3 vị trí x 2 = 6 bạn). Tuyệt đối KHÔNG chia thêm bạn thứ 7, 8...
 *    - Các bạn chưa được sắp xếp (4 bạn còn lại trong 10 bạn) sẽ được ưu tiên xếp vào đợt sắp xếp (tuần) tiếp theo và xoay vòng liên tục, công bằng.
 * 3. Lựa chọn "3 bạn 1 vị trí":
 *    - Sắp xếp 3 bạn/vị trí (chuẩn 3-3-4 cho 10 học sinh).
 * 4. Tùy chỉnh (custom):
 *    - Giữ nguyên cấu hình do người dùng tự phân bổ.
 */
export function generateSHDCSchedule(
  currentSHDC: import('../types').SHDCSchedule | undefined,
  students: import('../types').SupportStudent[],
  mode: import('../types').SHDCDistributionMode,
  weekNumber: number,
  allWeeks?: Record<number, import('../types').WeekSchedule>,
  locationsList?: import('../types').SHDCLocationConfig[]
): import('../types').SHDCSchedule {
  const activeLocations: string[] =
    locationsList && locationsList.length > 0
      ? locationsList.map((l) => l.key)
      : ['khu_c', 'thu_vien', 'cong_truoc'];

  // Khởi tạo khung lịch SHDC
  const newLocations: Record<string, import('../types').SHDCLocationSlot> = {};
  activeLocations.forEach((loc) => {
    newLocations[loc] = { locationKey: loc, students: [] };
  });

  const currentLocked = new Set<string>(currentSHDC?.lockedStudents || []);

  // Nếu là chế độ tùy chỉnh thủ công, giữ nguyên
  if (mode === 'custom') {
    activeLocations.forEach((loc) => {
      newLocations[loc].students = [...(currentSHDC?.locations?.[loc]?.students || [])];
    });
    return {
      mode: 'custom',
      locations: newLocations,
      lockedStudents: Array.from(currentLocked),
    };
  }

  // 1. Giữ nguyên vị trí của những học sinh ĐÃ ĐƯỢC KHÓA
  const assignedStudentIds = new Set<string>();
  activeLocations.forEach((loc) => {
    const prevStudents = currentSHDC?.locations?.[loc]?.students || [];
    const lockedHere = prevStudents.filter((stId) => currentLocked.has(stId));
    newLocations[loc].students = [...lockedHere];
    lockedHere.forEach((id) => assignedStudentIds.add(id));
  });

  // 2. Tìm danh sách học sinh chưa khóa
  const unlockedStudents = students.filter((st) => !currentLocked.has(st.id));

  if (unlockedStudents.length === 0) {
    return {
      mode,
      locations: newLocations,
      lockedStudents: Array.from(currentLocked),
    };
  }

  // 3. XÁC ĐỊNH THỨ TỰ ƯU TIÊN XOAY VÒNG:
  // Tìm xem ở tuần gần nhất trước đó (ví dụ tuần weekNumber - 1), những học sinh nào CHƯA ĐƯỢC SẮP XẾP.
  // Các bạn chưa được sắp xếp đó sẽ được đưa lên đầu danh sách ưu tiên xếp tuần này!
  let orderedUnlockedStudents: import('../types').SupportStudent[] = [];

  if (allWeeks && weekNumber > 1) {
    // Tìm tuần liền trước có dữ liệu SHDC
    let prevWeekSHDC: import('../types').SHDCSchedule | undefined;
    for (let w = weekNumber - 1; w >= 1; w--) {
      if (allWeeks[w]?.shdc?.locations) {
        prevWeekSHDC = allWeeks[w].shdc;
        break;
      }
    }

    if (prevWeekSHDC) {
      const prevScheduledIds = new Set<string>();
      Object.values(prevWeekSHDC.locations).forEach((loc) => {
        loc.students.forEach((id) => prevScheduledIds.add(id));
      });

      // Nhóm A: Những bạn CHƯA được xếp tuần trước (ưu tiên số 1)
      const unassignedLastWeek = unlockedStudents.filter((s) => !prevScheduledIds.has(s.id));
      // Nhóm B: Những bạn ĐÃ được xếp tuần trước (ưu tiên số 2)
      const assignedLastWeek = unlockedStudents.filter((s) => prevScheduledIds.has(s.id));

      // Xoay tua nhẹ trong nhóm B để đảm bảo công bằng
      const offsetB = (weekNumber - 1) % (assignedLastWeek.length || 1);
      const rotatedAssigned = [
        ...assignedLastWeek.slice(offsetB),
        ...assignedLastWeek.slice(0, offsetB),
      ];

      orderedUnlockedStudents = [...unassignedLastWeek, ...rotatedAssigned];
    }
  }

  // Nếu không có lịch tuần trước (ví dụ tuần 1 hoặc chưa có dữ liệu), dùng xoay tua theo số tuần
  if (orderedUnlockedStudents.length === 0) {
    const offset = (weekNumber - 1) % (unlockedStudents.length || 1);
    orderedUnlockedStudents = [
      ...unlockedStudents.slice(offset),
      ...unlockedStudents.slice(0, offset),
    ];
  }

  // 4. TÍNH DUNG LƯỢNG MỤC TIÊU CHO TỪNG VỊ TRÍ
  if (mode === '2_per_location') {
    // YÊU CẦU ĐẶC BIỆT: "khi chọn 2 bạn 1 vị trí thì chỉ lấy đúng 2 bạn chứ không thêm"
    // Mỗi vị trí tối đa đúng 2 bạn.
    let studentIdx = 0;
    for (const loc of activeLocations) {
      const currentCount = newLocations[loc].students.length;
      const need = Math.max(0, 2 - currentCount); // Chỉ lấy đủ 2 bạn cho mỗi vị trí

      for (let i = 0; i < need && studentIdx < orderedUnlockedStudents.length; i++) {
        const candidate = orderedUnlockedStudents[studentIdx];
        studentIdx++;
        newLocations[loc].students.push(candidate.id);
        assignedStudentIds.add(candidate.id);
      }
    }
    // Dừng lại ở đây, không chia thêm các học sinh còn lại vào vị trí nào nữa!
    // Các bạn chưa được sắp xếp sẽ nằm ở danh sách ưu tiên cho tuần tiếp theo!
  } else if (mode === '3_per_location') {
    // 3 bạn / 1 vị trí: Mỗi vị trí chuẩn 3 bạn, nếu còn dư thì phân bổ đều
    const targetCounts: Record<string, number> = {};
    activeLocations.forEach((loc) => {
      targetCounts[loc] = 3;
    });

    let extra = students.length - activeLocations.length * 3;
    let extraIdx = activeLocations.length - 1;
    while (extra > 0 && activeLocations.length > 0) {
      const loc = activeLocations[extraIdx % activeLocations.length];
      targetCounts[loc]++;
      extra--;
      extraIdx--;
    }

    let studentIdx = 0;
    for (const loc of activeLocations) {
      const currentCount = newLocations[loc].students.length;
      const need = Math.max(0, (targetCounts[loc] || 3) - currentCount);

      for (let i = 0; i < need && studentIdx < orderedUnlockedStudents.length; i++) {
        const candidate = orderedUnlockedStudents[studentIdx];
        studentIdx++;
        newLocations[loc].students.push(candidate.id);
        assignedStudentIds.add(candidate.id);
      }
    }

    // Nếu vẫn còn sót học sinh nào chưa xếp hết (ví dụ danh sách > tổng target)
    const lastLoc = activeLocations[activeLocations.length - 1] || 'cong_truoc';
    while (studentIdx < orderedUnlockedStudents.length) {
      const candidate = orderedUnlockedStudents[studentIdx];
      studentIdx++;
      if (newLocations[lastLoc]) {
        newLocations[lastLoc].students.push(candidate.id);
      }
      assignedStudentIds.add(candidate.id);
    }
  }

  return {
    mode,
    locations: newLocations,
    lockedStudents: Array.from(currentLocked),
  };
}

/**
 * Giữ sang tuần tiếp theo các phân công đã bị KHÓA (BCH hoặc Học sinh hoặc SHDC):
 * Nếu ở tuần trước đó (hoặc tuần liền kề gần nhất) có ô BCH bị khóa, hoặc ô học sinh bị khóa,
 * hoặc học sinh trực SHDC bị khóa, thì tự động kế thừa (carry over) sang tuần mới này.
 */
export function carryLockedElementsFromPriorWeek(
  targetWeek: WeekSchedule,
  weekNumber: number,
  allWeeks: Record<number, WeekSchedule>
): WeekSchedule {
  // Tìm tuần trước đó gần nhất có dữ liệu
  const priorWeekNums = Object.keys(allWeeks)
    .map(Number)
    .filter((num) => num < weekNumber && allWeeks[num]?.grid)
    .sort((a, b) => b - a);

  if (priorWeekNums.length === 0) return targetWeek;

  const prevWeek = allWeeks[priorWeekNums[0]];
  if (!prevWeek) return targetWeek;

  const updatedWeek: WeekSchedule = JSON.parse(JSON.stringify(targetWeek));

  // 1. Kế thừa ô BCH bị khóa và ô Học sinh trực tuần bị khóa trong Grid
  for (const grade of ORDERED_GRADES) {
    for (const day of ALL_DAYS) {
      const prevCell = prevWeek.grid?.[grade]?.[day];
      if (!prevCell) continue;

      if (!updatedWeek.grid[grade]) {
        updatedWeek.grid[grade] = {} as any;
      }
      if (!updatedWeek.grid[grade][day]) {
        updatedWeek.grid[grade][day] = {
          students: [],
          bch: { bchId: undefined, isLocked: false },
        };
      }

      const currCell = updatedWeek.grid[grade][day];

      // Nếu tuần trước có BCH bị khóa -> giữ nguyên sang tuần này
      if (prevCell.bch?.isLocked && prevCell.bch.bchId) {
        // Chỉ ghi đè nếu tuần này chưa có ô bị khóa riêng
        if (!currCell.bch?.isLocked) {
          currCell.bch = {
            bchId: prevCell.bch.bchId,
            isLocked: true,
          };
        }
      }

      // Nếu tuần trước có Học sinh trực bị khóa -> giữ nguyên sang tuần này
      if (prevCell.isStudentsLocked && prevCell.students && prevCell.students.length > 0) {
        if (!currCell.isStudentsLocked) {
          currCell.students = [...prevCell.students];
          currCell.isStudentsLocked = true;
        }
      }
    }
  }

  // 2. Kế thừa học sinh bị khóa tại các vị trí SHDC sáng Thứ Hai
  if (prevWeek.shdc?.lockedStudents && prevWeek.shdc.lockedStudents.length > 0) {
    const prevLockedSet = new Set<string>(prevWeek.shdc.lockedStudents);
    if (!updatedWeek.shdc) {
      updatedWeek.shdc = {
        mode: prevWeek.shdc.mode || '3_per_location',
        locations: {},
        lockedStudents: [],
      };
    }

    const currLockedSet = new Set<string>(updatedWeek.shdc.lockedStudents || []);

    if (prevWeek.shdc.locations) {
      Object.entries(prevWeek.shdc.locations).forEach(([locKey, locSlot]) => {
        const lockedInLoc = (locSlot.students || []).filter((stId) => prevLockedSet.has(stId));
        if (lockedInLoc.length > 0) {
          if (!updatedWeek.shdc!.locations[locKey]) {
            updatedWeek.shdc!.locations[locKey] = {
              locationKey: locKey,
              students: [],
            };
          }
          const currLoc = updatedWeek.shdc!.locations[locKey];
          lockedInLoc.forEach((stId) => {
            if (!currLoc.students.includes(stId)) {
              currLoc.students.push(stId);
            }
            currLockedSet.add(stId);
          });
        }
      });
    }

    updatedWeek.shdc.lockedStudents = Array.from(currLockedSet);
  }

  // 3. Kế thừa phân công lớp trực Thứ Hai & Vệ sinh cầu thang nếu tuần trước bị khóa hoặc tuần mới chưa có
  if (prevWeek.mondayDutyClasses) {
    const prevDuty = prevWeek.mondayDutyClasses;
    // TH 1: Toàn bộ phân công lớp trực & cầu thang tuần trước bị khóa (isLocked = true)
    if (prevDuty.isLocked) {
      // Nếu tuần mới chưa khóa riêng biệt, kế thừa nguyên vẹn phân công bị khóa từ tuần trước
      if (!updatedWeek.mondayDutyClasses?.isLocked) {
        updatedWeek.mondayDutyClasses = JSON.parse(JSON.stringify(prevDuty));
      }
    } 
    // TH 2: Tuần trước có các vị trí lớp trực / cầu thang bị khóa lẻ (lockedFields)
    else if (prevDuty.lockedFields && Object.keys(prevDuty.lockedFields).length > 0) {
      if (!updatedWeek.mondayDutyClasses) {
        updatedWeek.mondayDutyClasses = JSON.parse(JSON.stringify(prevDuty));
      } else {
        const uDuty = updatedWeek.mondayDutyClasses;
        uDuty.lockedFields = { ...(uDuty.lockedFields || {}) };

        // Sao chép Trực tuần bị khóa
        if (prevDuty.lockedFields['weekDuty.morning'] && prevDuty.weekDuty?.morning) {
          if (!uDuty.weekDuty) uDuty.weekDuty = {};
          uDuty.weekDuty.morning = prevDuty.weekDuty.morning;
          uDuty.lockedFields['weekDuty.morning'] = true;
        }
        if (prevDuty.lockedFields['weekDuty.afternoon'] && prevDuty.weekDuty?.afternoon) {
          if (!uDuty.weekDuty) uDuty.weekDuty = {};
          uDuty.weekDuty.afternoon = prevDuty.weekDuty.afternoon;
          uDuty.lockedFields['weekDuty.afternoon'] = true;
        }

        // Sao chép Sáng: Cổng, Chuẩn bị, Dọn dẹp sân khấu bị khóa
        if (prevDuty.lockedFields['morning.gateDutyClass'] && prevDuty.morning?.gateDutyClass) {
          if (!uDuty.morning) uDuty.morning = {};
          uDuty.morning.gateDutyClass = prevDuty.morning.gateDutyClass;
          uDuty.lockedFields['morning.gateDutyClass'] = true;
        }
        if (prevDuty.lockedFields['morning.stagePrepClass'] && prevDuty.morning?.stagePrepClass) {
          if (!uDuty.morning) uDuty.morning = {};
          uDuty.morning.stagePrepClass = prevDuty.morning.stagePrepClass;
          uDuty.lockedFields['morning.stagePrepClass'] = true;
        }
        if (prevDuty.lockedFields['morning.stageCleanClass'] && prevDuty.morning?.stageCleanClass) {
          if (!uDuty.morning) uDuty.morning = {};
          uDuty.morning.stageCleanClass = prevDuty.morning.stageCleanClass;
          uDuty.lockedFields['morning.stageCleanClass'] = true;
        }

        // Sao chép Chiều: Cổng, Chuẩn bị, Dọn dẹp sân khấu bị khóa
        if (prevDuty.lockedFields['afternoon.gateDutyClass'] && prevDuty.afternoon?.gateDutyClass) {
          if (!uDuty.afternoon) uDuty.afternoon = {};
          uDuty.afternoon.gateDutyClass = prevDuty.afternoon.gateDutyClass;
          uDuty.lockedFields['afternoon.gateDutyClass'] = true;
        }
        if (prevDuty.lockedFields['afternoon.stagePrepClass'] && prevDuty.afternoon?.stagePrepClass) {
          if (!uDuty.afternoon) uDuty.afternoon = {};
          uDuty.afternoon.stagePrepClass = prevDuty.afternoon.stagePrepClass;
          uDuty.lockedFields['afternoon.stagePrepClass'] = true;
        }
        if (prevDuty.lockedFields['afternoon.stageCleanClass'] && prevDuty.afternoon?.stageCleanClass) {
          if (!uDuty.afternoon) uDuty.afternoon = {};
          uDuty.afternoon.stageCleanClass = prevDuty.afternoon.stageCleanClass;
          uDuty.lockedFields['afternoon.stageCleanClass'] = true;
        }

        // Sao chép Vệ sinh cầu thang Sáng & Chiều bị khóa
        const areas = ['khuA', 'khuB_cong', 'khuB_thuvien', 'khuC1', 'khuD'] as const;
        areas.forEach((area) => {
          const morningKey = `stairCleaning.morning.${area}`;
          if (prevDuty.lockedFields?.[morningKey] && prevDuty.stairCleaning?.morning?.[area]) {
            if (!uDuty.stairCleaning) uDuty.stairCleaning = {};
            if (!uDuty.stairCleaning.morning) uDuty.stairCleaning.morning = {};
            uDuty.stairCleaning.morning[area] = prevDuty.stairCleaning.morning[area];
            if (!uDuty.lockedFields) uDuty.lockedFields = {};
            uDuty.lockedFields[morningKey] = true;
          }

          const afternoonKey = `stairCleaning.afternoon.${area}`;
          if (prevDuty.lockedFields?.[afternoonKey] && prevDuty.stairCleaning?.afternoon?.[area]) {
            if (!uDuty.stairCleaning) uDuty.stairCleaning = {};
            if (!uDuty.stairCleaning.afternoon) uDuty.stairCleaning.afternoon = {};
            uDuty.stairCleaning.afternoon[area] = prevDuty.stairCleaning.afternoon[area];
            if (!uDuty.lockedFields) uDuty.lockedFields = {};
            uDuty.lockedFields[afternoonKey] = true;
          }
        });
      }
    } 
    // TH 3: Tuần mới chưa hề có phân công -> tự động nạp từ tuần trước
    else if (!updatedWeek.mondayDutyClasses) {
      updatedWeek.mondayDutyClasses = JSON.parse(JSON.stringify(prevDuty));
    }
  }

  return updatedWeek;
}

