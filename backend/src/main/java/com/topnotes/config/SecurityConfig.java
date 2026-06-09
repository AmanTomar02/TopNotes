package com.topnotes.config;

import com.topnotes.security.JwtAuthFilter;
import com.topnotes.security.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security configuration — stateless JWT, role-based access control.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final JwtAuthFilter           jwtAuthFilter;
    private final UserDetailsServiceImpl  userDetailsService;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter,
                          UserDetailsServiceImpl userDetailsService) {
        this.jwtAuthFilter      = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF — using stateless JWT
            .csrf(AbstractHttpConfigurer::disable)

            // Let Spring Security use the shared CorsConfigurationSource bean.
            .cors(Customizer.withDefaults())

            // Session management — stateless
            .sessionManagement(sm ->
                sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Request authorization
            .authorizeHttpRequests(auth -> auth

                // ── Public endpoints ───────────────────────
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/health").permitAll()
                .requestMatchers(HttpMethod.GET,
                        "/notes",
                        "/notes/{id}",
                        "/notes/{id}/preview",
                        "/notes/filters").permitAll()
                // Swagger UI
                .requestMatchers(
                        "/swagger-ui/**",
                        "/swagger-ui.html",
                        "/v3/api-docs/**").permitAll()
                // Actuator health check
                .requestMatchers("/actuator/health").permitAll()

                // ── Role-based endpoints ───────────────────
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .requestMatchers("/seller/**").hasRole("SELLER")
                // Buying is open to any non-admin user (a seller can buy too)
                .requestMatchers("/buyer/**").hasAnyRole("BUYER", "SELLER")

                // ── Authenticated endpoints ────────────────
                .requestMatchers("/notifications/**").authenticated()
                .requestMatchers("/profile/**").authenticated()

                // ── Note mutations require SELLER ──────────
                .requestMatchers(HttpMethod.POST,   "/notes").hasRole("SELLER")
                .requestMatchers(HttpMethod.PATCH,  "/notes/**").hasRole("SELLER")
                .requestMatchers(HttpMethod.DELETE, "/notes/**").hasRole("SELLER")

                // ── Note full view requires a purchase (any non-admin) ──
                .requestMatchers(HttpMethod.GET, "/notes/{id}/view").hasAnyRole("BUYER", "SELLER")

                // Deny everything else unless authenticated
                .anyRequest().authenticated()
            )

            // Inject JWT filter before username/password filter
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
