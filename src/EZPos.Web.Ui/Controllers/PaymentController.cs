using EZPos.Web.Ui.Data;
using EZPos.Web.Ui.Models;
using Microsoft.AspNetCore.Mvc;
using Stripe.Checkout;
using System;
using System.Linq;

namespace EZPos.Web.Ui.Controllers
{
    public class PaymentController : Controller
    {
        private readonly AppDbContext _context;

        public PaymentController(AppDbContext context)
        {
            _context = context;
        }

        // Fungsi ini dipanggil apabila butang "Beli" ditekan
        [HttpPost]
        public IActionResult CreateCheckoutSession()
        {
            var domain = $"{Request.Scheme}://{Request.Host}";

            var options = new SessionCreateOptions
            {
                PaymentMethodTypes = new System.Collections.Generic.List<string> { "card" },
                LineItems = new System.Collections.Generic.List<SessionLineItemOptions>
                {
                    new SessionLineItemOptions
                    {
                        PriceData = new SessionLineItemPriceDataOptions
                        {
                            UnitAmount = 49900, // RM 499.00 (ditulis dalam sen iaitu 49900)
                            Currency = "myr",
                            ProductData = new SessionLineItemPriceDataProductDataOptions
                            {
                                Name = "Lesen Seumur Hidup EZPos",
                                Description = "Satu lesen untuk satu peranti kedai runcit anda."
                            },
                        },
                        Quantity = 1,
                    },
                },
                Mode = "payment",
                // Jika berjaya, pergi ke halaman Success
                SuccessUrl = domain + "/Payment/Success?session_id={CHECKOUT_SESSION_ID}",
                // Jika batal, pergi ke halaman Cancel
                CancelUrl = domain + "/Payment/Cancel",
            };

            var service = new SessionService();
            Session session = service.Create(options);

            // Hantar pelanggan ke halaman Stripe
            Response.Headers.Add("Location", session.Url);
            return new StatusCodeResult(303);
        }

        // Fungsi ini dipanggil secara automatik apabila pembayaran di Stripe BERJAYA
        public IActionResult Success(string session_id)
        {
            if (string.IsNullOrEmpty(session_id))
            {
                return RedirectToAction("Index", "Home");
            }

            // Jana Lesen Baru
            string newKeyString = GenerateRandomLicenseKey();

            // Simpan lesen baru ke dalam pangkalan data
            var newLicense = new License
            {
                KeyString = newKeyString,
                IsActive = false,
                CreatedAt = DateTime.Now
            };

            _context.Licenses.Add(newLicense);
            _context.SaveChanges();

            // Hantar kunci lesen ke halaman Visual (View) untuk ditunjukkan kepada pelanggan
            ViewBag.LicenseKey = newKeyString;

            return View();
        }

        // Fungsi ini dipanggil apabila pelanggan membatalkan pembayaran di Stripe
        public IActionResult Cancel()
        {
            return View();
        }

        // Fungsi bantuan untuk mencipta format Kunci Lesen (Contoh: EZPOS-A1B2-C3D4-E5F6)
        private string GenerateRandomLicenseKey()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var random = new Random();
            
            string part1 = new string(Enumerable.Repeat(chars, 4).Select(s => s[random.Next(s.Length)]).ToArray());
            string part2 = new string(Enumerable.Repeat(chars, 4).Select(s => s[random.Next(s.Length)]).ToArray());
            string part3 = new string(Enumerable.Repeat(chars, 4).Select(s => s[random.Next(s.Length)]).ToArray());
            
            return $"EZPOS-{part1}-{part2}-{part3}";
        }
    }
}
