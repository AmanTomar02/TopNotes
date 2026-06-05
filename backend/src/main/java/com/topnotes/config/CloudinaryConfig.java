package com.topnotes.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CloudinaryConfig {

    @Bean
    public Cloudinary cloudinary() {
        // Safe check: Agar variables nahi milenge toh empty text pass hoga, application crash nahi hogi
        String cloudName = System.getenv("CLOUDINARY_CLOUD_NAME") != null ? System.getenv("CLOUDINARY_CLOUD_NAME") : "";
        String apiKey    = System.getenv("CLOUDINARY_API_KEY") != null ? System.getenv("CLOUDINARY_API_KEY") : "";
        String apiSecret = System.getenv("CLOUDINARY_API_SECRET") != null ? System.getenv("CLOUDINARY_API_SECRET") : "";

        return new Cloudinary(ObjectUtils.asMap(
            "cloud_name", cloudName,
            "api_key",    apiKey,
            "api_secret", apiSecret,
            "secure",     true
        ));
    }
}