using EZPos.Web.Ui.Data;
using Microsoft.AspNetCore.Mvc;

namespace EZPos.Web.Ui.Controllers
{
    public class CrossxPosController : Controller
    {
        private readonly AppDbContext _context;

        public CrossxPosController(AppDbContext context)
        {
            _context = context;
        }

        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Pricing()
        {
            var basicPrice = _context.SiteSettings
                .FirstOrDefault(s => s.Key == "CrossxBasicPrice")?.Value ?? "299.00";
            var proPrice = _context.SiteSettings
                .FirstOrDefault(s => s.Key == "CrossxProPrice")?.Value ?? "499.00";

            ViewData["BasicPrice"] = basicPrice;
            ViewData["ProPrice"]   = proPrice;
            return View();
        }
    }
}
