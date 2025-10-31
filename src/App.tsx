import React, { useState } from 'react';
import { Layout, Menu, Card, Button, message, Spin, Dropdown } from 'antd';
import { UploadOutlined, BarChartOutlined, TableOutlined, FileExcelOutlined, FilePdfOutlined, DownOutlined } from '@ant-design/icons';
import { AnalysisResult, AnalysisConfig } from './types';
import { readExcelFile, analyzeScores, exportToExcel, exportAllSubjectsExcel, exportRankingExcel } from './utils/excelUtils';
import { generatePDFReport, generatePDFFromElement } from './utils/pdfUtils';
import FileUpload from './components/FileUpload';
// import AnalysisDashboard from './components/AnalysisDashboard';
import MultiSubjectDashboard from './components/MultiSubjectDashboard';
import ReportDashboard from './components/ReportDashboard';
// import StudentTable from './components/StudentTable';
import AnalysisConfigComponent from './components/AnalysisConfig';
import './App.css';

const { Header, Content, Sider } = Layout;

const App: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('config');
  const [analysisConfig, setAnalysisConfig] = useState<AnalysisConfig>({
    gradeLevel: '九年级',
    subjects: [
      { name: '语文', fullScore: 120, passScore: 72, excellentScore: 108 },
      { name: '数学', fullScore: 120, passScore: 72, excellentScore: 108 },
      { name: '英语', fullScore: 90, passScore: 54, excellentScore: 81 },
      { name: '政治(道德与法治)', fullScore: 90, passScore: 54, excellentScore: 81 },
      { name: '物理', fullScore: 90, passScore: 54, excellentScore: 81 },
      { name: '化学', fullScore: 90, passScore: 54, excellentScore: 81 },
      { name: '历史', fullScore: 90, passScore: 54, excellentScore: 81 }
    ],
    // 保持向后兼容
    subjectName: '数学',
    fullScore: 120,
    passScore: 72,
    excellentScore: 108
  });

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    try {
      const students = await readExcelFile(file);
      const result = analyzeScores(students, analysisConfig);
      setAnalysisResult(result);
      message.success(`成功导入 ${students.length} 条学生成绩数据`);
    } catch (error) {
      message.error('文件读取失败，请检查文件格式');
      console.error('Error reading file:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (newConfig: AnalysisConfig) => {
    setAnalysisConfig(newConfig);
    // 如果已有分析结果，重新分析
    if (analysisResult) {
      const newResult = analyzeScores(analysisResult.students, newConfig);
      setAnalysisResult(newResult);
    }
  };

  const handleExportExcel = () => {
    if (analysisResult) {
      exportToExcel(analysisResult);
      message.success('Excel导出成功');
    }
  };

  const handleExportPDF = async () => {
    if (analysisResult) {
      try {
        await generatePDFReport(analysisResult);
        message.success('PDF导出成功');
      } catch (error) {
        message.error('PDF导出失败');
        console.error('PDF export error:', error);
      }
    }
  };

  const handleExportAllSubjects = () => {
    if (analysisResult) {
      try {
        exportAllSubjectsExcel(analysisResult);
        message.success('所有学科报表导出成功！');
      } catch (error) {
        message.error('批量导出失败：' + (error as Error).message);
      }
    }
  };

  const handleExportRanking = () => {
    if (analysisResult) {
      try {
        exportRankingExcel(analysisResult, '联考排名表');
        message.success('排名表导出成功！');
      } catch (error) {
        message.error('排名表导出失败：' + (error as Error).message);
      }
    }
  };

  const handleExportPDFFromView = async () => {
    try {
      // 默认导出分析内容区域，使用平衡压缩级别
      await generatePDFFromElement('analysis-content', '四校数学成绩分析报告', 'balanced');
      message.success('PDF导出成功');
    } catch (error) {
      message.error('PDF导出失败');
      console.error('PDF export error:', error);
    }
  };

  const exportMenuItems = [
    {
      key: 'excel',
      label: '导出Excel',
      icon: <FileExcelOutlined />,
      onClick: handleExportExcel,
    },
    {
      key: 'excel-ranking',
      label: '导出排名',
      icon: <FileExcelOutlined />,
      onClick: handleExportRanking,
    },
    {
      key: 'excel-all',
      label: '导出所有学科报表',
      icon: <FileExcelOutlined />,
      onClick: handleExportAllSubjects,
    },
    {
      key: 'pdf',
      label: '导出PDF报告',
      icon: <FilePdfOutlined />,
      onClick: handleExportPDF,
    },
    {
      key: 'pdf-view',
      label: '导出当前视图PDF',
      icon: <FilePdfOutlined />,
      onClick: handleExportPDFFromView,
    },
  ];

  const menuItems = [
    {
      key: 'config',
      icon: <UploadOutlined />,
      label: '分析配置',
    },
    {
      key: 'upload',
      icon: <UploadOutlined />,
      label: '文件上传',
    },
        {
          key: 'dashboard',
          icon: <BarChartOutlined />,
          label: '数据分析',
          disabled: !analysisResult,
        },
        {
          key: 'multi-subject',
          icon: <BarChartOutlined />,
          label: '全科分析',
          disabled: !analysisResult,
        },
        {
          key: 'report',
          icon: <BarChartOutlined />,
          label: '分析报告',
          disabled: !analysisResult,
        },
    {
      key: 'table',
      icon: <TableOutlined />,
      label: '成绩表格',
      disabled: !analysisResult,
    },
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <p style={{ marginTop: '16px' }}>正在处理文件...</p>
        </div>
      );
    }

    switch (currentTab) {
      case 'config':
        return <AnalysisConfigComponent config={analysisConfig} onConfigChange={handleConfigChange} />;
      case 'upload':
        return <FileUpload onFileUpload={handleFileUpload} />;
          case 'dashboard':
            return analysisResult ? (
              <MultiSubjectDashboard analysisResult={analysisResult} />
            ) : (
              <Card>
                <div style={{ textAlign: 'center', padding: '50px' }}>
                  <p>请先上传Excel文件进行数据分析</p>
                </div>
              </Card>
            );
          case 'multi-subject':
            return analysisResult ? (
              <MultiSubjectDashboard analysisResult={analysisResult} />
            ) : (
              <Card>
                <div style={{ textAlign: 'center', padding: '50px' }}>
                  <p>请先上传Excel文件进行全科分析</p>
                </div>
              </Card>
            );
          case 'report':
            return analysisResult ? (
              <ReportDashboard 
                analysisResult={analysisResult} 
                onExportPDFFromView={async (elementId: string, filename: string) => {
                  try {
                    await generatePDFFromElement(elementId, filename, 'balanced');
                    message.success('PDF导出成功');
                  } catch (error) {
                    message.error('PDF导出失败');
                    console.error('PDF export error:', error);
                  }
                }}
              />
            ) : (
              <Card>
                <div style={{ textAlign: 'center', padding: '50px' }}>
                  <p>请先上传Excel文件生成分析报告</p>
                </div>
              </Card>
            );
      case 'table':
        return (
          <Card>
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <p>成绩表格功能已移至分析报告页面</p>
              <p>请在"分析报告"页面查看详细的学生成绩数据</p>
            </div>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h1 style={{ margin: 0, color: '#1890ff' }}>四校成绩分析系统</h1>
          {analysisResult && (
            <Dropdown menu={{ items: exportMenuItems }} trigger={['click']}>
              <Button type="primary" icon={<FileExcelOutlined />}>
                导出报告 <DownOutlined />
              </Button>
            </Dropdown>
          )}
        </div>
      </Header>
      
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[currentTab]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
            onClick={({ key }) => setCurrentTab(key)}
          />
        </Sider>
        
        <Layout style={{ padding: '24px' }}>
          <Content id="analysis-content">
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default App;
