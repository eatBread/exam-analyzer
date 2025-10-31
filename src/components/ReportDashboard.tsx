import React, { useState, useMemo } from 'react';
import { Layout, Menu, Card, Typography, Row, Col, Statistic, Divider, Button, Space, message } from 'antd';
import { FileExcelOutlined, DownloadOutlined, FilePdfOutlined } from '@ant-design/icons';
import { AnalysisResult } from '../types';
import { exportToExcel, exportAllSubjectsExcel, exportRankingExcel } from '../utils/excelUtils';
import SchoolComparisonChart from './SchoolComparisonChart';
import SchoolComparisonTable from './SchoolComparisonTable';
import ClassComparisonChart from './ClassComparisonChart';
import ScoreGradeTable from './ScoreGradeTable';
import ScoreGradeChart from './ScoreGradeChart';
import SchoolGradeComparisonTable from './SchoolGradeComparisonTable';
import SchoolGradeComparisonChart from './SchoolGradeComparisonChart';
import HighLowScoreComparisonTable from './HighLowScoreComparisonTable';
import HighLowScoreComparisonChart from './HighLowScoreComparisonChart';
import AllSubjectsAnalysisTable from './AllSubjectsAnalysisTable';
import ScoreRangeChart from './ScoreRangeChart';

const { Sider, Content } = Layout;
const { Title } = Typography;

interface ReportDashboardProps {
  analysisResult: AnalysisResult;
  onExportPDFFromView?: (elementId: string, filename: string) => void;
}

const ReportDashboard: React.FC<ReportDashboardProps> = ({ analysisResult, onExportPDFFromView }) => {
  const [selectedSubject, setSelectedSubject] = useState('全学科');
  const [selectedSchool, setSelectedSchool] = useState('联考');

  const { students, subjectStats, classStats, schoolStats, config } = analysisResult;

  // 获取所有科目列表
  const subjects = useMemo(() => {
    const subjectList = ['全学科'];
    if (config.subjects) {
      subjectList.push(...config.subjects.map(s => s.name));
    }
    return subjectList;
  }, [config.subjects]);

  // 获取所有学校列表
  const schools = useMemo(() => {
    const schoolList = ['联考'];
    const uniqueSchools = [...new Set(students.map(s => s.school).filter(Boolean))];
    schoolList.push(...uniqueSchools);
    return schoolList;
  }, [students]);

  // 导出当前报表
  const handleExportCurrent = () => {
    try {
      const filename = `${selectedSubject} - ${selectedSchool} 分析报告`;
      exportToExcel(analysisResult, filename, selectedSubject, selectedSchool);
      message.success('报表导出成功！');
    } catch (error) {
      message.error('报表导出失败：' + (error as Error).message);
    }
  };

  // 批量导出所有报表
  const handleExportAll = () => {
    try {
      exportAllSubjectsExcel(analysisResult);
      message.success('所有报表导出成功！');
    } catch (error) {
      message.error('批量导出失败：' + (error as Error).message);
    }
  };

  // 导出排名
  const handleExportRanking = () => {
    try {
      const filename = `${selectedSubject} - ${selectedSchool} 排名表`;
      exportRankingExcel(analysisResult, filename);
      message.success('排名表导出成功！');
    } catch (error) {
      message.error('排名表导出失败：' + (error as Error).message);
    }
  };

  // 导出当前视图PDF
  const handleExportPDF = () => {
    if (onExportPDFFromView) {
      const filename = `${selectedSubject} - ${selectedSchool} 分析报告`;
      onExportPDFFromView('report-content', filename);
    }
  };

  // 根据选择的科目和学校筛选数据
  const filteredData = useMemo(() => {
    let filteredStudents = students;

    // 按学校筛选
    if (selectedSchool !== '联考') {
      filteredStudents = students.filter(s => s.school === selectedSchool);
    }

    // 按科目筛选（全学科不需要额外筛选）
    if (selectedSubject !== '全学科') {
      // 对于单科，我们需要重新计算平均分
      filteredStudents = filteredStudents.map(student => {
        const subjectScore = student.subjects[selectedSubject] || 0;
        return {
          ...student,
          average: subjectScore,
          total: subjectScore
        };
      });
    }

    return filteredStudents;
  }, [students, selectedSubject, selectedSchool]);

  // 计算当前数据的统计信息
  const currentStats = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        fullScore: 0,
        minScore: 0,
        maxScore: 0,
        avgScore: 0,
        aboveAverageRate: 0,
        participantCount: 0
      };
    }

    const scores = filteredData.map(s => selectedSubject === '全学科' ? s.total : s.average);
    
    let fullScore = 0;
    if (selectedSubject === '全学科') {
      fullScore = config.subjects?.reduce((sum, s) => sum + s.fullScore, 0) || 0;
    } else {
      const subjectConfig = config.subjects?.find(s => s.name === selectedSubject);
      fullScore = subjectConfig?.fullScore || 100;
    }

    const avgScore = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;
    // 超均率计算：(当前平均分 - 参考平均值) / 参考平均值 × 100%
    // 对于成绩分布概览，参考平均值就是当前平均分，所以超均率应该是0
    const aboveAverageRate = 0;

    return {
      fullScore,
      minScore: scores.length > 0 ? Math.min(...scores) : 0,
      maxScore: scores.length > 0 ? Math.max(...scores) : 0,
      avgScore,
      aboveAverageRate,
      participantCount: filteredData.length
    };
  }, [filteredData, selectedSubject, config.subjects]);

  // 科目菜单项
  const subjectMenuItems = subjects.map(subject => ({
    key: subject,
    label: subject
  }));

  // 学校菜单项
  const schoolMenuItems = schools.map(school => ({
    key: school,
    label: school
  }));

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* 科目选择器 */}
      <div style={{ background: '#fff', padding: '16px', marginBottom: '16px', borderRadius: '8px' }}>
        <Title level={4} style={{ margin: '0 0 16px 0' }}>科目选择</Title>
        <Menu
          mode="horizontal"
          selectedKeys={[selectedSubject]}
          items={subjectMenuItems}
          onClick={({ key }) => setSelectedSubject(key)}
          style={{ border: 'none' }}
        />
      </div>

      <Layout>
        {/* 学校选择器 */}
        <Sider width={200} style={{ background: '#fff', marginRight: '16px', borderRadius: '8px' }}>
          <div style={{ padding: '16px' }}>
            <Title level={5} style={{ margin: '0 0 16px 0' }}>学校选择</Title>
            <Menu
              mode="inline"
              selectedKeys={[selectedSchool]}
              items={schoolMenuItems}
              onClick={({ key }) => setSelectedSchool(key)}
              style={{ border: 'none' }}
            />
          </div>
        </Sider>

        {/* 主内容区域 */}
        <Content>
          <div id="report-content" style={{ background: '#fff', padding: '24px', borderRadius: '8px' }}>
            {/* 页面标题和导出按钮 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <Title level={2} style={{ margin: 0 }}>
                {selectedSubject} - {selectedSchool} 分析报告
              </Title>
              <Space>
                <Button 
                  type="primary" 
                  icon={<FileExcelOutlined />}
                  onClick={handleExportCurrent}
                >
                  导出当前报表
                </Button>
                <Button 
                  icon={<FileExcelOutlined />}
                  onClick={handleExportRanking}
                >
                  导出排名
                </Button>
                <Button 
                  icon={<FilePdfOutlined />}
                  onClick={handleExportPDF}
                >
                  导出PDF
                </Button>
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={handleExportAll}
                >
                  批量导出所有报表
                </Button>
              </Space>
            </div>

            {/* 成绩分布概览图表 */}
            <ScoreRangeChart
              fullScore={currentStats.fullScore}
              minScore={currentStats.minScore}
              maxScore={currentStats.maxScore}
              avgScore={currentStats.avgScore}
              participantCount={currentStats.participantCount}
              totalStudents={analysisResult.students.length}
            />

            <Divider />

            {/* 学校对比表格 */}
            {selectedSchool === '联考' && (
              <div style={{ marginBottom: '24px' }}>
                <SchoolComparisonTable 
                  analysisResult={analysisResult} 
                  selectedSubject={selectedSubject} 
                />
              </div>
            )}

            {/* 成绩分档统计表格和饼状图 */}
            {selectedSchool === '联考' && (
              <div style={{ marginBottom: '24px' }}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12}>
                    <ScoreGradeTable 
                      analysisResult={analysisResult} 
                      selectedSubject={selectedSubject}
                      selectedSchool={selectedSchool}
                    />
                  </Col>
                  <Col xs={24} lg={12}>
                    <ScoreGradeChart 
                      analysisResult={analysisResult} 
                      selectedSubject={selectedSubject}
                      selectedSchool={selectedSchool}
                    />
                  </Col>
                </Row>
              </div>
            )}

            {/* 各学校优良率对比图表 */}
            {selectedSchool === '联考' && (
              <div style={{ marginBottom: '24px' }}>
                <SchoolGradeComparisonChart 
                  analysisResult={analysisResult} 
                  selectedSubject={selectedSubject}
                />
              </div>
            )}

            {/* 各学校优良率对比表格 */}
            {selectedSchool === '联考' && (
              <div style={{ marginBottom: '24px' }}>
                <SchoolGradeComparisonTable 
                  analysisResult={analysisResult} 
                  selectedSubject={selectedSubject}
                />
              </div>
            )}

            {/* 全科分析表格 */}
            {selectedSubject === '全学科' && (
              <div style={{ marginBottom: '24px' }}>
                <AllSubjectsAnalysisTable 
                  analysisResult={analysisResult}
                  selectedSchool={selectedSchool}
                />
              </div>
            )}

            {/* 图表区域 */}
            {selectedSchool === '联考' && (
              <>
                <Title level={3}>图表分析</Title>
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                  <Col span={12}>
                    <SchoolComparisonChart 
                      schoolStats={schoolStats} 
                      students={students}
                      selectedSubject={selectedSubject}
                      config={config}
                    />
                  </Col>
                  <Col span={12}>
                    <ClassComparisonChart 
                      classStats={classStats} 
                      students={students}
                      selectedSubject={selectedSubject}
                      config={config}
                    />
                  </Col>
                </Row>

                {/* 高低分对比分析图表 */}
                <HighLowScoreComparisonChart 
                  analysisResult={analysisResult} 
                  selectedSubject={selectedSubject}
                />

                {/* 高低分对比分析表格 */}
                <HighLowScoreComparisonTable 
                  analysisResult={analysisResult} 
                  selectedSubject={selectedSubject}
                />
              </>
            )}

            {selectedSchool !== '联考' && (
              <>
                {/* 成绩分档统计表格和饼状图 */}
                <div style={{ marginBottom: '24px' }}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                      <ScoreGradeTable 
                        analysisResult={analysisResult} 
                        selectedSubject={selectedSubject}
                        selectedSchool={selectedSchool}
                      />
                    </Col>
                    <Col xs={24} lg={12}>
                      <ScoreGradeChart 
                        analysisResult={analysisResult} 
                        selectedSubject={selectedSubject}
                        selectedSchool={selectedSchool}
                      />
                    </Col>
                  </Row>
                </div>

              </>
            )}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ReportDashboard;
