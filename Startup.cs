using Microsoft.AspNetCore.Cors.Infrastructure;

public void ConfigureServices(IServiceCollection services)
{
    services.AddCors(options =>
    {
        options.AddPolicy("AllowAll", policy =>
        {
            policy
                .WithOrigins(
                    "http://localhost:3000",     // Local development
                    "https://app.mockylab.com"   // Production
                )
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        });
    });
    
    // Diğer servis konfigürasyonları...
}

public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
{
    // CORS middleware'ini UseRouting'den önce ekleyin
    app.UseCors("AllowAll");
    
    app.UseRouting();
    // Diğer middleware'ler...
} 