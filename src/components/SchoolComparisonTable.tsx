import React, { useMemo } from 'react';
import { Table, Card, Typography } from 'antd';
import { AnalysisResult } from '../types';

const { Title } = Typography;

interface SchoolComparisonTableProps {
  analysisResult: AnalysisResult;
  selectedSubject: string;
}

const SchoolComparisonTable: React.FC<SchoolComparisonTableProps> = ({ 
  analysisResult, 
  selectedSubject 
}) => {
  const { students, config } = analysisResult;

  // 计算学校对比数据
  const schoolComparisonData = useMemo(() => {
    // 按学校分组
    const schoolGroups = students.reduce((acc, student) => {
      const school = student.school || '未知学校';
      if (!acc[school]) {
        acc[school] = [];
      }
      acc[school].push(student);
      return acc;
    }, {} as { [key: string]: typeof students });

    // 计算每个学校的数据
    return Object.entries(schoolGroups).map(([schoolName, schoolStudents]) => {
      // 根据选择的科目筛选数据
      let scores: number[] = [];
      let fullScore = 0;

      if (selectedSubject === '全学科') {
        // 全学科：使用总分
        scores = schoolStudents.map(s => s.total);
        fullScore = config.subjects?.reduce((sum, s) => sum + s.fullScore, 0) || 0;
      } else {
        // 单科：使用该科目分数
        scores = schoolStudents.map(s => s.subjects[selectedSubject] || 0);
        const subjectConfig = config.subjects?.find(s => s.name === selectedSubject);
        fullScore = subjectConfig?.fullScore || 100;
      }

      // 包含所有学生，0分学生按0分计算
      const allScores = scores; // 不过滤0分学生
      const totalCount = schoolStudents.length; // 总人数

      const average = allScores.length > 0 ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length : 0;
      const maxScore = allScores.length > 0 ? Math.max(...allScores) : 0;
      const minScore = allScores.length > 0 ? Math.min(...allScores) : 0;
      const averageRate = fullScore > 0 ? (average / fullScore) * 100 : 0;
      
      // 计算超均率：(该学校平均分 - 参考平均值) / 参考平均值 × 100%
      // 需要先计算总体平均分作为参考
      const allStudentsScores = students.map(s => {
        if (selectedSubject === '全学科') {
          return s.total;
        } else {
          return s.subjects[selectedSubject] || 0;
        }
      });
      const overallAverage = allStudentsScores.length > 0 ? allStudentsScores.reduce((sum, s) => sum + s, 0) / allStudentsScores.length : 0;
      const aboveAverageRate = overallAverage > 0 ? ((average - overallAverage) / overallAverage) * 100 : 0;

      return {
        key: schoolName,
        schoolName,
        totalCount, // 总人数
        average: Number(average.toFixed(2)),
        averageRate: Number(averageRate.toFixed(2)),
        aboveAverageRate: Number(aboveAverageRate.toFixed(2)),
        maxScore: Number(maxScore.toFixed(2)),
        minScore: Number(minScore.toFixed(2))
      };
    }).sort((a, b) => b.average - a.average); // 按平均分降序排列
  }, [students, selectedSubject, config.subjects]);

  const columns = [
    {
      title: '学校名称',
      dataIndex: 'schoolName',
      key: 'schoolName',
      width: 120,
      fixed: 'left' as const,
    },
    {
      title: '人数',
      dataIndex: 'totalCount',
      key: 'totalCount',
      width: 100,
      render: (value: number) => (
        <span style={{ fontWeight: 'bold' }}>
          {value}
        </span>
      ),
    },
    {
      title: '平均分',
      dataIndex: 'average',
      key: 'average',
      width: 100,
      render: (value: number) => (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
          {value}
        </span>
      ),
    },
    {
      title: '超均率',
      dataIndex: 'aboveAverageRate',
      key: 'aboveAverageRate',
      width: 100,
      render: (value: number) => (
        <span style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f', fontWeight: 'bold' }}>
          {value >= 0 ? '+' : ''}{value.toFixed(2)}%
        </span>
      ),
    },
    {
      title: '平均得分率',
      dataIndex: 'averageRate',
      key: 'averageRate',
      width: 120,
      render: (value: number) => (
        <span style={{ color: value >= 80 ? '#52c41a' : value >= 60 ? '#faad14' : '#ff4d4f' }}>
          {value}%
        </span>
      ),
    },
    {
      title: '最高分',
      dataIndex: 'maxScore',
      key: 'maxScore',
      width: 100,
      render: (value: number) => (
        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
          {value}
        </span>
      ),
    },
    {
      title: '最低分',
      dataIndex: 'minScore',
      key: 'minScore',
      width: 100,
      render: (value: number) => (
        <span style={{ color: '#ff4d4f' }}>
          {value}
        </span>
      ),
    },
  ];

  return (
    <Card>
      <Title level={4}>学校对比分析</Title>
      <Table
        columns={columns}
        dataSource={schoolComparisonData}
        pagination={false}
        scroll={{ x: 600 }}
        size="small"
        bordered
        style={{ marginTop: '16px' }}
        summary={(pageData) => {
          if (pageData.length === 0) return null;
          
          const totalCount = pageData.reduce((sum, item) => sum + item.totalCount, 0);
          const overallAverage = pageData.reduce((sum, item) => sum + item.average * item.totalCount, 0) / totalCount;
          const maxScore = Math.max(...pageData.map(item => item.maxScore));
          const minScore = Math.min(...pageData.map(item => item.minScore));

          // 重新计算所有统计项：基于所有学生的实际数据
          let allScores: number[] = [];
          let fullScore = 0;
          
          if (selectedSubject === '全学科') {
            allScores = students.map(s => s.total);
            fullScore = config.subjects?.reduce((sum, s) => sum + s.fullScore, 0) || 0;
          } else {
            allScores = students.map(s => s.subjects[selectedSubject] || 0);
            const subjectConfig = config.subjects?.find(s => s.name === selectedSubject);
            fullScore = subjectConfig?.fullScore || 100;
          }
          
          // 重新计算平均分率
          const overallRate = fullScore > 0 ? (overallAverage / fullScore) * 100 : 0;
          
          // 合计行的超均率应该是0，因为它本身就是参考平均值
          const overallAboveAverageRate = 0;

          return (
            <Table.Summary fixed>
              <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
                <Table.Summary.Cell index={0}>合计</Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <span style={{ fontWeight: 'bold' }}>
                    {totalCount}
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                  <span style={{ color: '#1890ff' }}>
                    {overallAverage.toFixed(2)}
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3}>
                  <span style={{ color: '#666', fontWeight: 'bold' }}>
                    {overallAboveAverageRate.toFixed(2)}%
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4}>
                  <span style={{ color: overallRate >= 80 ? '#52c41a' : overallRate >= 60 ? '#faad14' : '#ff4d4f' }}>
                    {overallRate.toFixed(2)}%
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5}>
                  <span style={{ color: '#52c41a' }}>
                    {maxScore.toFixed(2)}
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6}>
                  <span style={{ color: '#ff4d4f' }}>
                    {minScore.toFixed(2)}
                  </span>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          );
        }}
      />
    </Card>
  );
};

export default SchoolComparisonTable;
