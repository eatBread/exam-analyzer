import React, { useCallback } from 'react';
import { Upload, Card, Typography, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Dragger } = Upload;
const { Title, Paragraph } = Typography;

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const handleUpload = useCallback((file: File) => {
    const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                   file.type === 'application/vnd.ms-excel' ||
                   file.name.endsWith('.xlsx') ||
                   file.name.endsWith('.xls');
    
    if (!isExcel) {
      message.error('请上传Excel文件（.xlsx或.xls格式）');
      return false;
    }
    
    onFileUpload(file);
    return false; // 阻止默认上传行为
  }, [onFileUpload]);

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    beforeUpload: handleUpload,
    showUploadList: false,
  };

  return (
    <div className="upload-container">
      <Card>
        <Title level={2}>上传四校联考成绩文件</Title>
        <Paragraph>
          请上传包含四校联考成绩的Excel文件。文件应包含以下列：
        </Paragraph>
        <ul>
          <li>学校（学校名称）</li>
          <li>考号（学生考号）</li>
          <li>班级（班级名称）</li>
          <li>姓名（学生姓名）</li>
          <li>数学（数学成绩）</li>
          <li>校内名次（校内排名）</li>
          <li>联考名次（联考排名）</li>
        </ul>
        
        <Dragger {...uploadProps} className="upload-area">
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持 .xlsx 和 .xls 格式的Excel文件<br/>
            包含：学校、考号、班级、姓名、语文、数学、英语、政治、物理、化学、历史、总分、校内名次、联考名次
          </p>
        </Dragger>
        
        <div style={{ marginTop: '24px' }}>
          <Title level={4}>文件格式说明：</Title>
          <Paragraph>
            <strong>第一行应为表头</strong>，包含列名。系统会自动识别以下列：
          </Paragraph>
          <ul>
            <li><strong>学校列</strong>：包含"学校"或"校名"的列</li>
            <li><strong>考号列</strong>：包含"考号"、"学号"或"学生编号"的列</li>
            <li><strong>班级列</strong>：包含"班级"或"班别"的列</li>
            <li><strong>姓名列</strong>：包含"姓名"、"名字"或"学生姓名"的列</li>
            <li><strong>数学列</strong>：包含数学成绩的列</li>
            <li><strong>排名列</strong>：包含"校内名次"、"联考名次"等排名信息</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default FileUpload;
