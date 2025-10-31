import React from 'react';
import { Row, Col, Card, Statistic, Typography } from 'antd';
import { AnalysisResult } from '../types';
import SubjectScoreChart from './SubjectScoreChart';
import SchoolComparisonChart from './SchoolComparisonChart';
import ClassComparisonChart from './ClassComparisonChart';
// import ScoreDistributionChart from './ScoreDistributionChart';

const { Title } = Typography;

interface AnalysisDashboardProps {
  analysisResult: AnalysisResult;
}

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ analysisResult }) => {
  const { overallStats, subjectStats, classStats, schoolStats, config } = analysisResult;

  return (
    <div className="analysis-container">
      <Title level={2}>{config.gradeLevel}{config.subjectName}成绩分析概览</Title>
      <div style={{ marginBottom: '24px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
        <Typography.Text strong>分析配置：</Typography.Text>
        <Typography.Text>
          满分 {config.fullScore || config.subjects?.[0]?.fullScore || 100}分 | 
          及格线 {config.passScore || config.subjects?.[0]?.passScore || 60}分 | 
          优秀线 {config.excellentScore || config.subjects?.[0]?.excellentScore || 90}分
        </Typography.Text>
      </div>
      
      {/* 总体统计 */}
      <div className="stats-grid">
        <div className="stat-item">
          <Card className="stats-card">
            <Statistic
              title="总学生数"
              value={overallStats.totalStudents}
              valueStyle={{ color: '#1890ff', fontSize: '28px' }}
            />
          </Card>
        </div>
        <div className="stat-item">
          <Card className="stats-card">
            <Statistic
              title="平均分"
              value={overallStats.overallAverage}
              precision={2}
              valueStyle={{ color: '#52c41a', fontSize: '28px' }}
              suffix="分"
            />
          </Card>
        </div>
        <div className="stat-item">
          <Card className="stats-card">
            <Statistic
              title="及格率"
              value={overallStats.overallPassRate}
              precision={2}
              valueStyle={{ color: '#faad14', fontSize: '28px' }}
              suffix="%"
            />
          </Card>
        </div>
        <div className="stat-item">
          <Card className="stats-card">
            <Statistic
              title="优秀率"
              value={overallStats.overallExcellentRate}
              precision={2}
              valueStyle={{ color: '#722ed1', fontSize: '28px' }}
              suffix="%"
            />
          </Card>
        </div>
      </div>

      {/* 学校统计 */}
      <div className="stats-grid">
        <div className="stat-item">
          <Card className="stats-card">
            <Statistic
              title="参与学校数"
              value={overallStats.totalSchools}
              valueStyle={{ color: '#13c2c2', fontSize: '28px' }}
            />
          </Card>
        </div>
        <div className="stat-item">
          <Card className="stats-card">
            <Statistic
              title="参与班级数"
              value={overallStats.totalClasses}
              valueStyle={{ color: '#eb2f96', fontSize: '28px' }}
            />
          </Card>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="chart-grid">
        <div className="chart-item">
          <SchoolComparisonChart schoolStats={schoolStats} />
        </div>
        <div className="chart-item">
          <ClassComparisonChart classStats={classStats} />
        </div>
      </div>

      {/* <div className="chart-grid">
        <div className="chart-item">
          <ScoreDistributionChart students={analysisResult.students} config={config} />
        </div>
      </div> */}
    </div>
  );
};

export default AnalysisDashboard;
