using System.ComponentModel.DataAnnotations;

namespace EZPos.Web.Ui.Models
{
    /// <summary>
    /// Simpanan tetapan aplikasi (key-value).
    /// Contoh key: "LicensePrice" → "499.00" (dalam RM, bukan sen)
    /// </summary>
    public class SiteSetting
    {
        [Key]
        public string Key { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
    }
}
