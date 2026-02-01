package com.sagetracker.app

import android.app.Application
import com.sagetracker.app.data.api.ApiService
import com.sagetracker.app.data.api.AuthInterceptor
import com.sagetracker.app.data.local.TokenManager
import com.sagetracker.app.data.repository.AuthRepository
import com.sagetracker.app.data.repository.LocationRepository
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

class SageTrackerApplication : Application() {

    lateinit var tokenManager: TokenManager
        private set

    lateinit var authRepository: AuthRepository
        private set

    lateinit var locationRepository: LocationRepository
        private set

    private lateinit var apiService: ApiService

    override fun onCreate() {
        super.onCreate()

        tokenManager = TokenManager(this)

        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val okHttpClient = OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(tokenManager))
            .addInterceptor(loggingInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()

        val retrofit = Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        apiService = retrofit.create(ApiService::class.java)

        authRepository = AuthRepository(apiService, tokenManager)
        locationRepository = LocationRepository(apiService)
    }
}
