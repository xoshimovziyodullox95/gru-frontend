// src/components/utils/globalBarcodeLookup.js
//
// Ochiq, bepul, kalitsiz global mahsulotlar bazasi (Open Food Facts).
// Dunyodagi millionlab haqiqiy mahsulot (Kefir, Lipton va h.k.)ni
// shtrix-kod orqali topib beradi — API kalit talab qilmaydi.

export async function lookupGlobalBarcode(barcode) {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
    const data = await res.json();

    if (data.status !== 1 || !data.product) {
      return null; // Global bazada ham topilmadi
    }

    const p = data.product;
    const name = p.product_name_uz || p.product_name || p.product_name_ru || p.generic_name || '';
    const brand = p.brands || '';

    if (!name) return null;

    return {
      name: brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${name}` : name,
      imageUrl: p.image_front_url || p.image_url || null,
      quantity: p.quantity || '', // masalan "500 ml", "1 l"
    };
  } catch (err) {
    console.error('Global barcode qidiruvida xatolik:', err);
    return null;
  }
}   