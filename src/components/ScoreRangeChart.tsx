import React from 'react';
import { Card, Typography, Statistic } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface ScoreRangeChartProps {
  fullScore: number;
  minScore: number;
  maxScore: number;
  avgScore: number;
  participantCount: number;
  totalStudents?: number;
}

const ScoreRangeChart: React.FC<ScoreRangeChartProps> = ({
  fullScore,
  minScore,
  maxScore,
  avgScore,
  participantCount,
  totalStudents
}) => {
  // 计算各点在条形图中的位置（百分比）
  const minPosition = (minScore / fullScore) * 100;
  const avgPosition = (avgScore / fullScore) * 100;
  const maxPosition = (maxScore / fullScore) * 100;
  const avgScoreRate = ((avgScore / fullScore) * 100).toFixed(1);

  return (
    <Card style={{ marginBottom: '24px' }}>
      <Title level={4} style={{ textAlign: 'center', marginBottom: '24px' }}>
        成绩分布概览
      </Title>
      
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        {/* 标注区域 - 放在满分条上面 */}
        <div style={{ height: '80px', marginBottom: '10px' }}>
          {/* 最低分标记 */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: `${Math.max(0, minPosition - 2)}%`,
              transform: 'translateX(-50%)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                color: '#ff4d4f',
                fontWeight: 'bold',
                fontSize: '14px',
                marginBottom: '4px'
              }}
            >
              最低分: {minScore.toFixed(1)}
            </div>
            <div
              style={{
                width: '0',
                height: '0',
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '8px solid #ff4d4f',
                margin: '0 auto'
              }}
            />
          </div>

          {/* 平均分标记 */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: `${Math.max(0, avgPosition - 2)}%`,
              transform: 'translateX(-50%)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                color: '#faad14',
                fontWeight: 'bold',
                fontSize: '14px',
                marginBottom: '2px'
              }}
            >
              平均分: {avgScore.toFixed(1)}
            </div>
            <div
              style={{
                color: '#faad14',
                fontSize: '12px',
                marginBottom: '4px'
              }}
            >
              平均得分率: {avgScoreRate}%
            </div>
            <div
              style={{
                width: '0',
                height: '0',
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '8px solid #faad14',
                margin: '0 auto'
              }}
            />
          </div>


          {/* 最高分标记 */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: `${Math.max(0, maxPosition - 2)}%`,
              transform: 'translateX(-50%)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                color: '#1890ff',
                fontWeight: 'bold',
                fontSize: '14px',
                marginBottom: '4px'
              }}
            >
              最高分: {maxScore.toFixed(1)}
            </div>
            <div
              style={{
                width: '0',
                height: '0',
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '8px solid #1890ff',
                margin: '0 auto'
              }}
            />
          </div>
        </div>

        {/* 绿色条形图背景 */}
        <div
          style={{
            width: '100%',
            height: '40px',
            backgroundColor: '#52c41a',
            borderRadius: '20px',
            position: 'relative',
            margin: '0',
            boxShadow: '0 2px 8px rgba(82, 196, 26, 0.3)'
          }}
        >
          {/* 满分值标签 */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '16px',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)'
            }}
          >
            满分值: {fullScore}
          </div>
        </div>
      </div>

      {/* 参与测试人数 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '20px'
        }}
      >
        <UserOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
        <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
          测试人数: {participantCount}
          {totalStudents && totalStudents !== participantCount && ` / ${totalStudents}`}
        </span>
      </div>
    </Card>
  );
};

export default ScoreRangeChart;
