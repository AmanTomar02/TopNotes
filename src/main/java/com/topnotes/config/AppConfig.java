package com.topnotes.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/** Miscellaneous beans: async task executor for email dispatch, etc. */
@Configuration
public class AppConfig {

    /**
     * Thread pool used by {@code @Async} methods (email sending, notifications).
     * Keeps the request thread unblocked.
     */
    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(16);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("topnotes-async-");
        executor.initialize();
        return executor;
    }
}
