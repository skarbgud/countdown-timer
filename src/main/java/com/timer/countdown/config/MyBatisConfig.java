package com.timer.countdown.config;

import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import javax.sql.DataSource;

@Configuration
@MapperScan("com.timer.countdown.mapper")
public class MyBatisConfig {

    @Bean
    public SqlSessionFactory sqlSessionFactory(DataSource dataSource) throws Exception {
        SqlSessionFactoryBean sessionFactory = new SqlSessionFactoryBean();
        sessionFactory.setDataSource(dataSource);
        
        // Mapper XML 파일 위치 설정
        sessionFactory.setMapperLocations(
            new PathMatchingResourcePatternResolver().getResources("classpath:mappers/**/*.xml")
        );
        
        // Type Aliases 패키지 설정
        sessionFactory.setTypeAliasesPackage("com.timer.countdown.model");
        
        // MyBatis 설정
        org.apache.ibatis.session.Configuration configuration = new org.apache.ibatis.session.Configuration();
        configuration.setMapUnderscoreToCamelCase(true);  // snake_case -> camelCase 자동 변환
        configuration.setCacheEnabled(true);  // 2차 캐시 활성화
        configuration.setDefaultFetchSize(100);
        configuration.setDefaultStatementTimeout(30);
        
        sessionFactory.setConfiguration(configuration);
        
        return sessionFactory.getObject();
    }
}
