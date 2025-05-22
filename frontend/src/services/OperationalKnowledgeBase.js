export class OperationalKnowledgeBase {
  constructor() {
    this.troubleshootingGuides = this.initializeTroubleshootingGuides();
    this.commandLibrary = this.initializeCommandLibrary();
    this.solutionPatterns = this.initializeSolutionPatterns();
  }

  // 운영 명령어 라이브러리
  initializeCommandLibrary() {
    return {
      // CPU 관련 명령어
      cpu_monitoring: {
        description: "CPU 사용률 모니터링 및 분석",
        commands: [
          {
            cmd: "top -p $(pgrep -d',' java)",
            description: "Java 프로세스 CPU 사용률 실시간 모니터링",
            when_to_use: "Java 애플리케이션 CPU 사용률이 높을 때"
          },
          {
            cmd: "htop",
            description: "시스템 전체 프로세스 리소스 사용률 확인",
            when_to_use: "전체 시스템 상태 파악이 필요할 때"
          },
          {
            cmd: "iostat -x 1 5",
            description: "CPU I/O 대기 시간 분석",
            when_to_use: "CPU 사용률은 높지 않지만 응답이 느릴 때"
          }
        ]
      },

      // 메모리 관련 명령어
      memory_analysis: {
        description: "메모리 사용량 분석 및 리크 탐지",
        commands: [
          {
            cmd: "free -h && cat /proc/meminfo",
            description: "시스템 메모리 상태 상세 확인",
            when_to_use: "메모리 부족 상황 분석 시"
          },
          {
            cmd: "ps aux --sort=-%mem | head -20",
            description: "메모리 사용량 높은 프로세스 TOP 20",
            when_to_use: "메모리 누수 의심 프로세스 식별"
          },
          {
            cmd: "jstat -gc [PID] 1s",
            description: "Java GC 상태 모니터링",
            when_to_use: "Java 애플리케이션 메모리 문제 분석"
          }
        ]
      },

      // 네트워크 관련 명령어
      network_diagnosis: {
        description: "네트워크 연결 및 성능 진단",
        commands: [
          {
            cmd: "netstat -tulpn | grep LISTEN",
            description: "열려있는 포트 및 서비스 확인",
            when_to_use: "서비스 포트 접근 문제 해결"
          },
          {
            cmd: "ss -tuln",
            description: "네트워크 연결 상태 확인 (netstat 대체)",
            when_to_use: "연결 상태 빠른 확인"
          },
          {
            cmd: "ping -c 4 [target] && traceroute [target]",
            description: "네트워크 연결성 및 경로 확인",
            when_to_use: "외부 서비스 연결 문제 진단"
          }
        ]
      },

      // 로그 분석 명령어
      log_analysis: {
        description: "로그 파일 분석 및 에러 추적",
        commands: [
          {
            cmd: "tail -f /var/log/application.log | grep ERROR",
            description: "실시간 에러 로그 모니터링",
            when_to_use: "실시간으로 에러 발생 추적"
          },
          {
            cmd: "journalctl -u [service-name] --since '1 hour ago'",
            description: "특정 서비스의 최근 1시간 로그 확인",
            when_to_use: "systemd 서비스 문제 분석"
          },
          {
            cmd: "grep -r 'OutOfMemoryError' /var/log/ --include='*.log'",
            description: "메모리 부족 에러 로그 검색",
            when_to_use: "메모리 관련 문제 추적"
          }
        ]
      },

      // Kubernetes 관련 명령어
      kubernetes_ops: {
        description: "Kubernetes 클러스터 운영 명령어",
        commands: [
          {
            cmd: "kubectl get pods --all-namespaces | grep -v Running",
            description: "비정상 상태 파드 확인",
            when_to_use: "K8s 클러스터 전체 상태 점검"
          },
          {
            cmd: "kubectl describe pod [pod-name] -n [namespace]",
            description: "특정 파드 상세 상태 및 이벤트 확인",
            when_to_use: "파드 시작 실패나 오류 원인 분석"
          },
          {
            cmd: "kubectl logs [pod-name] -f --tail=100",
            description: "파드 로그 실시간 모니터링",
            when_to_use: "애플리케이션 런타임 에러 추적"
          }
        ]
      }
    };
  }

  // 문제 해결 가이드
  initializeTroubleshootingGuides() {
    return {
      high_cpu_usage: {
        title: "CPU 사용률 과부하 해결 가이드",
        symptoms: ["CPU 사용률 90% 이상", "응답 시간 급격한 증가", "서비스 타임아웃"],
        investigation_steps: [
          "1. top 명령어로 CPU 사용률 높은 프로세스 식별",
          "2. 해당 프로세스의 스레드별 CPU 사용률 확인",
          "3. 애플리케이션 로그에서 무한루프나 과도한 연산 확인",
          "4. 최근 배포나 설정 변경 이력 확인"
        ],
        immediate_actions: [
          "CPU 사용률 높은 프로세스 우선순위 조정 (nice 명령어)",
          "불필요한 백그라운드 작업 중단",
          "트래픽 일시 차단 (필요시)",
          "서버 추가 투입 고려"
        ],
        prevention: [
          "애플리케이션 성능 프로파일링 정기 실행",
          "CPU 사용률 임계치 알람 설정",
          "오토 스케일링 정책 적용",
          "코드 리뷰 시 성능 최적화 검토"
        ]
      },

      memory_leak: {
        title: "메모리 누수 해결 가이드",
        symptoms: ["메모리 사용률 지속적 증가", "GC 빈도 증가", "OutOfMemoryError"],
        investigation_steps: [
          "1. 메모리 사용량 추이 분석 (지난 24시간)",
          "2. 힙덤프 생성 및 분석",
          "3. GC 로그 분석",
          "4. 메모리 프로파일링 도구 활용"
        ],
        immediate_actions: [
          "애플리케이션 재시작 (임시 조치)",
          "힙 메모리 크기 증가 (임시)",
          "트래픽 제한",
          "메모리 사용량 모니터링 강화"
        ],
        prevention: [
          "정적 코드 분석 도구 도입",
          "메모리 누수 테스트 자동화",
          "개발 환경에서 장기 실행 테스트",
          "메모리 사용 패턴 정기 리뷰"
        ]
      },

      network_latency: {
        title: "네트워크 지연 해결 가이드",
        symptoms: ["API 응답 시간 증가", "연결 타임아웃", "패킷 손실"],
        investigation_steps: [
          "1. ping, traceroute로 네트워크 경로 확인",
          "2. 네트워크 트래픽 패턴 분석",
          "3. 스위치, 라우터 상태 확인",
          "4. DNS 해상도 시간 측정"
        ],
        immediate_actions: [
          "네트워크 경로 우회 설정",
          "연결 타임아웃 값 조정",
          "로드밸런서 설정 검토",
          "CDN 활용 검토"
        ],
        prevention: [
          "네트워크 모니터링 강화",
          "다중 경로 설정",
          "네트워크 용량 계획 수립",
          "정기적인 네트워크 성능 테스트"
        ]
      }
    };
  }

  // 솔루션 패턴 매칭
  initializeSolutionPatterns() {
    return {
      // 증상 패턴 → 솔루션 매핑
      patterns: [
        {
          symptoms: ["high_cpu", "memory_pressure"],
          likely_cause: "resource_exhaustion",
          confidence: 0.8,
          solution_template: "resource_scaling"
        },
        {
          symptoms: ["network_latency", "connection_timeout"],
          likely_cause: "network_infrastructure",
          confidence: 0.7,
          solution_template: "network_optimization"
        },
        {
          symptoms: ["service_unavailable", "pod_restart"],
          likely_cause: "application_crash",
          confidence: 0.9,
          solution_template: "application_stability"
        }
      ]
    };
  }

  // 근본 원인 추론
  async inferRootCause(firstSymptom, incident, allIncidents) {
    // 증상 패턴 매칭
    const matchingPatterns = this.solutionPatterns.patterns.filter(pattern =>
      pattern.symptoms.some(symptom => firstSymptom.type.includes(symptom))
    );

    if (matchingPatterns.length > 0) {
      const bestMatch = matchingPatterns.reduce((best, current) =>
        current.confidence > best.confidence ? current : best
      );

      return {
        category: bestMatch.likely_cause,
        confidence: bestMatch.confidence,
        technical_explanation: this.generateTechnicalExplanation(bestMatch, firstSymptom),
        evidence: this.gatherEvidence(firstSymptom, incident),
        recommendation: bestMatch.solution_template
      };
    }

    return {
      category: "unknown",
      confidence: 0.3,
      technical_explanation: "증상 패턴이 기존 지식베이스와 일치하지 않아 추가 조사가 필요합니다.",
      recommendation: "manual_investigation"
    };
  }

  // 대응 절차 조회
  async getResponseProcedures(rootCause, whatHappened, whereOccurred) {
    const procedures = {
      immediate: [],
      short_term: [],
      medium_term: [],
      prevention: []
    };

    // 근본 원인별 대응 절차
    const guideKey = this.mapRootCauseToGuide(rootCause.category);
    const guide = this.troubleshootingGuides[guideKey];

    if (guide) {
      procedures.immediate = guide.immediate_actions || [];
      procedures.prevention = guide.prevention || [];
      
      // 상황에 맞는 커스터마이징
      procedures.immediate = procedures.immediate.map(action =>
        this.customizeActionForSituation(action, whatHappened, whereOccurred)
      );
    }

    return procedures;
  }

  // 명령어 조회
  getRelevantCommands(problemType, context = {}) {
    const relevantCommands = [];
    
    Object.entries(this.commandLibrary).forEach(([category, cmdGroup]) => {
      if (category.includes(problemType) || problemType.includes(category.split('_')[0])) {
        relevantCommands.push({
          category: cmdGroup.description,
          commands: cmdGroup.commands
        });
      }
    });

    return relevantCommands;
  }

  // 유틸리티 메서드들
  mapRootCauseToGuide(category) {
    const mapping = {
      'resource_exhaustion': 'high_cpu_usage',
      'memory_leak_detected': 'memory_leak',
      'network_infrastructure': 'network_latency'
    };
    return mapping[category] || 'high_cpu_usage';
  }

  generateTechnicalExplanation(pattern, symptom) {
    const explanations = {
      'resource_exhaustion': `${symptom.affected_servers.join(', ')} 서버에서 리소스 고갈로 인한 성능 저하가 발생했습니다.`,
      'network_infrastructure': `네트워크 인프라 문제로 인해 ${symptom.affected_servers.length}개 서버 간 통신에 지연이 발생했습니다.`,
      'application_crash': `애플리케이션 안정성 문제로 서비스 중단이 발생했습니다.`
    };
    return explanations[pattern.likely_cause] || "시스템 복합 요인으로 추정됩니다.";
  }

  gatherEvidence(firstSymptom, incident) {
    // 증거 수집 로직
    return [
      `${firstSymptom.type} 유형의 이상 징후가 ${firstSymptom.affected_servers?.length || 1}개 서버에서 발생`,
      incident.duration ? `문제 지속 시간: ${incident.duration}` : null
    ].filter(Boolean);
  }

  customizeActionForSituation(action, whatHappened, whereOccurred) {
    // 상황에 맞게 액션 커스터마이징
    const affectedSystems = whereOccurred?.affected_systems?.map(s => s.type).join(', ') || '';
    return action.replace('[systems]', affectedSystems);
  }
} 