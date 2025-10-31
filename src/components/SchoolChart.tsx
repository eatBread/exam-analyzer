import React from 'react';
import { Card, Typography } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { SchoolStats } from '../types';

const { Title } = Typography;

interface SchoolChartProps {
  schoolStats: SchoolStats[];
}

const SchoolChart: React.FC<SchoolChartProps> = ({ schoolStats }) => {
  const data = schoolStats.map(stat => ({
    school: stat.schoolName,
    average: stat.average,
    passRate: stat.passRate,
    excellentRate: stat.excellentRate,
  }));

  const getBarColor = (value: number) => {
    if (value >= 90) return '#52c41a';
    if (value >= 80) return '#1890ff';
    if (value >= 70) return '#faad14';
    if (value >= 60) return '#fa8c16';
    return '#ff4d4f';
  };

  return (
    <Card className="chart-container">
      <Title level={4}>各学校平均分对比</Title>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="school" 
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
            fontSize={10}
          />
          <YAxis 
            label={{ value: '分数', angle: -90, position: 'insideLeft' }}
            domain={[0, 100]}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [
              `${value.toFixed(2)}分`, 
              name === 'average' ? '平均分' : name
            ]}
            labelFormatter={(label) => `学校: ${label}`}
          />
          <Bar dataKey="average" name="average">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.average)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default SchoolChart;


