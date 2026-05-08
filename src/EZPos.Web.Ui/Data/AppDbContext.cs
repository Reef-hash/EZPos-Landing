using EZPos.Web.Ui.Models;
using Microsoft.EntityFrameworkCore;

namespace EZPos.Web.Ui.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<License> Licenses => Set<License>();
    }
}
