import React from 'react';
import { Row, Col, Card, Statistic, Typography, Divider } from 'antd';
import { AnalysisResult } from '../types';
import SubjectScoreChart from './SubjectScoreChart';
import SchoolComparisonChart from './SchoolComparisonChart';
import ClassComparisonChart from './ClassComparisonChart';
import ScoreDistributionChart from './ScoreDistributionChart';

const { Title } = Typography;

interface MultiSubjectDashboardProps {
  analysisResult: AnalysisResult;
}

const MultiSubjectDashboard: React.FC<MultiSubjectDashboardProps> = ({ analysisResult }) => {
  const { overallStats, subjectStats, classStats, schoolStats, config } = analysisResult;

  return (
    <div className="analysis-container">
      <Title level={2}>{config.gradeLevel}全科成绩分析概览</Title>
      
      {/* 分析配置显示 */}
      <div style={{ marginBottom: '24px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
        <Typography.Text strong>分析配置：</Typography.Text>
        <div style={{ marginTop: '8px' }}>
          {config.subjects?.map((subject, index) => (
            <Typography.Text key={index} style={{ marginRight: '16px' }}>
              {subject.name}满分{subject.fullScore}分 | 及格线{subject.passScore}分 | 优秀线{subject.excellentScore}分
            </Typography.Text>
          ))}
        </div>
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
              title="总平均分"
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
              title="总及格率"
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
              title="总优秀率"
              value={overallStats.overallExcellentRate}
              precision={2}
              valueStyle={{ color: '#722ed1', fontSize: '28px' }}
              suffix="%"
            />
          </Card>
        </div>
      </div>

      {/* 学校班级统计 */}
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

      <Divider />

      {/* 各科目得分情况 */}
      <Title level={3}>各科目得分情况</Title>
      <div className="chart-grid">
        {subjectStats.map((subject, index) => (
          <div key={index} className="chart-item">
            <SubjectScoreChart 
              subjectStats={subject} 
              subjectConfig={config.subjects?.find(s => s.name === subject.subject)}
            />
          </div>
        ))}
      </div>

      <Divider />

      {/* 学校对比分析 */}
      <Title level={3}>学校对比分析</Title>
      <div className="chart-grid">
        <div className="chart-item">
          <SchoolComparisonChart schoolStats={schoolStats} />
        </div>
        <div className="chart-item">
          <ClassComparisonChart classStats={classStats} />
        </div>
      </div>

      <Divider />

      {/* 总分分布 */}
      <Title level={3}>总分分布情况</Title>
      <div className="chart-grid">
        <div className="chart-item">
          <ScoreDistributionChart 
            students={analysisResult.students} 
            config={config}
            isTotalScore={true}
          />
        </div>
      </div>
    </div>
  );
};

export default MultiSubjectDashboard;

