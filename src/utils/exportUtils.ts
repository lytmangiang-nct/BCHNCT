import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

/**
 * Hàm hỗ trợ lấy kích thước thực và render phần tử HTML thành HTMLCanvasElement sắc nét.
 * Đảm bảo tương thích hoàn hảo trong môi trường iframe lẫn tab mới.
 */
async function renderElementToCanvas(sourceElement: HTMLElement): Promise<HTMLCanvasElement> {
  // 1. Tạo wrapper tạm gắn vào body với visibility: visible, opacity: 1, zIndex âm
  const wrapper = document.createElement('div');
  wrapper.setAttribute('data-export-temp-wrapper', 'true');
  wrapper.style.position = 'fixed';
  wrapper.style.top = '0px';
  wrapper.style.left = '0px';
  wrapper.style.width = '1120px';
  wrapper.style.backgroundColor = '#ffffff';
  wrapper.style.zIndex = '-99999';
  wrapper.style.pointerEvents = 'none';
  wrapper.style.visibility = 'visible';
  wrapper.style.opacity = '1';
  wrapper.style.overflow = 'visible';

  // 2. Clone phần tử mục tiêu
  const clone = sourceElement.cloneNode(true) as HTMLElement;
  clone.style.width = '1120px';
  clone.style.minWidth = '1120px';
  clone.style.maxWidth = '1120px';
  clone.style.margin = '0 auto';
  clone.style.backgroundColor = '#ffffff';
  clone.style.visibility = 'visible';
  clone.style.display = 'block';
  clone.style.opacity = '1';

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    // Chờ 150ms để trình duyệt render layout và nạp xong phông chữ
    await new Promise((resolve) => setTimeout(resolve, 150));

    const canvas = await html2canvas(clone, {
      scale: 2.0,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: 1120,
      windowWidth: 1120,
      scrollX: 0,
      scrollY: 0,
    });

    return canvas;
  } finally {
    if (document.body.contains(wrapper)) {
      document.body.removeChild(wrapper);
    }
  }
}

/**
 * Tải file an toàn qua thẻ <a> blob url
 */
function downloadFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Xuất phần tử HTML ra ảnh PNG chất lượng cao
 */
export async function exportToImage(element: HTMLElement, fileName: string): Promise<void> {
  const canvas = await renderElementToCanvas(element);
  
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Không thể tạo file ảnh từ canvas!'));
        return;
      }
      const safeName = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
      downloadFile(blob, safeName);
      resolve();
    }, 'image/png', 1.0);
  });
}

/**
 * Xuất phần tử HTML ra file PDF theo khổ A4 DỌC và TỐI ĐA LỀ (A4 Portrait, Max Margins)
 */
export async function exportToPDF(element: HTMLElement, fileName: string): Promise<void> {
  const canvas = await renderElementToCanvas(element);

  // Kích thước chuẩn khổ A4 dọc tính theo mm: 210mm x 297mm
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();   // 210 mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm

  // Tối đa lề: Đặt lề tối thiểu 4mm (hoặc 5mm) để tận dụng tối đa bề ngang và bề dọc của trang A4
  const marginX = 4; // lề trái/phải 4mm
  const marginY = 4; // lề trên/dưới 4mm

  const printableWidth = pageWidth - marginX * 2;   // 202 mm
  const printableHeight = pageHeight - marginY * 2; // 289 mm

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  // Tính chiều cao của ảnh khi co dãn cho vừa printableWidth (202mm)
  const renderedImgHeight = (printableWidth * canvasHeight) / canvasWidth;

  // Chuyển canvas sang JPEG chất lượng cao để tránh lag và tối ưu dung lượng, hoặc PNG
  const imgData = canvas.toDataURL('image/png', 1.0);

  // Nếu toàn bộ nội dung nằm vừa hoặc gần vừa trong 1 trang A4
  if (renderedImgHeight <= printableHeight) {
    // Đặt ảnh sát lề trên để tối đa hóa không gian
    pdf.addImage(imgData, 'PNG', marginX, marginY, printableWidth, renderedImgHeight, undefined, 'FAST');
  } else {
    // Trường hợp nội dung dài hơn 1 trang A4 dọc:
    // Cắt ảnh thành từng trang A4 chính xác theo tỷ lệ để không bị mất hay đè nội dung
    const pageCanvasHeight = (printableHeight * canvasWidth) / printableWidth;
    let renderedHeightRemaining = canvasHeight;
    let currentY = 0;
    let pageIndex = 0;

    while (renderedHeightRemaining > 0) {
      if (pageIndex > 0) {
        pdf.addPage('a4', 'portrait');
      }

      const chunkHeight = Math.min(renderedHeightRemaining, pageCanvasHeight);

      // Tạo canvas con cho từng trang
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvasWidth;
      pageCanvas.height = chunkHeight;
      const ctx = pageCanvas.getContext('2d');

      if (ctx) {
        // Nền trắng
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

        // Vẽ phần ảnh tương ứng của trang hiện tại
        ctx.drawImage(
          canvas,
          0,
          currentY,
          canvasWidth,
          chunkHeight,
          0,
          0,
          canvasWidth,
          chunkHeight
        );

        const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
        const pageImgHeightMm = (printableWidth * chunkHeight) / canvasWidth;

        pdf.addImage(
          pageImgData,
          'PNG',
          marginX,
          marginY,
          printableWidth,
          pageImgHeightMm,
          undefined,
          'FAST'
        );
      }

      currentY += chunkHeight;
      renderedHeightRemaining -= chunkHeight;
      pageIndex++;
    }
  }

  const safeName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  const blob = pdf.output('blob');
  downloadFile(blob, safeName);
}
