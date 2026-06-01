package com.topnotes;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * TopNotes Platform — Main Application Entry Point
 * Marketplace for verified academic toppers to sell handwritten notes.
 */
@SpringBootApplication
@EnableJpaAuditing
@EnableAsync
public class TopNotesApplication {

    public static void main(String[] args) {
        SpringApplication.run(TopNotesApplication.class, args);
    }
}
