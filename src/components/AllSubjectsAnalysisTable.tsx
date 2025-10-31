import React, { useMemo } from 'react';
import { Card, Table, Typography, Tag } from 'antd';
import { AnalysisResult } from '../types';

const { Title } = Typography;

interface AllSubjectsAnalysisTableProps {
  analysisResult: AnalysisResult;
  selectedSchool?: string;
}

interface SubjectAnalysisData {
  key: string;
  subject: string;
  fullScore: number;
  schoolAverage: number; // 学校平均分
  overallAverage: number; // 联考平均分
  maxScore: number;
  minScore: number;
  excellentRate: number;
  passRate: number;
  lowScoreRate: number;
  aboveAverageRate: number;
}

const AllSubjectsAnalysisTable: React.FC<AllSubjectsAnalysisTableProps> = ({ 
  analysisResult,
  selectedSchool = '联考'
}) => {
  const { students, config } = analysisResult;

  const tableData = useMemo(() => {
    if (!config?.subjects) return [];

    const data: SubjectAnalysisData[] = [];

    // 计算各学科统计
    config.subjects.forEach(subjectConfig => {
      // 计算联考该科目的平均分（所有学生）
      const allSubjectScores = students.map(s => s.subjects[subjectConfig.name] || 0);
      const overallSubjectAverage = allSubjectScores.length > 0 ? allSubjectScores.reduce((sum, s) => sum + s, 0) / allSubjectScores.length : 0;
      
      let schoolSubjectScores: number[] = [];
      let schoolAverage = 0;
      let maxScore = 0;
      let minScore = 0;
      let excellentRate = 0;
      let passRate = 0;
      let lowScoreRate = 0;
      let aboveAverageRate = 0;
      
      if (selectedSchool === '联考') {
        // 联考时，学校平均分就是联考平均分
        schoolSubjectScores = allSubjectScores;
        schoolAverage = overallSubjectAverage;
        maxScore = Math.max(...allSubjectScores);
        minScore = Math.min(...allSubjectScores);
        aboveAverageRate = 0; // 联考时超均率为0
        
        // 计算各率
        const excellentCount = allSubjectScores.filter(score => (score / subjectConfig.fullScore) >= 0.8).length;
        const passCount = allSubjectScores.filter(score => score >= subjectConfig.passScore).length;
        const lowScoreCount = allSubjectScores.filter(score => score < subjectConfig.passScore * 0.2).length;
        
        excellentRate = (excellentCount / allSubjectScores.length) * 100;
        passRate = (passCount / allSubjectScores.length) * 100;
        lowScoreRate = (lowScoreCount / allSubjectScores.length) * 100;
      } else {
        // 单校时，计算该校该科目的数据
        schoolSubjectScores = students.filter(s => s.school === selectedSchool).map(s => s.subjects[subjectConfig.name] || 0);
        if (schoolSubjectScores.length === 0) return;
        
        schoolAverage = schoolSubjectScores.reduce((sum, score) => sum + score, 0) / schoolSubjectScores.length;
        maxScore = Math.max(...schoolSubjectScores);
        minScore = Math.min(...schoolSubjectScores);
        
        // 计算超均率：(该校平均分 - 联考平均分) / 联考平均分 × 100%
        aboveAverageRate = overallSubjectAverage > 0 ? ((schoolAverage - overallSubjectAverage) / overallSubjectAverage) * 100 : 0;
        
        // 计算各率
        const excellentCount = schoolSubjectScores.filter(score => (score / subjectConfig.fullScore) >= 0.8).length;
        const passCount = schoolSubjectScores.filter(score => score >= subjectConfig.passScore).length;
        const lowScoreCount = schoolSubjectScores.filter(score => score < subjectConfig.passScore * 0.2).length;
        
        excellentRate = (excellentCount / schoolSubjectScores.length) * 100;
        passRate = (passCount / schoolSubjectScores.length) * 100;
        lowScoreRate = (lowScoreCount / schoolSubjectScores.length) * 100;
      }

      data.push({
        key: subjectConfig.name,
        subject: subjectConfig.name,
        fullScore: subjectConfig.fullScore,
        schoolAverage: schoolAverage,
        overallAverage: overallSubjectAverage,
        maxScore: maxScore,
        minScore: minScore,
        excellentRate: excellentRate,
        passRate: passRate,
        lowScoreRate: lowScoreRate,
        aboveAverageRate: aboveAverageRate
      });
    });

    // 计算全科统计
    const allTotalScores = students.map(s => s.total);
    const overallTotalAverage = allTotalScores.length > 0 ? allTotalScores.reduce((sum, s) => sum + s, 0) / allTotalScores.length : 0;
    
    let schoolTotalScores: number[] = [];
    let schoolTotalAverage = 0;
    let totalMaxScore = 0;
    let totalMinScore = 0;
    let totalExcellentRate = 0;
    let totalPassRate = 0;
    let totalLowScoreRate = 0;
    let totalAboveAverageRate = 0;
    
    if (selectedSchool === '联考') {
      // 联考时，学校总分就是联考总分
      schoolTotalScores = allTotalScores;
      schoolTotalAverage = overallTotalAverage;
      totalMaxScore = Math.max(...allTotalScores);
      totalMinScore = Math.min(...allTotalScores);
      totalAboveAverageRate = 0; // 联考时超均率为0
      
      // 计算各率
      const totalFullScore = config.subjects.reduce((sum, s) => sum + s.fullScore, 0);
      const totalPassScore = config.subjects.reduce((sum, s) => sum + s.passScore, 0);
      const totalExcellentScore = config.subjects.reduce((sum, s) => sum + s.excellentScore, 0);
      
      const totalExcellentCount = allTotalScores.filter(score => score >= totalExcellentScore).length;
      const totalPassCount = allTotalScores.filter(score => score >= totalPassScore).length;
      const totalLowScoreCount = allTotalScores.filter(score => score < totalPassScore * 0.2).length;
      
      totalExcellentRate = (totalExcellentCount / allTotalScores.length) * 100;
      totalPassRate = (totalPassCount / allTotalScores.length) * 100;
      totalLowScoreRate = (totalLowScoreCount / allTotalScores.length) * 100;
    } else {
      // 单校时，计算该校总分数据
      schoolTotalScores = students.filter(s => s.school === selectedSchool).map(s => s.total);
      if (schoolTotalScores.length === 0) return data;
      
      schoolTotalAverage = schoolTotalScores.reduce((sum, score) => sum + score, 0) / schoolTotalScores.length;
      totalMaxScore = Math.max(...schoolTotalScores);
      totalMinScore = Math.min(...schoolTotalScores);
      
      // 计算超均率：(该校总分平均分 - 联考总分平均分) / 联考总分平均分 × 100%
      totalAboveAverageRate = overallTotalAverage > 0 ? ((schoolTotalAverage - overallTotalAverage) / overallTotalAverage) * 100 : 0;
      
      // 计算各率
      const totalFullScore = config.subjects.reduce((sum, s) => sum + s.fullScore, 0);
      const totalPassScore = config.subjects.reduce((sum, s) => sum + s.passScore, 0);
      const totalExcellentScore = config.subjects.reduce((sum, s) => sum + s.excellentScore, 0);
      
      const totalExcellentCount = schoolTotalScores.filter(score => (score / totalFullScore) >= 0.8).length;
      const totalPassCount = schoolTotalScores.filter(score => score >= totalPassScore).length;
      const totalLowScoreCount = schoolTotalScores.filter(score => score < totalPassScore * 0.2).length;
      
      totalExcellentRate = (totalExcellentCount / schoolTotalScores.length) * 100;
      totalPassRate = (totalPassCount / schoolTotalScores.length) * 100;
      totalLowScoreRate = (totalLowScoreCount / schoolTotalScores.length) * 100;
    }

    const totalFullScore = config.subjects.reduce((sum, s) => sum + s.fullScore, 0);

    data.push({
      key: '全科',
      subject: '全科',
      fullScore: totalFullScore,
      schoolAverage: schoolTotalAverage,
      overallAverage: overallTotalAverage,
      maxScore: totalMaxScore,
      minScore: totalMinScore,
      excellentRate: totalExcellentRate,
      passRate: totalPassRate,
      lowScoreRate: totalLowScoreRate,
      aboveAverageRate: totalAboveAverageRate
    });

    return data;
  }, [students, config, selectedSchool]);

  const columns = [
    {
      title: '学科',
      dataIndex: 'subject',
      key: 'subject',
      fixed: 'left' as const,
      width: 120,
      render: (text: string) => text === '全科' ? <Tag color="blue">{text}</Tag> : text,
    },
    {
      title: '满分值',
      dataIndex: 'fullScore',
      key: 'fullScore',
      width: 80,
      align: 'center' as const,
      render: (value: number) => <span style={{ fontWeight: 'bold' }}>{value}</span>,
    },
    {
      title: '联考平均分',
      dataIndex: 'overallAverage',
      key: 'overallAverage',
      width: 100,
      align: 'center' as const,
      render: (value: number) => <span style={{ color: '#52c41a', fontWeight: 'bold' }}>{value.toFixed(1)}</span>,
    },
    {
      title: '学校平均分',
      dataIndex: 'schoolAverage',
      key: 'schoolAverage',
      width: 100,
      align: 'center' as const,
      render: (value: number) => <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{value.toFixed(1)}</span>,
    },
    {
      title: '最高分',
      dataIndex: 'maxScore',
      key: 'maxScore',
      width: 100,
      align: 'center' as const,
      render: (value: number) => <span style={{ color: '#52c41a', fontWeight: 'bold' }}>{value.toFixed(1)}</span>,
    },
    {
      title: '最低分',
      dataIndex: 'minScore',
      key: 'minScore',
      width: 100,
      align: 'center' as const,
      render: (value: number) => <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{value.toFixed(1)}</span>,
    },
    {
      title: '优良率',
      dataIndex: 'excellentRate',
      key: 'excellentRate',
      width: 100,
      align: 'center' as const,
      render: (value: number) => {
        let color = 'default';
        if (value >= 20) color = 'green';
        else if (value >= 10) color = 'blue';
        else if (value >= 5) color = 'orange';
        else color = 'red';
        return <Tag color={color}>{value.toFixed(1)}%</Tag>;
      },
    },
    {
      title: '及格率',
      dataIndex: 'passRate',
      key: 'passRate',
      width: 100,
      align: 'center' as const,
      render: (value: number) => {
        let color = 'default';
        if (value >= 80) color = 'green';
        else if (value >= 60) color = 'blue';
        else if (value >= 40) color = 'orange';
        else color = 'red';
        return <Tag color={color}>{value.toFixed(1)}%</Tag>;
      },
    },
    {
      title: '低分率',
      dataIndex: 'lowScoreRate',
      key: 'lowScoreRate',
      width: 100,
      align: 'center' as const,
      render: (value: number) => {
        let color = 'default';
        if (value <= 5) color = 'green';
        else if (value <= 10) color = 'blue';
        else if (value <= 20) color = 'orange';
        else color = 'red';
        return <Tag color={color}>{value.toFixed(1)}%</Tag>;
      },
    },
    {
      title: '超均率',
      dataIndex: 'aboveAverageRate',
      key: 'aboveAverageRate',
      width: 100,
      align: 'center' as const,
      render: (value: number) => {
        let color = 'default';
        if (value >= 0) color = 'green';
        else color = 'red';
        return <Tag color={color}>{value >= 0 ? '+' : ''}{value.toFixed(2)}%</Tag>;
      },
    }
  ];

  return (
    <Card title={<Title level={3}>全科分析</Title>} style={{ marginBottom: '24px' }}>
      <Table
        columns={columns}
        dataSource={tableData}
        pagination={false}
        bordered
        scroll={{ x: 1000 }}
        rowKey="key"
        size="small"
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={columns.length}>
              <Typography.Text type="secondary">
                注：低分率定义为低于及格分20%的学生占比；超均率为超过平均分的学生占比。
              </Typography.Text>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />
    </Card>
  );
};

export default AllSubjectsAnalysisTable;
