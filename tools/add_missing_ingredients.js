const axios = require('axios');

const API_BASE = 'http://localhost:3000';

// Missing ingredients from the recipes with their FODMAP levels
const missingIngredients = [
  // From Śniadania
  { name: 'Płatki owsiane', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Mleko ryżowe', quantity_unit: 'ml', fodmap_level: 'LOW' },
  { name: 'Orzechy włoskie', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Olej kokosowy', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Sól morska', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Cynamon', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Żółtka jaj', quantity_unit: 'szt', fodmap_level: 'LOW' },
  { name: 'Jogurt kokosowy', quantity_unit: 'ml', fodmap_level: 'LOW' },
  { name: 'Mąka ryżowa', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Siemię lniane mielone', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Masło klarowane', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Ekstrakt waniliowy', quantity_unit: 'ml', fodmap_level: 'LOW' },
  { name: 'Borówki', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Kiwi', quantity_unit: 'szt', fodmap_level: 'LOW' },
  { name: 'Syrop klonowy', quantity_unit: 'ml', fodmap_level: 'LOW' },

  // From Obiady
  { name: 'Wołowina', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Ryż brązowy', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Olej rzepakowy', quantity_unit: 'ml', fodmap_level: 'LOW' },
  { name: 'Olej czosnkowy', quantity_unit: 'ml', fodmap_level: 'LOW' },
  { name: 'Koncentrat pomidorowy', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Bulion wołowy', quantity_unit: 'ml', fodmap_level: 'LOW' },
  { name: 'Papryka słodka', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Majeranek suszony', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Tymianek', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Liście laurowe', quantity_unit: 'szt', fodmap_level: 'LOW' },
  { name: 'Kminek', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Pieprz czarny', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Indyk', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Bulion warzywny', quantity_unit: 'ml', fodmap_level: 'LOW' },
  { name: 'Jagnięcina mielona', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Bułka tarta bezglutenowa', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Rozmaryn świeży', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Oregano', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Sok z cytryny', quantity_unit: 'ml', fodmap_level: 'LOW' },
  { name: 'Fasolka szparagowa', quantity_unit: 'g', fodmap_level: 'LOW' },

  // From Przekąski
  { name: 'Melon kantalupa', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Mleko owsiane', quantity_unit: 'ml', fodmap_level: 'LOW' },
  { name: 'Miód', quantity_unit: 'g', fodmap_level: 'MODERATE' },
  { name: 'Mięta świeża', quantity_unit: 'g', fodmap_level: 'LOW' },

  // From Kolacje
  { name: 'Pierś indyka', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Bazylia suszona', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Filet z łososia', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Koper świeży', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Pieprz biały', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Mozzarella di bufala', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Roszponka', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Bazylia świeża', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Ocet balsamiczny', quantity_unit: 'ml', fodmap_level: 'LOW' },
  { name: 'Olej sezamowy', quantity_unit: 'ml', fodmap_level: 'LOW' },
  { name: 'Ocet ryżowy', quantity_unit: 'ml', fodmap_level: 'LOW' },
  { name: 'Imbir świeży', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Nasiona sezamu', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Szczypiorek', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Szprotki w oleju', quantity_unit: 'g', fodmap_level: 'LOW' },
  { name: 'Ocet jabłkowy', quantity_unit: 'ml', fodmap_level: 'LOW' },
  { name: 'Chleb bezglutenowy', quantity_unit: 'kromka', fodmap_level: 'LOW' }
];

async function addMissingIngredients() {
  console.log('🌱 Adding missing ingredients to the database...');
  
  let addedCount = 0;
  let skippedCount = 0;
  
  for (const ingredient of missingIngredients) {
    try {
      const response = await axios.post(`${API_BASE}/ingredients`, ingredient);
      console.log(`✅ Added: ${ingredient.name} (${ingredient.fodmap_level})`);
      addedCount++;
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.log(`⏭️  Skipped: ${ingredient.name} (already exists)`);
        skippedCount++;
      } else {
        console.error(`❌ Failed to add ${ingredient.name}:`, error.response?.data || error.message);
      }
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Added: ${addedCount} ingredients`);
  console.log(`   ⏭️  Skipped: ${skippedCount} ingredients (already existed)`);
  console.log(`   📝 Total processed: ${missingIngredients.length} ingredients`);
}

// Run the script
addMissingIngredients().catch(console.error);
