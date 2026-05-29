using EZPos.Web.Ui.Data;
using Microsoft.AspNetCore.Mvc;

namespace EZPos.Web.Ui.Controllers
{
    public class HomeController : Controller
    {
        private readonly AppDbContext _context;

        public HomeController(AppDbContext context)
        {
            _context = context;
        }

        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Pricing()
        {
            var priceStr = _context.SiteSettings
                .FirstOrDefault(s => s.Key == "LicensePrice")?.Value ?? "499.00";

            ViewData["LicensePrice"] = priceStr;
            return View();
        }
    }
}
