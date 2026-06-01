package com.topnotes.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Key-value config table for runtime-adjustable platform settings.
 * Changing a value here does not require a server restart.
 */
@Entity
@Table(
    name = "platform_config",
    indexes = {
        @Index(name = "idx_config_key", columnList = "config_key", unique = true)
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "config_key", unique = true, nullable = false, length = 100)
    private String configKey;

    @Column(name = "config_value", nullable = false, columnDefinition = "TEXT")
    private String configValue;

    @Column(length = 350)
    private String description;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
