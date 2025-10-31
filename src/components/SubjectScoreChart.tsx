import React from 'react';
import { Card, Typography, Row, Col, Statistic } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { SubjectStats } from '../types';

const { Title } = Typography;

interface SubjectScoreChartProps {
  subjectStats: SubjectStats;
  subjectConfig?: { fullScore: number; passScore: number; excellentScore: number };
}

const SubjectScoreChart: React.FC<SubjectScoreChartProps> = ({ subjectStats, subjectConfig }) => {
  const { subject, average, max, min } = subjectStats;
  const fullScore = subjectConfig?.fullScore || 100;
  const passScore = subjectConfig?.passScore || 60;
  const excellentScore = subjectConfig?.excellentScore || 90;

  // 创建得分情况数据
  const scoreData = [
    { name: '最低分', value: min, color: '#ff4d4f' },
    { name: '平均分', value: average, color: '#1890ff' },
    { name: '最高分', value: max, color: '#52c41a' },
    { name: '满分', value: fullScore, color: '#722ed1' }
  ];

  return (
    <Card title={`${subject}得分情况`} style={{ height: '100%' }}>
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={6}>
          <Statistic
            title="测试人数"
            value={subjectStats.distribution.reduce((sum, item) => sum + item.count, 0)}
            valueStyle={{ fontSize: '18px' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="平均分"
            value={average}
            precision={2}
            valueStyle={{ fontSize: '18px', color: '#1890ff' }}
            suffix="分"
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="及格率"
            value={subjectStats.passRate}
            precision={2}
            valueStyle={{ fontSize: '18px', color: '#faad14' }}
            suffix="%"
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="优秀率"
            value={subjectStats.excellentRate}
            precision={2}
            valueStyle={{ fontSize: '18px', color: '#722ed1' }}
            suffix="%"
          />
        </Col>
      </Row>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={scoreData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, fullScore]} />
          <Tooltip 
            formatter={(value: number) => [`${value}分`, '分数']}
            labelFormatter={(label) => `${label}`}
          />
          <Bar dataKey="value" fill="#1890ff" />
          <ReferenceLine y={passScore} stroke="#faad14" strokeDasharray="5 5" label="及格线" />
          <ReferenceLine y={excellentScore} stroke="#722ed1" strokeDasharray="5 5" label="优秀线" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default SubjectScoreChart;

