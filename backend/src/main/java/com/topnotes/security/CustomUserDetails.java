package com.topnotes.security;

import com.topnotes.entity.User;
import com.topnotes.entity.enums.UserStatus;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Wraps a User entity for Spring Security consumption.
 * Carries the DB user ID so controllers can resolve it from the auth context.
 */
@Getter
public class CustomUserDetails implements UserDetails {

    private final Long   id;
    private final String email;
    private final String password;
    private final String role;
    private final boolean enabled;
    private final boolean accountNonLocked;
    private final Collection<? extends GrantedAuthority> authorities;

    public CustomUserDetails(User user) {
        this.id          = user.getId();
        this.email       = user.getEmail();
        this.password    = user.getPassword();
        this.role        = user.getRole().name();
        // A suspended account can't sign in; a deleted one is fully disabled.
        this.enabled          = user.getStatus() != UserStatus.DELETED;
        this.accountNonLocked = user.getStatus() == UserStatus.ACTIVE;
        this.authorities = List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
    }

    @Override public String   getUsername()                    { return email; }
    @Override public boolean  isAccountNonExpired()            { return true; }
    @Override public boolean  isAccountNonLocked()             { return accountNonLocked; }
    @Override public boolean  isCredentialsNonExpired()        { return true; }
    @Override public boolean  isEnabled()                      { return enabled; }
}
