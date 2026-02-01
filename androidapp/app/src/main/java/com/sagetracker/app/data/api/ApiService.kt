package com.sagetracker.app.data.api

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val success: Boolean,
    val token: String?,
    val userId: String?,
    val username: String?,
    val error: String?
)

data class LocationRequest(
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float? = null,
    val altitude: Double? = null,
    val speed: Float? = null,
    val bearing: Float? = null,
    val deviceId: String? = null
)

data class LocationData(
    val id: String,
    val userId: String,
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float?,
    val altitude: Double?,
    val speed: Float?,
    val bearing: Float?,
    val timestamp: String,
    val deviceId: String?
)

data class LocationSaveResponse(
    val success: Boolean,
    val location: LocationData?,
    val error: String?
)

data class LocationHistoryResponse(
    val locations: List<LocationData>?,
    val error: String?
)

interface ApiService {
    @POST("/api/auth/mobile-login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("/api/location")
    suspend fun saveLocation(@Body request: LocationRequest): Response<LocationSaveResponse>

    @GET("/api/location")
    suspend fun getLocationHistory(@Query("limit") limit: Int = 100): Response<LocationHistoryResponse>
}
