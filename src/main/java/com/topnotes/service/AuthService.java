package com.topnotes.service;

import com.topnotes.dto.request.LoginRequest;
import com.topnotes.dto.request.RegisterRequest;
import com.topnotes.dto.response.AuthResponse;

/** Authentication operations — registration and login. */
public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
}
