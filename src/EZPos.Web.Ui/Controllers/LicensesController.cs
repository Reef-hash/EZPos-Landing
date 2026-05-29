using EZPos.Web.Ui.Data;
using Microsoft.AspNetCore.Mvc;

namespace EZPos.Web.Ui.Controllers
{
    [ApiController]
    [Route("api/licenses")]
    public class LicensesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<LicensesController> _logger;

        public LicensesController(AppDbContext context, ILogger<LicensesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpPost("validate")]
        public IActionResult Validate([FromBody] ValidateLicenseRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.LicenseKey))
                return BadRequest(new { isValid = false, message = "License key is required." });

            var key      = request.LicenseKey.Trim().ToUpperInvariant();
            var deviceId = request.DeviceId?.Trim().ToUpperInvariant() ?? string.Empty;
            var license  = _context.Licenses.FirstOrDefault(l => l.KeyString == key);

            if (license is null || !license.IsActive)
            {
                _logger.LogInformation("Validation failed for key: {Key}", key);
                return Ok(new { isValid = false, message = "License key is invalid or has been deactivated." });
            }

            // ── Device binding ────────────────────────────────────────────────
            if (string.IsNullOrWhiteSpace(license.DeviceId))
            {
                // First activation — bind this key to the current machine
                license.DeviceId = deviceId;
                _context.SaveChanges();
                _logger.LogInformation("Key {Key} bound to device {DeviceId}", key, deviceId);
            }
            else if (!string.Equals(license.DeviceId, deviceId, StringComparison.OrdinalIgnoreCase))
            {
                // Key is already bound to a different machine
                _logger.LogWarning("Key {Key} rejected — bound to {BoundId}, attempted by {DeviceId}", key, license.DeviceId, deviceId);
                return Ok(new
                {
                    isValid = false,
                    message = "This license key is already in use on another machine. Please contact support to transfer your license."
                });
            }
            // ─────────────────────────────────────────────────────────────────

            _logger.LogInformation("Validation successful for key: {Key}", key);
            return Ok(new { isValid = true, message = "License is valid." });
        }
    }

    public record ValidateLicenseRequest(string LicenseKey, string? DeviceId);
}
