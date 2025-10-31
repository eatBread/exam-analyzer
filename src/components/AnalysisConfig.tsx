import React from 'react';
import { Card, Typography, Button, Space } from 'antd';
import { AnalysisConfig } from '../types';

const { Title, Text } = Typography;

interface AnalysisConfigProps {
  config: AnalysisConfig;
  onConfigChange: (newConfig: AnalysisConfig) => void;
}

const AnalysisConfigComponent: React.FC<AnalysisConfigProps> = ({ config, onConfigChange }) => {
  const presetConfigs = [
    {
      name: '九年级全科',
      config: {
        gradeLevel: '九年级',
        subjects: [
          { name: '语文', fullScore: 120, passScore: 72, excellentScore: 108 },
          { name: '数学', fullScore: 120, passScore: 72, excellentScore: 108 },
          { name: '英语', fullScore: 90, passScore: 54, excellentScore: 81 },
          { name: '政治(道德与法治)', fullScore: 90, passScore: 54, excellentScore: 81 },
          { name: '物理', fullScore: 90, passScore: 54, excellentScore: 81 },
          { name: '化学', fullScore: 90, passScore: 54, excellentScore: 81 },
          { name: '历史', fullScore: 90, passScore: 54, excellentScore: 81 }
        ]
      }
    },
    {
      name: '九年级数学',
      config: {
        gradeLevel: '九年级',
        subjects: [
          { name: '数学', fullScore: 120, passScore: 72, excellentScore: 108 }
        ],
        subjectName: '数学',
        fullScore: 120,
        passScore: 72,
        excellentScore: 108
      }
    }
  ];

  const applyPreset = (preset: typeof presetConfigs[0]) => {
    onConfigChange(preset.config);
  };

  return (
    <div className="config-container">
      <Card>
        <Title level={4}>分析配置</Title>
        <Text type="secondary">请根据实际考试情况选择分析配置，以获得更准确的分析结果</Text>
        
        <div style={{ marginTop: '24px' }}>
          <Title level={5}>快速配置</Title>
          <Space wrap>
            {presetConfigs.map((preset, index) => (
              <Button
                key={index}
                onClick={() => applyPreset(preset)}
                type={config.gradeLevel === preset.config.gradeLevel ? 'primary' : 'default'}
              >
                {preset.name}
              </Button>
            ))}
          </Space>
        </div>

        <div style={{ marginTop: '24px' }}>
          <Title level={5}>当前配置</Title>
          <div style={{ fontSize: '14px', color: '#666' }}>
            <p><strong>年级：</strong>{config.gradeLevel}</p>
            <p><strong>科目设置：</strong></p>
            <ul>
              {config.subjects?.map((subject, index) => (
                <li key={index}>
                  {subject.name} - 满分{subject.fullScore}分，及格线{subject.passScore}分，优秀线{subject.excellentScore}分
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AnalysisConfigComponent;