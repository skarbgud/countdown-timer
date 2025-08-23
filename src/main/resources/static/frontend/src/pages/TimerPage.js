import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import Countdown from 'react-countdown';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Input,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Divider,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  IconButton,
  useClipboard,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import { CopyIcon, EditIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';

const TimerPage = () => {
  const { timerId } = useParams();
  const [timer, setTimer] = useState(null);
  const [serverTime, setServerTime] = useState(null);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const [currentTime, setCurrentTime] = useState('');
  const [currentTimeLocal, setCurrentTimeLocal] = useState('');
  const [newTargetTime, setNewTargetTime] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const wsRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const toast = useToast();
  const { hasCopied, onCopy } = useClipboard(shareUrl);

  // 타이머 로드 함수를 useCallback으로 메모이제이션
  const loadTimer = useCallback(async () => {
    try {
      console.log('타이머 로드:', `${API_BASE_URL}/api/timers/${timerId}`);
      
      const response = await fetch(`${API_BASE_URL}/api/timers/${timerId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('타이머 데이터:', result);
      
      if (result.success) {
        const timerData = result.data;
        console.log("==timerData===")
        console.log(timerData)
        setTimer(timerData);
        
        // 서버 시간 설정
        if (timerData.serverTime) {
          const serverTimeObj = new Date(timerData.serverTime);
          setServerTime(serverTimeObj);
          
          // 서버 시간과 로컬 시간의 차이 계산
          const localTime = new Date();
          const offset = localTime.getTime() - serverTimeObj.getTime();
          setServerTimeOffset(offset);
          
                  console.log('서버 시간:', serverTimeObj);
        console.log('시간 오프셋:', offset);
        }
      } else {
        toast({
          title: '타이머 로드 실패',
          description: result.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top-left',
        });
      }
    } catch (error) {
      console.error('타이머 로드 실패:', error);
      toast({
        title: '오류 발생',
        description: '타이머를 찾을 수 없습니다: ' + error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-left',
      });
    } finally {
      setLoading(false);
    }
  }, [timerId, toast]);

  // WebSocket 연결 함수를 useCallback으로 메모이제이션
  const connectWebSocket = useCallback(() => {
    try {
      // 기존 연결이 있다면 먼저 정리
      if (wsRef.current) {
        console.log('기존 WebSocket 연결 정리 중...');
        wsRef.current.close();
      }

      console.log('WebSocket 연결 시도: ws://localhost:8088/ws');
      console.log('현재 타이머 ID:', timerId);
      
      wsRef.current = new WebSocket('ws://localhost:8088/ws');
      
      // 연결 상태 모니터링
      console.log('WebSocket readyState:', wsRef.current.readyState);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket 연결됨 - readyState:', wsRef.current.readyState);
        // 연결 성공 시 재연결 시도 횟수 리셋
        reconnectAttemptsRef.current = 0;
        
        const joinMessage = {
          type: 'join',
          timerId: timerId
        };
        console.log('타이머 방 참가 메시지 전송:', joinMessage);
        
        wsRef.current.send(JSON.stringify(joinMessage));
      };

      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('WebSocket 메시지 수신:', message);
        
        if (message.type === 'targetTimeUpdated') {
          // 타이머 업데이트 시 전체 타이머 정보를 다시 로드
          loadTimer();
          toast({
            title: '타이머 업데이트',
            description: '목표 시간이 업데이트되었습니다.',
            status: 'info',
            duration: 3000,
            isClosable: true,
            position: 'top-left',
          });
        } else if (message.type === 'timestampAdded') {
          loadTimer(); // 새로고침
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket 오류 발생:', error);
        console.error('WebSocket readyState:', wsRef.current.readyState);
        console.error('WebSocket URL:', wsRef.current.url);
        
        // WebSocket 오류 시 재연결 시도 (최대 시도 횟수 제한)
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`WebSocket 재연결 시도 ${reconnectAttemptsRef.current}/${maxReconnectAttempts}...`);
          setTimeout(() => {
            connectWebSocket();
          }, 3000);
        } else {
          console.error('WebSocket 최대 재연결 시도 횟수 초과');
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket 연결 종료:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        
        // 정상적인 종료가 아닌 경우 재연결 시도 (최대 시도 횟수 제한)
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`WebSocket 재연결 시도 ${reconnectAttemptsRef.current}/${maxReconnectAttempts}...`);
          setTimeout(() => {
            connectWebSocket();
          }, 3000);
        }
      };
    } catch (error) {
      console.error('WebSocket 연결 생성 실패:', error);
      // 연결 실패 시 재시도 (최대 시도 횟수 제한)
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        console.log(`WebSocket 재연결 시도 ${reconnectAttemptsRef.current}/${maxReconnectAttempts}...`);
        setTimeout(() => {
          connectWebSocket();
        }, 3000);
      } else {
        console.error('WebSocket 최대 재연결 시도 횟수 초과');
      }
    }
  }, [timerId, loadTimer, toast]);

  // 타이머 로드와 WebSocket 연결
  useEffect(() => {
    loadTimer();
    
    // WebSocket 연결을 약간 지연시켜 백엔드가 완전히 준비되도록 함
    const wsTimer = setTimeout(() => {
      connectWebSocket();
    }, 1000);
    
    return () => {
      clearTimeout(wsTimer);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [loadTimer, connectWebSocket]);

  // 현재 시간 업데이트
  useEffect(() => {
    if (!serverTime) return;
    
    const updateCurrentTime = () => {
      const now = new Date(serverTime.getTime() + Date.now() - (serverTime.getTime() + serverTimeOffset));
      setCurrentTime(now.toISOString().replace('T', ' ').substring(0, 19) + 'Z (UTC+0)');
      setCurrentTimeLocal(now.toLocaleString() + " (UTC+9)");
    };
    
    // 초기 설정
    updateCurrentTime();
    
    const interval = setInterval(() => {
      updateCurrentTime();
    }, 1000);
    
    return () => clearInterval(interval);
  }, [serverTime, serverTimeOffset]);

    const updateTargetTime = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`http://localhost:8088/api/timers/${timerId}/target-time`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          targetTime: new Date(newTargetTime).toISOString()
        })
      });
      
      // HTTP 상태 코드 체크
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || '목표 시간 업데이트에 실패했습니다.'}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // 새로운 타이머 정보로 상태 업데이트
        const timerData = result.data;
        setTimer(timerData);
        
        // 서버 시간 업데이트
        if (timerData.serverTime) {
          const serverTimeObj = new Date(timerData.serverTime);
          setServerTime(serverTimeObj);
          
          // 서버 시간과 로컬 시간의 차이 계산
          const localTime = new Date();
          const offset = localTime.getTime() - serverTimeObj.getTime();
          setServerTimeOffset(offset);
        }
        
        setIsEditing(false);
        setNewTargetTime('');
        
        toast({
          title: '성공',
          description: '목표 시간이 업데이트되었습니다.',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top-left',
        });
      } else {
        throw new Error(result.message || '목표 시간 업데이트에 실패했습니다.');
      }
    } catch (error) {
      toast({
        title: '오류 발생',
        description: '목표 시간 업데이트에 실패했습니다.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-left',
      });
    } finally {
      setIsUpdating(false);
    }
  };

    const saveTimestamp = async () => {
    setIsSaving(true);
    try {
      let timeToSave = '00:00:00';

      if (timer && serverTime) {
        const now = new Date(serverTime.getTime() + Date.now() - (serverTime.getTime() + serverTimeOffset));
        const targetTime = new Date(timer.targetTime);
        const diff = targetTime.getTime() - now.getTime();
        
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          timeToSave = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
      }
      
      const response = await fetch(`http://localhost:8088/api/timers/${timerId}/timestamps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          remainingTime: timeToSave
        })
      });

      // HTTP 상태 코드 체크
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || '타임스탬프 저장에 실패했습니다.'}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: '성공',
          description: '타임스탬프가 저장되었습니다.',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top-left',
        });
      } else {
        throw new Error(result.message || '타임스탬프 저장에 실패했습니다.');
      }
    } catch (error) {
      toast({
        title: '오류 발생',
        description: '타임스탬프 저장에 실패했습니다.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-left',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const generateShareLink = async () => {
    try {
      const response = await fetch(`http://localhost:8088/api/timers/${timerId}/share`);
      
      // HTTP 상태 코드 체크
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || '공유 링크 생성에 실패했습니다.'}`);
      }
      
      const result = await response.json();
      if (result.success) {
        const fullUrl = `${window.location.origin}${result.data.shareUrl}`;
        setShareUrl(fullUrl);
        onCopy();
        toast({
          title: '공유 링크 생성',
          description: '공유 링크가 클립보드에 복사되었습니다.',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top-left',
        });
      } else {
        throw new Error(result.message || '공유 링크 생성에 실패했습니다.');
      }
    } catch (error) {
      toast({
        title: '오류 발생',
        description: '공유 링크 생성에 실패했습니다.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-left',
      });
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" />
          <Text fontSize="lg" color="gray.600">타이머를 불러오는 중...</Text>
        </VStack>
      </Box>
    );
  }

  if (!timer) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Alert status="error" maxW="md">
          <AlertIcon />
          <AlertTitle>타이머를 찾을 수 없습니다!</AlertTitle>
          <AlertDescription>
            요청하신 타이머가 존재하지 않거나 접근 권한이 없습니다.
          </AlertDescription>
        </Alert>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50" py={8}>
      <Container maxW="4xl">
        <VStack align="stretch">
          {/* 헤더 */}
          <Box textAlign="center">
            <Heading size="2xl" mb={4}>
              카운트다운 타이머
            </Heading>
            <Text fontSize="lg" color="gray.600">
              목표 시각: {(timer.targetTime)} (UTC+0)
            </Text>
            <Text fontSize="lg" color="gray.600">
              {new Date(timer.targetTime).toLocaleString()} (UTC+9)
            </Text>
          </Box>

          {/* 목표 시간 수정 */}
          {timer.isOwner && !timer.isExpired && (
            <Card>
              <CardBody>
                <HStack justify="space-between" align="center">
                  <Text fontWeight="semibold">목표 시간 수정</Text>
                  <IconButton
                    icon={isEditing ? <CloseIcon /> : <EditIcon />}
                    onClick={() => setIsEditing(!isEditing)}
                    colorScheme="brand"
                    variant="ghost"
                    aria-label={isEditing ? "수정 취소" : "목표 시간 수정"}
                  />
                </HStack>
                
                {isEditing && (
                  <VStack mt={4} spacing={4}>
                    <HStack w="100%">
                      <Input
                        type="datetime-local"
                        value={newTargetTime}
                        onChange={(e) => setNewTargetTime(e.target.value)}
                        size="md"
                      />
                      <Button
                        onClick={updateTargetTime}
                        colorScheme="brand"
                        isLoading={isUpdating}
                        loadingText="수정 중..."
                      >
                        수정
                      </Button>
                    </HStack>
                  </VStack>
                )}
              </CardBody>
            </Card>
          )}

          {/* 현재 시간과 남은 시간 */}
          <Card>
            <CardBody>
              <VStack spacing={6}>
                <Stat textAlign="center">
                  <StatLabel fontSize="lg" color="gray.600">현재 시간</StatLabel>
                  <StatNumber fontSize="2xl" color="gray.800">
                    {currentTime || '로딩 중...'}
                  </StatNumber>
                  <StatNumber fontSize="2xl" color="gray.800">
                    {currentTimeLocal || '로딩 중...'}
                  </StatNumber>
                </Stat>
                
                <Divider />
                
                <Stat textAlign="center">
                  <StatLabel fontSize="lg" color="gray.600">남은 시간</StatLabel>
                  {timer && !timer.isExpired ? (
                    <Countdown
                      date={new Date(timer.targetTime)}
                      renderer={({ hours, minutes, seconds, completed }) => {
                        if (completed) {
                          return (
                            <StatNumber fontSize="6xl" color="red.500" fontWeight="bold">
                              ⏰ 시간 종료!
                            </StatNumber>
                          );
                        }
                        return (
                          <StatNumber 
                            fontSize="6xl" 
                            color="blue.500"
                            fontWeight="bold"
                          >
                            ⏳ {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                          </StatNumber>
                        );
                      }}
                      onComplete={() => {
                        // 타이머 완료 시 처리
                        toast({
                          title: '시간 종료!',
                          description: '설정된 시간이 다 되었습니다!',
                          status: 'warning',
                          duration: 5000,
                          isClosable: true,
                          position: 'top-left',
                        });
                      }}
                    />
                  ) : (
                    <StatNumber fontSize="6xl" color="red.500" fontWeight="bold">
                      ⏰ 시간 종료!
                    </StatNumber>
                  )}
                  <StatHelpText>
                    {timer.isExpired ? '시간이 종료되었습니다' : '목표 시간까지 남은 시간'}
                  </StatHelpText>
                </Stat>
              </VStack>
            </CardBody>
          </Card>

          {/* 액션 버튼들 */}
          <Card>
            <CardBody>
              <HStack spacing={4} justify="center" flexWrap="wrap">
                <Button
                  onClick={saveTimestamp}
                  disabled={timer.isExpired}
                  colorScheme="purple"
                  size="lg"
                  isLoading={isSaving}
                  loadingText="저장 중..."
                  leftIcon={<CheckIcon />}
                >
                  타임스탬프 저장
                </Button>
                
                <Button
                  onClick={generateShareLink}
                  colorScheme="teal"
                  size="lg"
                  leftIcon={<CopyIcon />}
                >
                  공유 링크 생성
                </Button>
              </HStack>
            </CardBody>
          </Card>

          {/* 공유 링크 표시 */}
          {shareUrl && (
            <Card>
              <CardBody>
                <VStack spacing={3}>
                  <Text fontWeight="semibold">공유 링크</Text>
                  <HStack w="100%" spacing={2}>
                    <Input value={shareUrl} isReadOnly />
                    <IconButton
                      icon={hasCopied ? <CheckIcon /> : <CopyIcon />}
                      onClick={onCopy}
                      colorScheme={hasCopied ? "orange" : "yellow"}
                      aria-label="링크 복사"
                    />
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* 타임스탬프 리스트 */}
          <Card>
            <CardHeader>
              <Heading size="md">저장된 타임스탬프</Heading>
            </CardHeader>
            <CardBody>
              {timer.timestamps.length === 0 ? (
                <Text color="gray.500" textAlign="center" py={8}>
                  아직 저장된 타임스탬프가 없습니다.
                </Text>
              ) : (
                <VStack spacing={3} align="stretch">
                  {timer.timestamps.map((ts, index) => (
                    <Box
                      key={index}
                      p={4}
                      bg="gray.50"
                      borderRadius="md"
                      borderLeft="4px solid"
                      borderLeftColor="brand.500"
                    >
                      <VStack align="start" spacing={2}>
                        <HStack>
                          <Badge colorScheme="purple" fontSize="md" px={2} py={1} borderRadius="md">
                            ⏳ {ts.remainingTime}
                          </Badge>
                        </HStack>
                        
                        <HStack spacing={4} mt={1}>
                          <VStack align="start" spacing={0}>
                            <Text fontSize="xs" fontWeight="bold" color="gray.500">
                              UTC+0
                            </Text>
                            <Text fontSize="sm" color="gray.700">
                              {ts.capturedTime.replace('T', ' ').substring(0, 19)}Z
                            </Text>
                          </VStack>
                          
                          <VStack align="start" spacing={0}>
                            <Text fontSize="xs" fontWeight="bold" color="gray.500">
                              UTC+9
                            </Text>
                            <Text fontSize="sm" color="gray.700">
                              {new Date(ts.capturedTime).toLocaleString()}
                            </Text>
                          </VStack>
                        </HStack>
                      </VStack>
                    </Box>
                  ))}
                </VStack>
              )}
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
};

export default TimerPage;