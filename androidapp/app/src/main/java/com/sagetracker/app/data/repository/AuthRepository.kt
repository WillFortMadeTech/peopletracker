package com.sagetracker.app.data.repository

import com.sagetracker.app.data.api.ApiService
import com.sagetracker.app.data.api.LoginRequest
import com.sagetracker.app.data.local.TokenManager

sealed class LoginResult {
    data class Success(val userId: String, val username: String?) : LoginResult()
    data class Error(val message: String) : LoginResult()
}

class AuthRepository(
    private val apiService: ApiService,
    private val tokenManager: TokenManager
) {
    suspend fun login(email: String, password: String): LoginResult {
        return try {
            val response = apiService.login(LoginRequest(email, password))

            if (response.isSuccessful) {
                val body = response.body()
                if (body?.success == true && body.token != null && body.userId != null) {
                    tokenManager.saveToken(body.token)
                    tokenManager.saveUserId(body.userId)
                    body.username?.let { tokenManager.saveUsername(it) }
                    LoginResult.Success(body.userId, body.username)
                } else {
                    LoginResult.Error(body?.error ?: "Login failed")
                }
            } else {
                LoginResult.Error("Invalid email or password")
            }
        } catch (e: Exception) {
            LoginResult.Error(e.message ?: "Network error")
        }
    }

    fun isLoggedIn(): Boolean = tokenManager.isLoggedIn()

    fun logout() {
        tokenManager.clearAll()
    }

    fun getUsername(): String? = tokenManager.getUsername()
}
