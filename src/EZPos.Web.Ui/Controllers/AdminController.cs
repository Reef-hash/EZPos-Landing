using EZPos.Web.Ui.Data;
using EZPos.Web.Ui.Models;
using EZPos.Web.Ui.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Security.Cryptography;

namespace EZPos.Web.Ui.Controllers
{
    /// <summary>
    /// Admin panel for managing EZPos license keys.
    ///
    /// Routes:
    ///   GET  /Admin/Login           — Login page
    ///   POST /Admin/Login           — Process login
    ///   POST /Admin/Logout          — Sign out
    ///   GET  /Admin/Dashboard       — License list (requires auth)
    ///   POST /Admin/Deactivate/{id} — Deactivate a key (requires auth)
    ///   POST /Admin/Activate/{id}   — Reactivate a key (requires auth)
    ///   POST /Admin/ResetDevice/{id}— Clear bound device (requires auth)
    ///
    /// Credentials are read from appsettings.json: Admin:Username, Admin:Password
    /// Change these before production deployment.
    /// </summary>
    public class AdminController : Controller
    {
        private readonly AppDbContext    _context;
        private readonly IConfiguration  _config;
        private readonly ILogger<AdminController> _logger;
        private readonly CrossxLicenseService _crossxLicense;

        public AdminController(
            AppDbContext context,
            IConfiguration config,
            ILogger<AdminController> logger,
            CrossxLicenseService crossxLicense)
        {
            _context = context;
            _config  = config;
            _logger  = logger;
            _crossxLicense = crossxLicense;
        }

        // ── Root redirect ──────────────────────────────────────────────────

        [HttpGet]
        public IActionResult Index() => RedirectToAction(nameof(Dashboard));

        // ── Authentication ─────────────────────────────────────────────────

        [HttpGet]
        public IActionResult Login(string? returnUrl = null)
        {
            if (User.Identity?.IsAuthenticated == true)
                return RedirectToAction(nameof(Dashboard));

            ViewData["ReturnUrl"] = returnUrl;
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(string username, string password, string? returnUrl = null)
        {
            var expectedUser = _config["Admin:Username"] ?? "admin";
            var expectedPass = _config["Admin:Password"] ?? "";

            if (!string.Equals(username, expectedUser, StringComparison.Ordinal)
                || !string.Equals(password, expectedPass, StringComparison.Ordinal))
            {
                _logger.LogWarning("Admin login failed for username: {Username}", username);
                ViewData["Error"]     = "Username atau password salah.";
                ViewData["ReturnUrl"] = returnUrl;
                return View();
            }

            var claims    = new List<Claim> { new(ClaimTypes.Name, username) };
            var identity  = new ClaimsIdentity(claims, "AdminCookie");
            var principal = new ClaimsPrincipal(identity);

            await HttpContext.SignInAsync("AdminCookie", principal);
            _logger.LogInformation("Admin login: {Username}", username);

            if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
                return Redirect(returnUrl);

            return RedirectToAction(nameof(Dashboard));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync("AdminCookie");
            return RedirectToAction(nameof(Login));
        }

        // ── Dashboard ──────────────────────────────────────────────────────

        [Authorize(AuthenticationSchemes = "AdminCookie")]
        [HttpGet]
        public IActionResult Dashboard(string? search = null)
        {
            IQueryable<License> query = _context.Licenses.OrderByDescending(l => l.CreatedAt);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToUpperInvariant();
                query = query.Where(l =>
                    l.KeyString.Contains(s) ||
                    l.CustomerEmail.ToUpper().Contains(s));
            }

            ViewData["Search"]           = search;
            ViewData["TotalCount"]        = _context.Licenses.Count();
            ViewData["ActiveCount"]       = _context.Licenses.Count(l => l.IsActive);
            ViewData["EzPosCount"]        = _context.Licenses.Count(l => l.ProductType != "CrossxPos");
            ViewData["CrossxPosCount"]    = _context.Licenses.Count(l => l.ProductType == "CrossxPos");
            ViewData["LicensePrice"]      = _context.SiteSettings.FirstOrDefault(s => s.Key == "LicensePrice")?.Value ?? "499.00";
            ViewData["CrossxBasicPrice"]  = _context.SiteSettings.FirstOrDefault(s => s.Key == "CrossxBasicPrice")?.Value ?? "299.00";
            ViewData["CrossxProPrice"]    = _context.SiteSettings.FirstOrDefault(s => s.Key == "CrossxProPrice")?.Value ?? "499.00";

            return View(query.ToList());
        }

        // ── Key actions ────────────────────────────────────────────────────

        [Authorize(AuthenticationSchemes = "AdminCookie")]
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult CreateManualEzPos(string? customerEmail)
        {
            var key = GenerateSecureLicenseKey();

            _context.Licenses.Add(new License
            {
                KeyString       = key,
                IsActive        = true,
                CreatedAt       = DateTime.UtcNow,
                CustomerEmail   = customerEmail?.Trim() ?? string.Empty,
                StripeSessionId = $"MANUAL-EZPOS-{Guid.NewGuid():N}",
                ProductType     = "EZPos"
            });

            _context.SaveChanges();
            _logger.LogInformation("Admin generated manual EZPos key: {Key}", key);
            TempData["Message"] = $"Key EZPos manual berjaya dijana: {key}";
            return RedirectToAction(nameof(Dashboard));
        }

        [Authorize(AuthenticationSchemes = "AdminCookie")]
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult CreateManualCrossxPos(string? plan, string? restaurantName, string? customerEmail)
        {
            if (string.IsNullOrWhiteSpace(restaurantName))
            {
                TempData["SettingsError"] = "Nama restoran diperlukan untuk CrossxPos.";
                return RedirectToAction(nameof(Dashboard));
            }

            var normalizedPlan = string.Equals(plan, "pro", StringComparison.OrdinalIgnoreCase) ? "pro" : "basic";
            var days = CrossxLicenseService.DaysForPlan(normalizedPlan);
            var licenseId = $"CXM-{DateTime.UtcNow:yyyyMMddHHmmss}";
            var key = _crossxLicense.GenerateKey(normalizedPlan, restaurantName.Trim(), licenseId, days);

            _context.Licenses.Add(new License
            {
                KeyString       = key,
                IsActive        = true,
                CreatedAt       = DateTime.UtcNow,
                CustomerEmail   = customerEmail?.Trim() ?? string.Empty,
                StripeSessionId = $"MANUAL-CROSSX-{Guid.NewGuid():N}",
                ProductType     = "CrossxPos",
                RestaurantName  = restaurantName.Trim(),
                Plan            = normalizedPlan,
                ExpiresAt       = DateTime.UtcNow.AddDays(days)
            });

            _context.SaveChanges();
            _logger.LogInformation("Admin generated manual CrossxPos key: {Key} ({Plan})", key, normalizedPlan);
            TempData["Message"] = $"Key CrossxPos ({normalizedPlan.ToUpperInvariant()}) manual berjaya dijana.";
            return RedirectToAction(nameof(Dashboard));
        }

        [Authorize(AuthenticationSchemes = "AdminCookie")]
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult Deactivate(int id)
        {
            var license = _context.Licenses.Find(id);
            if (license is null) return NotFound();

            license.IsActive = false;
            _context.SaveChanges();
            _logger.LogInformation("Admin deactivated key {Key} (id={Id})", license.KeyString, id);

            TempData["Message"] = $"Key {license.KeyString} telah dinyahaktifkan.";
            return RedirectToAction(nameof(Dashboard));
        }

        [Authorize(AuthenticationSchemes = "AdminCookie")]
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult Activate(int id)
        {
            var license = _context.Licenses.Find(id);
            if (license is null) return NotFound();

            license.IsActive = true;
            _context.SaveChanges();
            _logger.LogInformation("Admin activated key {Key} (id={Id})", license.KeyString, id);

            TempData["Message"] = $"Key {license.KeyString} telah diaktifkan semula.";
            return RedirectToAction(nameof(Dashboard));
        }

        [Authorize(AuthenticationSchemes = "AdminCookie")]
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult ResetDevice(int id)
        {
            var license = _context.Licenses.Find(id);
            if (license is null) return NotFound();

            var oldDevice    = license.DeviceId ?? "(none)";
            license.DeviceId = null;
            _context.SaveChanges();
            _logger.LogInformation("Admin reset device for key {Key} (was: {OldDevice})", license.KeyString, oldDevice);

            TempData["Message"] = $"Device binding untuk {license.KeyString} telah diset semula. Key boleh diaktifkan pada mesin baru.";
            return RedirectToAction(nameof(Dashboard));
        }

        // ── Settings ───────────────────────────────────────────────────────

        [Authorize(AuthenticationSchemes = "AdminCookie")]
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult SaveSettings(string? licensePrice, string? crossxBasicPrice, string? crossxProPrice)
        {
            bool saved = false;

            if (!string.IsNullOrWhiteSpace(licensePrice))
            {
                if (!decimal.TryParse(licensePrice, System.Globalization.NumberStyles.Any,
                        System.Globalization.CultureInfo.InvariantCulture, out var price) || price <= 0)
                {
                    TempData["SettingsError"] = "Harga EZPos tidak sah.";
                    return RedirectToAction(nameof(Dashboard));
                }
                UpsertSetting("LicensePrice", price);
                saved = true;
            }

            if (!string.IsNullOrWhiteSpace(crossxBasicPrice))
            {
                if (!decimal.TryParse(crossxBasicPrice, System.Globalization.NumberStyles.Any,
                        System.Globalization.CultureInfo.InvariantCulture, out var p) || p <= 0)
                {
                    TempData["SettingsError"] = "Harga CrossxPos Basic tidak sah.";
                    return RedirectToAction(nameof(Dashboard));
                }
                UpsertSetting("CrossxBasicPrice", p);
                saved = true;
            }

            if (!string.IsNullOrWhiteSpace(crossxProPrice))
            {
                if (!decimal.TryParse(crossxProPrice, System.Globalization.NumberStyles.Any,
                        System.Globalization.CultureInfo.InvariantCulture, out var p) || p <= 0)
                {
                    TempData["SettingsError"] = "Harga CrossxPos Pro tidak sah.";
                    return RedirectToAction(nameof(Dashboard));
                }
                UpsertSetting("CrossxProPrice", p);
                saved = true;
            }

            if (saved)
            {
                _context.SaveChanges();
                _logger.LogInformation("Admin updated pricing settings.");
                TempData["Message"] = "Harga telah dikemaskini.";
            }

            return RedirectToAction(nameof(Dashboard));
        }

        private void UpsertSetting(string key, decimal value)
        {
            var setting = _context.SiteSettings.FirstOrDefault(s => s.Key == key);
            var strVal  = value.ToString("F2", System.Globalization.CultureInfo.InvariantCulture);
            if (setting == null)
                _context.SiteSettings.Add(new Models.SiteSetting { Key = key, Value = strVal });
            else
                setting.Value = strVal;
        }

        private static string GenerateSecureLicenseKey()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var bytes = RandomNumberGenerator.GetBytes(12);

            var parts = new string[3];
            for (int p = 0; p < 3; p++)
            {
                var segment = new char[4];
                for (int i = 0; i < 4; i++)
                    segment[i] = chars[bytes[p * 4 + i] % chars.Length];
                parts[p] = new string(segment);
            }

            return $"EZPOS-{parts[0]}-{parts[1]}-{parts[2]}";
        }
    }
}
