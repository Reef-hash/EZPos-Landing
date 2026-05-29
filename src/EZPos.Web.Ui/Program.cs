using EZPos.Web.Ui.Data;
using EZPos.Web.Ui.Services;
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

// 2a. Daftarkan CrossxPos license generator
builder.Services.AddSingleton<CrossxLicenseService>();

// 3a. Admin panel authentication (cookie-based)
builder.Services.AddAuthentication("AdminCookie")
    .AddCookie("AdminCookie", options =>
    {
        options.LoginPath          = "/Admin/Login";
        options.Cookie.Name        = "EZPosAdmin";
        options.Cookie.HttpOnly    = true;
        options.Cookie.SameSite    = Microsoft.AspNetCore.Http.SameSiteMode.Strict;
        options.Cookie.SecurePolicy = Microsoft.AspNetCore.Http.CookieSecurePolicy.SameAsRequest;
        options.ExpireTimeSpan     = TimeSpan.FromHours(8);
        options.SlidingExpiration  = true;
    });

var app = builder.Build();

// 3. Pastikan pangkalan data dicipta secara automatik
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (app.Environment.IsDevelopment())
    {
        dbContext.Database.EnsureDeleted();
        dbContext.Database.EnsureCreated();
    }
    else
    {
        dbContext.Database.EnsureCreated();
    }

    // Seed tetapan lalai (hanya jika belum ada)
    if (!dbContext.SiteSettings.Any(s => s.Key == "LicensePrice"))
        dbContext.SiteSettings.Add(new EZPos.Web.Ui.Models.SiteSetting { Key = "LicensePrice", Value = "499.00" });

    if (!dbContext.SiteSettings.Any(s => s.Key == "CrossxBasicPrice"))
        dbContext.SiteSettings.Add(new EZPos.Web.Ui.Models.SiteSetting { Key = "CrossxBasicPrice", Value = "299.00" });

    if (!dbContext.SiteSettings.Any(s => s.Key == "CrossxProPrice"))
        dbContext.SiteSettings.Add(new EZPos.Web.Ui.Models.SiteSetting { Key = "CrossxProPrice", Value = "499.00" });

    dbContext.SaveChanges();
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

app.UseAuthentication();
app.UseAuthorization();

// 5. Konfigurasi laluan (Routing)
app.MapControllers();
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
