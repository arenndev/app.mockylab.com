var builder = WebApplication.CreateBuilder(args);

// CORS policy ekleme
builder.Services.AddCors(options =>
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

var app = builder.Build();

// CORS middleware'ini ekle (UseRouting'den önce olmalı)
app.UseCors("AllowAll");

// Diğer middleware'ler...
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization(); 