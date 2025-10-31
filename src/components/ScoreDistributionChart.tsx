import React from 'react';
import { Card, Typography } from 'antd';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { StudentScore, AnalysisConfig } from '../types';

const { Title } = Typography;

interface ScoreDistributionChartProps {
  students: StudentScore[];
  config: AnalysisConfig;
  isTotalScore?: boolean;
}

const ScoreDistributionChart: React.FC<ScoreDistributionChartProps> = ({ students, config, isTotalScore = false }) => {
  // 计算分数分布
  let passScore, excellentScore, fullScore;
  
  if (isTotalScore && config.subjects) {
    // 总分分布
    passScore = config.subjects.reduce((sum, s) => sum + s.passScore, 0);
    excellentScore = config.subjects.reduce((sum, s) => sum + s.excellentScore, 0);
    fullScore = config.subjects.reduce((sum, s) => sum + s.fullScore, 0);
  } else {
    // 单科分布（向后兼容）
    passScore = config.passScore || 60;
    excellentScore = config.excellentScore || 90;
    fullScore = config.fullScore || 100;
  }
  
  const distribution = [
    { name: `优秀(${excellentScore}-${fullScore}分)`, value: 0, color: '#52c41a' },
    { name: `良好(${Math.floor((passScore + excellentScore) / 2)}-${excellentScore - 1}分)`, value: 0, color: '#1890ff' },
    { name: `及格(${passScore}-${Math.floor((passScore + excellentScore) / 2) - 1}分)`, value: 0, color: '#faad14' },
    { name: `不及格(0-${passScore - 1}分)`, value: 0, color: '#ff4d4f' },
  ];

  students.forEach(student => {
    const score = isTotalScore ? student.total : student.average;
    if (score >= excellentScore) {
      distribution[0].value++;
    } else if (score >= Math.floor((passScore + excellentScore) / 2)) {
      distribution[1].value++;
    } else if (score >= passScore) {
      distribution[2].value++;
    } else {
      distribution[3].value++;
    }
  });

  const total = students.length;
  const data = distribution.map(item => ({
    ...item,
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0'
  }));

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {percentage}%
      </text>
    );
  };

  return (
    <Card className="chart-container">
      <Title level={4}>{isTotalScore ? "总分分布情况" : "学生成绩分布"}</Title>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number, name: string, props: any) => [
              `${value}人 (${props.payload.percentage}%)`,
              name
            ]}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry: any) => (
              <span style={{ color: entry.color }}>
                {value} ({entry.payload.value}人)
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default ScoreDistributionChart;
