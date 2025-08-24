import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { timerAPI } from '../services/api';
import {
  Box,
  Container,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  Text,
  useToast,
  Center,
} from '@chakra-ui/react';

const HomePage = () => {
  const [targetTime, setTargetTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [minDateTime, setMinDateTime] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 과거 시간 선택 검증
    if (targetTime && new Date(targetTime) <= new Date()) {
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
    
    setIsLoading(true);

    try {
      const result = await timerAPI.createTimer(targetTime);
      
      if (result.success) {
        toast({
          title: '타이머 생성 성공',
          description: '타이머 페이지로 이동합니다.',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top-left',
        });
        // 타이머 상세 페이지로 이동
        navigate(`/timer/${result.data.timerId}`);
      } else {
        toast({
          title: '타이머 생성 실패',
          description: result.message || '알 수 없는 오류가 발생했습니다.',
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top-left',
        });
      }
    } catch (error) {
      toast({
        title: '오류 발생',
        description: '네트워크 오류가 발생했습니다.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-left',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50" py={20}>
      <Container maxW="md">
        <VStack spacing={8}>
          <Center>
            <Heading textAlign="center">
              카운트다운 타이머
            </Heading>
          </Center>

          <Text fontSize="lg" textAlign="center">
            목표 시간을 설정해주세요
          </Text>

          <Box
            as="form"
            onSubmit={handleSubmit}
            bg="white"
            p={8}
            borderRadius="xl"
            boxShadow="xl"
          >
            <VStack spacing={6}>
              <FormControl isRequired>
                <FormLabel fontSize="lg">
                  목표 시각
                </FormLabel>
                <Input
                  type="datetime-local"
                  value={targetTime}
                  onChange={(e) => setTargetTime(e.target.value)}
                  min={minDateTime}
                  size="lg"
                  borderRadius="md"
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  현재 시간 이후의 미래 시간을 선택해주세요
                </Text>
              </FormControl>

              <Button
                type="submit"
                size="lg"
                w="100%"
                colorScheme="blue"
                isLoading={isLoading}
                loadingText="타이머 생성 중..."
              >
                타이머 생성하기
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default HomePage;