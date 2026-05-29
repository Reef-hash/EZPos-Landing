using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace EZPos.Web.Ui.Services
{
    /// <summary>
    /// Menjana license key CrossxPOS menggunakan logik yang sama dengan
    /// scripts/generate-license.mjs — HMAC-SHA256 + Base64url payload.
    ///
    /// Format output: CROSSX-&lt;base64url_payload&gt;.&lt;base64url_hmac&gt;
    ///
    /// Kunci yang dijana di sini boleh disahkan secara offline oleh
    /// CrossxPos app melalui src/lib/license.ts tanpa sebarang server call.
    /// </summary>
    public class CrossxLicenseService
    {
        private readonly string _hmacSecret;

        // Definisi plan — mesti padan dengan CrossxPos/src/lib/license.ts
        private static readonly Dictionary<string, object> BasicLimits = new()
        {
            ["maxStaff"]    = 3,
            ["maxTables"]   = 10,
            ["maxProducts"] = 50
        };

        private static readonly Dictionary<string, object> ProLimits = new()
        {
            ["maxStaff"]    = 15,
            ["maxTables"]   = -1,
            ["maxProducts"] = -1
        };

        private static readonly Dictionary<string, object> BasicFeatures = new()
        {
            ["voidOrder"]         = (object)true,
            ["exportReports"]     = false,
            ["dateRangeReports"]  = false,
            ["splitBill"]         = false,
            ["discount"]          = false,
            ["multiSection"]      = false
        };

        private static readonly Dictionary<string, object> ProFeatures = new()
        {
            ["voidOrder"]         = (object)true,
            ["exportReports"]     = true,
            ["dateRangeReports"]  = true,
            ["splitBill"]         = true,
            ["discount"]          = true,
            ["multiSection"]      = true
        };

        public CrossxLicenseService(IConfiguration configuration)
        {
            _hmacSecret = configuration["CrossxPos:HmacSecret"]
                ?? "cxpos-lic-hmac-s3cr3t-v1";
        }

        /// <summary>
        /// Jana license key CrossxPOS.
        /// </summary>
        /// <param name="plan">"basic" atau "pro"</param>
        /// <param name="restaurantName">Nama restoran pelanggan</param>
        /// <param name="licenseId">ID unik lesen (cth: CX-0001)</param>
        /// <param name="daysValid">Tempoh sah (hari) — default: 365</param>
        public string GenerateKey(string plan, string restaurantName, string licenseId, int daysValid = 365)
        {
            plan = plan.ToLower() == "pro" ? "pro" : "basic";

            var now    = DateTime.UtcNow;
            var expiry = now.AddDays(daysValid);

            // Bina payload — susunan kunci mesti padan dengan generate-license.mjs
            var payload = new Dictionary<string, object>
            {
                ["licenseId"]      = licenseId,
                ["plan"]           = plan,
                ["restaurantName"] = restaurantName.Trim(),
                ["limits"]         = plan == "pro" ? ProLimits   : BasicLimits,
                ["features"]       = plan == "pro" ? ProFeatures : BasicFeatures,
                ["issuedAt"]       = now.ToString("yyyy-MM-dd"),
                ["expiresAt"]      = expiry.ToString("yyyy-MM-dd")
            };

            var json           = JsonSerializer.Serialize(payload);
            var encodedPayload = Base64UrlEncode(Encoding.UTF8.GetBytes(json));
            var signature      = SignHmac(encodedPayload);

            return $"CROSSX-{encodedPayload}.{signature}";
        }

        /// <summary>Bilangan hari bagi setiap plan.</summary>
        public static int DaysForPlan(string plan) =>
            plan.ToLower() == "pro" ? 730 : 365;

        // ── Private helpers ──────────────────────────────────────────────────

        private string SignHmac(string message)
        {
            var keyBytes = Encoding.UTF8.GetBytes(_hmacSecret);
            var msgBytes = Encoding.UTF8.GetBytes(message);
            using var hmac = new HMACSHA256(keyBytes);
            return Base64UrlEncode(hmac.ComputeHash(msgBytes));
        }

        private static string Base64UrlEncode(byte[] input) =>
            Convert.ToBase64String(input)
                   .Replace('+', '-')
                   .Replace('/', '_')
                   .TrimEnd('=');
    }
}
