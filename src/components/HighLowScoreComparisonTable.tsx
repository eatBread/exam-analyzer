import React, { useMemo } from 'react';
import { Card, Table, Typography } from 'antd';
import { AnalysisResult } from '../types';

const { Title } = Typography;

interface HighLowScoreComparisonTableProps {
  analysisResult: AnalysisResult;
  selectedSubject: string;
}

const HighLowScoreComparisonTable: React.FC<HighLowScoreComparisonTableProps> = ({ 
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
    
    return schools.map(schoolName => {
      const schoolStudents = students.filter(s => s.school === schoolName);
      const totalStudents = schoolStudents.length;
      
      if (totalStudents === 0) {
        return {
          key: schoolName,
          schoolName,
          average: 0,
          maxScore: 0,
          minScore: 0,
          highGroupAverage: 0,
          lowGroupAverage: 0,
          highGroupCount: 0,
          lowGroupCount: 0
        };
      }

      // 计算各学校学生的分数
      const scores = schoolStudents.map(student => {
        if (selectedSubject === '全学科') {
          return student.total;
        } else {
          return student.subjects[selectedSubject] || 0;
        }
      });

      // 按分数排序
      const sortedScores = [...scores].sort((a, b) => b - a);
      
      // 计算平均分、最高分、最低分
      const average = scores.reduce((sum, score) => sum + score, 0) / totalStudents;
      const maxScore = Math.max(...scores);
      const minScore = Math.min(...scores);
      
      // 计算高分组和低分组
      const highGroupSize = Math.ceil(totalStudents * 0.3); // 前30%
      const lowGroupSize = Math.ceil(totalStudents * 0.3); // 后30%
      
      const highGroupScores = sortedScores.slice(0, highGroupSize);
      const lowGroupScores = sortedScores.slice(-lowGroupSize);
      
      const highGroupAverage = highGroupScores.length > 0 
        ? highGroupScores.reduce((sum, score) => sum + score, 0) / highGroupScores.length 
        : 0;
      
      const lowGroupAverage = lowGroupScores.length > 0 
        ? lowGroupScores.reduce((sum, score) => sum + score, 0) / lowGroupScores.length 
        : 0;

      return {
        key: schoolName,
        schoolName,
        average: Number(average.toFixed(1)),
        maxScore: Number(maxScore.toFixed(1)),
        minScore: Number(minScore.toFixed(1)),
        highGroupAverage: Number(highGroupAverage.toFixed(1)),
        lowGroupAverage: Number(lowGroupAverage.toFixed(1)),
        highGroupCount: highGroupScores.length,
        lowGroupCount: lowGroupScores.length
      };
    }).sort((a, b) => b.average - a.average); // 按平均分降序排列
  }, [students, selectedSubject, config]);

  const columns = [
    {
      title: '学校',
      dataIndex: 'schoolName',
      key: 'schoolName',
      width: 200,
      fixed: 'left' as const,
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
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          {value}
        </span>
      ),
    },
    {
      title: '高分组平均分\n(前30%)',
      dataIndex: 'highGroupAverage',
      key: 'highGroupAverage',
      width: 120,
      render: (value: number) => (
        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
          {value}
        </span>
      ),
    },
    {
      title: '低分组平均分\n(后30%)',
      dataIndex: 'lowGroupAverage',
      key: 'lowGroupAverage',
      width: 120,
      render: (value: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          {value}
        </span>
      ),
    },
    {
      title: '高分组人数(人)',
      dataIndex: 'highGroupCount',
      key: 'highGroupCount',
      width: 120,
      render: (value: number) => (
        <span style={{ color: '#52c41a' }}>
          {value}
        </span>
      ),
    },
    {
      title: '低分组人数(人)',
      dataIndex: 'lowGroupCount',
      key: 'lowGroupCount',
      width: 120,
      render: (value: number) => (
        <span style={{ color: '#ff4d4f' }}>
          {value}
        </span>
      ),
    },
  ];

  return (
    <Card title={<Title level={3}>高低分对比分析</Title>} style={{ marginBottom: '24px' }}>
      <Table
        columns={columns}
        dataSource={tableData}
        pagination={false}
        bordered
        scroll={{ x: 1000 }}
        size="middle"
      />
    </Card>
  );
};

export default HighLowScoreComparisonTable;

