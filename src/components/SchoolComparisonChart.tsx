import React, { useMemo } from 'react';
import { Card, Typography } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, LabelList } from 'recharts';
import { SchoolStats, StudentScore, AnalysisConfig } from '../types';

const { Title } = Typography;

interface SchoolComparisonChartProps {
  schoolStats: SchoolStats[];
  students: StudentScore[];
  selectedSubject: string;
  config: AnalysisConfig;
}

const SchoolComparisonChart: React.FC<SchoolComparisonChartProps> = ({ 
  schoolStats, 
  students, 
  selectedSubject, 
  config 
}) => {
  // 学校简称映射
  const schoolNameMap: { [key: string]: string } = {
    '广州市第一一三中学陶育实验学校': '陶实',
    '广州市华颖外国语学校': '华颖',
    '广州市南国学校': '南国',
    '广州市天河中学猎德实验学校': '猎德'
  };

  // 根据选择的学科重新计算数据
  const data = useMemo(() => {
    // 按学校分组
    const schoolGroups = students.reduce((acc, student) => {
      const school = student.school || '未知学校';
      if (!acc[school]) {
        acc[school] = [];
      }
      acc[school].push(student);
      return acc;
    }, {} as { [key: string]: StudentScore[] });

    return Object.entries(schoolGroups).map(([schoolName, schoolStudents]) => {
      let scores: number[] = [];
      let fullScore = 0;

      if (selectedSubject === '全学科') {
        // 全学科：使用总分
        scores = schoolStudents.map(s => s.total);
        fullScore = config.subjects?.reduce((sum, s) => sum + s.fullScore, 0) || 0;
      } else {
        // 单科：使用该科目分数
        scores = schoolStudents.map(s => s.subjects[selectedSubject] || 0);
        const subjectConfig = config.subjects?.find(s => s.name === selectedSubject);
        fullScore = subjectConfig?.fullScore || 100;
      }

      const average = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
      const passRate = fullScore > 0 ? (scores.filter(score => score >= (fullScore * 0.6)).length / scores.length) * 100 : 0;
      const excellentRate = fullScore > 0 ? (scores.filter(score => score >= (fullScore * 0.9)).length / scores.length) * 100 : 0;

      return {
        school: schoolNameMap[schoolName] || schoolName,
        average: Number(average.toFixed(2)),
        passRate: Number(passRate.toFixed(2)),
        excellentRate: Number(excellentRate.toFixed(2)),
        studentCount: schoolStudents.length
      };
    }).sort((a, b) => b.average - a.average);
  }, [students, selectedSubject, config.subjects]);

  // 计算总体平均分
  const totalAverage = data.length > 0 ? data.reduce((sum, item) => sum + item.average, 0) / data.length : 0;

  const colors = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#13c2c2', '#eb2f96', '#ff4d4f'];

  return (
    <Card title="各学校平均分对比" style={{ height: '100%' }}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 40, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="school" 
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis />
          <Tooltip 
            formatter={(value: number, name: string) => [
              `${value.toFixed(2)}${name === 'average' ? '分' : '%'}`, 
              name === 'average' ? '平均分' : name === 'passRate' ? '及格率' : '优秀率'
            ]}
            labelFormatter={(label) => `学校: ${label}`}
          />
          <Bar dataKey="average" name="average">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
            <LabelList 
              dataKey="average" 
              position="top" 
              formatter={(value: number) => `${value.toFixed(1)}分`}
              style={{ fontSize: '12px', fill: '#333' }}
            />
          </Bar>
          <ReferenceLine 
            y={totalAverage} 
            stroke="#ff4d4f" 
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{ value: `总体平均分: ${totalAverage.toFixed(1)}分`, position: "top", offset: 20 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default SchoolComparisonChart;
