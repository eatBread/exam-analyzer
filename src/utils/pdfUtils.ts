import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { AnalysisResult } from '../types';

// 扩展jsPDF类型以包含autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// 生成PDF报告
export const generatePDFReport = async (analysisResult: AnalysisResult, filename: string = '四校数学成绩分析报告') => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPosition = 20;

  // 设置字体
  pdf.setFont('helvetica');

  // 标题
  pdf.setFontSize(20);
  pdf.text('四校数学成绩分析报告', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;

  // 总体统计
  pdf.setFontSize(16);
  pdf.text('总体统计', 20, yPosition);
  yPosition += 10;

  pdf.setFontSize(12);
  const overallStats = analysisResult.overallStats;
  pdf.text(`总学生数: ${overallStats.totalStudents}`, 20, yPosition);
  yPosition += 6;
  pdf.text(`总学校数: ${overallStats.totalSchools}`, 20, yPosition);
  yPosition += 6;
  pdf.text(`总班级数: ${overallStats.totalClasses}`, 20, yPosition);
  yPosition += 6;
  pdf.text(`整体平均分: ${overallStats.overallAverage}`, 20, yPosition);
  yPosition += 6;
  pdf.text(`整体及格率: ${overallStats.overallPassRate}%`, 20, yPosition);
  yPosition += 6;
  pdf.text(`整体优秀率: ${overallStats.overallExcellentRate}%`, 20, yPosition);
  yPosition += 15;

  // 学校统计表格
  pdf.setFontSize(16);
  pdf.text('各学校统计', 20, yPosition);
  yPosition += 10;

  const schoolData = analysisResult.schoolStats.map(stat => [
    stat.rank.toString(),
    stat.schoolName,
    stat.studentCount.toString(),
    stat.classCount.toString(),
    stat.average.toFixed(2),
    stat.passRate.toFixed(2) + '%',
    stat.excellentRate.toFixed(2) + '%'
  ]);

  autoTable(pdf, {
    head: [['排名', '学校名称', '学生数', '班级数', '平均分', '及格率', '优秀率']],
    body: schoolData,
    startY: yPosition,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: 20, right: 20 }
  });

  yPosition = (pdf as any).lastAutoTable.finalY + 10;

  // 班级统计表格
  pdf.setFontSize(16);
  pdf.text('各班级统计', 20, yPosition);
  yPosition += 10;

  const classData = analysisResult.classStats.map(stat => [
    stat.overallRank.toString(),
    stat.schoolRank.toString(),
    stat.school,
    stat.className,
    stat.studentCount.toString(),
    stat.average.toFixed(2),
    stat.passRate.toFixed(2) + '%',
    stat.excellentRate.toFixed(2) + '%'
  ]);

  autoTable(pdf, {
    head: [['总排名', '校内排名', '学校', '班级', '人数', '平均分', '及格率', '优秀率']],
    body: classData,
    startY: yPosition,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: 20, right: 20 }
  });

  yPosition = (pdf as any).lastAutoTable.finalY + 10;

  // 科目统计表格
  pdf.setFontSize(16);
  pdf.text('科目统计', 20, yPosition);
  yPosition += 10;

  const subjectData = analysisResult.subjectStats.map(stat => [
    stat.subject,
    stat.average.toFixed(2),
    stat.max.toString(),
    stat.min.toString(),
    stat.passRate.toFixed(2) + '%',
    stat.excellentRate.toFixed(2) + '%'
  ]);

  autoTable(pdf, {
    head: [['科目', '平均分', '最高分', '最低分', '及格率', '优秀率']],
    body: subjectData,
    startY: yPosition,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: 20, right: 20 }
  });

  // 保存PDF
  pdf.save(`${filename}.pdf`);
};

// 生成当前视图的PDF
export const generatePDFFromElement = async (elementId: string, filename: string = '当前视图', compressLevel: 'normal' | 'high' | 'maximum' | 'balanced' = 'balanced') => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  // 根据压缩级别设置参数
  let scale, quality;
  switch (compressLevel) {
    case 'maximum':
      scale = 1.0;
      quality = 0.5; // 50%质量
      break;
    case 'high':
      scale = 1.3;
      quality = 0.75; // 75%质量
      break;
    case 'normal':
      scale = 1.8; // 提高缩放比例
      quality = 0.85; // 85%质量
      break;
    case 'balanced':
    default:
      scale = 2.0; // 接近原始质量
      quality = 0.9; // 90%质量
      break;
  }

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false, // 禁用日志
    removeContainer: true // 移除临时容器
  });

  // 使用JPEG格式压缩图片
  const imgData = canvas.toDataURL('image/jpeg', quality);
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  const imgWidth = pageWidth - 20;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  if (imgHeight > pageHeight) {
    // 如果图片高度超过页面高度，需要分页
    const totalPages = Math.ceil(imgHeight / pageHeight);
    for (let i = 0; i < totalPages; i++) {
      if (i > 0) {
        pdf.addPage();
      }
      
      const yOffset = -i * pageHeight;
      pdf.addImage(imgData, 'JPEG', 10, yOffset, imgWidth, imgHeight);
    }
  } else {
    pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
  }

  pdf.save(`${filename}.pdf`);
};