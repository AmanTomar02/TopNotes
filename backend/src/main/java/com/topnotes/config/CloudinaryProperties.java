package com.topnotes.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "cloudinary")
public class CloudinaryProperties {

    private String cloudName = "";
    private String apiKey = "";
    private String apiSecret = "";

    public boolean isConfigured() {
        return !cloudName.isBlank() && !apiKey.isBlank() && !apiSecret.isBlank();
    }
}
