import React, { useMemo } from 'react';
import { Card, Table, Typography, Tag } from 'antd';
import { AnalysisResult } from '../types';

const { Title } = Typography;

interface SchoolGradeComparisonTableProps {
  analysisResult: AnalysisResult;
  selectedSubject: string;
}

interface GradeComparisonData {
  key: string;
  schoolName: string;
  excellent: { count: number; percentage: string };
  good: { count: number; percentage: string };
  medium: { count: number; percentage: string };
  pass: { count: number; percentage: string };
  fail: { count: number; percentage: string };
  low: { count: number; percentage: string };
}

const SchoolGradeComparisonTable: React.FC<SchoolGradeComparisonTableProps> = ({ 
  analysisResult, 
  selectedSubject 
}) => {
  const { students, config } = analysisResult;

  const tableData = useMemo(() => {
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
    
    const schoolData: GradeComparisonData[] = schools.map(schoolName => {
      const schoolStudents = students.filter(s => s.school === schoolName);
      const totalStudents = schoolStudents.length;
      
      if (totalStudents === 0) {
        return {
          key: schoolName,
          schoolName,
          excellent: { count: 0, percentage: '0%' },
          good: { count: 0, percentage: '0%' },
          medium: { count: 0, percentage: '0%' },
          pass: { count: 0, percentage: '0%' },
          fail: { count: 0, percentage: '0%' },
          low: { count: 0, percentage: '0%' }
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

      const gradeCounts = {
        excellent: 0,  // 优秀 [90%, 100%]
        good: 0,      // 良好 [80%, 90%)
        medium: 0,    // 中等 [60%, 80%)
        pass: 0,      // 及格 [60%, 100%]
        fail: 0,      // 不及格 [0%, 60%)
        low: 0        // 低分 [0%, 20%)
      };

      scores.forEach(score => {
        const rate = score / fullScore;
        if (rate >= 0.9) {
          gradeCounts.excellent++;
        } else if (rate >= 0.8) {
          gradeCounts.good++;
        } else if (rate >= 0.6) {
          gradeCounts.medium++;
        } else if (rate >= 0.2) {
          // 待及格 [20%, 60%) - 这里不需要单独计算，因为已经包含在不及格中
        } else {
          // 低分 [0%, 20%)
          gradeCounts.low++;
        }
        
        // 及格和不及格的计算
        if (rate >= 0.6) {
          gradeCounts.pass++;
        } else {
          gradeCounts.fail++;
        }
      });

      return {
        key: schoolName,
        schoolName,
        excellent: {
          count: gradeCounts.excellent,
          percentage: ((gradeCounts.excellent / totalStudents) * 100).toFixed(1) + '%'
        },
        good: {
          count: gradeCounts.good,
          percentage: ((gradeCounts.good / totalStudents) * 100).toFixed(1) + '%'
        },
        medium: {
          count: gradeCounts.medium,
          percentage: ((gradeCounts.medium / totalStudents) * 100).toFixed(1) + '%'
        },
        pass: {
          count: gradeCounts.pass,
          percentage: ((gradeCounts.pass / totalStudents) * 100).toFixed(1) + '%'
        },
        fail: {
          count: gradeCounts.fail,
          percentage: ((gradeCounts.fail / totalStudents) * 100).toFixed(1) + '%'
        },
        low: {
          count: gradeCounts.low,
          percentage: ((gradeCounts.low / totalStudents) * 100).toFixed(1) + '%'
        }
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

    const totalGradeCounts = {
      excellent: 0,
      good: 0,
      medium: 0,
      pass: 0,
      fail: 0,
      low: 0
    };

    totalScores.forEach(score => {
      const rate = score / fullScore;
      if (rate >= 0.9) {
        totalGradeCounts.excellent++;
      } else if (rate >= 0.8) {
        totalGradeCounts.good++;
      } else if (rate >= 0.6) {
        totalGradeCounts.medium++;
      } else if (rate >= 0.2) {
        // 待及格 [20%, 60%) - 这里不需要单独计算，因为已经包含在不及格中
      } else {
        // 低分 [0%, 20%)
        totalGradeCounts.low++;
      }
      
      if (rate >= 0.6) {
        totalGradeCounts.pass++;
      } else {
        totalGradeCounts.fail++;
      }
    });

    const totalData: GradeComparisonData = {
      key: 'total',
      schoolName: '总体',
      excellent: {
        count: totalGradeCounts.excellent,
        percentage: ((totalGradeCounts.excellent / totalStudents) * 100).toFixed(1) + '%'
      },
      good: {
        count: totalGradeCounts.good,
        percentage: ((totalGradeCounts.good / totalStudents) * 100).toFixed(1) + '%'
      },
      medium: {
        count: totalGradeCounts.medium,
        percentage: ((totalGradeCounts.medium / totalStudents) * 100).toFixed(1) + '%'
      },
      pass: {
        count: totalGradeCounts.pass,
        percentage: ((totalGradeCounts.pass / totalStudents) * 100).toFixed(1) + '%'
      },
      fail: {
        count: totalGradeCounts.fail,
        percentage: ((totalGradeCounts.fail / totalStudents) * 100).toFixed(1) + '%'
      },
      low: {
        count: totalGradeCounts.low,
        percentage: ((totalGradeCounts.low / totalStudents) * 100).toFixed(1) + '%'
      }
    };

    return [...schoolData, totalData];
  }, [students, selectedSubject, config]);

  const columns = [
    {
      title: '学校名称',
      dataIndex: 'schoolName',
      key: 'schoolName',
      fixed: 'left' as const,
      width: 200,
      render: (text: string) => text === '总体' ? <Tag color="blue">{text}</Tag> : text,
    },
    {
      title: '优秀\n[ 90% , 100% ]',
      key: 'excellent',
      children: [
        {
          title: '人数',
          dataIndex: ['excellent', 'count'],
          key: 'excellent-count',
          width: 80,
          align: 'center' as const,
        },
        {
          title: '占比',
          dataIndex: ['excellent', 'percentage'],
          key: 'excellent-percentage',
          width: 80,
          align: 'center' as const,
          render: (text: string) => <span style={{ color: '#52c41a', fontWeight: 'bold' }}>{text}</span>,
        }
      ]
    },
    {
      title: '良好\n[ 80% , 90% )',
      key: 'good',
      children: [
        {
          title: '人数',
          dataIndex: ['good', 'count'],
          key: 'good-count',
          width: 80,
          align: 'center' as const,
        },
        {
          title: '占比',
          dataIndex: ['good', 'percentage'],
          key: 'good-percentage',
          width: 80,
          align: 'center' as const,
          render: (text: string) => <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{text}</span>,
        }
      ]
    },
    {
      title: '中等\n[ 60% , 80% )',
      key: 'medium',
      children: [
        {
          title: '人数',
          dataIndex: ['medium', 'count'],
          key: 'medium-count',
          width: 80,
          align: 'center' as const,
        },
        {
          title: '占比',
          dataIndex: ['medium', 'percentage'],
          key: 'medium-percentage',
          width: 80,
          align: 'center' as const,
          render: (text: string) => <span style={{ color: '#faad14', fontWeight: 'bold' }}>{text}</span>,
        }
      ]
    },
    {
      title: '及格\n[ 60% , 100% ]',
      key: 'pass',
      children: [
        {
          title: '人数',
          dataIndex: ['pass', 'count'],
          key: 'pass-count',
          width: 80,
          align: 'center' as const,
        },
        {
          title: '占比',
          dataIndex: ['pass', 'percentage'],
          key: 'pass-percentage',
          width: 80,
          align: 'center' as const,
          render: (text: string) => <span style={{ color: '#13c2c2', fontWeight: 'bold' }}>{text}</span>,
        }
      ]
    },
    {
      title: '不及格\n[ 0% , 60% )',
      key: 'fail',
      children: [
        {
          title: '人数',
          dataIndex: ['fail', 'count'],
          key: 'fail-count',
          width: 80,
          align: 'center' as const,
        },
        {
          title: '占比',
          dataIndex: ['fail', 'percentage'],
          key: 'fail-percentage',
          width: 80,
          align: 'center' as const,
          render: (text: string) => <span style={{ color: '#ff7875', fontWeight: 'bold' }}>{text}</span>,
        }
      ]
    },
    {
      title: '低分\n[ 0% , 20% )',
      key: 'low',
      children: [
        {
          title: '人数',
          dataIndex: ['low', 'count'],
          key: 'low-count',
          width: 80,
          align: 'center' as const,
        },
        {
          title: '占比',
          dataIndex: ['low', 'percentage'],
          key: 'low-percentage',
          width: 80,
          align: 'center' as const,
          render: (text: string) => <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{text}</span>,
        }
      ]
    }
  ];

  return (
    <Card title={<Title level={3}>各学校优良率对比</Title>} style={{ marginBottom: '24px' }}>
      <Table
        columns={columns}
        dataSource={tableData}
        pagination={false}
        bordered
        scroll={{ x: 1200 }}
        rowKey="key"
        size="small"
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={columns.length}>
              <Typography.Text type="secondary">
                注：各分档按得分率区间计算，包含所有学生（包括0分学生）。
              </Typography.Text>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />
    </Card>
  );
};

export default SchoolGradeComparisonTable;

