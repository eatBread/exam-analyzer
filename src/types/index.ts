// 学生成绩数据类型
export interface StudentScore {
  id: string;
  name: string;
  studentId: string;
  class: string;
  school: string;
  subjects: {
    [subject: string]: number;
  };
  missingSubjects?: {
    [subject: string]: boolean; // 记录缺考科目
  };
  total: number;
  average: number;
  schoolRank: number;
  overallRank: number;
  rank: number; // 保持向后兼容
  subjectRanks?: {
    [subject: string]: {
      schoolRank: number; // 该科目校内排名
      overallRank: number; // 该科目联考排名
    };
  };
}

// 科目统计数据类型
export interface SubjectStats {
  subject: string;
  average: number;
  max: number;
  min: number;
  passRate: number;
  excellentRate: number;
  distribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
}

// 班级统计数据类型
export interface ClassStats {
  className: string;
  school: string;
  studentCount: number;
  average: number;
  passRate: number;
  excellentRate: number;
  schoolRank: number;
  overallRank: number;
  rank: number; // 保持向后兼容
}

// 学校统计数据类型
export interface SchoolStats {
  schoolName: string;
  studentCount: number;
  average: number;
  passRate: number;
  excellentRate: number;
  classCount: number;
  rank: number;
}

// 科目配置类型
export interface SubjectConfig {
  name: string;
  fullScore: number;
  passScore: number;
  excellentScore: number;
}

// 分析配置类型
export interface AnalysisConfig {
  gradeLevel: string;
  subjects: SubjectConfig[];
  // 保持向后兼容
  subjectName?: string;
  fullScore?: number;
  passScore?: number;
  excellentScore?: number;
}

// 分析结果类型
export interface AnalysisResult {
  students: StudentScore[];
  subjectStats: SubjectStats[];
  classStats: ClassStats[];
  schoolStats: SchoolStats[];
  config: AnalysisConfig;
  overallStats: {
    totalStudents: number;
    overallAverage: number;
    overallPassRate: number;
    overallExcellentRate: number;
    totalSchools: number;
    totalClasses: number;
  };
}
