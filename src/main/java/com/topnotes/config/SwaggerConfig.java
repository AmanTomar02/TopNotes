package com.topnotes.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/** OpenAPI 3 / Swagger UI configuration. Access at /swagger-ui.html */
@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI topNotesOpenAPI() {
        SecurityScheme bearerScheme = new SecurityScheme()
                .name("bearerAuth")
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .description("Enter your JWT token (without 'Bearer ' prefix)");

        return new OpenAPI()
                .info(new Info()
                        .title("TopNotes API")
                        .version("1.0.0")
                        .description("Enterprise REST API for the TopNotes handwritten-notes marketplace. " +
                                "Verified toppers sell notes; students purchase and view them securely.")
                        .contact(new Contact()
                                .name("TopNotes Team")
                                .email("dev@topnotes.com"))
                        .license(new License()
                                .name("MIT")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server().url("/api").description("Local / same-server"),
                        new Server().url("https://api.topnotes.com").description("Production")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", bearerScheme));
    }
}
