import React from 'react';
import { Table, Card, Typography } from 'antd';
import { StudentScore } from '../types';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

interface StudentTableProps {
  students: StudentScore[];
}

const StudentTable: React.FC<StudentTableProps> = ({ students }) => {
  const getRankColor = (rank: number, total: number) => {
    const percentage = (rank / total) * 100;
    if (percentage <= 10) return 'excellent';
    if (percentage <= 30) return 'good';
    if (percentage <= 60) return 'pass';
    return 'fail';
  };

  const getRankTag = (rank: number, total: number) => {
    const color = getRankColor(rank, total);
    const className = `rank-${color}`;
    return <span className={className}>第{rank}名</span>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#52c41a';
    if (score >= 80) return '#1890ff';
    if (score >= 70) return '#faad14';
    if (score >= 60) return '#fa8c16';
    return '#ff4d4f';
  };

  // 动态生成列
  const generateColumns = (): ColumnsType<StudentScore> => {
    const baseColumns: ColumnsType<StudentScore> = [
      {
        title: '联考排名',
        dataIndex: 'overallRank',
        key: 'overallRank',
        width: 80,
        render: (rank: number) => getRankTag(rank, students.length),
        sorter: (a, b) => a.overallRank - b.overallRank,
      },
      {
        title: '校内排名',
        dataIndex: 'schoolRank',
        key: 'schoolRank',
        width: 80,
        render: (rank: number) => getRankTag(rank, students.length),
        sorter: (a, b) => a.schoolRank - b.schoolRank,
      },
      {
        title: '学校',
        dataIndex: 'school',
        key: 'school',
        width: 150,
        fixed: 'left',
      },
      {
        title: '班级',
        dataIndex: 'class',
        key: 'class',
        width: 100,
      },
      {
        title: '姓名',
        dataIndex: 'name',
        key: 'name',
        width: 100,
      },
      {
        title: '考号',
        dataIndex: 'studentId',
        key: 'studentId',
        width: 120,
      },
    ];

    // 添加科目列
    if (students.length > 0) {
      const subjects = Object.keys(students[0].subjects);
      subjects.forEach(subject => {
        baseColumns.push({
          title: subject,
          dataIndex: ['subjects', subject],
          key: subject,
          width: 80,
          render: (score: number) => (
            <span style={{ color: getScoreColor(score) }}>
              {score || '-'}
            </span>
          ),
          sorter: (a, b) => (a.subjects[subject] || 0) - (b.subjects[subject] || 0),
        });
      });
    }

    // 添加总分和平均分列
    baseColumns.push(
      {
        title: '总分',
        dataIndex: 'total',
        key: 'total',
        width: 80,
        render: (total: number) => (
          <span style={{ color: getScoreColor(total / Object.keys(students[0]?.subjects || {}).length) }}>
            {total}
          </span>
        ),
        sorter: (a, b) => a.total - b.total,
      },
      {
        title: '平均分',
        dataIndex: 'average',
        key: 'average',
        width: 80,
        render: (average: number) => (
          <span style={{ color: getScoreColor(average) }}>
            {average.toFixed(2)}
          </span>
        ),
        sorter: (a, b) => a.average - b.average,
      }
    );

    return baseColumns;
  };

  const columns = generateColumns();

  return (
    <div className="table-container">
      <Card>
        <Title level={2}>学生成绩表</Title>
        <Table
          columns={columns}
          dataSource={students}
          rowKey="id"
          scroll={{ x: 800 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
          }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default StudentTable;
