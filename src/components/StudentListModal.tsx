import React, { useState } from 'react';
import { SupportStudent, GradeLevel } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  students: SupportStudent[];
  onSaveStudents: (newStudents: SupportStudent[]) => void;
}

export const StudentListModal: React.FC<Props> = ({
  isOpen,
  onClose,
  students,
  onSaveStudents,
}) => {
  const [list, setList] = useState<SupportStudent[]>(() => {
    // Đảm bảo có tối đa/tối thiểu các học sinh theo danh sách
    return JSON.parse(JSON.stringify(students));
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (index: number, field: keyof SupportStudent, value: string) => {
    setErrorMsg(null);
    const updated = [...list];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    // Tự động suy luận khối nếu người dùng nhập lớp (ví dụ "10C1" -> khối "10")
    if (field === 'className') {
      const match = value.match(/^(10|11|12)/);
      if (match) {
        updated[index].grade = match[1] as GradeLevel;
      }
    }
    setList(updated);
  };

  const handleAddRow = () => {
    if (list.length >= 15) {
      setErrorMsg('Danh sách đã đạt số lượng tối đa.');
      return;
    }
    const newStudent: SupportStudent = {
      id: `st-${Date.now()}`,
      fullName: '',
      className: '10C1',
      grade: '10',
    };
    setList([...list, newStudent]);
  };

  const handleDeleteRow = (index: number) => {
    if (list.length <= 1) {
      setErrorMsg('Danh sách phải có ít nhất 1 học sinh.');
      return;
    }
    const updated = list.filter((_, i) => i !== index);
    setList(updated);
  };

  const handleSave = () => {
    // Validate tên không được để trống
    for (let i = 0; i < list.length; i++) {
      if (!list[i].fullName.trim()) {
        setErrorMsg(`Dòng ${i + 1}: Vui lòng nhập Họ và tên.`);
        return;
      }
    }
    onSaveStudents(list);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3">
      <div className="bg-white border border-gray-400 rounded-sm shadow-lg max-w-2xl w-full p-4 text-sm font-sans">
        <div className="flex justify-between items-center border-b border-gray-300 pb-2 mb-3">
          <h2 className="font-bold text-base text-gray-900 uppercase">
            DANH SÁCH 10 HỌC SINH TRỰC HỖ TRỢ ĐOÀN TRƯỜNG
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black font-bold px-2 py-0.5 text-base border border-transparent hover:border-gray-300"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-gray-600 mb-2">
          Học sinh được phân bổ vào đúng hàng Khối (12, 11, hoặc 10) tương ứng với lớp của mình.
        </p>

        {errorMsg && (
          <div className="mb-2 p-1.5 bg-red-50 text-red-700 text-xs border border-red-300 font-medium">
            {errorMsg}
          </div>
        )}

        <div className="overflow-x-auto max-h-[360px] border border-gray-300">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-xs text-gray-800 border-b border-gray-300 font-bold">
                <th className="p-1.5 border-r border-gray-300 w-10 text-center">STT</th>
                <th className="p-1.5 border-r border-gray-300">Họ và tên</th>
                <th className="p-1.5 border-r border-gray-300 w-28 text-center">Lớp</th>
                <th className="p-1.5 border-r border-gray-300 w-24 text-center">Khối</th>
                <th className="p-1.5 w-12 text-center">Xóa</th>
              </tr>
            </thead>
            <tbody>
              {list.map((st, idx) => (
                <tr key={st.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-1.5 border-r border-gray-300 text-center text-xs font-semibold text-gray-600">
                    {idx + 1}
                  </td>
                  <td className="p-1 border-r border-gray-300">
                    <input
                      type="text"
                      value={st.fullName}
                      onChange={(e) => handleChange(idx, 'fullName', e.target.value)}
                      placeholder="Ví dụ: Nguyễn Văn An"
                      className="w-full px-2 py-1 text-xs border border-gray-300 focus:border-blue-600 focus:outline-hidden"
                    />
                  </td>
                  <td className="p-1 border-r border-gray-300 text-center">
                    <input
                      type="text"
                      value={st.className}
                      onChange={(e) => handleChange(idx, 'className', e.target.value)}
                      placeholder="10C1"
                      className="w-full px-2 py-1 text-xs text-center border border-gray-300 focus:border-blue-600 focus:outline-hidden font-medium"
                    />
                  </td>
                  <td className="p-1 border-r border-gray-300 text-center">
                    <select
                      value={st.grade}
                      onChange={(e) => handleChange(idx, 'grade', e.target.value as GradeLevel)}
                      className="w-full px-1.5 py-1 text-xs border border-gray-300 bg-white focus:border-blue-600 focus:outline-hidden font-medium"
                    >
                      <option value="12">Khối 12</option>
                      <option value="11">Khối 11</option>
                      <option value="10">Khối 10</option>
                    </select>
                  </td>
                  <td className="p-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(idx)}
                      title="Xóa dòng này"
                      className="text-gray-400 hover:text-red-600 font-bold px-1.5 py-0.5"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-200">
          <button
            type="button"
            onClick={handleAddRow}
            className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 font-medium"
          >
            + Thêm học sinh
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 font-medium"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1 text-xs bg-blue-700 hover:bg-blue-800 text-white font-bold border border-blue-800"
            >
              Lưu danh sách
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
