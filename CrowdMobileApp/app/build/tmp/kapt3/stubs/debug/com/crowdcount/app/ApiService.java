package com.crowdcount.app;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000$\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0000\n\u0002\u0010$\n\u0002\u0010\u000e\n\u0002\b\u0002\bf\u0018\u00002\u00020\u0001J\u0014\u0010\u0002\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\u00050\u00040\u0003H\'J$\u0010\u0006\u001a\u0014\u0012\u0010\u0012\u000e\u0012\u0004\u0012\u00020\b\u0012\u0004\u0012\u00020\b0\u00070\u00032\b\b\u0001\u0010\t\u001a\u00020\u0005H\'\u00a8\u0006\n"}, d2 = {"Lcom/crowdcount/app/ApiService;", "", "getCrowdData", "Lretrofit2/Call;", "", "Lcom/crowdcount/app/CrowdData;", "postCrowdData", "", "", "data", "app_debug"})
public abstract interface ApiService {
    
    @retrofit2.http.GET(value = "/all-crowd-data")
    @org.jetbrains.annotations.NotNull()
    public abstract retrofit2.Call<java.util.List<com.crowdcount.app.CrowdData>> getCrowdData();
    
    @retrofit2.http.POST(value = "/update-crowd")
    @org.jetbrains.annotations.NotNull()
    public abstract retrofit2.Call<java.util.Map<java.lang.String, java.lang.String>> postCrowdData(@retrofit2.http.Body()
    @org.jetbrains.annotations.NotNull()
    com.crowdcount.app.CrowdData data);
}