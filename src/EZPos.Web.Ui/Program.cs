using EZPos.Web.Ui.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using Stripe;

var builder = WebApplication.CreateBuilder(args);

// 1. Tambahkan servis Pangkalan Data (SQLite)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. Tambahkan servis MVC dan Web API
builder.Services.AddControllersWithViews();

var app = builder.Build();

// 3. Pastikan pangkalan data dicipta secara automatik
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.EnsureCreated();
}

// 4. Konfigurasi Kunci Keselamatan Stripe
var stripeSecretKey = builder.Configuration.GetSection("Stripe")["SecretKey"];
if (string.IsNullOrEmpty(stripeSecretKey) || stripeSecretKey.StartsWith("pk_"))
{
    // Jika kunci bermula dengan pk_, bermakna tersalah letak Publishable Key
    Console.WriteLine("ERROR: Stripe SecretKey is missing or invalid (Starts with pk_). Check Environment Variables.");
}
StripeConfiguration.ApiKey = stripeSecretKey;

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

// 5. Konfigurasi laluan (Routing)
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
