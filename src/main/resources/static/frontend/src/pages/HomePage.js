import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
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
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/timers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          targetTime: new Date(targetTime).toISOString()
        })
      });

      const result = await response.json();
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
                  size="lg"
                  borderRadius="md"
                />
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