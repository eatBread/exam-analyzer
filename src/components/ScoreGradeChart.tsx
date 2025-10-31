import React, { useMemo } from 'react';
import { Card, Typography } from 'antd';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Label } from 'recharts';

const { Title } = Typography;

interface ScoreGradeChartProps {
  analysisResult: any;
  selectedSubject: string;
  selectedSchool: string;
}

interface GradeData {
  name: string;
  value: number;
  color: string;
}

const ScoreGradeChart: React.FC<ScoreGradeChartProps> = ({ 
  analysisResult, 
  selectedSubject, 
  selectedSchool 
}) => {
  const { students, config } = analysisResult;

  const chartData = useMemo(() => {
    // 筛选学生数据
    let filteredStudents = students;
    if (selectedSchool !== '联考') {
      filteredStudents = students.filter(s => s.school === selectedSchool);
    }

    // 获取分数数据
    const scores = filteredStudents.map(student => {
      if (selectedSubject === '全学科') {
        return student.total;
      } else {
        return student.subjects[selectedSubject] || 0;
      }
    });

    const totalStudents = scores.length;
    if (totalStudents === 0) return { innerData: [], outerData: [] };

    // 获取满分值
    let fullScore = 0;
    if (selectedSubject === '全学科') {
      fullScore = config?.subjects?.reduce((sum: number, s: any) => sum + s.fullScore, 0) || 0;
    } else {
      const subjectConfig = config?.subjects?.find((s: any) => s.name === selectedSubject);
      fullScore = subjectConfig?.fullScore || 100;
    }

    // 计算及格线
    let passScore = 0;
    if (selectedSubject === '全学科') {
      passScore = config?.subjects?.reduce((sum: number, s: any) => sum + s.passScore, 0) || 0;
    } else {
      const subjectConfig = config?.subjects?.find((s: any) => s.name === selectedSubject);
      passScore = subjectConfig?.passScore || 60;
    }

    // 计算各分档人数
    const gradeCounts = {
      low: 0,        // 低分 (0-20%)
      pending: 0,    // 待及格 (20-60%)
      medium: 0,     // 中等 (60-80%)
      good: 0,       // 良好 (80-90%)
      excellent: 0   // 优秀 (90-100%)
    };

    scores.forEach(score => {
      const rate = score / fullScore;
      if (rate >= 0.9) {
        gradeCounts.excellent++;
      } else if (rate >= 0.8) {
        gradeCounts.good++;
      } else if (rate >= 0.6) {
        gradeCounts.medium++;
      } else if (rate >= 0.2) {
        gradeCounts.pending++;
      } else {
        gradeCounts.low++;
      }
    });

    // 内圈数据（及格/不及格）
    const passCount = scores.filter(score => score >= passScore).length;
    const failCount = totalStudents - passCount;

    const innerData: GradeData[] = [
      {
        name: '及格',
        value: passCount,
        color: '#ff7f50'
      },
      {
        name: '不及格',
        value: failCount,
        color: '#87ceeb'
      }
    ];

    // 外圈数据（详细分档）
    const outerData: GradeData[] = [
      {
        name: '优秀',
        value: gradeCounts.excellent,
        color: '#90ee90'
      },
      {
        name: '良好',
        value: gradeCounts.good,
        color: '#87ceeb'
      },
      {
        name: '中等',
        value: gradeCounts.medium,
        color: '#ffa500'
      },
      {
        name: '待及格',
        value: gradeCounts.pending,
        color: '#ff7f50'
      },
      {
        name: '低分',
        value: gradeCounts.low,
        color: '#dc143c'
      }
    ];

    return { innerData, outerData };
  }, [students, selectedSubject, selectedSchool, config]);

  const renderCustomLabel = (entry: any, isInner: boolean = false) => {
    if (entry.value === 0) return null;
    const percentage = ((entry.value / students.length) * 100).toFixed(1);
    
    if (isInner) {
      // 内圆标签：只显示名称
      return entry.name;
    } else {
      // 外圆标签：显示完整信息
      return `${entry.name}\n${entry.value}人 (${percentage}%)`;
    }
  };

  return (
    <Card title={<Title level={3}>成绩分档分布</Title>} style={{ marginBottom: '24px' }}>
      <div style={{ width: '100%', height: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData.outerData}
              cx="50%"
              cy="50%"
              outerRadius={120}
              innerRadius={80}
              dataKey="value"
              label={renderCustomLabel}
              labelLine={false}
            >
              {chartData.outerData.map((entry, index) => (
                <Cell key={`outer-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Pie
              data={chartData.innerData}
              cx="50%"
              cy="50%"
              innerRadius={0}
              outerRadius={70}
              dataKey="value"
              label={({ name, value, percent }) => {
                if (value === 0) return null;
                const percentage = (percent * 100).toFixed(1);
                return `${name} ${value}人 ${percentage}%`;
              }}
              labelLine={false}
            >
              {chartData.innerData.map((entry, index) => (
                <Cell key={`inner-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any, name: string) => [
                `${value}人 (${((value / students.length) * 100).toFixed(1)}%)`,
                name
              ]}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              formatter={(value: string) => (
                <span style={{ color: '#333', fontSize: '12px' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default ScoreGradeChart;
