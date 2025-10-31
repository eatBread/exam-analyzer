import React, { useMemo } from 'react';
import { Card, Typography } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { AnalysisResult } from '../types';

const { Title } = Typography;

interface SchoolGradeComparisonChartProps {
  analysisResult: AnalysisResult;
  selectedSubject: string;
}

const SchoolGradeComparisonChart: React.FC<SchoolGradeComparisonChartProps> = ({ 
  analysisResult, 
  selectedSubject 
}) => {
  const { students, config } = analysisResult;

  // 学校简称映射
  const schoolNameMap: { [key: string]: string } = {
    '广州市第一一三中学陶育实验学校': '陶实',
    '广州市华颖外国语学校': '华颖',
    '广州市南国学校': '南国',
    '广州市天河中学猎德实验学校': '猎德'
  };

  const chartData = useMemo(() => {
    // 获取满分值
    let fullScore = 0;
    if (selectedSubject === '全学科') {
      fullScore = config?.subjects?.reduce((sum: number, s: any) => sum + s.fullScore, 0) || 0;
    } else {
      const subjectConfig = config?.subjects?.find((s: any) => s.name === selectedSubject);
      fullScore = subjectConfig?.fullScore || 100;
    }

    // 获取所有学校
    const schools = [...new Set(students.map(s => s.school).filter(Boolean))];
    
    const schoolData = schools.map(schoolName => {
      const schoolStudents = students.filter(s => s.school === schoolName);
      const totalStudents = schoolStudents.length;
      
      if (totalStudents === 0) {
        return {
          schoolName,
          '优秀率': 0,
          '良好率': 0,
          '中等率': 0,
          '不及格率': 0
        };
      }

      // 计算各分档人数
      const scores = schoolStudents.map(student => {
        if (selectedSubject === '全学科') {
          return student.total;
        } else {
          return student.subjects[selectedSubject] || 0;
        }
      });

      const excellentCount = scores.filter(score => (score / fullScore) >= 0.9).length;
      const goodCount = scores.filter(score => (score / fullScore) >= 0.8 && (score / fullScore) < 0.9).length;
      const mediumCount = scores.filter(score => (score / fullScore) >= 0.6 && (score / fullScore) < 0.8).length;
      const failCount = scores.filter(score => (score / fullScore) < 0.6).length;

      return {
        schoolName: schoolNameMap[schoolName] || schoolName,
        '优秀率': Math.round((excellentCount / totalStudents) * 100),
        '良好率': Math.round((goodCount / totalStudents) * 100),
        '中等率': Math.round((mediumCount / totalStudents) * 100),
        '不及格率': Math.round((failCount / totalStudents) * 100)
      };
    });

    // 计算总体数据
    const totalStudents = students.length;
    const totalScores = students.map(student => {
      if (selectedSubject === '全学科') {
        return student.total;
      } else {
        return student.subjects[selectedSubject] || 0;
      }
    });

    const totalExcellentCount = totalScores.filter(score => (score / fullScore) >= 0.9).length;
    const totalGoodCount = totalScores.filter(score => (score / fullScore) >= 0.8 && (score / fullScore) < 0.9).length;
    const totalMediumCount = totalScores.filter(score => (score / fullScore) >= 0.6 && (score / fullScore) < 0.8).length;
    const totalFailCount = totalScores.filter(score => (score / fullScore) < 0.6).length;

    const totalData = {
      schoolName: '总体',
      '优秀率': Math.round((totalExcellentCount / totalStudents) * 100),
      '良好率': Math.round((totalGoodCount / totalStudents) * 100),
      '中等率': Math.round((totalMediumCount / totalStudents) * 100),
      '不及格率': Math.round((totalFailCount / totalStudents) * 100)
    };

    return [...schoolData, totalData];
  }, [students, selectedSubject, config]);

  const colors = {
    '不及格率': '#ff4d4f', // 红色 - 最下面
    '中等率': '#fa8c16', // 深橙色
    '良好率': '#faad14', // 橙色
    '优秀率': '#52c41a' // 绿色 - 最上面
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ margin: '2px 0', color: entry.color }}>
              {`${entry.name}: ${entry.value}%`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card title={<Title level={3}>各校优良率对比</Title>} style={{ marginBottom: '24px' }}>
      <div style={{ width: '100%', height: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
            barCategoryGap="40%"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="schoolName" 
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis 
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="不及格率" stackId="a" fill={colors['不及格率']} name="不及格率">
              <LabelList 
                dataKey="不及格率" 
                position="left" 
                formatter={(value: number) => value > 0 ? `${value}%` : ''}
                style={{ fontSize: '10px', fill: '#333', fontWeight: 'bold' }}
              />
            </Bar>
            <Bar dataKey="中等率" stackId="a" fill={colors['中等率']} name="中等率">
              <LabelList 
                dataKey="中等率" 
                position="left" 
                formatter={(value: number) => value > 0 ? `${value}%` : ''}
                style={{ fontSize: '10px', fill: '#333', fontWeight: 'bold' }}
              />
            </Bar>
            <Bar dataKey="良好率" stackId="a" fill={colors['良好率']} name="良好率">
              <LabelList 
                dataKey="良好率" 
                position="left" 
                formatter={(value: number) => value > 0 ? `${value}%` : ''}
                style={{ fontSize: '10px', fill: '#333', fontWeight: 'bold' }}
              />
            </Bar>
            <Bar dataKey="优秀率" stackId="a" fill={colors['优秀率']} name="优秀率">
              <LabelList 
                dataKey="优秀率" 
                position="left" 
                formatter={(value: number) => value > 0 ? `${value}%` : ''}
                style={{ fontSize: '10px', fill: '#333', fontWeight: 'bold' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default SchoolGradeComparisonChart;
