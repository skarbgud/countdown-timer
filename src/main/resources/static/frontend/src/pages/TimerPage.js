import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WEBSOCKET_URL } from '../config/websocket';
import { timerAPI } from '../services/api';
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
import { CopyIcon, EditIcon, CheckIcon, CloseIcon, ArrowBackIcon } from '@chakra-ui/icons';

const TimerPage = () => {
  const { timerId } = useParams();
  const navigate = useNavigate();
  const [timer, setTimer] = useState(null);
  const [remainingTime, setRemainingTime] = useState('');
  const [newTargetTime, setNewTargetTime] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [minDateTime, setMinDateTime] = useState('');
  const [isOwner, setIsOwner] = useState(false);

  const wsRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const toast = useToast();
  const { hasCopied, onCopy } = useClipboard(shareUrl);

  // 남은 시간 계산 함수
  const calculateRemainingTime = useCallback((targetTime) => {
    if (!targetTime) return '00:00:00';

    const now = new Date();
    const target = new Date(targetTime);
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) {
      return '00:00:00';
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // 타이머 로드 함수
  const loadTimer = useCallback(async () => {
    try {
      const result = await timerAPI.getTimer(timerId);
      
      if (result.success) {
        const timerData = result.data;
        
        setTimer(timerData);
        setIsExpired(timerData.expired || false);
        setIsOwner(timerData.isOwner || false);

        // 초기 남은 시간 계산
        if (timerData.targetTime) {
          if (timerData.expired) {
            setRemainingTime('00:00:00');
          } else {
            const remaining = calculateRemainingTime(timerData.targetTime);
            setRemainingTime(remaining);
          }
        }
      } else {
        toast({
          title: '타이머 로드 실패',
          description: result.message || '타이머를 찾을 수 없습니다',
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
        description: '타이머를 찾을 수 없습니다',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-left',
      });
    } finally {
      setLoading(false);
    }
  }, [timerId, toast, calculateRemainingTime]);

  // 남은 시간 업데이트 (1초마다)
  useEffect(() => {
    if (!timer || !timer.targetTime || isExpired) return;

    const interval = setInterval(() => {
      const remaining = calculateRemainingTime(timer.targetTime);
      setRemainingTime(remaining);

      // 만료 체크 (한 번만 실행되도록)
      const now = new Date();
      const target = new Date(timer.targetTime);
      if (now >= target) {
        setIsExpired(true);
        setRemainingTime('00:00:00');
        toast({
          title: '시간 종료!',
          description: '설정된 시간이 다 되었습니다!',
          status: 'warning',
          duration: 5000,
          isClosable: true,
          position: 'top-left',
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timer, calculateRemainingTime, isExpired, toast]);

  // isExpired 상태가 변경될 때 remainingTime 즉시 업데이트
  useEffect(() => {
    if (isExpired) {
      setRemainingTime('00:00:00');
    }
  }, [isExpired]);

  // WebSocket 연결 함수
  const connectWebSocket = useCallback(() => {
    try {
      if (wsRef.current) {
        console.log('기존 WebSocket 연결 정리 중...');
        wsRef.current.close();
      }

      console.log('WebSocket 연결 시도:', WEBSOCKET_URL);
      wsRef.current = new WebSocket(WEBSOCKET_URL);

      wsRef.current.onopen = () => {
        console.log('WebSocket 연결됨');
        reconnectAttemptsRef.current = 0;

        const joinMessage = {
          type: 'join',
          timerId: timerId
        };
        console.log('타이머 방 참가:', joinMessage);
        wsRef.current.send(JSON.stringify(joinMessage));
      };

      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('WebSocket 메시지 수신:', message);

        if (message.type === 'targetTimeUpdated') {
          console.log('목표 시간 업데이트됨:', message.targetTime);

          // 타이머 상태 업데이트
          setTimer(prev => ({
            ...prev,
            targetTime: message.targetTime,
            expired: message.isExpired || false
          }));

          setIsExpired(message.isExpired || false);

          // 즉시 남은 시간 계산
          const remaining = calculateRemainingTime(message.targetTime);
          setRemainingTime(remaining);

          toast({
            title: '타이머 업데이트',
            description: '목표 시간이 업데이트되었습니다.',
            status: 'info',
            duration: 3000,
            isClosable: true,
            position: 'top-left',
          });
        } else if (message.type === 'timestampAdded') {
          loadTimer();
        } else if (message.type === 'timerExpired') {
          setIsExpired(true);
          setRemainingTime('00:00:00');

          toast({
            title: '시간 종료!',
            description: '설정된 시간이 다 되었습니다!',
            status: 'warning',
            duration: 5000,
            isClosable: true,
            position: 'top-left',
          });
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket 오류:', error);

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`WebSocket 재연결 시도 ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
          setTimeout(() => connectWebSocket(), 3000);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket 연결 종료:', event.code, event.reason);

        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`WebSocket 재연결 시도 ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
          setTimeout(() => connectWebSocket(), 3000);
        }
      };
    } catch (error) {
      console.error('WebSocket 연결 실패:', error);
    }
  }, [timerId, calculateRemainingTime, loadTimer, toast]);

  // 초기 로드 및 WebSocket 연결
  useEffect(() => {
    loadTimer();

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

  // 현재 시간을 최소값으로 설정
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    setMinDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
  }, []);

  // 목표 시간 업데이트
  const updateTargetTime = async () => {
    if (!newTargetTime) return;

    // 과거 시간 선택 검증
    if (new Date(newTargetTime) <= new Date()) {
      toast({
        title: '잘못된 시간 선택',
        description: '현재 시간보다 미래의 시간을 선택해주세요.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top-left',
      });
      return;
    }

    setIsUpdating(true);
    try {
      const result = await timerAPI.updateTargetTime(timerId, newTargetTime);

      if (result.success) {
        // 상태 즉시 업데이트
        setTimer(result.data);
        setIsExpired(result.data.expired || false);

        // 남은 시간 재계산
        const remaining = calculateRemainingTime(result.data.targetTime);
        setRemainingTime(remaining);

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
        toast({
          title: '목표 시간 업데이트 실패',
          description: result.message || '목표 시간 업데이트에 실패했습니다.',
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top-left',
        });
      }
    } catch (error) {
      console.error('목표 시간 업데이트 실패:', error);
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

  // 타임스탬프 저장
  const saveTimestamp = async () => {
    setIsSaving(true);
    try {
      const result = await timerAPI.saveTimestamp(timerId, remainingTime);
      
      if (result.success) {
        // 타이머 정보 새로고침하여 새 타임스탬프 반영
        loadTimer();

        toast({
          title: '성공',
          description: '타임스탬프가 저장되었습니다.',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top-left',
        });
      } else {
        toast({
          title: '타임스탬프 저장 실패',
          description: result.message || '타임스탬프 저장에 실패했습니다.',
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top-left',
        });
      }
    } catch (error) {
      console.error('타임스탬프 저장 실패:', error);
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

  // 공유 링크 생성
  const generateShareLink = () => {
    try {
      const fullUrl = `${window.location.origin}/timer/${timerId}`;
      setShareUrl(fullUrl);

      // 클립보드에 복사 시도
      navigator.clipboard.writeText(fullUrl).then(() => {
        toast({
          title: '공유 링크 생성',
          description: '공유 링크가 클립보드에 복사되었습니다.',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top-left',
        });
      }).catch(() => {
        // Fallback: 임시 input으로 복사
        const tempInput = document.createElement('input');
        tempInput.value = fullUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);

        toast({
          title: '공유 링크 생성',
          description: '공유 링크가 클립보드에 복사되었습니다.',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top-left',
        });
      });
    } catch (error) {
      console.error('공유 링크 생성 실패:', error);
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
        <VStack spacing={6} align="stretch">
          {/* 헤더 */}
          <Box mb={8}>
            <Box position="relative" mb={4}>
              <HStack justify="space-between" align="center">
                <IconButton
                  onClick={() => navigate('/')}
                  icon={<ArrowBackIcon />}
                  colorScheme="gray"
                  variant="ghost"
                  size="lg"
                  aria-label="뒤가기"
                />
                <Box flex="1" textAlign="center">
                  <Heading size="xl">
                    카운트다운 타이머
                  </Heading>
                </Box>
                <Box w="48px" />
              </HStack>
            </Box>
            
            <Box textAlign="center">
              <VStack spacing={2}>
                <Text fontSize="lg" color="gray.600">
                  목표 시각: {timer.targetTime?.replace('T', ' ').substring(0, 19)}Z (UTC+0)
                </Text>
                <Text fontSize="lg" color="gray.600">
                  {new Date(timer.targetTime).toLocaleString()} (UTC+9)
                </Text>
              </VStack>
            </Box>
          </Box>

          {/* 목표 시간 수정 */}
          {isOwner && !isExpired && (
            <Card>
              <CardBody>
                <HStack justify="space-between" align="center">
                  <Text fontWeight="semibold">목표 시간 수정</Text>
                  <IconButton
                    icon={isEditing ? <CloseIcon /> : <EditIcon />}
                    onClick={() => setIsEditing(!isEditing)}
                    colorScheme="blue"
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
                        min={minDateTime}
                        size="md"
                      />
                      <Button
                        onClick={updateTargetTime}
                        colorScheme="blue"
                        isLoading={isUpdating}
                        loadingText="수정 중..."
                        disabled={!newTargetTime}
                      >
                        수정
                      </Button>
                    </HStack>
                    <Text fontSize="sm" color="gray.500" textAlign="left" w="100%">
                      현재 시간 이후의 미래 시간을 선택해주세요
                    </Text>
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
                    {new Date().toISOString().replace('T', ' ').substring(0, 19)}Z (UTC+0)
                  </StatNumber>
                  <StatNumber fontSize="xl" color="gray.600">
                    {new Date().toLocaleString()} (UTC+9)
                  </StatNumber>
                </Stat>

                <Divider />

                <Stat textAlign="center">
                  <StatLabel fontSize="lg" color="gray.600">남은 시간</StatLabel>
                  <StatNumber
                    fontSize="5xl"
                    color={isExpired ? "red.500" : "blue.500"}
                    fontWeight="bold"
                  >
                    {isExpired ? "⏰ 시간 종료!" : `⏳ ${remainingTime}`}
                  </StatNumber>
                  <StatHelpText>
                    {isExpired ? '시간이 종료되었습니다' : '목표 시간까지 남은 시간'}
                  </StatHelpText>
                  
                  {/* 시간 종료 시 뒤로가기 버튼 */}
                  {isExpired && (
                    <Button
                      onClick={() => navigate('/')}
                      colorScheme="red"
                      size="md"
                      mt={4}
                      leftIcon={<ArrowBackIcon />}
                    >
                      새 타이머 만들기
                    </Button>
                  )}
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
                  disabled={isExpired}
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
                      colorScheme={hasCopied ? "green" : "teal"}
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
              {!timer.timestamps || timer.timestamps.length === 0 ? (
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
                      borderLeftColor="purple.500"
                    >
                      <VStack align="start" spacing={2}>
                        <Badge colorScheme="purple" fontSize="md" px={2} py={1} borderRadius="md">
                          ⏳ {ts.remainingTime}
                        </Badge>

                        <HStack spacing={4} mt={1}>
                          <VStack align="start" spacing={0}>
                            <Text fontSize="xs" fontWeight="bold" color="gray.500">
                              UTC+0
                            </Text>
                            <Text fontSize="sm" color="gray.700">
                              {ts.capturedTime?.replace('T', ' ').substring(0, 19)}Z
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