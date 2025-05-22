import React, { useState, useEffect, useRef } from 'react';
import { AutoReportTrigger } from '../services/AutoReportTrigger.js';

const AutoReportDashboard = () => {
  const [reports, setReports] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  const [autoReporting, setAutoReporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTrigger = useRef(new AutoReportTrigger());

  // 컴포넌트 마운트 시 기존 보고서 로드
  useEffect(() => {
    const savedReports = JSON.parse(localStorage.getItem('aiReports') || '[]');
    setReports(savedReports);
    
    // 새 보고서 이벤트 리스너
    const handleNewReport = (event) => {
      setReports(prev => [event.detail, ...prev.slice(0, 49)]);
    };
    
    // 긴급 알림 이벤트 리스너
    const handleEmergencyAlert = (event) => {
      alert(`🚨 긴급 상황 발생!\n${event.detail.executive_summary.incident_overview}`);
    };
    
    window.addEventListener('newAIReport', handleNewReport);
    window.addEventListener('emergencyAlert', handleEmergencyAlert);
    
    return () => {
      window.removeEventListener('newAIReport', handleNewReport);
      window.removeEventListener('emergencyAlert', handleEmergencyAlert);
    };
  }, []);

  // 자동 보고서 시스템 제어
  useEffect(() => {
    if (autoReporting) {
      reportTrigger.current.startAutoReporting();
    } else {
      reportTrigger.current.stopAutoReporting();
    }
  }, [autoReporting]);

  // 수동 보고서 생성
  const generateManualReport = async () => {
    setIsGenerating(true);
    try {
      const report = await reportTrigger.current.generateManualReport();
      if (report) {
        setCurrentReport(report);
      }
    } catch (error) {
      console.error('수동 보고서 생성 실패:', error);
      alert('보고서 생성에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">🤖 AI 자동 장애 분석 시스템</h1>
            <p className="text-blue-100">1시간마다 모든 서버 데이터를 분석하여 완전한 보고서를 자동 생성합니다</p>
          </div>
          <div className="text-right">
            <div className={`inline-block px-4 py-2 rounded-full mb-2 ${autoReporting ? 'bg-green-500' : 'bg-gray-500'}`}>
              {autoReporting ? '🟢 자동 분석 활성' : '⚫자동 분석 비활성'}
            </div>
            <br />
            <span className="text-sm">생성된 보고서: {reports.length}개</span>
          </div>
        </div>
        
        <div className="mt-4 flex items-center space-x-4">
          <button 
            onClick={() => setAutoReporting(!autoReporting)}
            className={`px-6 py-2 rounded-lg font-medium ${
              autoReporting 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {autoReporting ? '⏹️ 자동 분석 중단' : '▶️ 자동 분석 시작'}
          </button>
          
          <button 
            onClick={generateManualReport}
            disabled={isGenerating}
            className="px-6 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 font-medium disabled:opacity-50"
          >
            {isGenerating ? '📊 생성 중...' : '📊 즉시 보고서 생성'}
          </button>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 보고서 목록 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">📋 생성된 보고서</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {reports.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  <p>아직 생성된 보고서가 없습니다.</p>
                  <p className="text-sm mt-2">자동 분석을 시작하거나 수동으로 보고서를 생성해보세요.</p>
                </div>
              ) : (
                reports.map(report => (
                  <div 
                    key={report.report_id}
                    onClick={() => setCurrentReport(report)}
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      currentReport?.report_id === report.report_id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">{report.report_id}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        report.type === 'emergency' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {report.type === 'emergency' ? '🚨 긴급' : '📊 정기'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {report.executive_summary.incident_overview.substring(0, 80)}...
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(report.generated_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 보고서 상세 내용 */}
        <div className="lg:col-span-2">
          {currentReport ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{currentReport.report_id}</h2>
                <span className="text-sm text-gray-500">
                  {new Date(currentReport.generated_at).toLocaleString()}
                </span>
              </div>

              {/* 경영진 요약 */}
              <div className="mb-8 p-6 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <h3 className="text-lg font-bold text-blue-800 mb-3">💼 경영진 요약</h3>
                <p className="text-gray-800 mb-4">{currentReport.executive_summary.incident_overview}</p>
                
                {currentReport.executive_summary.key_findings.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-blue-700 mb-2">🔍 주요 발견사항:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {currentReport.executive_summary.key_findings.map((finding, idx) => (
                        <li key={idx} className="text-sm text-gray-700">{finding}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {currentReport.executive_summary.business_impact && (
                  <div>
                    <h4 className="font-semibold text-blue-700 mb-2">💰 비즈니스 영향:</h4>
                    <p className="text-sm text-gray-700">{currentReport.executive_summary.business_impact}</p>
                  </div>
                )}
              </div>

              {/* 기술 분석 */}
              {currentReport.technical_analysis.timeline_reconstruction && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold mb-3">🔧 기술 분석</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap text-gray-800">
                      {currentReport.technical_analysis.timeline_reconstruction}
                    </pre>
                  </div>
                </div>
              )}

              {/* 액션 플랜 */}
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-3">🎯 액션 플랜</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-red-600 mb-2">⚡ 즉시 조치:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {currentReport.action_plan.immediate_actions.map((action, idx) => (
                        <li key={idx} className="text-sm text-gray-700">{action}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-yellow-600 mb-2">📈 단기 개선:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {currentReport.action_plan.short_term_improvements.map((improvement, idx) => (
                        <li key={idx} className="text-sm text-gray-700">{improvement}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-gray-400 py-12">
                <h3 className="text-xl font-semibold mb-2">보고서를 선택해주세요</h3>
                <p>좌측 목록에서 보고서를 클릭하시면 상세 내용을 확인할 수 있습니다.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutoReportDashboard; 