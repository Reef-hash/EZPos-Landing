using System;

namespace EZPos.Web.Ui.Models
{
    public class License
    {
        public int Id { get; set; }
        public string KeyString { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }

        /// <summary>Email address of the customer, collected by Stripe Checkout.</summary>
        public string CustomerEmail { get; set; } = string.Empty;

        /// <summary>Stripe Checkout Session ID tied to this license.
        /// Used for idempotency — prevents duplicate keys if the customer
        /// refreshes the success page or if the webhook fires after the redirect.
        /// </summary>
        public string StripeSessionId { get; set; } = string.Empty;

        /// <summary>
        /// Device fingerprint (hashed MAC) of the first machine that activated this key.
        /// Null until the key is used for the first time.
        /// Once set, only the same device ID will be accepted by the validate endpoint.
        /// Admin panel can reset this to null to allow transfer to a new machine.
        /// </summary>
        public string? DeviceId { get; set; }

        // ── Multi-product fields ─────────────────────────────────────────────

        /// <summary>"EZPos" atau "CrossxPos". Default "EZPos" untuk rekod lama.</summary>
        public string ProductType { get; set; } = "EZPos";

        /// <summary>Nama restoran pelanggan CrossxPos. Null untuk EZPos.</summary>
        public string? RestaurantName { get; set; }

        /// <summary>Plan lesen CrossxPos: "basic" atau "pro". Null untuk EZPos.</summary>
        public string? Plan { get; set; }

        /// <summary>Tarikh tamat lesen CrossxPos. Null bermaksud seumur hidup (EZPos).</summary>
        public DateTime? ExpiresAt { get; set; }
    }
}
