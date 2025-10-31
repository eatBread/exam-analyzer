import React, { useMemo } from 'react';
import { Card, Typography } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, Line, ComposedChart, ReferenceDot, Label } from 'recharts';
import { AnalysisResult } from '../types';

const { Title } = Typography;

interface HighLowScoreComparisonChartProps {
  analysisResult: AnalysisResult;
  selectedSubject: string;
}

const HighLowScoreComparisonChart: React.FC<HighLowScoreComparisonChartProps> = ({ 
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

    // 计算Y轴最大值：最高分 + 50
    const allScores = students.map(student => {
      if (selectedSubject === '全学科') {
        return student.total;
      } else {
        return student.subjects[selectedSubject] || 0;
      }
    });
    const maxScore = allScores.length > 0 ? Math.max(...allScores) : fullScore;
    const yAxisMax = maxScore + 50;

    // 获取所有学校
    const schools = [...new Set(students.map(s => s.school).filter(Boolean))];
    
    return schools.map(schoolName => {
      const schoolStudents = students.filter(s => s.school === schoolName);
      const totalStudents = schoolStudents.length;
      
      if (totalStudents === 0) {
        return {
          schoolName,
          average: 0,
          maxScore: 0,
          minScore: 0,
          highGroupAverage: 0,
          lowGroupAverage: 0,
          highGroupGap: 0,
          lowGroupGap: 0
        };
      }

      // 计算各学校学生的分数
      const scores = schoolStudents.map(student => {
        if (selectedSubject === '全学科') {
          return student.total;
        } else {
          return student.subjects[selectedSubject] || 0;
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

      // 计算与平均分的差距
      const highGroupGap = highGroupAverage - average;
      const lowGroupGap = average - lowGroupAverage;

      return {
        schoolName: schoolNameMap[schoolName] || schoolName,
        average: Number(average.toFixed(1)),
        maxScore: Number(maxScore.toFixed(1)),
        minScore: Number(minScore.toFixed(1)),
        highGroupAverage: Number(highGroupAverage.toFixed(1)),
        lowGroupAverage: Number(lowGroupAverage.toFixed(1)),
        // 纺锤体设计：从低分组平均分开始，到高分组平均分结束
        // 红色部分：从低分组平均分到平均分
        lowGroupToAverage: Number((average - lowGroupAverage).toFixed(1)),
        // 绿色部分：从平均分到高分组平均分
        averageToHighGroup: Number((highGroupAverage - average).toFixed(1)),
        // 纺锤体底部（低分组平均分位置）
        lowGroupBottom: Number(lowGroupAverage.toFixed(1)),
        // Y轴最大值
        yAxisMax
      };
    }).sort((a, b) => b.average - a.average); // 按平均分降序排列
  }, [students, selectedSubject, config]);

  // 计算总体平均分
  const overallAverage = chartData.length > 0 
    ? chartData.reduce((sum, item) => sum + item.average, 0) / chartData.length 
    : 0;

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
              {`${entry.name}: ${entry.value}分`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card title={<Title level={3}>各校高低分组与平均分的差距分析图</Title>} style={{ marginBottom: '24px' }}>
      <div style={{ width: '100%', height: '500px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
            barCategoryGap="60%"
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
              label={{ value: '分数 (分)', angle: -90, position: 'insideLeft' }}
              domain={[0, chartData.length > 0 ? chartData[0].yAxisMax : 'dataMax + 80']}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* 总体平均分参考线 */}
            <ReferenceLine 
              y={overallAverage} 
              stroke="#1890ff" 
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{ value: `总体平均分: ${overallAverage.toFixed(1)}分`, position: "top", offset: 10 }}
            />

            {/* 纺锤体底部（低分组平均分位置） */}
            <Bar 
              dataKey="lowGroupBottom" 
              stackId="spindle"
              fill="transparent" 
              name="纺锤体底部"
            />

            {/* 红色部分：从低分组平均分到平均分 */}
            <Bar 
              dataKey="lowGroupToAverage" 
              stackId="spindle"
              fill="#ff4d4f" 
              name="低分组到平均分"
            />
            
            {/* 绿色部分：从平均分到高分组平均分 */}
            <Bar 
              dataKey="averageToHighGroup" 
              stackId="spindle"
              fill="#52c41a" 
              name="平均分到高分组"
            />

            {/* 平均分点（蓝色圆点） */}
            <Line 
              type="monotone" 
              dataKey="average" 
              stroke="#1890ff" 
              strokeWidth={4}
              dot={{ fill: '#1890ff', strokeWidth: 2, r: 6 }}
              name="平均分"
              label={{ value: "平均", position: "top", offset: 8 }}
            />

            {/* 高分组平均分点（绿色圆点） */}
            <Line 
              type="monotone" 
              dataKey="highGroupAverage" 
              stroke="#52c41a" 
              strokeWidth={2}
              dot={{ fill: '#52c41a', strokeWidth: 2, r: 4 }}
              name="高分组平均分"
              label={{ value: "高分组", position: "top", offset: 8 }}
            />

            {/* 低分组平均分点（红色圆点） */}
            <Line 
              type="monotone" 
              dataKey="lowGroupAverage" 
              stroke="#ff4d4f" 
              strokeWidth={2}
              dot={{ fill: '#ff4d4f', strokeWidth: 2, r: 4 }}
              name="低分组平均分"
              label={{ value: "低分组", position: "bottom", offset: 8 }}
            />

            {/* 最高分点（深绿色圆点） */}
            {chartData.map((item, index) => (
              <ReferenceDot
                key={`max-${index}`}
                x={item.schoolName}
                y={item.maxScore}
                r={4}
                fill="#13c2c2"
                stroke="#13c2c2"
                strokeWidth={2}
                label={{ value: `最高: ${item.maxScore}`, position: "top", offset: 8 }}
              />
            ))}

            {/* 最低分点（深红色圆点） */}
            {chartData.map((item, index) => (
              <ReferenceDot
                key={`min-${index}`}
                x={item.schoolName}
                y={item.minScore}
                r={4}
                fill="#722ed1"
                stroke="#722ed1"
                strokeWidth={2}
                label={{ value: `最低: ${item.minScore}`, position: "bottom", offset: 8 }}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default HighLowScoreComparisonChart;
