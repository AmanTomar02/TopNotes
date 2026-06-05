package com.topnotes.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;

@Configuration
@EnableConfigurationProperties(CloudinaryProperties.class)
@Slf4j
public class CloudinaryConfig {

    @Bean
    public Cloudinary cloudinary(CloudinaryProperties props, Environment environment) {
        if (environment.acceptsProfiles(Profiles.of("render")) && !props.isConfigured()) {
            throw new IllegalStateException(
                    "Cloudinary credentials are required on Render. Set these environment variables "
                            + "on the topnotes-backend service: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, "
                            + "CLOUDINARY_API_SECRET");
        }

        if (!props.isConfigured()) {
            log.warn("Cloudinary credentials are not configured — file uploads will fail until they are set");
        } else {
            log.info("Cloudinary configured for cloud: {}", props.getCloudName());
        }

        return new Cloudinary(ObjectUtils.asMap(
                "cloud_name", props.getCloudName(),
                "api_key", props.getApiKey(),
                "api_secret", props.getApiSecret(),
                "secure", true
        ));
    }
}
