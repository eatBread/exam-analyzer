import React, { useMemo } from 'react';
import { Card, Table, Typography, Tag } from 'antd';
import { AnalysisResult, SubjectConfig } from '../types';

const { Title } = Typography;

interface ScoreGradeTableProps {
  analysisResult: AnalysisResult;
  selectedSubject: string;
  selectedSchool: string;
}

interface GradeData {
  key: string;
  grade: string;
  scoreRateRange: string;
  scoreRange: string;
  count: number;
  percentage: string;
}

const ScoreGradeTable: React.FC<ScoreGradeTableProps> = ({ 
  analysisResult, 
  selectedSubject, 
  selectedSchool 
}) => {
  const { students, config } = analysisResult;

  const subjectConfig: SubjectConfig | undefined = useMemo(() => {
    if (selectedSubject === '全学科') {
      const totalFullScore = config.subjects?.reduce((sum, s) => sum + s.fullScore, 0) || 0;
      return { name: '全学科', fullScore: totalFullScore, passScore: 0, excellentScore: 0 };
    }
    return config.subjects?.find(s => s.name === selectedSubject);
  }, [selectedSubject, config.subjects]);

  const tableData = useMemo(() => {
    if (!subjectConfig) return [];

    // 筛选学生数据
    let filteredStudents = students;
    if (selectedSchool !== '联考') {
      filteredStudents = students.filter(s => s.school === selectedSchool);
    }

    // 获取分数数据
    const scores = filteredStudents.map(student => {
      if (selectedSubject === '全学科') {
        return student.total;
      } else {
        return student.subjects[selectedSubject] || 0;
      }
    }).filter(score => score > 0); // 只统计有成绩的学生

    const totalStudents = scores.length;
    if (totalStudents === 0) return [];

    const fullScore = subjectConfig.fullScore;

    // 定义分档标准
    const gradeDefinitions = [
      { 
        grade: '优秀', 
        scoreRateRange: '[ 90% , 100% ]', 
        minRate: 0.9, 
        maxRate: 1.0,
        color: 'green'
      },
      { 
        grade: '良好', 
        scoreRateRange: '[ 80% , 90% )', 
        minRate: 0.8, 
        maxRate: 0.9,
        color: 'blue'
      },
      { 
        grade: '中等', 
        scoreRateRange: '[ 60% , 80% )', 
        minRate: 0.6, 
        maxRate: 0.8,
        color: 'orange'
      },
      { 
        grade: '待及格', 
        scoreRateRange: '[ 20% , 60% )', 
        minRate: 0.2, 
        maxRate: 0.6,
        color: 'red'
      },
      { 
        grade: '及格', 
        scoreRateRange: '[ 60% , 100% ]', 
        minRate: 0.6, 
        maxRate: 1.0,
        color: 'green'
      },
      { 
        grade: '不及格', 
        scoreRateRange: '[ 0% , 60% )', 
        minRate: 0.0, 
        maxRate: 0.6,
        color: 'red'
      },
      { 
        grade: '低分', 
        scoreRateRange: '[ 0% , 20% )', 
        minRate: 0.0, 
        maxRate: 0.2,
        color: 'red'
      }
    ];

    const gradeData: GradeData[] = gradeDefinitions.map(def => {
      let count = 0;
      
      if (def.grade === '优秀') {
        count = scores.filter(score => {
          const rate = score / fullScore;
          return rate >= 0.9 && rate <= 1.0;
        }).length;
      } else if (def.grade === '良好') {
        count = scores.filter(score => {
          const rate = score / fullScore;
          return rate >= 0.8 && rate < 0.9;
        }).length;
      } else if (def.grade === '中等') {
        count = scores.filter(score => {
          const rate = score / fullScore;
          return rate >= 0.6 && rate < 0.8;
        }).length;
      } else if (def.grade === '待及格') {
        count = scores.filter(score => {
          const rate = score / fullScore;
          return rate >= 0.2 && rate < 0.6;
        }).length;
      } else if (def.grade === '及格') {
        count = scores.filter(score => {
          const rate = score / fullScore;
          return rate >= 0.6 && rate <= 1.0;
        }).length;
      } else if (def.grade === '不及格') {
        count = scores.filter(score => {
          const rate = score / fullScore;
          return rate >= 0.0 && rate < 0.6;
        }).length;
      } else if (def.grade === '低分') {
        count = scores.filter(score => {
          const rate = score / fullScore;
          return rate >= 0.0 && rate < 0.2;
        }).length;
      }

      const percentage = totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(1) : '0.0';
      
      // 计算成绩区间
      const minScore = Math.round(def.minRate * fullScore * 10) / 10;
      const maxScore = Math.round(def.maxRate * fullScore * 10) / 10;
      const scoreRange = def.maxRate === 1.0 ? 
        `[ ${minScore} , ${maxScore} ]` : 
        `[ ${minScore} , ${maxScore} )`;

      return {
        key: def.grade,
        grade: def.grade,
        scoreRateRange: def.scoreRateRange,
        scoreRange,
        count,
        percentage: `${percentage}%`
      };
    });

    return gradeData;
  }, [students, selectedSubject, selectedSchool, subjectConfig]);

  const columns = [
    {
      title: '分档',
      dataIndex: 'grade',
      key: 'grade',
      width: 80,
      render: (text: string) => {
        const colorMap: { [key: string]: string } = {
          '优秀': 'green',
          '良好': 'blue', 
          '中等': 'orange',
          '待及格': 'red',
          '及格': 'green',
          '不及格': 'red',
          '低分': 'red'
        };
        return <Tag color={colorMap[text] || 'default'}>{text}</Tag>;
      }
    },
    {
      title: '得分率区间',
      dataIndex: 'scoreRateRange',
      key: 'scoreRateRange',
      width: 120,
    },
    {
      title: '成绩区间',
      dataIndex: 'scoreRange',
      key: 'scoreRange',
      width: 150,
    },
    {
      title: '人数',
      dataIndex: 'count',
      key: 'count',
      width: 80,
      render: (count: number) => <span style={{ fontWeight: 'bold' }}>{count}</span>
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      width: 80,
      render: (percentage: string) => <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{percentage}</span>
    }
  ];

  return (
    <Card title={<Title level={3}>成绩分档统计</Title>} style={{ marginBottom: '24px' }}>
      <Table
        columns={columns}
        dataSource={tableData}
        pagination={false}
        bordered
        size="small"
        rowKey="key"
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={columns.length}>
              <Typography.Text type="secondary">
                注：只统计有成绩的学生，缺考学生不计入统计。
              </Typography.Text>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />
    </Card>
  );
};

export default ScoreGradeTable;


