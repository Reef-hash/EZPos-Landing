using Microsoft.AspNetCore.Mvc;

namespace EZPos.Web.Ui.Controllers
{
    public class HomeController : Controller
    {
        // Apabila URL utama dibuka, ia akan memaparkan fail Index.cshtml (Landing Page)
        public IActionResult Index()
        {
            return View();
        }

        // Apabila URL /Home/Pricing dibuka, ia akan memaparkan fail Pricing.cshtml
        public IActionResult Pricing()
        {
            return View();
        }
    }
}
