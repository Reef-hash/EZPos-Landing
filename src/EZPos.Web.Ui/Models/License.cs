using System;

namespace EZPos.Web.Ui.Models
{
    public class License
    {
        public int Id { get; set; }
        public string KeyString { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
