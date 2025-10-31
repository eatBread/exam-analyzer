import * as XLSX from 'xlsx';
import { StudentScore, AnalysisResult, SubjectStats, ClassStats, SchoolStats, AnalysisConfig } from '../types';

// 读取Excel文件
export const readExcelFile = (file: File): Promise<StudentScore[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        // 解析数据
        const students = parseStudentData(jsonData);
        resolve(students);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsBinaryString(file);
  });
};

// 解析学生数据
const parseStudentData = (data: any[][]): StudentScore[] => {
  if (data.length < 2) return [];
  
  const headers = data[0];
  const students: StudentScore[] = [];
  
  // 查找关键列
  const nameIndex = headers.findIndex(h => 
    typeof h === 'string' && (h.includes('姓名') || h.includes('名字') || h.includes('学生姓名'))
  );
  const studentIdIndex = headers.findIndex(h => 
    typeof h === 'string' && (h.includes('学号') || h.includes('学生编号') || h.includes('考号'))
  );
  const classIndex = headers.findIndex(h => 
    typeof h === 'string' && (h.includes('班级') || h.includes('班别'))
  );
  const schoolIndex = headers.findIndex(h => 
    typeof h === 'string' && (h.includes('学校') || h.includes('校名'))
  );
  const schoolRankIndex = headers.findIndex(h => 
    typeof h === 'string' && (h.includes('校内名次') || h.includes('校内排名'))
  );
  const overallRankIndex = headers.findIndex(h => 
    typeof h === 'string' && (h.includes('联考名次') || h.includes('联考排名') || h.includes('总排名'))
  );
  
  // 查找科目列（排除姓名、学号、班级、学校、排名等）
  const subjectIndices = headers
    .map((h, i) => ({ header: h, index: i }))
    .filter(({ header, index }) => 
      typeof header === 'string' && 
      !header.includes('姓名') && 
      !header.includes('学号') && 
      !header.includes('考号') &&
      !header.includes('班级') &&
      !header.includes('学校') &&
      !header.includes('校名') &&
      !header.includes('名次') &&
      !header.includes('排名') &&
      !header.includes('总分') &&
      !header.includes('平均分') &&
      index !== nameIndex && 
      index !== studentIdIndex && 
      index !== classIndex &&
      index !== schoolIndex &&
      index !== schoolRankIndex &&
      index !== overallRankIndex
    );
  
  // 处理每一行数据
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    const name = row[nameIndex]?.toString() || '';
    const studentId = row[studentIdIndex]?.toString() || '';
    const className = row[classIndex]?.toString() || '';
    const schoolName = row[schoolIndex]?.toString() || '';
    const schoolRank = parseInt(row[schoolRankIndex]) || 0;
    const overallRank = parseInt(row[overallRankIndex]) || 0;
    
    if (!name) continue;
    
    const subjects: { [subject: string]: number } = {};
    const missingSubjects: { [subject: string]: boolean } = {}; // 记录缺考科目
    let total = 0;
    let validSubjectCount = 0;
    
    subjectIndices.forEach(({ header, index }) => {
      const rawValue = row[index];
      let score = 0;
      let isMissing = false;
      
      // 处理非数字分数（缺考、作弊等）
      if (typeof rawValue === 'string') {
        const cleanValue = rawValue.trim();
        if (cleanValue === '缺考' || cleanValue === '作弊' || cleanValue === '违纪' || cleanValue === '' || cleanValue === '-') {
          score = 0;
          isMissing = true;
        } else {
          score = parseFloat(cleanValue) || 0;
        }
      } else if (typeof rawValue === 'number') {
        score = rawValue;
      }
      
      if (!isNaN(score) && score >= 0) {
        subjects[header] = score;
        missingSubjects[header] = isMissing;
        total += score;
        validSubjectCount++;
      }
    });
    
    const average = validSubjectCount > 0 ? total / validSubjectCount : 0;
    
    students.push({
      id: `${i}`,
      name,
      studentId,
      class: className,
      school: schoolName,
      subjects,
      missingSubjects,
      total,
      average: Math.round(average * 100) / 100,
      schoolRank,
      overallRank,
      rank: overallRank || 0 // 使用联考名次作为总排名
    });
  }
  
  // 计算各科目的排名
  const subjectNames = Object.keys(students[0]?.subjects || {});
  subjectNames.forEach(subjectName => {
    // 计算该科目的联考排名
    const subjectScores = students
      .filter(s => !s.missingSubjects?.[subjectName])
      .map(s => ({ student: s, score: s.subjects[subjectName] || 0 }))
      .sort((a, b) => b.score - a.score);
    
    // 分配联考排名
    let currentRank = 1;
    for (let i = 0; i < subjectScores.length; i++) {
      if (i > 0 && subjectScores[i].score !== subjectScores[i - 1].score) {
        currentRank = i + 1;
      }
      if (!subjectScores[i].student.subjectRanks) {
        subjectScores[i].student.subjectRanks = {};
      }
      subjectScores[i].student.subjectRanks[subjectName] = {
        overallRank: currentRank,
        schoolRank: 0 // 稍后计算
      };
    }
    
    // 计算该科目的校内排名
    const schoolGroups = students.reduce((acc, student) => {
      const school = student.school || '未知学校';
      if (!acc[school]) {
        acc[school] = [];
      }
      acc[school].push(student);
      return acc;
    }, {} as { [key: string]: StudentScore[] });
    
    Object.values(schoolGroups).forEach(schoolStudents => {
      const schoolSubjectScores = schoolStudents
        .filter(s => !s.missingSubjects?.[subjectName])
        .map(s => ({ student: s, score: s.subjects[subjectName] || 0 }))
        .sort((a, b) => b.score - a.score);
      
      let schoolRank = 1;
      for (let i = 0; i < schoolSubjectScores.length; i++) {
        if (i > 0 && schoolSubjectScores[i].score !== schoolSubjectScores[i - 1].score) {
          schoolRank = i + 1;
        }
        if (!schoolSubjectScores[i].student.subjectRanks) {
          schoolSubjectScores[i].student.subjectRanks = {};
        }
        schoolSubjectScores[i].student.subjectRanks[subjectName] = {
          ...schoolSubjectScores[i].student.subjectRanks[subjectName],
          schoolRank: schoolRank
        };
      }
    });
  });

  // 如果没有联考名次，则按平均分计算排名
  if (students.every(s => s.overallRank === 0)) {
    students.sort((a, b) => b.average - a.average);
    students.forEach((student, index) => {
      student.rank = index + 1;
      student.overallRank = index + 1;
    });
  }
  
  return students;
};

// 分析成绩数据
export const analyzeScores = (students: StudentScore[], config: AnalysisConfig): AnalysisResult => {
  if (students.length === 0) {
    return {
      students: [],
      subjectStats: [],
      classStats: [],
      schoolStats: [],
      config,
      overallStats: {
        totalStudents: 0,
        overallAverage: 0,
        overallPassRate: 0,
        overallExcellentRate: 0,
        totalSchools: 0,
        totalClasses: 0
      }
    };
  }
  
  // 获取所有科目
  const allSubjects = new Set<string>();
  students.forEach(student => {
    Object.keys(student.subjects).forEach(subject => allSubjects.add(subject));
  });
  
  // 计算科目统计
  const subjectStats: SubjectStats[] = Array.from(allSubjects).map(subject => {
    // 单科分析时排除缺考的学生
    const scores = students
      .filter(s => !s.missingSubjects?.[subject]) // 排除该科缺考的学生
      .map(s => s.subjects[subject])
      .filter(score => !isNaN(score) && score >= 0);
    
    if (scores.length === 0) {
      return {
        subject,
        average: 0,
        max: 0,
        min: 0,
        passRate: 0,
        excellentRate: 0,
        distribution: []
      };
    }
    
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    // 获取该科目的配置
    const subjectConfig = config.subjects?.find(s => s.name === subject) || 
      { name: subject, fullScore: 100, passScore: 60, excellentScore: 90 };
    
    const passCount = scores.filter(score => score >= subjectConfig.passScore).length;
    const excellentCount = scores.filter(score => score >= subjectConfig.excellentScore).length;
    const passRate = (passCount / scores.length) * 100;
    const excellentRate = (excellentCount / scores.length) * 100;
    
    // 计算分数分布
    const distribution = calculateDistribution(scores, subjectConfig);
    
    return {
      subject,
      average: Math.round(average * 100) / 100,
      max,
      min,
      passRate: Math.round(passRate * 100) / 100,
      excellentRate: Math.round(excellentRate * 100) / 100,
      distribution
    };
  });
  
  // 计算班级统计
  const classMap = new Map<string, StudentScore[]>();
  students.forEach(student => {
    const classKey = `${student.school}-${student.class}`;
    if (!classMap.has(classKey)) {
      classMap.set(classKey, []);
    }
    classMap.get(classKey)!.push(student);
  });

  const classStats: ClassStats[] = Array.from(classMap.entries()).map(([, classStudents]) => {
    const schoolName = classStudents[0].school;
    const className = classStudents[0].class;
    // 全学科：使用总分计算平均分，而不是各科平均分的平均值
    const totals = classStudents.map(s => s.total);
    const classAverage = totals.reduce((sum, total) => sum + total, 0) / totals.length;
    // 计算总分及格率和优秀率（使用总分）
    const totalPassScore = config.subjects?.reduce((sum, s) => sum + s.passScore, 0) || 420; // 默认总分及格线
    const totalExcellentScore = config.subjects?.reduce((sum, s) => sum + s.excellentScore, 0) || 630; // 默认总分优秀线
    const passCount = classStudents.filter(s => s.total >= totalPassScore).length;
    const excellentCount = classStudents.filter(s => s.total >= totalExcellentScore).length;
    const passRate = (passCount / classStudents.length) * 100;
    const excellentRate = (excellentCount / classStudents.length) * 100;
    
    return {
      className,
      school: schoolName,
      studentCount: classStudents.length,
      average: Math.round(classAverage * 100) / 100,
      passRate: Math.round(passRate * 100) / 100,
      excellentRate: Math.round(excellentRate * 100) / 100,
      schoolRank: 0, // 稍后计算校内排名
      overallRank: 0, // 稍后计算总排名
      rank: 0 // 保持向后兼容
    };
  });
  
  // 计算学校统计
  const schoolMap = new Map<string, StudentScore[]>();
  students.forEach(student => {
    const schoolName = student.school || '未知学校';
    if (!schoolMap.has(schoolName)) {
      schoolMap.set(schoolName, []);
    }
    schoolMap.get(schoolName)!.push(student);
  });
  
  const schoolStats: SchoolStats[] = Array.from(schoolMap.entries()).map(([schoolName, schoolStudents]) => {
    // 全学科：使用总分计算平均分，而不是各科平均分的平均值
    const totals = schoolStudents.map(s => s.total);
    const schoolAverage = totals.reduce((sum, total) => sum + total, 0) / totals.length;
    // 计算总分及格率和优秀率（使用总分）
    const totalPassScore = config.subjects?.reduce((sum, s) => sum + s.passScore, 0) || 420; // 默认总分及格线
    const totalExcellentScore = config.subjects?.reduce((sum, s) => sum + s.excellentScore, 0) || 630; // 默认总分优秀线
    const passCount = schoolStudents.filter(s => s.total >= totalPassScore).length;
    const excellentCount = schoolStudents.filter(s => s.total >= totalExcellentScore).length;
    const passRate = (passCount / schoolStudents.length) * 100;
    const excellentRate = (excellentCount / schoolStudents.length) * 100;
    
    // 计算该学校的班级数
    const classSet = new Set(schoolStudents.map(s => s.class));
    const classCount = classSet.size;
    
    return {
      schoolName,
      studentCount: schoolStudents.length,
      average: Math.round(schoolAverage * 100) / 100,
      passRate: Math.round(passRate * 100) / 100,
      excellentRate: Math.round(excellentRate * 100) / 100,
      classCount,
      rank: 0 // 稍后计算学校排名
    };
  });
  
  // 计算学校排名
  schoolStats.sort((a, b) => b.average - a.average);
  schoolStats.forEach((schoolStat, index) => {
    schoolStat.rank = index + 1;
  });
  
  // 计算班级排名（校内排名和总排名）
  classStats.sort((a, b) => b.average - a.average);
  classStats.forEach((classStat, index) => {
    classStat.overallRank = index + 1;
    classStat.rank = index + 1; // 保持向后兼容
  });
  
  // 计算每个学校内的班级排名
  schoolStats.forEach(schoolStat => {
    const schoolClasses = classStats.filter(c => c.school === schoolStat.schoolName);
    schoolClasses.sort((a, b) => b.average - a.average);
    schoolClasses.forEach((classStat, index) => {
      classStat.schoolRank = index + 1;
    });
  });
  
  // 计算总体统计
  // 全学科：使用总分计算平均分，而不是各科平均分的平均值
  const overallAverage = students.reduce((sum, s) => sum + s.total, 0) / students.length;
  // 计算总分及格率和优秀率（使用总分）
  const totalPassScore = config.subjects?.reduce((sum, s) => sum + s.passScore, 0) || 420; // 默认总分及格线
  const totalExcellentScore = config.subjects?.reduce((sum, s) => sum + s.excellentScore, 0) || 630; // 默认总分优秀线
  const passCount = students.filter(s => s.total >= totalPassScore).length;
  const excellentCount = students.filter(s => s.total >= totalExcellentScore).length;
  const overallPassRate = (passCount / students.length) * 100;
  const overallExcellentRate = (excellentCount / students.length) * 100;
  
  return {
    students,
    subjectStats,
    classStats,
    schoolStats,
    config,
    overallStats: {
      totalStudents: students.length,
      overallAverage: Math.round(overallAverage * 100) / 100,
      overallPassRate: Math.round(overallPassRate * 100) / 100,
      overallExcellentRate: Math.round(overallExcellentRate * 100) / 100,
      totalSchools: schoolStats.length,
      totalClasses: classStats.length
    }
  };
};

// 计算分数分布
const calculateDistribution = (scores: number[], subjectConfig: { fullScore: number; passScore: number; excellentScore: number }): { range: string; count: number; percentage: number }[] => {
  const fullScore = subjectConfig.fullScore;
  const passScore = subjectConfig.passScore;
  const excellentScore = subjectConfig.excellentScore;
  
  const ranges = [
    { min: 0, max: passScore - 1, label: `0-${passScore - 1}分(不及格)` },
    { min: passScore, max: Math.floor((passScore + excellentScore) / 2) - 1, label: `${passScore}-${Math.floor((passScore + excellentScore) / 2) - 1}分(及格)` },
    { min: Math.floor((passScore + excellentScore) / 2), max: excellentScore - 1, label: `${Math.floor((passScore + excellentScore) / 2)}-${excellentScore - 1}分(良好)` },
    { min: excellentScore, max: fullScore, label: `${excellentScore}-${fullScore}分(优秀)` }
  ];
  
  return ranges.map(range => {
    const count = scores.filter(score => score >= range.min && score <= range.max).length;
    const percentage = scores.length > 0 ? (count / scores.length) * 100 : 0;
    return {
      range: range.label,
      count,
      percentage: Math.round(percentage * 100) / 100
    };
  });
};

// 导出Excel文件
export const exportToExcel = (
  analysisResult: AnalysisResult, 
  filename: string = '四校数学成绩分析报告',
  subjectFilter?: string,
  schoolFilter?: string
) => {
  const workbook = XLSX.utils.book_new();
  
  // 筛选学生数据
  let filteredStudents = analysisResult.students;
  
  // 按学校筛选
  if (schoolFilter && schoolFilter !== '联考') {
    filteredStudents = filteredStudents.filter(s => s.school === schoolFilter);
  }
  
  // 按科目筛选（全学科不需要额外筛选）
  if (subjectFilter && subjectFilter !== '全学科') {
    // 单科分析时排除该科缺考的学生
    filteredStudents = filteredStudents
      .filter(student => !student.missingSubjects?.[subjectFilter]) // 排除该科缺考的学生
      .map(student => {
        const subjectScore = student.subjects[subjectFilter] || 0;
        return {
          ...student,
          average: subjectScore,
          total: subjectScore
        };
      });
  }
  
  // 学生成绩表 - 根据科目筛选决定排序方式
  const studentData = filteredStudents
    .sort((a, b) => {
      if (subjectFilter && subjectFilter !== '全学科') {
        // 单科导出：按该科目成绩降序排序
        const scoreA = a.subjects[subjectFilter] || 0;
        const scoreB = b.subjects[subjectFilter] || 0;
        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }
        // 如果分数相同，按姓名排序
        return a.name.localeCompare(b.name);
      } else {
        // 全科导出：按联考排名排序，如果排名相同则按总分降序
        if (a.overallRank !== b.overallRank) {
          return a.overallRank - b.overallRank;
        }
        return b.total - a.total;
      }
    })
    .map(student => {
      // 根据科目筛选决定显示哪些成绩
      if (subjectFilter && subjectFilter !== '全学科') {
        // 单科导出：只显示该科目成绩，不显示总分
        return {
          '联考排名': student.overallRank,
          '校内排名': student.schoolRank,
          '学校': student.school,
          '班级': student.class,
          '姓名': student.name,
          '考号': student.studentId,
          [subjectFilter]: student.subjects[subjectFilter] || 0
        };
      } else {
        // 全科导出：显示所有科目成绩
        return {
          '联考排名': student.overallRank,
          '校内排名': student.schoolRank,
          '学校': student.school,
          '班级': student.class,
          '姓名': student.name,
          '考号': student.studentId,
          ...student.subjects,
          '总分': student.total
        };
      }
    });
  
  // 总体情况表
  let subjectDataFormatted;
  
  // 获取联考平均分（用于统一参考）
  let overallReferenceAverage = 0;
  if (subjectFilter === '全学科' || !subjectFilter) {
    // 全学科时，使用总分平均分
    const totalSubjectStat = analysisResult.subjectStats.find(s => s.subject === '总分');
    overallReferenceAverage = totalSubjectStat ? totalSubjectStat.average : 0;
  } else {
    // 单学科时，使用该科目的平均分
    const subjectStat = analysisResult.subjectStats.find(s => s.subject === subjectFilter);
    overallReferenceAverage = subjectStat ? subjectStat.average : 0;
  }
  
  // 如果是全学科联考分析，改为按学校分行的格式
  if (subjectFilter === '全学科' && (!schoolFilter || schoolFilter === '联考')) {
    // 按学校分行的格式
    const schools = [...new Set(analysisResult.students.map(s => s.school))];
    const subjects = analysisResult.config?.subjects || [];
    
    subjectDataFormatted = schools.map(schoolName => {
      const schoolStudents = analysisResult.students.filter(s => s.school === schoolName);
      const row: any = { '学校': schoolName };
      
      // 总分统计
      const totalScores = schoolStudents.map(s => s.total);
      const totalAvg = totalScores.length > 0 ? totalScores.reduce((sum, s) => sum + s, 0) / totalScores.length : 0;
      const totalMax = totalScores.length > 0 ? Math.max(...totalScores) : 0;
      const totalMin = totalScores.length > 0 ? Math.min(...totalScores) : 0;
      
      // 计算总分超均率（相对于联考总分平均分）
      const allTotalScores = analysisResult.students.map(s => s.total);
      const overallTotalAvg = allTotalScores.length > 0 ? allTotalScores.reduce((sum, s) => sum + s, 0) / allTotalScores.length : 0;
      const totalAboveAvgRate = overallTotalAvg > 0 ? ((totalAvg - overallTotalAvg) / overallTotalAvg) * 100 : 0;
      
      // 计算总分及格率和优良率（80%以上）
      const totalPassScore = subjects.reduce((sum, s) => sum + s.passScore, 0);
      const totalFullScore = subjects.reduce((sum, s) => sum + s.fullScore, 0);
      const totalPassCount = totalScores.filter(score => score >= totalPassScore).length;
      const totalExcellentCount = totalScores.filter(score => (score / totalFullScore) >= 0.8).length;
      const totalPassRate = totalScores.length > 0 ? (totalPassCount / totalScores.length) * 100 : 0;
      const totalExcellentRate = totalScores.length > 0 ? (totalExcellentCount / totalScores.length) * 100 : 0;
      
      // 总分列
      row['总分平均分'] = Number(totalAvg.toFixed(2));
      row['总分超均率(%)'] = Number(totalAboveAvgRate.toFixed(2));
      row['总分最高分'] = Number(totalMax.toFixed(2));
      row['总分最低分'] = Number(totalMin.toFixed(2));
      row['总分及格率(%)'] = Number(totalPassRate.toFixed(2));
      row['总分优良率(%)'] = Number(totalExcellentRate.toFixed(2));
      
      // 各科目统计
      subjects.forEach(subject => {
        const subjectScores = schoolStudents.map(s => s.subjects[subject.name] || 0);
        const subjectAvg = subjectScores.length > 0 ? subjectScores.reduce((sum, s) => sum + s, 0) / subjectScores.length : 0;
        const subjectMax = subjectScores.length > 0 ? Math.max(...subjectScores) : 0;
        const subjectMin = subjectScores.length > 0 ? Math.min(...subjectScores) : 0;
        
        // 计算该科目超均率（相对于联考该科目平均分）
        const allSubjectScores = analysisResult.students.map(s => s.subjects[subject.name] || 0);
        const overallSubjectAvg = allSubjectScores.length > 0 ? allSubjectScores.reduce((sum, s) => sum + s, 0) / allSubjectScores.length : 0;
        const subjectAboveAvgRate = overallSubjectAvg > 0 ? ((subjectAvg - overallSubjectAvg) / overallSubjectAvg) * 100 : 0;
        
        // 计算该科目及格率和优良率（80%以上）
        const subjectPassCount = subjectScores.filter(score => score >= subject.passScore).length;
        const subjectExcellentCount = subjectScores.filter(score => (score / subject.fullScore) >= 0.8).length;
        const subjectPassRate = subjectScores.length > 0 ? (subjectPassCount / subjectScores.length) * 100 : 0;
        const subjectExcellentRate = subjectScores.length > 0 ? (subjectExcellentCount / subjectScores.length) * 100 : 0;
        
        // 该科目列
        row[`${subject.name}平均分`] = Number(subjectAvg.toFixed(2));
        row[`${subject.name}超均率(%)`] = Number(subjectAboveAvgRate.toFixed(2));
        row[`${subject.name}最高分`] = Number(subjectMax.toFixed(2));
        row[`${subject.name}最低分`] = Number(subjectMin.toFixed(2));
        row[`${subject.name}及格率(%)`] = Number(subjectPassRate.toFixed(2));
        row[`${subject.name}优良率(%)`] = Number(subjectExcellentRate.toFixed(2));
      });
      
      return row;
    });
    
    // 添加总计行
    const allStudents = analysisResult.students;
    const totalRow: any = { '学校': '总计' };
    
    // 总分统计
    const allTotalScores = allStudents.map(s => s.total);
    const overallTotalAvg = allTotalScores.length > 0 ? allTotalScores.reduce((sum, s) => sum + s, 0) / allTotalScores.length : 0;
    const overallTotalMax = allTotalScores.length > 0 ? Math.max(...allTotalScores) : 0;
    const overallTotalMin = allTotalScores.length > 0 ? Math.min(...allTotalScores) : 0;
    
    const totalPassScore = subjects.reduce((sum, s) => sum + s.passScore, 0);
    const totalFullScore = subjects.reduce((sum, s) => sum + s.fullScore, 0);
    const totalPassCount = allTotalScores.filter(score => score >= totalPassScore).length;
    const totalExcellentCount = allTotalScores.filter(score => (score / totalFullScore) >= 0.8).length;
    const totalPassRate = allTotalScores.length > 0 ? (totalPassCount / allTotalScores.length) * 100 : 0;
    const totalExcellentRate = allTotalScores.length > 0 ? (totalExcellentCount / allTotalScores.length) * 100 : 0;
    
    totalRow['总分平均分'] = Number(overallTotalAvg.toFixed(2));
    totalRow['总分超均率(%)'] = 0; // 总计行超均率为0
    totalRow['总分最高分'] = Number(overallTotalMax.toFixed(2));
    totalRow['总分最低分'] = Number(overallTotalMin.toFixed(2));
    totalRow['总分及格率(%)'] = Number(totalPassRate.toFixed(2));
    totalRow['总分优良率(%)'] = Number(totalExcellentRate.toFixed(2));
    
    // 各科目统计
    subjects.forEach(subject => {
      const allSubjectScores = allStudents.map(s => s.subjects[subject.name] || 0);
      const overallSubjectAvg = allSubjectScores.length > 0 ? allSubjectScores.reduce((sum, s) => sum + s, 0) / allSubjectScores.length : 0;
      const overallSubjectMax = allSubjectScores.length > 0 ? Math.max(...allSubjectScores) : 0;
      const overallSubjectMin = allSubjectScores.length > 0 ? Math.min(...allSubjectScores) : 0;
      
      const subjectPassCount = allSubjectScores.filter(score => score >= subject.passScore).length;
      const subjectExcellentCount = allSubjectScores.filter(score => (score / subject.fullScore) >= 0.8).length;
      const subjectPassRate = allSubjectScores.length > 0 ? (subjectPassCount / allSubjectScores.length) * 100 : 0;
      const subjectExcellentRate = allSubjectScores.length > 0 ? (subjectExcellentCount / allSubjectScores.length) * 100 : 0;
      
      totalRow[`${subject.name}平均分`] = Number(overallSubjectAvg.toFixed(2));
      totalRow[`${subject.name}超均率(%)`] = 0; // 总计行超均率为0
      totalRow[`${subject.name}最高分`] = Number(overallSubjectMax.toFixed(2));
      totalRow[`${subject.name}最低分`] = Number(overallSubjectMin.toFixed(2));
      totalRow[`${subject.name}及格率(%)`] = Number(subjectPassRate.toFixed(2));
      totalRow[`${subject.name}优良率(%)`] = Number(subjectExcellentRate.toFixed(2));
    });
    
    subjectDataFormatted.push(totalRow);
  } else {
    // 原有的按科目分行的格式（单科分析或单校分析）
    let subjectData = analysisResult.subjectStats;
    
    // 按科目筛选
    if (subjectFilter && subjectFilter !== '全学科') {
      subjectData = subjectData.filter(stat => stat.subject === subjectFilter);
    }
    
    subjectDataFormatted = subjectData.map(stat => {
      // 计算超均率：(该科目平均分 - 参考平均值) / 参考平均值 × 100%
      // 参考平均值始终是联考的平均分
      let aboveAvgRate = 0;
      if (schoolFilter === '联考' || !schoolFilter) {
        // 联考时，超均率应该是0（因为联考就是参考）
        aboveAvgRate = 0;
      } else {
        // 单校时，参考联考该科目的平均分
        const allStudents = analysisResult.students;
        if (subjectFilter === '全学科') {
          // 全学科时，参考联考总分平均分
          const allTotalScores = allStudents.map(s => s.total);
          const overallAverage = allTotalScores.length > 0 ? allTotalScores.reduce((sum, s) => sum + s, 0) / allTotalScores.length : 0;
          if (overallAverage > 0) {
            aboveAvgRate = ((stat.average - overallAverage) / overallAverage) * 100;
          }
        } else {
          // 单科时，参考联考该科目平均分
          const allSubjectScores = allStudents.map(s => s.subjects[stat.subject] || 0);
          const overallAverage = allSubjectScores.length > 0 ? allSubjectScores.reduce((sum, s) => sum + s, 0) / allSubjectScores.length : 0;
          if (overallAverage > 0) {
            aboveAvgRate = ((stat.average - overallAverage) / overallAverage) * 100;
          }
        }
      }
      
      // 根据是否为单校分析决定列结构
      if (schoolFilter && schoolFilter !== '联考') {
        // 单校分析时，添加联考平均分列
        const allStudents = analysisResult.students;
        // 始终计算该科目的联考平均分，不管subjectFilter是什么
        const allSubjectScores = allStudents.map(s => s.subjects[stat.subject] || 0);
        const overallAverage = allSubjectScores.length > 0 ? allSubjectScores.reduce((sum, s) => sum + s, 0) / allSubjectScores.length : 0;
        
        // 重新计算优良率（80%以上）
        const subjectConfig = analysisResult.config?.subjects?.find((s: any) => s.name === stat.subject);
        const fullScore = subjectConfig?.fullScore || 100;
        const filteredStudentsForSubject = filteredStudents.filter(s => !s.missingSubjects?.[stat.subject]);
        const subjectScores = filteredStudentsForSubject.map(s => s.subjects[stat.subject] || 0);
        const excellentCount = subjectScores.filter(score => (score / fullScore) >= 0.8).length;
        const excellentRate = subjectScores.length > 0 ? (excellentCount / subjectScores.length) * 100 : 0;
        
        return {
          '科目': stat.subject,
          '联考平均分': Number(overallAverage.toFixed(2)),
          '学校平均分': Number(stat.average.toFixed(2)),
          '最高分': Number(stat.max.toFixed(2)),
          '最低分': Number(stat.min.toFixed(2)),
          '及格率(%)': Number(stat.passRate.toFixed(2)),
          '优良率(%)': Number(excellentRate.toFixed(2)),
          '超均率(%)': Number(aboveAvgRate.toFixed(2))
        };
      } else {
        // 联考分析时，保持原有列结构，但重新计算优良率（80%以上）
        const subjectConfig = analysisResult.config?.subjects?.find((s: any) => s.name === stat.subject);
        const fullScore = subjectConfig?.fullScore || 100;
        const filteredStudentsForSubject = filteredStudents.filter(s => !s.missingSubjects?.[stat.subject]);
        const subjectScores = filteredStudentsForSubject.map(s => s.subjects[stat.subject] || 0);
        const excellentCount = subjectScores.filter(score => (score / fullScore) >= 0.8).length;
        const excellentRate = subjectScores.length > 0 ? (excellentCount / subjectScores.length) * 100 : 0;
        
        return {
          '科目': stat.subject,
          '平均分': Number(stat.average.toFixed(2)),
          '最高分': Number(stat.max.toFixed(2)),
          '最低分': Number(stat.min.toFixed(2)),
          '及格率(%)': Number(stat.passRate.toFixed(2)),
          '优良率(%)': Number(excellentRate.toFixed(2)),
          '超均率(%)': Number(aboveAvgRate.toFixed(2))
        };
      }
    });

  }
  
  const subjectSheet = XLSX.utils.json_to_sheet(subjectDataFormatted);
  XLSX.utils.book_append_sheet(workbook, subjectSheet, '总体情况');
  
  const studentSheet = XLSX.utils.json_to_sheet(studentData);
  XLSX.utils.book_append_sheet(workbook, studentSheet, '学生成绩单');
  
  // 学校对比表（原学校统计表）
  let schoolData = analysisResult.schoolStats;
  
  // 按学校筛选
  if (schoolFilter && schoolFilter !== '联考') {
    schoolData = schoolData.filter(stat => stat.schoolName === schoolFilter);
  }
  
  // 获取满分值
  let fullScore = 0;
  if (subjectFilter === '全学科' || !subjectFilter) {
    fullScore = analysisResult.config?.subjects?.reduce((sum: number, s: any) => sum + s.fullScore, 0) || 0;
  } else {
    const subjectConfig = analysisResult.config?.subjects?.find((s: any) => s.name === subjectFilter);
    fullScore = subjectConfig?.fullScore || 100;
  }
  
  // 重新计算学校统计，添加更多统计信息
  const schoolDataFormatted = schoolData.map(stat => {
    // 获取该学校的学生数据
    const schoolStudents = filteredStudents.filter(s => s.school === stat.schoolName);
    let scores;
    if (subjectFilter === '全学科' || !subjectFilter) {
      scores = schoolStudents.map(s => s.total);
    } else {
      scores = schoolStudents.map(s => s.subjects[subjectFilter] || 0);
    }
    
    let avgScore = stat.average;
    let aboveAvgRate = 0;
    let passCount = 0;
    let passRate = 0;
    let excellentCount = 0;
    let goodCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    
    if (scores.length > 0) {
      // 重新计算平均分（确保全学科时使用总分）
      avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      
      // 计算总体平均分（参考平均值）
      // 超均率的参考平均值始终是联考的平均分，不是当前筛选后的平均分
      const allStudents = analysisResult.students;
      let allScores;
      if (subjectFilter === '全学科' || !subjectFilter) {
        allScores = allStudents.map(s => s.total);
      } else {
        allScores = allStudents.map(s => s.subjects[subjectFilter] || 0);
      }
      const overallAverage = allScores.length > 0 ? allScores.reduce((sum, s) => sum + s, 0) / allScores.length : 0;
      
      // 计算超均率：(该学校平均分 - 参考平均值) / 参考平均值 × 100%
      if (overallAverage > 0) {
        aboveAvgRate = ((avgScore - overallAverage) / overallAverage) * 100;
      }
      
      // 计算及格人数和及格率（60%以上）
      passCount = scores.filter(score => (score / fullScore) >= 0.6).length;
      passRate = (passCount / scores.length) * 100;
      
      // 计算各分档人数
      excellentCount = scores.filter(score => (score / fullScore) >= 0.9).length;
      goodCount = scores.filter(score => (score / fullScore) >= 0.8 && (score / fullScore) < 0.9).length;
      mediumCount = scores.filter(score => (score / fullScore) >= 0.6 && (score / fullScore) < 0.8).length;
      lowCount = scores.filter(score => (score / fullScore) < 0.2).length;
    }
    
    // 计算联考平均分（用于显示）
    const allStudents = analysisResult.students;
    let allScoresForDisplay;
    if (subjectFilter === '全学科' || !subjectFilter) {
      allScoresForDisplay = allStudents.map(s => s.total);
    } else {
      allScoresForDisplay = allStudents.map(s => s.subjects[subjectFilter] || 0);
    }
    const overallAvgForDisplay = allScoresForDisplay.length > 0 ? allScoresForDisplay.reduce((sum, s) => sum + s, 0) / allScoresForDisplay.length : 0;
    
    return {
      '学校名称': stat.schoolName,
      '学生人数': stat.studentCount,
      '班级数': stat.classCount,
      '联考平均分': Number(overallAvgForDisplay.toFixed(2)),
      '学校平均分': Number(avgScore.toFixed(2)),
      '超均率(%)': Number(aboveAvgRate.toFixed(2)),
      '及格人数': passCount,
      '及格率(%)': Number(passRate.toFixed(2)),
      '优秀人数 [ 90% , 100% ]': excellentCount,
      '优秀占比 [ 90% , 100% ]': scores.length > 0 ? ((excellentCount / scores.length) * 100).toFixed(2) + '%' : '0.00%',
      '良好人数 [ 80% , 90% )': goodCount,
      '良好占比 [ 80% , 90% )': scores.length > 0 ? ((goodCount / scores.length) * 100).toFixed(2) + '%' : '0.00%',
      '中等人数 [ 60% , 80% )': mediumCount,
      '中等占比 [ 60% , 80% )': scores.length > 0 ? ((mediumCount / scores.length) * 100).toFixed(2) + '%' : '0.00%',
      '低分人数 [ 0% , 20% )': lowCount,
      '低分占比 [ 0% , 20% )': scores.length > 0 ? ((lowCount / scores.length) * 100).toFixed(2) + '%' : '0.00%'
    };
  });
  
  
  const schoolSheet = XLSX.utils.json_to_sheet(schoolDataFormatted);
  XLSX.utils.book_append_sheet(workbook, schoolSheet, '学校对比');
  
  // 班级统计表
  let classData = analysisResult.classStats;
  
  // 按学校筛选
  if (schoolFilter && schoolFilter !== '联考') {
    classData = classData.filter(stat => stat.school === schoolFilter);
  }
  
  // 重新计算班级统计，确保全学科时使用总分平均分，并添加超均率
  const classDataFormatted = classData.map(stat => {
    // 获取该班级的学生数据
    const classStudents = filteredStudents.filter(s => s.school === stat.school && s.class === stat.className);
    let scores;
    if (subjectFilter === '全学科' || !subjectFilter) {
      scores = classStudents.map(s => s.total);
    } else {
      scores = classStudents.map(s => s.subjects[subjectFilter] || 0);
    }
    
    let avgScore = stat.average;
    let aboveAvgRate = 0;
    let passRate = 0;
    let excellentRate = 0;
    
    if (scores.length > 0) {
      // 重新计算平均分（确保全学科时使用总分）
      avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      
      // 计算总体平均分（参考平均值）
      // 超均率的参考平均值始终是联考的平均分，不是当前筛选后的平均分
      const allStudents = analysisResult.students;
      let allScores;
      if (subjectFilter === '全学科' || !subjectFilter) {
        allScores = allStudents.map(s => s.total);
      } else {
        allScores = allStudents.map(s => s.subjects[subjectFilter] || 0);
      }
      const overallAverage = allScores.length > 0 ? allScores.reduce((sum, s) => sum + s, 0) / allScores.length : 0;
      
      // 计算超均率：(该班级平均分 - 参考平均值) / 参考平均值 × 100%
      if (overallAverage > 0) {
        aboveAvgRate = ((avgScore - overallAverage) / overallAverage) * 100;
      }
      
      // 重新计算及格率和优良率
      const fullScore = subjectFilter === '全学科' || !subjectFilter 
        ? (analysisResult.config?.subjects?.reduce((sum: number, s: any) => sum + s.fullScore, 0) || 0)
        : (analysisResult.config?.subjects?.find((s: any) => s.name === subjectFilter)?.fullScore || 100);
      
      const passCount = scores.filter(score => (score / fullScore) >= 0.6).length;
      passRate = (passCount / scores.length) * 100;
      
      const excellentCount = scores.filter(score => (score / fullScore) >= 0.8).length;
      excellentRate = (excellentCount / scores.length) * 100;
    }
    
    return {
      '学校': stat.school,
      '班级': stat.className,
      '人数': stat.studentCount,
      '平均分': Number(avgScore.toFixed(2)),
      '及格率(%)': Number(passRate.toFixed(2)),
      '优良率(%)': Number(excellentRate.toFixed(2)),
      '超均率(%)': Number(aboveAvgRate.toFixed(2))
    };
  });
  
  // 按学校升序然后班级升序排序
  classDataFormatted.sort((a, b) => {
    if (a['学校'] !== b['学校']) {
      return a['学校'].localeCompare(b['学校']);
    }
    return a['班级'].localeCompare(b['班级']);
  });
  
  const classSheet = XLSX.utils.json_to_sheet(classDataFormatted);
  XLSX.utils.book_append_sheet(workbook, classSheet, '班级统计');
  
  // 成绩分档统计表
  const gradeData = generateGradeStatistics(filteredStudents, subjectFilter, analysisResult.config);
  const gradeSheet = XLSX.utils.json_to_sheet(gradeData);
  XLSX.utils.book_append_sheet(workbook, gradeSheet, '成绩分档统计');
  
  // 高低分对比分析表
  const highLowComparisonData = generateHighLowComparisonData(filteredStudents, subjectFilter, analysisResult.config);
  const highLowComparisonSheet = XLSX.utils.json_to_sheet(highLowComparisonData);
  XLSX.utils.book_append_sheet(workbook, highLowComparisonSheet, '高低分对比分析');
  
  // 保存文件
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// 批量导出所有学科报表
export const exportAllSubjectsExcel = (analysisResult: AnalysisResult) => {
  const { config } = analysisResult;
  
  if (!config.subjects) {
    throw new Error('未找到科目配置');
  }
  
  // 导出全学科报表
  exportToExcel(
    analysisResult, 
    '全学科成绩分析报告', 
    '全学科', 
    '联考'
  );
  
  // 导出各科目报表
  config.subjects.forEach(subject => {
    exportToExcel(
      analysisResult, 
      `${subject.name}成绩分析报告`, 
      subject.name, 
      '联考'
    );
  });
  
  // 导出各学校全学科报表
  const schools = [...new Set(analysisResult.students.map(s => s.school).filter(Boolean))];
  schools.forEach(school => {
    exportToExcel(
      analysisResult, 
      `${school}全学科成绩分析报告`, 
      '全学科', 
      school
    );
  });
};

// 导出排名Excel文件
export const exportRankingExcel = (analysisResult: AnalysisResult, filename: string = '联考排名表') => {
  const workbook = XLSX.utils.book_new();
  const { students, config } = analysisResult;

  // 1. 总表（按总分重新计算排名）
  // 先按总分降序排序，然后重新计算排名
  const studentsWithTotalScore = students.map(student => ({
    ...student,
    totalScore: student.total
  })).sort((a, b) => b.totalScore - a.totalScore); // 按总分降序排序

  // 重新计算联考排名（基于实际总分）
  const rankedStudents = calculateRankings(studentsWithTotalScore, 'totalScore');

  // 计算校内排名（基于总分）
  const calculateSchoolRankByTotal = (student: any, allRankedStudents: any[]): number => {
    const schoolStudents = allRankedStudents.filter(s => s.school === student.school);
    const schoolRanked = calculateRankings(schoolStudents, 'totalScore');
    const studentRank = schoolRanked.find(s => 
      s.id === student.id || 
      (s.name === student.name && s.studentId === student.studentId && s.school === student.school)
    );
    return studentRank ? studentRank.rank : 1;
  };

  const totalRankingData = rankedStudents.map(student => ({
    '学校': student.school,
    '考号': student.studentId,
    '班级': student.class,
    '姓名': student.name,
    '语文': student.subjects['语文'] || 0,
    '数学': student.subjects['数学'] || 0,
    '英语': student.subjects['英语'] || 0,
    '政治(道德与法治)': student.subjects['政治(道德与法治)'] || student.subjects['政治'] || 0,
    '物理': student.subjects['物理'] || 0,
    '化学': student.subjects['化学'] || 0,
    '历史': student.subjects['历史'] || 0,
    '总分': student.total,
    '校内名次': calculateSchoolRankByTotal(student, rankedStudents),
    '联考名次': student.rank // 使用重新计算的排名
  }));

  const totalSheet = XLSX.utils.json_to_sheet(totalRankingData);
  XLSX.utils.book_append_sheet(workbook, totalSheet, '总排名');

  // 2. 各科排名表
  if (config.subjects) {
    config.subjects.forEach(subject => {
      // 按该科目成绩排序
      const subjectStudents = students
        .map(student => ({
          ...student,
          subjectScore: student.subjects[subject.name] || 0
        }))
        .sort((a, b) => b.subjectScore - a.subjectScore); // 按科目成绩降序排序

      // 计算联考排名（考虑并列）
      const subjectRankingData = calculateRankings(subjectStudents, 'subjectScore').map(student => ({
        '学校': student.school,
        '考号': student.studentId,
        '班级': student.class,
        '姓名': student.name,
        [subject.name]: student.subjectScore,
        '校内名次': calculateSchoolRank(student, subject.name, students),
        '联考名次': student.rank
      }));

      const subjectSheet = XLSX.utils.json_to_sheet(subjectRankingData);
      XLSX.utils.book_append_sheet(workbook, subjectSheet, `${subject.name}排名`);
    });
  }

  // 保存文件
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// 计算排名（考虑并列情况）
const calculateRankings = (students: any[], scoreField: string) => {
  const studentsWithRank = students.map((student, index) => ({
    ...student,
    originalIndex: index
  }));

  // 按分数分组
  const scoreGroups: { [score: number]: any[] } = {};
  studentsWithRank.forEach(student => {
    const score = student[scoreField];
    if (!scoreGroups[score]) {
      scoreGroups[score] = [];
    }
    scoreGroups[score].push(student);
  });

  // 按分数降序排序
  const sortedScores = Object.keys(scoreGroups)
    .map(Number)
    .sort((a, b) => b - a);

  // 计算排名
  let currentRank = 1;
  const result: any[] = [];

  sortedScores.forEach(score => {
    const studentsWithSameScore = scoreGroups[score];
    const rank = currentRank;
    
    studentsWithSameScore.forEach(student => {
      result.push({
        ...student,
        rank
      });
    });
    
    currentRank += studentsWithSameScore.length;
  });

  return result;
};

// 计算校内排名（考虑并列情况）
const calculateSchoolRank = (student: any, subjectName: string, allStudents: any[]): number => {
  const schoolStudents = allStudents.filter(s => s.school === student.school);
  const subjectScores = schoolStudents.map(s => ({
    ...s,
    subjectScore: s.subjects[subjectName] || 0
  }));
  
  const rankedStudents = calculateRankings(subjectScores, 'subjectScore');
  const studentRank = rankedStudents.find(s => s.id === student.id);
  
  return studentRank ? studentRank.rank : 1;
};

// 生成成绩分档统计数据
const generateGradeStatistics = (students: any[], subjectFilter?: string, config?: any) => {
  // 获取分数数据
  const scores = students.map(student => {
    if (subjectFilter === '全学科' || !subjectFilter) {
      return student.total;
    } else {
      return student.subjects[subjectFilter] || 0;
    }
  }); // 包含所有学生，包括0分（缺考）

  const totalStudents = scores.length;
  if (totalStudents === 0) return [];

  // 获取满分值
  let fullScore = 0;
  if (subjectFilter === '全学科' || !subjectFilter) {
    fullScore = config?.subjects?.reduce((sum: number, s: any) => sum + s.fullScore, 0) || 0;
  } else {
    const subjectConfig = config?.subjects?.find((s: any) => s.name === subjectFilter);
    fullScore = subjectConfig?.fullScore || 100;
  }

  // 定义分档标准
  const gradeDefinitions = [
    { 
      grade: '优秀', 
      scoreRateRange: '[ 90% , 100% ]', 
      minRate: 0.9, 
      maxRate: 1.0
    },
    { 
      grade: '良好', 
      scoreRateRange: '[ 80% , 90% )', 
      minRate: 0.8, 
      maxRate: 0.9
    },
    { 
      grade: '中等', 
      scoreRateRange: '[ 60% , 80% )', 
      minRate: 0.6, 
      maxRate: 0.8
    },
    { 
      grade: '待及格', 
      scoreRateRange: '[ 20% , 60% )', 
      minRate: 0.2, 
      maxRate: 0.6
    },
    { 
      grade: '及格', 
      scoreRateRange: '[ 60% , 100% ]', 
      minRate: 0.6, 
      maxRate: 1.0
    },
    { 
      grade: '不及格', 
      scoreRateRange: '[ 0% , 60% )', 
      minRate: 0.0, 
      maxRate: 0.6
    },
    { 
      grade: '低分', 
      scoreRateRange: '[ 0% , 20% )', 
      minRate: 0.0, 
      maxRate: 0.2
    }
  ];

  const gradeData = gradeDefinitions.map(def => {
    let count = 0;
    
    if (def.grade === '优秀') {
      count = scores.filter(score => {
        const rate = score / fullScore;
        return rate >= 0.9 && rate <= 1.0;
      }).length;
    } else if (def.grade === '良好') {
      count = scores.filter(score => {
        const rate = score / fullScore;
        return rate >= 0.8 && rate < 0.9;
      }).length;
    } else if (def.grade === '中等') {
      count = scores.filter(score => {
        const rate = score / fullScore;
        return rate >= 0.6 && rate < 0.8;
      }).length;
    } else if (def.grade === '待及格') {
      count = scores.filter(score => {
        const rate = score / fullScore;
        return rate >= 0.2 && rate < 0.6;
      }).length;
    } else if (def.grade === '及格') {
      count = scores.filter(score => {
        const rate = score / fullScore;
        return rate >= 0.6 && rate <= 1.0;
      }).length;
    } else if (def.grade === '不及格') {
      count = scores.filter(score => {
        const rate = score / fullScore;
        return rate >= 0.0 && rate < 0.6;
      }).length;
    } else if (def.grade === '低分') {
      count = scores.filter(score => {
        const rate = score / fullScore;
        return rate >= 0.0 && rate < 0.2;
      }).length;
    }

    const percentage = totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(2) : '0.00';
    
    // 计算成绩区间
    const minScore = Math.round(def.minRate * fullScore * 10) / 10;
    const maxScore = Math.round(def.maxRate * fullScore * 10) / 10;
    const scoreRange = def.maxRate === 1.0 ? 
      `[ ${minScore} , ${maxScore} ]` : 
      `[ ${minScore} , ${maxScore} )`;

    return {
      '分档': def.grade,
      '得分率区间': def.scoreRateRange,
      '成绩区间': scoreRange,
      '人数': count,
      '占比(%)': `${percentage}%`
    };
  });

  return gradeData;
};

// 生成高低分对比分析数据
const generateHighLowComparisonData = (
  students: StudentScore[], 
  subjectFilter?: string, 
  config?: AnalysisConfig
) => {
  // 获取满分值
  let fullScore = 0;
  if (subjectFilter === '全学科' || !subjectFilter) {
    fullScore = config?.subjects?.reduce((sum: number, s: any) => sum + s.fullScore, 0) || 0;
  } else {
    const subjectConfig = config?.subjects?.find((s: any) => s.name === subjectFilter);
    fullScore = subjectConfig?.fullScore || 100;
  }

  // 获取所有学校
  const schools = [...new Set(students.map(s => s.school).filter(Boolean))];
  
  const schoolData = schools.map(schoolName => {
    const schoolStudents = students.filter(s => s.school === schoolName);
    const totalStudents = schoolStudents.length;
    
    if (totalStudents === 0) {
      return {
        '学校': schoolName,
        '平均分': 0,
        '最高分': 0,
        '最低分': 0,
        '高分组平均分(前30%)': 0,
        '低分组平均分(后30%)': 0,
        '高分组人数(人)': 0,
        '低分组人数(人)': 0
      };
    }

    // 计算各学校学生的分数
    const scores = schoolStudents.map(student => {
      if (subjectFilter === '全学科' || !subjectFilter) {
        return student.total;
      } else {
        return student.subjects[subjectFilter] || 0;
      }
    });

    // 按分数排序
    const sortedScores = [...scores].sort((a, b) => b - a);
    
    // 计算平均分、最高分、最低分
    const average = scores.reduce((sum, score) => sum + score, 0) / totalStudents;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    
    // 计算高分组和低分组
    const highGroupSize = Math.ceil(totalStudents * 0.3); // 前30%
    const lowGroupSize = Math.ceil(totalStudents * 0.3); // 后30%
    
    const highGroupScores = sortedScores.slice(0, highGroupSize);
    const lowGroupScores = sortedScores.slice(-lowGroupSize);
    
    const highGroupAverage = highGroupScores.length > 0 
      ? highGroupScores.reduce((sum, score) => sum + score, 0) / highGroupScores.length 
      : 0;
    
    const lowGroupAverage = lowGroupScores.length > 0 
      ? lowGroupScores.reduce((sum, score) => sum + score, 0) / lowGroupScores.length 
      : 0;

    return {
      '学校': schoolName,
      '平均分': Number(average.toFixed(2)),
      '最高分': Number(maxScore.toFixed(2)),
      '最低分': Number(minScore.toFixed(2)),
      '高分组平均分(前30%)': Number(highGroupAverage.toFixed(2)),
      '低分组平均分(后30%)': Number(lowGroupAverage.toFixed(2)),
      '高分组人数(人)': highGroupSize,
      '低分组人数(人)': lowGroupSize
    };
  });

  // 按平均分降序排列
  return schoolData.sort((a, b) => b['平均分'] - a['平均分']);
};
