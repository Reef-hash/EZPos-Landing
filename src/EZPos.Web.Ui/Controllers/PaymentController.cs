using EZPos.Web.Ui.Data;
using EZPos.Web.Ui.Models;
using EZPos.Web.Ui.Services;
using Microsoft.AspNetCore.Mvc;
using Stripe;
using Stripe.Checkout;
using System.Security.Cryptography;

namespace EZPos.Web.Ui.Controllers
{
    public class PaymentController : Controller
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<PaymentController> _logger;
        private readonly CrossxLicenseService _crossxLicense;

        public PaymentController(
            AppDbContext context,
            IConfiguration configuration,
            ILogger<PaymentController> logger,
            CrossxLicenseService crossxLicense)
        {
            _context       = context;
            _configuration = configuration;
            _logger        = logger;
            _crossxLicense = crossxLicense;
        }

        // ── Langkah 1: Pelanggan tekan "Beli" → cipta sesi Stripe ────────────

        [HttpPost]
        public async Task<IActionResult> CreateCheckoutSession()
        {
            var domain = $"{Request.Scheme}://{Request.Host}";

            var options = new SessionCreateOptions
            {
                PaymentMethodTypes = new List<string> { "card" },
                LineItems = new List<SessionLineItemOptions>
                {
                    new SessionLineItemOptions
                    {
                        PriceData = new SessionLineItemPriceDataOptions
                        {
                            UnitAmount = GetLicensePriceCents(),
                            Currency   = "myr",
                            ProductData = new SessionLineItemPriceDataProductDataOptions
                            {
                                Name        = "Lesen Seumur Hidup EZPos",
                                Description = "Satu lesen untuk satu peranti kedai runcit anda."
                            },
                        },
                        Quantity = 1,
                    },
                },
                Mode       = "payment",
                SuccessUrl = domain + "/Payment/Success?session_id={CHECKOUT_SESSION_ID}",
                CancelUrl  = domain + "/Payment/Cancel",
                Metadata   = new Dictionary<string, string> { ["productType"] = "EZPos" }
            };

            var service = new SessionService();
            var session = await service.CreateAsync(options);

            Response.Headers["Location"] = session.Url;
            return new StatusCodeResult(303);
        }

        // ── CrossxPos checkout ───────────────────────────────────────────────

        [HttpPost]
        public async Task<IActionResult> CreateCrossxCheckoutSession(string plan, string restaurantName)
        {
            if (string.IsNullOrWhiteSpace(restaurantName))
                return RedirectToAction("Pricing", "CrossxPos");

            plan = plan?.ToLower() == "pro" ? "pro" : "basic";

            var domain      = $"{Request.Scheme}://{Request.Host}";
            var priceAmount = GetCrossxPriceCents(plan);
            var planLabel   = plan == "pro" ? "Pro" : "Basic";

            var options = new SessionCreateOptions
            {
                PaymentMethodTypes = new List<string> { "card" },
                LineItems = new List<SessionLineItemOptions>
                {
                    new SessionLineItemOptions
                    {
                        PriceData = new SessionLineItemPriceDataOptions
                        {
                            UnitAmount = priceAmount,
                            Currency   = "myr",
                            ProductData = new SessionLineItemPriceDataProductDataOptions
                            {
                                Name        = $"CrossxPos Lesen {planLabel}",
                                Description = $"Lesen {planLabel} CrossxPos untuk {restaurantName.Trim()} \u2014 {CrossxLicenseService.DaysForPlan(plan)} hari."
                            },
                        },
                        Quantity = 1,
                    },
                },
                Mode       = "payment",
                SuccessUrl = domain + "/Payment/Success?session_id={CHECKOUT_SESSION_ID}",
                CancelUrl  = domain + "/CrossxPos/Pricing",
                Metadata   = new Dictionary<string, string>
                {
                    ["productType"]     = "CrossxPos",
                    ["plan"]            = plan,
                    ["restaurantName"]  = restaurantName.Trim()
                }
            };

            var service = new SessionService();
            var session = await service.CreateAsync(options);

            Response.Headers["Location"] = session.Url;
            return new StatusCodeResult(303);
        }

        // ── Langkah 2: Stripe redirect pelanggan ke sini selepas bayar ────────

        public async Task<IActionResult> Success(string session_id)
        {
            if (string.IsNullOrWhiteSpace(session_id))
                return RedirectToAction("Index", "Home");

            Session session;
            try
            {
                session = await new SessionService().GetAsync(session_id);
            }
            catch (StripeException ex)
            {
                _logger.LogWarning(ex, "session_id tidak sah: {SessionId}", session_id);
                return RedirectToAction("Index", "Home");
            }

            if (session.PaymentStatus != "paid")
                return RedirectToAction("Cancel");

            var existing = _context.Licenses.FirstOrDefault(l => l.StripeSessionId == session_id);
            if (existing != null)
            {
                ViewBag.LicenseKey     = existing.KeyString;
                ViewBag.CustomerEmail  = existing.CustomerEmail;
                ViewBag.ProductType    = existing.ProductType;
                ViewBag.Plan           = existing.Plan;
                ViewBag.RestaurantName = existing.RestaurantName;
                return View();
            }

            var productType    = session.Metadata?.GetValueOrDefault("productType") ?? "EZPos";
            var customerEmail  = session.CustomerDetails?.Email ?? string.Empty;
            string newKey;
            string? restaurantName = null;
            string? plan           = null;
            DateTime? expiresAt    = null;

            if (productType == "CrossxPos")
            {
                plan           = session.Metadata?.GetValueOrDefault("plan") ?? "basic";
                restaurantName = session.Metadata?.GetValueOrDefault("restaurantName") ?? "Restoran";
                var days       = CrossxLicenseService.DaysForPlan(plan);
                var licenseId  = $"CX-{DateTime.UtcNow:yyyyMMddHHmmss}";
                newKey         = _crossxLicense.GenerateKey(plan, restaurantName, licenseId, days);
                expiresAt      = DateTime.UtcNow.AddDays(days);
            }
            else
            {
                newKey = GenerateSecureLicenseKey();
            }

            _context.Licenses.Add(new License
            {
                KeyString       = newKey,
                IsActive        = true,
                CreatedAt       = DateTime.UtcNow,
                CustomerEmail   = customerEmail,
                StripeSessionId = session_id,
                ProductType     = productType,
                RestaurantName  = restaurantName,
                Plan            = plan,
                ExpiresAt       = expiresAt
            });
            await _context.SaveChangesAsync();

            _logger.LogInformation("Kunci lesen dijana: {Product} {Key}", productType, newKey);

            ViewBag.LicenseKey     = newKey;
            ViewBag.CustomerEmail  = customerEmail;
            ViewBag.ProductType    = productType;
            ViewBag.Plan           = plan;
            ViewBag.RestaurantName = restaurantName;
            return View();
        }

        // ── Langkah 3 (backup): Stripe hantar webhook selepas bayar berjaya ──

        [HttpPost]
        [IgnoreAntiforgeryToken]
        [Route("Payment/Webhook")]
        public async Task<IActionResult> Webhook()
        {
            var webhookSecret = _configuration["Stripe:WebhookSecret"];

            if (string.IsNullOrWhiteSpace(webhookSecret))
            {
                _logger.LogWarning("Stripe:WebhookSecret belum dikonfigurasi — webhook diabaikan.");
                return Ok();
            }

            string json;
            using (var reader = new StreamReader(HttpContext.Request.Body))
                json = await reader.ReadToEndAsync();

            try
            {
                var stripeEvent = EventUtility.ConstructEvent(
                    json,
                    Request.Headers["Stripe-Signature"],
                    webhookSecret);

                if (stripeEvent.Type == "checkout.session.completed")
                {
                    var session = stripeEvent.Data.Object as Session;
                    if (session?.PaymentStatus == "paid" && !string.IsNullOrEmpty(session.Id))
                    {
                        var exists = _context.Licenses.Any(l => l.StripeSessionId == session.Id);
                        if (!exists)
                        {
                            var prodType    = session.Metadata?.GetValueOrDefault("productType") ?? "EZPos";
                            string webhookKey;
                            string? wRestaurant = null;
                            string? wPlan       = null;
                            DateTime? wExpires  = null;

                            if (prodType == "CrossxPos")
                            {
                                wPlan       = session.Metadata?.GetValueOrDefault("plan") ?? "basic";
                                wRestaurant = session.Metadata?.GetValueOrDefault("restaurantName") ?? "Restoran";
                                var days    = CrossxLicenseService.DaysForPlan(wPlan);
                                var licId   = $"CX-{DateTime.UtcNow:yyyyMMddHHmmss}";
                                webhookKey  = _crossxLicense.GenerateKey(wPlan, wRestaurant, licId, days);
                                wExpires    = DateTime.UtcNow.AddDays(days);
                            }
                            else
                            {
                                webhookKey = GenerateSecureLicenseKey();
                            }

                            _context.Licenses.Add(new License
                            {
                                KeyString       = webhookKey,
                                IsActive        = true,
                                CreatedAt       = DateTime.UtcNow,
                                CustomerEmail   = session.CustomerDetails?.Email ?? string.Empty,
                                StripeSessionId = session.Id,
                                ProductType     = prodType,
                                RestaurantName  = wRestaurant,
                                Plan            = wPlan,
                                ExpiresAt       = wExpires
                            });
                            await _context.SaveChangesAsync();
                            _logger.LogInformation("Webhook: Kunci dijana {Product} untuk sesi {SessionId}", prodType, session.Id);
                        }
                    }
                }

                return Ok();
            }
            catch (StripeException ex)
            {
                _logger.LogError(ex, "Pengesahan tandatangan webhook Stripe gagal.");
                return BadRequest();
            }
        }

        public IActionResult Cancel() => View();

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

        /// <summary>
        /// Baca harga lesen dari DB (dalam sen untuk Stripe).
        /// Contoh: "499.00" → 49900
        /// </summary>
        private long GetLicensePriceCents()
        {
            var priceStr = _context.SiteSettings
                .FirstOrDefault(s => s.Key == "LicensePrice")?.Value ?? "499.00";

            if (decimal.TryParse(priceStr, System.Globalization.NumberStyles.Any,
                    System.Globalization.CultureInfo.InvariantCulture, out var price) && price > 0)
                return (long)(price * 100);

            return 49900;
        }

        private long GetCrossxPriceCents(string plan)
        {
            var key      = plan == "pro" ? "CrossxProPrice" : "CrossxBasicPrice";
            var fallback = plan == "pro" ? 49900L : 29900L;
            var priceStr = _context.SiteSettings.FirstOrDefault(s => s.Key == key)?.Value;

            if (!string.IsNullOrEmpty(priceStr) &&
                decimal.TryParse(priceStr, System.Globalization.NumberStyles.Any,
                    System.Globalization.CultureInfo.InvariantCulture, out var price) && price > 0)
                return (long)(price * 100);

            return fallback;
        }
    }
}
