import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

/**
 * Danh sách các thuộc tính CSS trọng yếu cần sao chép trực tiếp từ DOM đã render (computed styles)
 * sang DOM clone trước khi html2canvas xử lý.
 * Điều này giải quyết triệt để vấn đề:
 * 1. Mất định dạng khi deploy do stylesheet external bị chặn CORS (SecurityError: Failed to read cssRules).
 * 2. Lỗi màu sắc "oklch" của Tailwind v4 (window.getComputedStyle luôn tự động chuẩn hóa sang rgb/rgba).
 * 3. Bảo đảm độ rộng cột, viền bảng, màu nền và phông chữ luôn chính xác 100% như trên màn hình.
 */
const CSS_PROPERTIES_TO_INLINE = [
  'display',
  'box-sizing',
  'position',
  'width',
  'min-width',
  'max-width',
  'height',
  'min-height',
  'max-height',
  'margin',
  'margin-top',
  'margin-bottom',
  'margin-left',
  'margin-right',
  'padding',
  'padding-top',
  'padding-bottom',
  'padding-left',
  'padding-right',
  'border',
  'border-width',
  'border-style',
  'border-color',
  'border-top',
  'border-bottom',
  'border-left',
  'border-right',
  'border-top-width',
  'border-bottom-width',
  'border-left-width',
  'border-right-width',
  'border-top-style',
  'border-bottom-style',
  'border-left-style',
  'border-right-style',
  'border-top-color',
  'border-bottom-color',
  'border-left-color',
  'border-right-color',
  'border-collapse',
  'border-spacing',
  'border-radius',
  'background-color',
  'background-image',
  'color',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'line-height',
  'letter-spacing',
  'text-align',
  'text-transform',
  'vertical-align',
  'white-space',
  'word-break',
  'flex-direction',
  'justify-content',
  'align-items',
  'flex-wrap',
  'gap',
  'grid-template-columns',
  'grid-column',
  'grid-row',
  'table-layout',
  'opacity',
];

/**
 * Đọc computed style đã render hoàn chỉnh từ DOM nguồn và gán thẳng thành inline style cho DOM clone.
 */
function applyComputedStylesDeep(source: HTMLElement, target: HTMLElement): void {
  const sourceNodes = [source, ...Array.from(source.querySelectorAll<HTMLElement>('*'))];
  const targetNodes = [target, ...Array.from(target.querySelectorAll<HTMLElement>('*'))];

  const total = Math.min(sourceNodes.length, targetNodes.length);
  for (let i = 0; i < total; i++) {
    const s = sourceNodes[i];
    const t = targetNodes[i];
    try {
      const computed = window.getComputedStyle(s);
      for (const prop of CSS_PROPERTIES_TO_INLINE) {
        const val = computed.getPropertyValue(prop);
        if (val && val !== 'initial') {
          // getComputedStyle tự động chuyển đổi oklch/hsl sang rgb(r, g, b) chuẩn mực
          t.style.setProperty(prop, val);
        }
      }
    } catch {
      // bỏ qua lỗi node đơn lẻ nếu có
    }
  }
}

/**
 * Hàm hỗ trợ lấy kích thước thực và render phần tử HTML thành HTMLCanvasElement sắc nét.
 * Đảm bảo tương thích hoàn hảo trong môi trường iframe lẫn tab mới, đặc biệt khi deploy production.
 */
async function renderElementToCanvas(sourceElement: HTMLElement): Promise<HTMLCanvasElement> {
  // 1. Tạo wrapper tạm gắn vào body đặt ngoài viewport (left: -99999px) nhưng opacity: 1, visibility: visible
  const wrapper = document.createElement('div');
  wrapper.setAttribute('data-export-temp-wrapper', 'true');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-99999px';
  wrapper.style.top = '0px';
  wrapper.style.width = '1120px';
  wrapper.style.backgroundColor = '#ffffff';
  wrapper.style.zIndex = '-9999';
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

  // 3. Sao chép toàn bộ computed style từ sourceElement sang clone
  applyComputedStylesDeep(sourceElement, clone);

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    // Chờ 150ms để trình duyệt kích hoạt render layout và nạp xong phông chữ
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
      onclone: (clonedDoc) => {
        // Gỡ bỏ toàn bộ thẻ <link rel="stylesheet"> ngoại vi trong cloned sandbox để tránh lỗi
        // CORS SecurityError và lỗi không parse được "oklch" trong tệp CSS đã build
        const linkSheets = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
        linkSheets.forEach((link) => link.remove());

        // Bổ sung style cơ bản an toàn cho sandbox
        const safeStyle = clonedDoc.createElement('style');
        safeStyle.textContent = `
          * { box-sizing: border-box !important; }
          body { margin: 0; padding: 0; background-color: #ffffff !important; font-family: Arial, Roboto, 'Segoe UI', sans-serif !important; }
          table { border-collapse: collapse !important; border-spacing: 0 !important; }
          th, td { box-sizing: border-box !important; }
        `;
        clonedDoc.head.appendChild(safeStyle);
      },
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
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Không thể tạo file ảnh từ canvas!'));
          return;
        }
        const safeName = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
        downloadFile(blob, safeName);
        resolve();
      },
      'image/png',
      1.0
    );
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

  const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm

  // Tối đa lề: Đặt lề tối thiểu 4mm để tận dụng tối đa bề ngang và bề dọc của trang A4
  const marginX = 4; // lề trái/phải 4mm
  const marginY = 4; // lề trên/dưới 4mm

  const printableWidth = pageWidth - marginX * 2; // 202 mm
  const printableHeight = pageHeight - marginY * 2; // 289 mm

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  // Tính chiều cao của ảnh khi co dãn cho vừa printableWidth (202mm)
  const renderedImgHeight = (printableWidth * canvasHeight) / canvasWidth;

  const imgData = canvas.toDataURL('image/png', 1.0);

  // Nếu toàn bộ nội dung nằm vừa trong 1 trang A4
  if (renderedImgHeight <= printableHeight) {
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
